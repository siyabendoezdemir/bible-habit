import AsyncStorage from '@react-native-async-storage/async-storage';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';

// Types
export interface BibleVerse {
  verse: number;
  text: string;
  book: string;
  chapter: number;
}

export interface BibleBook {
  id: string;
  name: string;
  testament: 'OT' | 'NT';
  chapters: number;
}

export interface BibleVersion {
  id: string;
  name: string;
  language: string;
  languageName: string;
  description?: string;
  shortName?: string;
}

// Constants
const CACHE_EXPIRY = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
const CHAPTER_CACHE_PREFIX = 'bible_chapter:';
const PREFERRED_VERSION_KEY = 'preferred_bible_version';
const DEFAULT_BIBLE_VERSION = 'web'; // World English Bible

// Bible books data
const BIBLE_BOOKS: BibleBook[] = [
  // Old Testament books
  { id: 'GEN', name: 'Genesis', testament: 'OT', chapters: 50 },
  { id: 'EXO', name: 'Exodus', testament: 'OT', chapters: 40 },
  { id: 'LEV', name: 'Leviticus', testament: 'OT', chapters: 27 },
  { id: 'NUM', name: 'Numbers', testament: 'OT', chapters: 36 },
  { id: 'DEU', name: 'Deuteronomy', testament: 'OT', chapters: 34 },
  { id: 'JOS', name: 'Joshua', testament: 'OT', chapters: 24 },
  { id: 'JDG', name: 'Judges', testament: 'OT', chapters: 21 },
  { id: 'RUT', name: 'Ruth', testament: 'OT', chapters: 4 },
  { id: '1SA', name: '1 Samuel', testament: 'OT', chapters: 31 },
  { id: '2SA', name: '2 Samuel', testament: 'OT', chapters: 24 },
  { id: '1KI', name: '1 Kings', testament: 'OT', chapters: 22 },
  { id: '2KI', name: '2 Kings', testament: 'OT', chapters: 25 },
  { id: '1CH', name: '1 Chronicles', testament: 'OT', chapters: 29 },
  { id: '2CH', name: '2 Chronicles', testament: 'OT', chapters: 36 },
  { id: 'EZR', name: 'Ezra', testament: 'OT', chapters: 10 },
  { id: 'NEH', name: 'Nehemiah', testament: 'OT', chapters: 13 },
  { id: 'EST', name: 'Esther', testament: 'OT', chapters: 10 },
  { id: 'JOB', name: 'Job', testament: 'OT', chapters: 42 },
  { id: 'PSA', name: 'Psalms', testament: 'OT', chapters: 150 },
  { id: 'PRO', name: 'Proverbs', testament: 'OT', chapters: 31 },
  { id: 'ECC', name: 'Ecclesiastes', testament: 'OT', chapters: 12 },
  { id: 'SNG', name: 'Song of Solomon', testament: 'OT', chapters: 8 },
  { id: 'ISA', name: 'Isaiah', testament: 'OT', chapters: 66 },
  { id: 'JER', name: 'Jeremiah', testament: 'OT', chapters: 52 },
  { id: 'LAM', name: 'Lamentations', testament: 'OT', chapters: 5 },
  { id: 'EZK', name: 'Ezekiel', testament: 'OT', chapters: 48 },
  { id: 'DAN', name: 'Daniel', testament: 'OT', chapters: 12 },
  { id: 'HOS', name: 'Hosea', testament: 'OT', chapters: 14 },
  { id: 'JOL', name: 'Joel', testament: 'OT', chapters: 3 },
  { id: 'AMO', name: 'Amos', testament: 'OT', chapters: 9 },
  { id: 'OBA', name: 'Obadiah', testament: 'OT', chapters: 1 },
  { id: 'JON', name: 'Jonah', testament: 'OT', chapters: 4 },
  { id: 'MIC', name: 'Micah', testament: 'OT', chapters: 7 },
  { id: 'NAM', name: 'Nahum', testament: 'OT', chapters: 3 },
  { id: 'HAB', name: 'Habakkuk', testament: 'OT', chapters: 3 },
  { id: 'ZEP', name: 'Zephaniah', testament: 'OT', chapters: 3 },
  { id: 'HAG', name: 'Haggai', testament: 'OT', chapters: 2 },
  { id: 'ZEC', name: 'Zechariah', testament: 'OT', chapters: 14 },
  { id: 'MAL', name: 'Malachi', testament: 'OT', chapters: 4 },
  
  // New Testament books
  { id: 'MAT', name: 'Matthew', testament: 'NT', chapters: 28 },
  { id: 'MRK', name: 'Mark', testament: 'NT', chapters: 16 },
  { id: 'LUK', name: 'Luke', testament: 'NT', chapters: 24 },
  { id: 'JHN', name: 'John', testament: 'NT', chapters: 21 },
  { id: 'ACT', name: 'Acts', testament: 'NT', chapters: 28 },
  { id: 'ROM', name: 'Romans', testament: 'NT', chapters: 16 },
  { id: '1CO', name: '1 Corinthians', testament: 'NT', chapters: 16 },
  { id: '2CO', name: '2 Corinthians', testament: 'NT', chapters: 13 },
  { id: 'GAL', name: 'Galatians', testament: 'NT', chapters: 6 },
  { id: 'EPH', name: 'Ephesians', testament: 'NT', chapters: 6 },
  { id: 'PHP', name: 'Philippians', testament: 'NT', chapters: 4 },
  { id: 'COL', name: 'Colossians', testament: 'NT', chapters: 4 },
  { id: '1TH', name: '1 Thessalonians', testament: 'NT', chapters: 5 },
  { id: '2TH', name: '2 Thessalonians', testament: 'NT', chapters: 3 },
  { id: '1TI', name: '1 Timothy', testament: 'NT', chapters: 6 },
  { id: '2TI', name: '2 Timothy', testament: 'NT', chapters: 4 },
  { id: 'TIT', name: 'Titus', testament: 'NT', chapters: 3 },
  { id: 'PHM', name: 'Philemon', testament: 'NT', chapters: 1 },
  { id: 'HEB', name: 'Hebrews', testament: 'NT', chapters: 13 },
  { id: 'JAS', name: 'James', testament: 'NT', chapters: 5 },
  { id: '1PE', name: '1 Peter', testament: 'NT', chapters: 5 },
  { id: '2PE', name: '2 Peter', testament: 'NT', chapters: 3 },
  { id: '1JN', name: '1 John', testament: 'NT', chapters: 5 },
  { id: '2JN', name: '2 John', testament: 'NT', chapters: 1 },
  { id: '3JN', name: '3 John', testament: 'NT', chapters: 1 },
  { id: 'JUD', name: 'Jude', testament: 'NT', chapters: 1 },
  { id: 'REV', name: 'Revelation', testament: 'NT', chapters: 22 },
];

// Available Bible versions
const AVAILABLE_VERSIONS: BibleVersion[] = [
  { 
    id: 'web', 
    name: 'World English Bible', 
    language: 'eng', 
    languageName: 'English', 
    description: 'WEB - World English Bible (Public Domain)', 
    shortName: 'WEB' 
  },
  // Additional versions can be added here in the future
];

// In-memory cache
const memoryCache: {
  [key: string]: {
    data: any;
    timestamp: number;
  }
} = {};

// Cache helpers
interface CachedData {
  timestamp: number;
  data: any;
  expiry?: number;
}

async function getCachedData<T>(key: string): Promise<T | null> {
  try {
    // Check memory cache first
    if (memoryCache[key] && (Date.now() - memoryCache[key].timestamp) < 3600000) { // 1 hour
      return memoryCache[key].data as T;
    }
    
    const jsonValue = await AsyncStorage.getItem(key);
    if (!jsonValue) return null;
    
    const cached: CachedData = JSON.parse(jsonValue);
    
    // Check if data is expired
    if (cached.expiry && Date.now() > cached.timestamp + cached.expiry) {
      await AsyncStorage.removeItem(key);
      return null;
    }
    
    // Update memory cache
    memoryCache[key] = {
      data: cached.data,
      timestamp: Date.now()
    };
    
    return cached.data as T;
  } catch (error) {
    console.error('Error retrieving cached data:', error);
    return null;
  }
}

async function setCachedData(key: string, data: any, expiry: number = CACHE_EXPIRY): Promise<void> {
  try {
    const cachedData: CachedData = {
      timestamp: Date.now(),
      data,
      expiry
    };
    
    // Update memory cache
    memoryCache[key] = {
      data,
      timestamp: Date.now()
    };
    
    await AsyncStorage.setItem(key, JSON.stringify(cachedData));
  } catch (error) {
    console.error('Error caching data:', error);
  }
}

// Bible data access functions
export async function getPreferredVersion(): Promise<string> {
  try {
    const version = await AsyncStorage.getItem(PREFERRED_VERSION_KEY);
    return version || DEFAULT_BIBLE_VERSION;
  } catch (error) {
    console.error('Error getting preferred Bible version:', error);
    return DEFAULT_BIBLE_VERSION;
  }
}

export async function setPreferredVersion(version: string): Promise<void> {
  try {
    // Validate that the version exists
    const versionExists = AVAILABLE_VERSIONS.some(v => v.id === version);
    if (!versionExists) {
      throw new Error(`Bible version ${version} is not available`);
    }
    
    await AsyncStorage.setItem(PREFERRED_VERSION_KEY, version);
  } catch (error) {
    console.error('Error setting preferred Bible version:', error);
    throw error;
  }
}

export async function getAvailableBibles(): Promise<BibleVersion[]> {
  // In this simplified implementation, we return the static list
  // In a future implementation, this could fetch from an API or local database
  return AVAILABLE_VERSIONS;
}

export async function getBibleBooks(): Promise<BibleBook[]> {
  // Return the static list of Bible books
  return BIBLE_BOOKS;
}

export async function getBookIdFromName(bookName: string): Promise<string | null> {
  const book = BIBLE_BOOKS.find(b => b.name === bookName);
  return book ? book.id : null;
}

export async function getBookChapters(bookId: string): Promise<number> {
  const book = BIBLE_BOOKS.find(b => b.id === bookId);
  return book ? book.chapters : 0;
}

// Initialize the Bible API service
export async function initializeBibleApiService(): Promise<void> {
  try {
    console.log('Initializing Bible API service...');
    
    // Ensure the preferred version is set
    const currentVersion = await getPreferredVersion();
    console.log(`Current Bible version: ${currentVersion}`);
    
    const versionExists = AVAILABLE_VERSIONS.some(v => v.id === currentVersion);
    if (!versionExists) {
      console.log(`Version ${currentVersion} not found, setting to default: ${DEFAULT_BIBLE_VERSION}`);
      await setPreferredVersion(DEFAULT_BIBLE_VERSION);
    }
    
    // Pre-cache Genesis 1 for offline access
    try {
      const cacheKey = `${CHAPTER_CACHE_PREFIX}${DEFAULT_BIBLE_VERSION}:Genesis:1`;
      const cached = await getCachedData<BibleVerse[]>(cacheKey);
      if (!cached) {
        console.log('Pre-caching Genesis 1...');
        await loadBibleContent('GEN', 1, DEFAULT_BIBLE_VERSION);
      }
    } catch (error) {
      console.warn('Failed to pre-cache Genesis 1:', error);
    }
    
    console.log('Bible API service initialized successfully');
  } catch (error) {
    console.error('Error initializing Bible API service:', error);
    try {
      await setPreferredVersion(DEFAULT_BIBLE_VERSION);
    } catch (e) {
      console.error('Failed to set default Bible version:', e);
    }
  }
}

// Load Bible content from API with robust error handling and caching
async function loadBibleContent(bookId: string, chapter: number, version: string): Promise<BibleVerse[]> {
  try {
    // Find the book name from the ID
    const book = BIBLE_BOOKS.find(b => b.id === bookId);
    if (!book) {
      throw new Error(`Book with ID ${bookId} not found`);
    }

    // Check cache first
    const cacheKey = `${CHAPTER_CACHE_PREFIX}${version}:${book.name}:${chapter}`;
    const cached = await getCachedData<BibleVerse[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Format the passage reference for Bible-api.com
    const passage = `${book.name} ${chapter}`.toLowerCase().replace(/\s+/g, '+');
    const apiUrl = `https://bible-api.com/${passage}`;

    try {
      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error(`Bible API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Log the response structure for debugging
      console.log('API Response:', JSON.stringify(data, null, 2));
      
      // Handle the case where the API returns no content
      if (!data || typeof data.text !== 'string') {
        console.warn(`No content found for ${book.name} ${chapter}`);
        throw new Error('No content found in API response');
      }

      // Split the text into verses and process them
      const verses: BibleVerse[] = [];
      const verseLines = data.text.trim().split('\n');
      
      for (let i = 0; i < verseLines.length; i++) {
        const line = verseLines[i].trim();
        if (line) {
          verses.push({
            verse: i + 1,
            text: line,
            book: book.name,
            chapter: chapter
          });
        }
      }

      // If we couldn't parse any verses, throw an error
      if (verses.length === 0) {
        throw new Error('No verses found in API response');
      }

      // Cache the results
      await setCachedData(cacheKey, verses);

      return verses;
    } catch (error) {
      console.error(`API request failed for ${book.name} ${chapter}:`, error);
      throw error;
    }
  } catch (error) {
    console.error(`Error loading Bible content for ${bookId} ${chapter}:`, error);
    
    // Return mock data as fallback
    const mockVerses = generateMockVerses(BIBLE_BOOKS.find(b => b.id === bookId)?.name || 'Unknown', chapter);
    
    // Cache the mock data temporarily (1 hour) to prevent repeated API calls
    const cacheKey = `${CHAPTER_CACHE_PREFIX}${version}:${bookId}:${chapter}`;
    await setCachedData(cacheKey, mockVerses, 60 * 60 * 1000); // 1 hour cache for mock data
    
    return mockVerses;
  }
}

// Generate mock verses for development and fallback
function generateMockVerses(bookName: string, chapter: number): BibleVerse[] {
  const versesCount = bookName === 'Psalms' ? 20 : 30; // Approximate
  const verses: BibleVerse[] = [];
  
  for (let i = 1; i <= versesCount; i++) {
    verses.push({
      verse: i,
      text: `This is a placeholder for ${bookName} chapter ${chapter} verse ${i}. In a production app, this would contain the actual Bible text.`,
      book: bookName,
      chapter: chapter
    });
  }
  
  return verses;
}

export async function getChapterContent(bookId: string, chapter: number, version?: string): Promise<BibleVerse[]> {
  const actualVersion = version || await getPreferredVersion();
  
  // Find the book name from the ID
  const book = BIBLE_BOOKS.find(b => b.id === bookId);
  if (!book) {
    throw new Error(`Book with ID ${bookId} not found`);
  }
  
  // Format caching key
  const cacheKey = `${CHAPTER_CACHE_PREFIX}${actualVersion}:${book.name}:${chapter}`;
  
  // Try to get from cache first
  const cached = await getCachedData<BibleVerse[]>(cacheKey);
  if (cached && cached.length > 0) {
    return cached;
  }
  
  // Load from bundled content
  const verses = await loadBibleContent(bookId, chapter, actualVersion);
  
  // Cache the result
  await setCachedData(cacheKey, verses);
  
  return verses;
}

export async function getVerseContent(bookId: string, chapter: number, verse: number, version?: string): Promise<BibleVerse | null> {
  const verses = await getChapterContent(bookId, chapter, version);
  return verses.find(v => v.verse === verse) || null;
}

export async function clearBibleCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(key => key.startsWith(CHAPTER_CACHE_PREFIX));
    
    if (cacheKeys.length > 0) {
      await AsyncStorage.multiRemove(cacheKeys);
    }
    
    // Clear memory cache
    Object.keys(memoryCache).forEach(key => {
      if (key.startsWith(CHAPTER_CACHE_PREFIX)) {
        delete memoryCache[key];
      }
    });
    
    console.log(`Cleared ${cacheKeys.length} Bible cache entries`);
  } catch (error) {
    console.error('Error clearing Bible cache:', error);
    throw error;
  }
}

// Add clearVersionsCache function
export async function clearVersionsCache(): Promise<void> {
  try {
    // Clear preferred version from AsyncStorage
    await AsyncStorage.removeItem(PREFERRED_VERSION_KEY);
    
    // Clear any version-related entries from memory cache
    Object.keys(memoryCache).forEach(key => {
      if (key === PREFERRED_VERSION_KEY || key.includes('version')) {
        delete memoryCache[key];
      }
    });
    
    // Reset to default version
    await setPreferredVersion(DEFAULT_BIBLE_VERSION);
    
    console.log('Bible versions cache cleared');
  } catch (error) {
    console.error('Error clearing versions cache:', error);
    throw error;
  }
}

// Get a daily verse
export function getDailyVerse() {
  // In a real implementation, this would rotate based on the date
  // For now, we'll return a static verse
  return {
    text: "But seek first his kingdom and his righteousness, and all these things will be given to you as well.",
    reference: "Matthew 6:33"
  };
}

// Get reading plan items
export function getReadingPlanItems() {
  // In a real implementation, this would be personalized
  // For now, we'll return static items
  return [
    { book: "Genesis 1-2", description: "Creation", completed: true },
    { book: "Psalms 1", description: "Blessed is the one", completed: true },
    { book: "Luke 1", description: "John's birth foretold", completed: true },
    { book: "John 1", description: "The Word", completed: false },
    { book: "Exodus 1", description: "Israelites oppressed", completed: false },
    { book: "1 Samuel 1", description: "Samuel's birth", completed: false }
  ];
} 