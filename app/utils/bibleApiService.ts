import AsyncStorage from '@react-native-async-storage/async-storage';
import { BibleVerse } from '../constants/BibleContent';

// Constants
const BASE_URL = 'https://bible-api.com';
const DEFAULT_BIBLE_VERSION = 'kjv'; // King James Version
const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

// Types
interface BibleApiResponse {
  reference: string;
  verses: Array<{
    book_id: string;
    book_name: string;
    chapter: number;
    verse: number;
    text: string;
  }>;
  text: string;
  translation_id: string;
  translation_name: string;
  translation_note: string;
}

interface CachedData {
  timestamp: number;
  data: any;
}

// Bible book structure
interface BibleBook {
  id: string;
  name: string;
  testament: 'OT' | 'NT';
}

// Storage keys
const PREFERRED_VERSION_KEY = 'bible-habit:preferredVersion';
const CHAPTER_CACHE_PREFIX = 'bible-habit:chapterCache:';

// Static list of Bible books
const BIBLE_BOOKS: BibleBook[] = [
  // Old Testament books
  { id: 'GEN', name: 'Genesis', testament: 'OT' },
  { id: 'EXO', name: 'Exodus', testament: 'OT' },
  { id: 'LEV', name: 'Leviticus', testament: 'OT' },
  { id: 'NUM', name: 'Numbers', testament: 'OT' },
  { id: 'DEU', name: 'Deuteronomy', testament: 'OT' },
  { id: 'JOS', name: 'Joshua', testament: 'OT' },
  { id: 'JDG', name: 'Judges', testament: 'OT' },
  { id: 'RUT', name: 'Ruth', testament: 'OT' },
  { id: '1SA', name: '1 Samuel', testament: 'OT' },
  { id: '2SA', name: '2 Samuel', testament: 'OT' },
  { id: '1KI', name: '1 Kings', testament: 'OT' },
  { id: '2KI', name: '2 Kings', testament: 'OT' },
  { id: '1CH', name: '1 Chronicles', testament: 'OT' },
  { id: '2CH', name: '2 Chronicles', testament: 'OT' },
  { id: 'EZR', name: 'Ezra', testament: 'OT' },
  { id: 'NEH', name: 'Nehemiah', testament: 'OT' },
  { id: 'EST', name: 'Esther', testament: 'OT' },
  { id: 'JOB', name: 'Job', testament: 'OT' },
  { id: 'PSA', name: 'Psalms', testament: 'OT' },
  { id: 'PRO', name: 'Proverbs', testament: 'OT' },
  { id: 'ECC', name: 'Ecclesiastes', testament: 'OT' },
  { id: 'SNG', name: 'Song of Solomon', testament: 'OT' },
  { id: 'ISA', name: 'Isaiah', testament: 'OT' },
  { id: 'JER', name: 'Jeremiah', testament: 'OT' },
  { id: 'LAM', name: 'Lamentations', testament: 'OT' },
  { id: 'EZK', name: 'Ezekiel', testament: 'OT' },
  { id: 'DAN', name: 'Daniel', testament: 'OT' },
  { id: 'HOS', name: 'Hosea', testament: 'OT' },
  { id: 'JOL', name: 'Joel', testament: 'OT' },
  { id: 'AMO', name: 'Amos', testament: 'OT' },
  { id: 'OBA', name: 'Obadiah', testament: 'OT' },
  { id: 'JON', name: 'Jonah', testament: 'OT' },
  { id: 'MIC', name: 'Micah', testament: 'OT' },
  { id: 'NAM', name: 'Nahum', testament: 'OT' },
  { id: 'HAB', name: 'Habakkuk', testament: 'OT' },
  { id: 'ZEP', name: 'Zephaniah', testament: 'OT' },
  { id: 'HAG', name: 'Haggai', testament: 'OT' },
  { id: 'ZEC', name: 'Zechariah', testament: 'OT' },
  { id: 'MAL', name: 'Malachi', testament: 'OT' },
  
  // New Testament books
  { id: 'MAT', name: 'Matthew', testament: 'NT' },
  { id: 'MRK', name: 'Mark', testament: 'NT' },
  { id: 'LUK', name: 'Luke', testament: 'NT' },
  { id: 'JHN', name: 'John', testament: 'NT' },
  { id: 'ACT', name: 'Acts', testament: 'NT' },
  { id: 'ROM', name: 'Romans', testament: 'NT' },
  { id: '1CO', name: '1 Corinthians', testament: 'NT' },
  { id: '2CO', name: '2 Corinthians', testament: 'NT' },
  { id: 'GAL', name: 'Galatians', testament: 'NT' },
  { id: 'EPH', name: 'Ephesians', testament: 'NT' },
  { id: 'PHP', name: 'Philippians', testament: 'NT' },
  { id: 'COL', name: 'Colossians', testament: 'NT' },
  { id: '1TH', name: '1 Thessalonians', testament: 'NT' },
  { id: '2TH', name: '2 Thessalonians', testament: 'NT' },
  { id: '1TI', name: '1 Timothy', testament: 'NT' },
  { id: '2TI', name: '2 Timothy', testament: 'NT' },
  { id: 'TIT', name: 'Titus', testament: 'NT' },
  { id: 'PHM', name: 'Philemon', testament: 'NT' },
  { id: 'HEB', name: 'Hebrews', testament: 'NT' },
  { id: 'JAS', name: 'James', testament: 'NT' },
  { id: '1PE', name: '1 Peter', testament: 'NT' },
  { id: '2PE', name: '2 Peter', testament: 'NT' },
  { id: '1JN', name: '1 John', testament: 'NT' },
  { id: '2JN', name: '2 John', testament: 'NT' },
  { id: '3JN', name: '3 John', testament: 'NT' },
  { id: 'JUD', name: 'Jude', testament: 'NT' },
  { id: 'REV', name: 'Revelation', testament: 'NT' },
];

// Chapter counts for each book
const CHAPTER_COUNTS: Record<string, number> = {
  'Genesis': 50, 'Exodus': 40, 'Leviticus': 27, 'Numbers': 36, 'Deuteronomy': 34,
  'Joshua': 24, 'Judges': 21, 'Ruth': 4, '1 Samuel': 31, '2 Samuel': 24,
  '1 Kings': 22, '2 Kings': 25, '1 Chronicles': 29, '2 Chronicles': 36, 'Ezra': 10,
  'Nehemiah': 13, 'Esther': 10, 'Job': 42, 'Psalms': 150, 'Proverbs': 31,
  'Ecclesiastes': 12, 'Song of Solomon': 8, 'Isaiah': 66, 'Jeremiah': 52, 'Lamentations': 5,
  'Ezekiel': 48, 'Daniel': 12, 'Hosea': 14, 'Joel': 3, 'Amos': 9,
  'Obadiah': 1, 'Jonah': 4, 'Micah': 7, 'Nahum': 3, 'Habakkuk': 3,
  'Zephaniah': 3, 'Haggai': 2, 'Zechariah': 14, 'Malachi': 4, 'Matthew': 28,
  'Mark': 16, 'Luke': 24, 'John': 21, 'Acts': 28, 'Romans': 16,
  '1 Corinthians': 16, '2 Corinthians': 13, 'Galatians': 6, 'Ephesians': 6, 'Philippians': 4,
  'Colossians': 4, '1 Thessalonians': 5, '2 Thessalonians': 3, '1 Timothy': 6, '2 Timothy': 4,
  'Titus': 3, 'Philemon': 1, 'Hebrews': 13, 'James': 5, '1 Peter': 5,
  '2 Peter': 3, '1 John': 5, '2 John': 1, '3 John': 1, 'Jude': 1,
  'Revelation': 22
};

// Helper function to fetch from Bible API
async function fetchFromApi(endpoint: string): Promise<any> {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`);

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Bible API fetch error:', error);
    throw error;
  }
}

// Get the preferred Bible version from storage or use default
export async function getPreferredVersion(): Promise<string> {
  try {
    const version = await AsyncStorage.getItem(PREFERRED_VERSION_KEY);
    return version || DEFAULT_BIBLE_VERSION;
  } catch (error) {
    console.error('Error getting preferred Bible version:', error);
    return DEFAULT_BIBLE_VERSION;
  }
}

// Set preferred Bible version
export async function setPreferredVersion(version: string): Promise<void> {
  try {
    await AsyncStorage.setItem(PREFERRED_VERSION_KEY, version);
  } catch (error) {
    console.error('Error setting preferred Bible version:', error);
  }
}

// Cache handling functions
async function getCachedData<T>(key: string): Promise<T | null> {
  try {
    const cachedDataStr = await AsyncStorage.getItem(key);
    if (!cachedDataStr) return null;
    
    const cachedData: CachedData = JSON.parse(cachedDataStr);
    
    // Check if cache is expired
    if (Date.now() - cachedData.timestamp > CACHE_EXPIRY) {
      await AsyncStorage.removeItem(key);
      return null;
    }
    
    return cachedData.data as T;
  } catch (error) {
    console.error('Error getting cached data:', error);
    return null;
  }
}

async function setCachedData(key: string, data: any): Promise<void> {
  try {
    const cacheData: CachedData = {
      timestamp: Date.now(),
      data
    };
    await AsyncStorage.setItem(key, JSON.stringify(cacheData));
  } catch (error) {
    console.error('Error setting cached data:', error);
  }
}

// Get available Bible versions
export async function getAvailableBibles(): Promise<any[]> {
  // This API doesn't have an endpoint for available versions
  // Return a static list of common versions
  return [
    { id: 'kjv', name: 'King James Version (KJV)' },
    { id: 'web', name: 'World English Bible (WEB)' },
    { id: 'bbe', name: 'Bible in Basic English (BBE)' },
    { id: 'asv', name: 'American Standard Version (ASV)' },
  ];
}

// Get books of the Bible
export async function getBibleBooks(): Promise<BibleBook[]> {
  // Return the static list of Bible books
  return BIBLE_BOOKS;
}

// Get chapters for a book
export async function getBookChapters(bookId: string): Promise<any[]> {
  // Find the book by ID
  const book = BIBLE_BOOKS.find(b => b.id === bookId);
  
  if (!book) {
    return [];
  }
  
  const chapterCount = CHAPTER_COUNTS[book.name] || 0;
  
  // Create an array of chapter objects
  return Array.from({ length: chapterCount }, (_, index) => ({
    id: `${bookId}.${index + 1}`,
    number: `${index + 1}`,
    bookId: bookId
  }));
}

// Get a specific chapter with verses
export async function getChapterContent(bookId: string, chapter: number, version?: string): Promise<BibleVerse[]> {
  const actualVersion = version || await getPreferredVersion();
  
  // Find the book name from the ID
  const book = BIBLE_BOOKS.find(b => b.id === bookId);
  if (!book) {
    throw new Error(`Book with ID ${bookId} not found`);
  }
  
  // Format the passage query
  const passage = `${book.name}+${chapter}`;
  const cacheKey = `${CHAPTER_CACHE_PREFIX}${actualVersion}:${passage}`;
  
  // Try to get from cache first
  const cached = await getCachedData<BibleVerse[]>(cacheKey);
  if (cached) return cached;
  
  // Fetch from API if not in cache
  try {
    const response = await fetchFromApi(`/${passage}?translation=${actualVersion}`);
    const verses: BibleVerse[] = [];
    
    response.verses.forEach((verse: any) => {
      verses.push({
        verse: verse.verse,
        text: verse.text.trim()
      });
    });
    
    // Cache the parsed verses
    await setCachedData(cacheKey, verses);
    return verses;
  } catch (error) {
    console.error(`Error fetching chapter content for ${passage}:`, error);
    return [];
  }
}

// Get book ID from book name
export async function getBookIdFromName(bookName: string): Promise<string | null> {
  const book = BIBLE_BOOKS.find(b => b.name === bookName);
  return book?.id || null;
}

// Clear cache
export async function clearBibleCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const bibleKeys = keys.filter(key => 
      key.startsWith(CHAPTER_CACHE_PREFIX) || 
      key === PREFERRED_VERSION_KEY
    );
    
    if (bibleKeys.length > 0) {
      await AsyncStorage.multiRemove(bibleKeys);
    }
  } catch (error) {
    console.error('Error clearing Bible cache:', error);
  }
} 