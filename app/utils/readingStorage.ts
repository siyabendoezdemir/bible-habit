import AsyncStorage from '@react-native-async-storage/async-storage';
import { differenceInDays } from 'date-fns';
import { BibleReading, ReadingStreak } from '../types';

// Load readings from AsyncStorage
export const loadReadings = async (): Promise<BibleReading[]> => {
  try {
    const storedReadings = await AsyncStorage.getItem('readings');
    return storedReadings ? JSON.parse(storedReadings) : [];
  } catch (error) {
    console.error('Error loading readings:', error);
    return [];
  }
};

// Load streak data from AsyncStorage
export const loadStreak = async (): Promise<ReadingStreak> => {
  try {
    const storedStreak = await AsyncStorage.getItem('streak');
    return storedStreak 
      ? JSON.parse(storedStreak) 
      : { currentStreak: 0, lastReadDate: null, totalDaysRead: 0 };
  } catch (error) {
    console.error('Error loading streak:', error);
    return { currentStreak: 0, lastReadDate: null, totalDaysRead: 0 };
  }
};

// Load both readings and streak data
export const loadData = async (): Promise<{ readings: BibleReading[], streak: ReadingStreak }> => {
  const [readings, streak] = await Promise.all([loadReadings(), loadStreak()]);
  return { readings, streak };
};

// Update streak based on a new reading
export const updateStreak = (streak: ReadingStreak, newReading: BibleReading): ReadingStreak => {
  const newStreak = { ...streak };
  const today = new Date().toISOString().split('T')[0];

  if (!streak.lastReadDate) {
    newStreak.currentStreak = 1;
    newStreak.totalDaysRead = 1;
  } else {
    const lastDate = new Date(streak.lastReadDate);
    const daysDiff = differenceInDays(new Date(), lastDate);

    if (daysDiff <= 1) {
      newStreak.currentStreak += 1;
    } else {
      newStreak.currentStreak = 1;
    }
    newStreak.totalDaysRead += 1;
  }

  newStreak.lastReadDate = today;
  return newStreak;
};

// Add a new reading and update streak
export const addReading = async (
  readings: BibleReading[], 
  streak: ReadingStreak, 
  newReading: BibleReading
): Promise<{ readings: BibleReading[], streak: ReadingStreak }> => {
  const updatedReadings = [newReading, ...readings];
  const updatedStreak = updateStreak(streak, newReading);

  try {
    await AsyncStorage.setItem('readings', JSON.stringify(updatedReadings));
    await AsyncStorage.setItem('streak', JSON.stringify(updatedStreak));
    
    return { readings: updatedReadings, streak: updatedStreak };
  } catch (error) {
    console.error('Error saving data:', error);
    return { readings, streak };
  }
};

// Delete a reading by ID
export const deleteReading = async (
  readings: BibleReading[], 
  id: string
): Promise<BibleReading[]> => {
  const updatedReadings = readings.filter(reading => reading.id !== id);
  
  try {
    await AsyncStorage.setItem('readings', JSON.stringify(updatedReadings));
    return updatedReadings;
  } catch (error) {
    console.error('Error deleting reading:', error);
    return readings;
  }
};

// Filter readings based on a specific date
export const getFilteredReadings = (readings: BibleReading[], date: Date): BibleReading[] => {
  return readings.filter(reading => {
    const readingDate = new Date(reading.date);
    return (
      readingDate.getDate() === date.getDate() &&
      readingDate.getMonth() === date.getMonth() &&
      readingDate.getFullYear() === date.getFullYear()
    );
  });
}; 