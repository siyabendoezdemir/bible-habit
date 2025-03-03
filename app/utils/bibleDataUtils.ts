import { BibleReading } from '../types';
import * as BibleApiService from './bibleApiService';

// Bible stats - would be calculated from actual reading data in a full implementation
export const TOTAL_CHAPTERS = 1189;
export const TOTAL_OT_CHAPTERS = 929;
export const TOTAL_NT_CHAPTERS = 260;
export const TOTAL_PSALMS = 150;

// Old Testament books
export const OT_BOOKS = [
  "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", "Joshua", "Judges", "Ruth", 
  "1 Samuel", "2 Samuel", "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra", 
  "Nehemiah", "Esther", "Job", "Psalms", "Proverbs", "Ecclesiastes", "Song of Solomon", 
  "Isaiah", "Jeremiah", "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel", "Amos", 
  "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah", "Malachi"
];

// New Testament books
export const NT_BOOKS = [
  "Matthew", "Mark", "Luke", "John", "Acts", "Romans", "1 Corinthians", "2 Corinthians", 
  "Galatians", "Ephesians", "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians", 
  "1 Timothy", "2 Timothy", "Titus", "Philemon", "Hebrews", "James", "1 Peter", "2 Peter", 
  "1 John", "2 John", "3 John", "Jude", "Revelation"
];

// Calculate total chapters read
export const getTotalChaptersRead = (readings: BibleReading[]) => {
  return readings.length;
};

// Calculate chapters read by testament
export const getTestamentProgress = (readings: BibleReading[]) => {
  const otChapters = readings.filter(reading => OT_BOOKS.includes(reading.book)).length;
  const ntChapters = readings.filter(reading => NT_BOOKS.includes(reading.book)).length;
  const psalmsChapters = readings.filter(reading => reading.book === "Psalms").length;
  
  return {
    ot: otChapters / TOTAL_OT_CHAPTERS,
    nt: ntChapters / TOTAL_NT_CHAPTERS,
    psalms: psalmsChapters / TOTAL_PSALMS
  };
};

// Get overall Bible reading progress
export const getOverallProgress = (readings: BibleReading[]) => {
  return getTotalChaptersRead(readings) / TOTAL_CHAPTERS;
};

// Get chapters left to read today based on a goal of 3 chapters per day
export const getChaptersLeftToday = (todayReadings: BibleReading[]) => {
  const dailyGoal = 3; // This could be a user setting
  return Math.max(0, dailyGoal - todayReadings.length);
};

// Get a verse of the day
export const getDailyVerse = () => {
  return BibleApiService.getDailyVerse();
};

// Get reading plan items
export const getReadingPlanItems = () => {
  return BibleApiService.getReadingPlanItems();
}; 