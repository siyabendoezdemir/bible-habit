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

// Recalculate streak from scratch based on all readings
export const recalculateStreak = (readings: BibleReading[]): ReadingStreak => {
  if (readings.length === 0) {
    return {
      currentStreak: 0,
      lastReadDate: null,
      totalDaysRead: 0
    };
  }

  // Sort readings by date (newest first)
  const sortedReadings = [...readings].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Get unique dates (we only care about days, not individual readings)
  const uniqueDates = Array.from(new Set(
    sortedReadings.map(reading => new Date(reading.date).toISOString().split('T')[0])
  ));

  // The most recent date read
  const lastReadDate = uniqueDates[0];
  
  // Count total unique days read
  const totalDaysRead = uniqueDates.length;
  
  // Calculate current streak
  let currentStreak = 1; // Start with 1 for the most recent day
  let expectedDate = new Date(lastReadDate);
  
  // Check consecutive days starting from the second most recent date
  for (let i = 1; i < uniqueDates.length; i++) {
    // Calculate the expected previous date (1 day before)
    expectedDate = new Date(expectedDate);
    expectedDate.setDate(expectedDate.getDate() - 1);
    const expectedDateStr = expectedDate.toISOString().split('T')[0];
    
    // If the next date in our list matches the expected previous date, increment streak
    if (uniqueDates[i] === expectedDateStr) {
      currentStreak++;
    } else {
      // Chain broken, stop counting
      break;
    }
  }
  
  return {
    currentStreak,
    lastReadDate,
    totalDaysRead
  };
};

// Load data from AsyncStorage
export const loadData = async (): Promise<{ readings: BibleReading[], streak: ReadingStreak }> => {
  try {
    const readingsData = await AsyncStorage.getItem('readings');
    const readings: BibleReading[] = readingsData ? JSON.parse(readingsData) : [];
    
    // Instead of loading the stored streak, recalculate it
    const streak = recalculateStreak(readings);
    
    return { readings, streak };
  } catch (error) {
    console.error('Error loading data:', error);
    return { 
      readings: [], 
      streak: { currentStreak: 0, lastReadDate: null, totalDaysRead: 0 } 
    };
  }
};

// Update streak based on a new reading
export const updateStreak = (streak: ReadingStreak, newReading: BibleReading): ReadingStreak => {
  const newStreak = { ...streak };
  const today = new Date().toISOString().split('T')[0];
  const readingDate = new Date(newReading.date).toISOString().split('T')[0];

  // If this is the first reading ever
  if (!streak.lastReadDate) {
    newStreak.currentStreak = 1;
    newStreak.totalDaysRead = 1;
    newStreak.lastReadDate = readingDate;
    return newStreak;
  }

  // Get the date of the last reading
  const lastDate = new Date(streak.lastReadDate);
  const currentDate = new Date(readingDate);
  
  // Calculate the difference in days
  const daysDiff = differenceInDays(currentDate, lastDate);
  
  // If reading for today and already read yesterday (or today)
  if (daysDiff === 1) {
    // Perfect continuation of streak
    newStreak.currentStreak += 1;
    newStreak.totalDaysRead += 1;
    newStreak.lastReadDate = readingDate;
  } else if (daysDiff === 0) {
    // Another reading for the same day, don't change streak
    // but ensure lastReadDate is the most recent
    newStreak.lastReadDate = readingDate;
  } else if (daysDiff > 1) {
    // Gap in reading, reset streak
    newStreak.currentStreak = 1;
    newStreak.totalDaysRead += 1;
    newStreak.lastReadDate = readingDate;
  } else if (daysDiff < 0) {
    // Reading for a past date - don't affect current streak
    // but count it in total days read if it's a new day
    const existingReadingsForDate = getFilteredReadings([], new Date(readingDate)).length;
    if (existingReadingsForDate === 0) {
      newStreak.totalDaysRead += 1;
    }
  }
  
  return newStreak;
};

// Check if the user is currently in an active streak (read yesterday or today)
export const isActiveStreak = (streak: ReadingStreak): boolean => {
  if (!streak.lastReadDate) return false;
  
  const lastReadDate = new Date(streak.lastReadDate);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  // Check if last read was today or yesterday
  const lastReadDay = lastReadDate.setHours(0, 0, 0, 0);
  const todayDay = today.setHours(0, 0, 0, 0);
  const yesterdayDay = yesterday.setHours(0, 0, 0, 0);
  
  return lastReadDay === todayDay || lastReadDay === yesterdayDay;
};

// Add a new reading and update streak
export const addReading = async (
  readings: BibleReading[], 
  streak: ReadingStreak, 
  newReading: BibleReading
): Promise<{ readings: BibleReading[], streak: ReadingStreak }> => {
  const updatedReadings = [newReading, ...readings];
  const updatedStreak = recalculateStreak(updatedReadings);

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