import AsyncStorage from '@react-native-async-storage/async-storage';
import { BibleReading } from '../types';

// Load recently read chapters
export const loadRecentlyRead = async (): Promise<BibleReading[]> => {
  try {
    const storedReadings = await AsyncStorage.getItem('readings');
    if (storedReadings) {
      const readings = JSON.parse(storedReadings) as BibleReading[];
      return readings.slice(0, 5); // Get the 5 most recent readings
    }
    return [];
  } catch (error) {
    console.error('Error loading recently read:', error);
    return [];
  }
};

// Check if a chapter is already read today
export const isChapterAlreadyRead = (
  recentlyRead: BibleReading[],
  selectedBook: string,
  selectedChapter: number
): boolean => {
  return recentlyRead.some(
    reading => 
      reading.book === selectedBook && 
      reading.chapter === selectedChapter &&
      new Date(reading.date).toDateString() === new Date().toDateString()
  );
};

// Mark a chapter as read
export const markAsRead = async (
  selectedBook: string,
  selectedChapter: number,
  recentlyRead: BibleReading[],
  isAutomatic = false
): Promise<{
  updatedReadings: BibleReading[],
  success: boolean,
  message?: string
}> => {
  // Don't mark as read if already read today
  if (isChapterAlreadyRead(recentlyRead, selectedBook, selectedChapter)) {
    return { updatedReadings: recentlyRead, success: false };
  }
  
  try {
    // Create a new reading entry
    const newReading: BibleReading = {
      id: Date.now().toString(),
      book: selectedBook,
      chapter: selectedChapter,
      date: new Date().toISOString(),
      completed: true,
      notes: ''
    };

    // Get existing readings
    const storedReadings = await AsyncStorage.getItem('readings');
    let readings: BibleReading[] = storedReadings ? JSON.parse(storedReadings) : [];
    
    // Add the new reading
    readings = [newReading, ...readings];
    
    // Save back to storage
    await AsyncStorage.setItem('readings', JSON.stringify(readings));
    
    // Update streak (this would be more complex in a real implementation)
    const storedStreak = await AsyncStorage.getItem('streak');
    let streak = storedStreak ? JSON.parse(storedStreak) : { currentStreak: 0, lastReadDate: null, totalDaysRead: 0 };
    
    const today = new Date().toISOString().split('T')[0];
    if (!streak.lastReadDate || streak.lastReadDate !== today) {
      streak.currentStreak += 1;
      streak.totalDaysRead += 1;
      streak.lastReadDate = today;
      await AsyncStorage.setItem('streak', JSON.stringify(streak));
    }

    let message;
    if (isAutomatic) {
      message = `${selectedBook} ${selectedChapter} automatically marked as read!`;
    }

    return { 
      updatedReadings: readings.slice(0, 5),
      success: true,
      message
    };
  } catch (error) {
    console.error('Error marking as read:', error);
    return { updatedReadings: recentlyRead, success: false };
  }
}; 