import AsyncStorage from '@react-native-async-storage/async-storage';
import { BibleVerse } from '../constants/BibleContent';

// Extend the BibleVerse interface to include book and chapter
export interface ExtendedBibleVerse extends BibleVerse {
  book: string;
  chapter: number;
}

// Constants
const BASE_URL = 'https://bible.helloao.org/api';
const DEFAULT_BIBLE_VERSION = 'eng-kjv'; // King James Version
const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
const ALL_VERSIONS_URL = `${BASE_URL}/available_translations.json`;
const BIBLES_URL = `${BASE_URL}/bibles/bibles.json`;
const CHAPTER_CACHE_PREFIX = 'bible_chapter:';
const VERSIONS_CACHE_KEY = 'bible_versions';
const PREFERRED_VERSION_KEY = 'preferred_bible_version';
const BOOKS_CACHE_PREFIX = 'bible_books:';

// In-memory cache for frequently accessed data
const memoryCache: {
  bibleVersions?: BibleVersion[];
  preferredVersion?: string;
  lastVersionsFetch: number;
} = {
  lastVersionsFetch: 0
};

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
  expiry?: number;
}

// Bible book structure
interface BibleBook {
  id: string;
  name: string;
  testament: 'OT' | 'NT';
}

// Bible version structure from GitHub API
interface RemoteBibleVersion {
  id: string;
  version: string;
  abbreviation: string;
  description?: string;
  language: {
    name: string;
    code: string;
    level?: number;
  };
  country?: {
    name: string;
    code: string;
  };
  scope?: string;
  numeralSystem?: string;
  script?: string;
  scriptDirection?: string;
  isRightToLeft?: boolean;
  copyright?: string;
  licenseName?: string;
  licenseUrl?: string;
  licenseText?: string;
  info?: string;
  publisher?: string;
}

// Simplified Bible version structure for UI
export interface BibleVersion {
  id: string;
  name: string;
  language: string;
  languageName: string;
  description?: string;
}

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

// Chapter response from API
interface ChapterResponse {
  book: string;
  chapter: string | number;
  verses: Array<{
    number: string;
    text: string;
  }>;
}

// Verse response from API
interface VerseResponse {
  book: string;
  chapter: string | number;
  verse: string | number;
  text: string;
}

// Map of special book name mappings for API
const BOOK_NAME_MAP: Record<string, string> = {
  'Genesis': 'genesis',
  'Exodus': 'exodus',
  'Leviticus': 'leviticus',
  'Numbers': 'numbers',
  'Deuteronomy': 'deuteronomy',
  'Joshua': 'joshua',
  'Judges': 'judges',
  'Ruth': 'ruth',
  '1 Samuel': '1samuel',
  '2 Samuel': '2samuel',
  '1 Kings': '1kings',
  '2 Kings': '2kings',
  '1 Chronicles': '1chronicles',
  '2 Chronicles': '2chronicles',
  'Ezra': 'ezra',
  'Nehemiah': 'nehemiah',
  'Esther': 'esther',
  'Job': 'job',
  'Psalms': 'psalms',
  'Proverbs': 'proverbs',
  'Ecclesiastes': 'ecclesiastes',
  'Song of Solomon': 'songofsolomon',
  'Isaiah': 'isaiah',
  'Jeremiah': 'jeremiah',
  'Lamentations': 'lamentations',
  'Ezekiel': 'ezekiel',
  'Daniel': 'daniel',
  'Hosea': 'hosea',
  'Joel': 'joel',
  'Amos': 'amos',
  'Obadiah': 'obadiah',
  'Jonah': 'jonah',
  'Micah': 'micah',
  'Nahum': 'nahum',
  'Habakkuk': 'habakkuk',
  'Zephaniah': 'zephaniah',
  'Haggai': 'haggai',
  'Zechariah': 'zechariah',
  'Malachi': 'malachi',
  'Matthew': 'matthew',
  'Mark': 'mark',
  'Luke': 'luke',
  'John': 'john',
  'Acts': 'acts',
  'Romans': 'romans',
  '1 Corinthians': '1corinthians',
  '2 Corinthians': '2corinthians',
  'Galatians': 'galatians',
  'Ephesians': 'ephesians',
  'Philippians': 'philippians',
  'Colossians': 'colossians',
  '1 Thessalonians': '1thessalonians',
  '2 Thessalonians': '2thessalonians',
  '1 Timothy': '1timothy',
  '2 Timothy': '2timothy',
  'Titus': 'titus',
  'Philemon': 'philemon',
  'Hebrews': 'hebrews',
  'James': 'james',
  '1 Peter': '1peter',
  '2 Peter': '2peter',
  '1 John': '1john',
  '2 John': '2john',
  '3 John': '3john',
  'Jude': 'jude',
  'Revelation': 'revelation'
};

// Helper function to format book name for API (using mapping)
function formatBookNameForApi(bookName: string): string {
  // Check if we have a direct mapping
  if (BOOK_NAME_MAP[bookName]) {
    return BOOK_NAME_MAP[bookName];
  }
  
  // Fallback: convert to lowercase and remove spaces and special characters
  return bookName.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
}

// New interface for the Free Use Bible API translation response
interface FreeUseBibleTranslation {
  id: string;
  name: string;
  website: string;
  licenseUrl: string;
  licenseNotes: string | null;
  shortName: string;
  englishName: string;
  language: string;
  textDirection: string;
  sha256: string;
  availableFormats: string[];
  listOfBooksApiLink: string;
  numberOfBooks: number;
  totalNumberOfChapters: number;
  totalNumberOfVerses: number;
  languageName: string;
  languageEnglishName: string;
}

// New interface for the Free Use Bible API book response
interface FreeUseBibleBook {
  id: string;
  translationId: string;
  name: string;
  commonName: string;
  title: string;
  order: number;
  numberOfChapters: number;
  sha256: string;
  firstChapterApiLink: string;
  lastChapterApiLink: string;
  totalNumberOfVerses: number;
}

// New interface for the Free Use Bible API chapter response
interface FreeUseBibleChapter {
  translation: FreeUseBibleTranslation;
  book: FreeUseBibleBook;
  chapter: {
    number: number;
    content: Array<{
      type: string;
      number: number;
      content: Array<string | { text: string; wordsOfJesus?: boolean }>;
    }>;
    footnotes: any[];
  };
  thisChapterLink: string;
  thisChapterAudioLinks: Record<string, string>;
  nextChapterApiLink: string;
  nextChapterAudioLinks: Record<string, string>;
  previousChapterApiLink: string;
  previousChapterAudioLinks: Record<string, string>;
  numberOfVerses: number;
}

// New interface for the Free Use Bible API available translations response
interface FreeUseBibleAvailableTranslations {
  translations: FreeUseBibleTranslation[];
}

// Helper function to fetch chapter content from API
async function fetchChapterContent(version: string, book: string, chapter: number): Promise<any> {
  try {
    // Find the book ID from the book name
    const bookObj = BIBLE_BOOKS.find(b => b.name === book);
    if (!bookObj) {
      throw new Error(`Book not found: ${book}`);
    }
    
    // The correct API endpoint format is:
    // https://bible.helloao.org/api/{translation}/{book}/{chapter}.json
    const url = `${BASE_URL}/${version}/${bookObj.id}/${chapter}.json`;
    
    console.log(`Fetching chapter from: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'BibleHabit/1.0',
        'Cache-Control': 'no-cache'
      }
    });

    if (!response.ok) {
      const status = response.status;
      console.error(`Failed to fetch Bible content for ${version}, book: ${bookObj.id}, chapter: ${chapter}, status: ${status}`);
      
      // Add more detailed logging for different error types
      if (status === 404) {
        throw new Error(`Version not found: ${version} does not have the requested content. Try another version.`);
      } else if (status === 403) {
        throw new Error(`Access forbidden: ${version} content is restricted. Try another version.`);
      } else {
        throw new Error(`API request failed: ${status} - Unable to fetch Bible content`);
      }
    }

    // Check content type to ensure we're getting JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.warn(`Expected JSON but got content-type: ${contentType} for ${url}`);
      
      // Try to parse anyway, but log the first part of the response for debugging
      const text = await response.text();
      console.log(`Response starts with: ${text.substring(0, 200)}...`);
      
      // If it starts with HTML, we're getting the website instead of the API
      if (text.trim().startsWith('<')) {
        console.error(`Received HTML instead of JSON. The API endpoint may be incorrect.`);
        // Fall back to default version
        throw new Error(`API endpoint incorrect for ${version}. Falling back to default version.`);
      }
      
      // Try to parse it as JSON anyway
      try {
        return JSON.parse(text);
      } catch (parseError) {
        console.error(`Failed to parse response as JSON for ${url}:`, parseError);
        throw new Error(`Invalid response format from Bible API for ${version} ${book} ${chapter}`);
      }
    }

    return await response.json();
  } catch (error) {
    console.error(`Bible API fetch error for ${version} ${book} ${chapter}:`, error);
    throw error;
  }
}

// Get book ID from book name
export async function getBookIdFromName(bookName: string): Promise<string | null> {
  const book = BIBLE_BOOKS.find(b => b.name === bookName);
  return book?.id || null;
}

// Clear all Bible-related cache
export async function clearBibleCache(): Promise<void> {
  try {
    // Get all keys from AsyncStorage
    const keys = await AsyncStorage.getAllKeys();
    
    // Filter for Bible-related cache keys
    const bibleCacheKeys = keys.filter(key => 
      key.startsWith(CHAPTER_CACHE_PREFIX) || 
      key.startsWith(BOOKS_CACHE_PREFIX) || 
      key === VERSIONS_CACHE_KEY
    );
    
    if (bibleCacheKeys.length > 0) {
      console.log(`Clearing ${bibleCacheKeys.length} Bible cache entries`);
      await AsyncStorage.multiRemove(bibleCacheKeys);
      console.log('Bible cache cleared successfully');
    } else {
      console.log('No Bible cache entries to clear');
    }
    
    // Clear memory cache
    memoryCache.bibleVersions = undefined;
    memoryCache.lastVersionsFetch = 0;
    // Don't clear preferredVersion from memory as it's still valid
    
  } catch (error) {
    console.error('Error clearing Bible cache:', error);
    throw error;
  }
}

// Helper function to fetch a specific verse from API
async function fetchVerseContent(version: string, book: string, chapter: number, verse: number): Promise<any> {
  try {
    const formattedBook = formatBookNameForApi(book);
    
    // Simply use the exact version ID as provided
    // Construct a single URL with the exact version ID from the API
    const url = `${BASE_URL}/bibles/${version}/books/${formattedBook}/chapters/${chapter}/verses/${verse}.json`;
    
    console.log(`Fetching verse from: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'User-Agent': 'BibleHabit/1.0'
      }
    });

    if (!response.ok) {
      const status = response.status;
      console.error(`Failed to fetch Bible verse for ${version}, book: ${formattedBook}, chapter: ${chapter}, verse: ${verse}, status: ${status}`);
      
      // Add more detailed logging for different error types
      if (status === 404) {
        throw new Error(`Version not found: ${version} does not have verse ${verse}. Try another version.`);
      } else if (status === 403) {
        throw new Error(`Access forbidden: ${version} content is restricted. Try another version.`);
      } else {
        throw new Error(`API request failed: ${status} - Unable to fetch Bible verse`);
      }
    }

    return await response.json();
  } catch (error) {
    console.error('Bible API fetch error:', error);
    throw error;
  }
}

// Get a specific verse
export async function getVerseContent(bookId: string, chapter: number, verse: number, version?: string): Promise<ExtendedBibleVerse | null> {
  const actualVersion = version || await getPreferredVersion();
  
  // Find the book name from the ID
  const book = BIBLE_BOOKS.find(b => b.id === bookId);
  if (!book) {
    throw new Error(`Book with ID ${bookId} not found`);
  }
  
  // Format caching key - we need to encode the key for storage purposes
  const cacheKey = `${CHAPTER_CACHE_PREFIX}${encodeURIComponent(actualVersion)}:${book.name}:${chapter}:${verse}`;
  
  // Try to get from cache first
  const cached = await getCachedData<ExtendedBibleVerse>(cacheKey);
  if (cached) return cached;
  
  // Fetch from API if not in cache
  try {
    console.log(`Fetching verse content for ${book.name} ${chapter}:${verse} in version ${actualVersion}...`);
    // Pass the exact version ID without sanitization
    const response = await fetchVerseContent(actualVersion, book.name, chapter, verse);
    
    if (!response || !response.text) {
      throw new Error(`No verse found for ${book.name} ${chapter}:${verse} in ${actualVersion}`);
    }
    
    const verseData: ExtendedBibleVerse = {
      verse: typeof response.verse === 'string' ? parseInt(response.verse) : response.verse,
      text: response.text.trim(),
      book: book.name,
      chapter: chapter
    };
    
    // Cache the parsed verse
    await setCachedData(cacheKey, verseData);
    console.log(`Successfully fetched verse ${book.name} ${chapter}:${verse} in ${actualVersion}`);
    return verseData;
  } catch (error) {
    console.error(`Error fetching verse content for ${book.name} ${chapter}:${verse} in ${actualVersion}:`, error);
    
    // Try with default version if using a non-default version
    if (actualVersion !== DEFAULT_BIBLE_VERSION) {
      try {
        console.log(`Falling back to ${DEFAULT_BIBLE_VERSION} for ${book.name} ${chapter}:${verse}`);
        
        // Update cache key for default version
        const defaultCacheKey = `${CHAPTER_CACHE_PREFIX}${DEFAULT_BIBLE_VERSION}:${book.name}:${chapter}:${verse}`;
        
        // Try to get from cache first
        const defaultCached = await getCachedData<ExtendedBibleVerse>(defaultCacheKey);
        if (defaultCached) {
          console.log(`Retrieved ${DEFAULT_BIBLE_VERSION} verse from cache as fallback`);
          return defaultCached;
        }
        
        // Fetch from API if not in cache
        console.log(`Fetching ${DEFAULT_BIBLE_VERSION} verse from API as fallback`);
        const defaultResponse = await fetchVerseContent(DEFAULT_BIBLE_VERSION, book.name, chapter, verse);
        
        if (!defaultResponse || !defaultResponse.text) {
          throw new Error(`No verse found in default version either`);
        }
        
        const defaultVerseData: ExtendedBibleVerse = {
          verse: typeof defaultResponse.verse === 'string' ? parseInt(defaultResponse.verse) : defaultResponse.verse,
          text: defaultResponse.text.trim(),
          book: book.name,
          chapter: chapter
        };
        
        // Cache the fallback verse
        await setCachedData(defaultCacheKey, defaultVerseData);
        console.log(`Successfully fetched verse as fallback for ${book.name} ${chapter}:${verse}`);
        
        return defaultVerseData;
      } catch (fallbackError) {
        console.error(`Even the fallback to ${DEFAULT_BIBLE_VERSION} failed:`, fallbackError);
        return null;
      }
    }
    
    return null;
  }
}

// Clear the Bible versions cache
export async function clearVersionsCache(): Promise<void> {
  try {
    // Clear from AsyncStorage
    await AsyncStorage.removeItem(VERSIONS_CACHE_KEY);
    
    // Clear from memory cache
    memoryCache.bibleVersions = undefined;
    memoryCache.lastVersionsFetch = 0;
    
    console.log('Bible versions cache cleared successfully');
  } catch (error) {
    console.error('Error clearing Bible versions cache:', error);
    throw error;
  }
}

// Get the user's preferred Bible version
export async function getPreferredVersion(): Promise<string> {
  try {
    // Check memory cache first
    if (memoryCache.preferredVersion) {
      return memoryCache.preferredVersion;
    }
    
    // Try to get from AsyncStorage
    const version = await AsyncStorage.getItem(PREFERRED_VERSION_KEY);
    
    // If no version is set, use the default
    const preferredVersion = version || DEFAULT_BIBLE_VERSION;
    
    // Update memory cache
    memoryCache.preferredVersion = preferredVersion;
    
    return preferredVersion;
  } catch (error) {
    console.error('Error getting preferred Bible version:', error);
    return DEFAULT_BIBLE_VERSION;
  }
}

// Set the user's preferred Bible version
export async function setPreferredVersion(version: string): Promise<void> {
  try {
    if (!version) {
      console.warn('Attempted to set empty preferred Bible version');
      return;
    }
    
    // Update AsyncStorage
    await AsyncStorage.setItem(PREFERRED_VERSION_KEY, version);
    
    // Update memory cache
    memoryCache.preferredVersion = version;
    
    console.log(`Set preferred Bible version to: ${version}`);
  } catch (error) {
    console.error('Error setting preferred Bible version:', error);
    throw error;
  }
}

// Cache handling functions
async function getCachedData<T>(key: string): Promise<T | null> {
  try {
    // Ensure the key is valid for storage
    const safeKey = encodeURIComponent(key);
    
    const data = await AsyncStorage.getItem(safeKey);
    if (!data) {
      return null;
    }
    
    let parsed: CachedData;
    try {
      parsed = JSON.parse(data) as CachedData;
    } catch (parseError) {
      console.error(`Error parsing cached data for key ${key}:`, parseError);
      await AsyncStorage.removeItem(safeKey);
      return null;
    }
    
    // Check if data has expired
    const now = Date.now();
    const expiryTime = parsed.expiry || CACHE_EXPIRY;
    if (parsed.timestamp && parsed.timestamp + expiryTime < now) {
      console.log(`Cache expired for key: ${key} (age: ${(now - parsed.timestamp) / 1000}s, expiry: ${expiryTime / 1000}s)`);
      await AsyncStorage.removeItem(safeKey);
      return null;
    }
    
    return parsed.data as T;
  } catch (error) {
    console.error(`Error retrieving cached data for key ${key}:`, error);
    return null;
  }
}

async function setCachedData(key: string, data: any, expiry?: number): Promise<void> {
  try {
    if (!data) {
      console.warn(`Attempted to cache null or undefined data for key: ${key}`);
      return;
    }
    
    // Ensure the key is valid for storage
    const safeKey = encodeURIComponent(key);
    
    const cacheData: CachedData = {
      timestamp: Date.now(),
      data,
      expiry: expiry || CACHE_EXPIRY
    };
    
    const jsonString = JSON.stringify(cacheData);
    
    await AsyncStorage.setItem(safeKey, jsonString);
    console.log(`Successfully cached data for key: ${key} with expiry: ${expiry || CACHE_EXPIRY}ms`);
  } catch (error) {
    console.error(`Error setting cached data for key ${key}:`, error);
  }
}

// Get the list of available Bible versions
export async function getAvailableBibles(): Promise<BibleVersion[]> {
  try {
    // Check in-memory cache first (valid for 5 minutes)
    const FIVE_MINUTES = 5 * 60 * 1000;
    if (memoryCache.bibleVersions && memoryCache.bibleVersions.length > 0 && 
        (Date.now() - memoryCache.lastVersionsFetch) < FIVE_MINUTES) {
      console.log(`Using ${memoryCache.bibleVersions.length} Bible versions from memory cache`);
      return filterToPopularVersions(memoryCache.bibleVersions);
    }
    
    // Try to get from AsyncStorage cache
    const cached = await getCachedData<BibleVersion[]>(VERSIONS_CACHE_KEY);
    if (cached && cached.length > 0) {
      console.log(`Retrieved ${cached.length} Bible versions from AsyncStorage cache`);
      // Update memory cache with all versions
      memoryCache.bibleVersions = cached;
      memoryCache.lastVersionsFetch = Date.now();
      // Return only popular versions
      return filterToPopularVersions(cached);
    }
    
    // Log the URL we're fetching from
    console.log(`Fetching available Bible translations from: ${ALL_VERSIONS_URL}`);
    
    // Use a longer cache expiry for versions (1 week)
    const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
    
    const response = await fetch(ALL_VERSIONS_URL, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'BibleHabit/1.0',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    if (!response.ok) {
      const responseText = await response.text();
      console.error(`Failed to fetch Bible versions. Status: ${response.status}, Text: ${responseText.substring(0, 200)}...`);
      throw new Error(`Failed to fetch Bible versions: ${response.status}`);
    }
    
    // Check content type to ensure we're getting JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.warn(`Expected JSON but got content-type: ${contentType}`);
      // Try to parse anyway, but log the first part of the response for debugging
      const text = await response.text();
      console.log(`Response starts with: ${text.substring(0, 200)}...`);
      
      // If it starts with HTML, throw an error
      if (text.trim().startsWith('<')) {
        throw new Error(`Received HTML instead of JSON from API: ${text.substring(0, 100)}...`);
      }
      
      // Try to parse it as JSON anyway
      try {
        const data = JSON.parse(text);
        if (!data || !data.translations || !Array.isArray(data.translations)) {
          throw new Error('Invalid data structure');
        }
        const versions = processTranslations(data);
        // Cache with longer expiry
        await setCachedData(VERSIONS_CACHE_KEY, versions, ONE_WEEK_MS);
        // Update memory cache with all versions
        memoryCache.bibleVersions = versions;
        memoryCache.lastVersionsFetch = Date.now();
        // Return only popular versions
        return filterToPopularVersions(versions);
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', parseError);
        throw new Error('Invalid response format from Bible API');
      }
    }
    
    let data: { translations: FreeUseBibleTranslation[] };
    try {
      data = await response.json();
    } catch (jsonError) {
      console.error('Failed to parse JSON response:', jsonError);
      throw new Error('Invalid JSON response from Bible versions API');
    }
    
    const versions = processTranslations(data);
    // Cache with longer expiry
    await setCachedData(VERSIONS_CACHE_KEY, versions, ONE_WEEK_MS);
    // Update memory cache with all versions
    memoryCache.bibleVersions = versions;
    memoryCache.lastVersionsFetch = Date.now();
    // Return only popular versions
    return filterToPopularVersions(versions);
  } catch (error) {
    console.error('Error fetching Bible versions:', error);
    
    // Return a fallback list of popular Bible versions
    const fallbackVersions = getDefaultBibleVersions();
    
    // Update memory cache with fallback
    memoryCache.bibleVersions = fallbackVersions;
    memoryCache.lastVersionsFetch = Date.now();
    
    return fallbackVersions;
  }
}

// Helper function to filter to only popular versions
function filterToPopularVersions(versions: BibleVersion[]): BibleVersion[] {
  // List of popular language codes
  const popularLanguages = [
    'eng', // English
    'spa', // Spanish
    'fra', // French
    'deu', // German
    'ita', // Italian
    'por', // Portuguese
    'rus', // Russian
    'zho', // Chinese
    'jpn', // Japanese
    'kor', // Korean
    'ara', // Arabic
  ];
  
  // List of known working version IDs
  const knownWorkingVersions = [
    'eng-kjv',   // King James Version
    'eng-web',   // World English Bible
    'eng-asv',   // American Standard Version
    'eng-bbe',   // Bible in Basic English
    'spa-rvr1909', // Reina-Valera 1909
    'fra-lsg',   // Louis Segond
    'deu-luth1545', // Luther Bible 1545
    'ita-riveduta', // Riveduta Bible
    'por-almeida', // Almeida
    'rus-synodal', // Synodal Translation
  ];
  
  // First, filter to only include versions from popular languages
  const languageFiltered = versions.filter(version => 
    popularLanguages.includes(version.language)
  );
  
  // Then prioritize known working versions
  const result = [
    // First include all known working versions
    ...languageFiltered.filter(version => knownWorkingVersions.includes(version.id)),
    // Then include a limited number of other versions from popular languages
    ...languageFiltered.filter(version => !knownWorkingVersions.includes(version.id)).slice(0, 20)
  ];
  
  console.log(`Filtered from ${versions.length} to ${result.length} Bible versions (popular languages only)`);
  
  return result;
}

// Get default Bible versions for fallback
function getDefaultBibleVersions(): BibleVersion[] {
  return [
    { id: 'eng-kjv', name: 'King James Version', language: 'eng', languageName: 'English', description: 'KJV - English' },
    { id: 'eng-web', name: 'World English Bible', language: 'eng', languageName: 'English', description: 'WEB - English' },
    { id: 'eng-asv', name: 'American Standard Version', language: 'eng', languageName: 'English', description: 'ASV - English' },
    { id: 'eng-bbe', name: 'Bible in Basic English', language: 'eng', languageName: 'English', description: 'BBE - English' },
    { id: 'spa-rvr1909', name: 'Reina-Valera 1909', language: 'spa', languageName: 'Spanish', description: 'RVR1909 - Spanish' },
    { id: 'fra-lsg', name: 'Louis Segond', language: 'fra', languageName: 'French', description: 'LSG - French' },
    { id: 'deu-luth1545', name: 'Luther Bible 1545', language: 'deu', languageName: 'German', description: 'LUTH1545 - German' },
    { id: 'ita-riveduta', name: 'Riveduta Bible', language: 'ita', languageName: 'Italian', description: 'Riveduta - Italian' },
    { id: 'por-almeida', name: 'Almeida', language: 'por', languageName: 'Portuguese', description: 'Almeida - Portuguese' },
    { id: 'rus-synodal', name: 'Synodal Translation', language: 'rus', languageName: 'Russian', description: 'Synodal - Russian' }
  ];
}

// Helper function to process translations data
function processTranslations(data: { translations: FreeUseBibleTranslation[] }): BibleVersion[] {
  if (!data || !data.translations || !Array.isArray(data.translations)) {
    console.error('Expected translations array but got:', data);
    throw new Error('Invalid Bible versions data: translations not found or not an array');
  }
  
  // Map the API response to our BibleVersion format
  const versions: BibleVersion[] = data.translations.map(translation => ({
    id: translation.id,
    name: translation.englishName || translation.name || translation.shortName,
    language: translation.language,
    languageName: translation.languageEnglishName || translation.languageName,
    description: `${translation.shortName} - ${translation.languageEnglishName || translation.languageName}`
  }));
  
  console.log(`Processed ${versions.length} Bible versions`);
  
  return versions;
}

// Fetch books for a specific translation
async function fetchBooksForTranslation(translationId: string): Promise<FreeUseBibleBook[]> {
  try {
    // Use the correct API endpoint format: {translation}/books.json
    const url = `${BASE_URL}/${translationId}/books.json`;
    
    console.log(`Fetching books for translation ${translationId} from: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'User-Agent': 'BibleHabit/1.0'
      }
    });

    if (!response.ok) {
      const status = response.status;
      console.error(`Failed to fetch books for translation ${translationId}, status: ${status}`);
      throw new Error(`API request failed: ${status} - Unable to fetch books for translation ${translationId}`);
    }

    const data = await response.json();
    
    if (!data || !Array.isArray(data)) {
      console.error('Expected books array but got:', data);
      throw new Error('Invalid books data: not found or not an array');
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching books for translation:', error);
    throw error;
  }
}

// Get books of the Bible for a specific translation
export async function getBibleBooksForTranslation(translationId?: string): Promise<BibleBook[]> {
  try {
    const version = translationId || await getPreferredVersion();
    const cacheKey = `${BOOKS_CACHE_PREFIX}${version}`;
    
    // Try to get from cache first
    const cached = await getCachedData<BibleBook[]>(cacheKey);
    if (cached) return cached;
    
    // Fetch from API if not in cache
    const books = await fetchBooksForTranslation(version);
    
    // Map to our BibleBook format
    const mappedBooks: BibleBook[] = books.map(book => ({
      id: book.id,
      name: book.commonName || book.name,
      testament: book.order <= 39 ? 'OT' : 'NT'
    }));
    
    // Cache the result
    await setCachedData(cacheKey, mappedBooks);
    
    return mappedBooks;
  } catch (error) {
    console.error('Error getting Bible books for translation:', error);
    // Fall back to static list if API fails
    return BIBLE_BOOKS;
  }
}

// Get books of the Bible (using the default static list for backward compatibility)
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
export async function getChapterContent(bookId: string, chapter: number, version?: string): Promise<ExtendedBibleVerse[]> {
  const actualVersion = version || await getPreferredVersion();
  
  // Find the book name from the ID
  const book = BIBLE_BOOKS.find(b => b.id === bookId);
  if (!book) {
    throw new Error(`Book with ID ${bookId} not found`);
  }
  
  // Format caching key - we need to encode the key for storage purposes
  const cacheKey = `${CHAPTER_CACHE_PREFIX}${encodeURIComponent(actualVersion)}:${book.name}:${chapter}`;
  
  // Try to get from cache first
  const cached = await getCachedData<ExtendedBibleVerse[]>(cacheKey);
  if (cached && cached.length > 0) {
    console.log(`Retrieved ${cached.length} verses for ${book.name} ${chapter} from cache`);
    return cached;
  }
  
  // Fetch from API if not in cache
  try {
    console.log(`Fetching content for ${book.name} ${chapter} in version ${actualVersion}...`);
    // Pass the exact version ID without sanitization
    const response = await fetchChapterContent(actualVersion, book.name, chapter);
    
    // Log the response structure for debugging
    console.log(`Response structure for ${book.name} ${chapter}: ${JSON.stringify(Object.keys(response || {}))}`);
    
    // Make sure we have data and it's in the correct format for the new API
    if (!response) {
      throw new Error(`Empty response for ${book.name} ${chapter} in ${actualVersion}`);
    }
    
    if (!response.chapter || !response.chapter.content) {
      console.warn(`Invalid response format for ${book.name} ${chapter} in ${actualVersion}`);
      console.log(`Response: ${JSON.stringify(response).substring(0, 200)}...`);
      throw new Error(`Invalid response format for ${book.name} ${chapter} in ${actualVersion}`);
    }
    
    if (!Array.isArray(response.chapter.content)) {
      console.warn(`Chapter content is not an array for ${book.name} ${chapter} in ${actualVersion}`);
      console.log(`Content type: ${typeof response.chapter.content}`);
      throw new Error(`Chapter content is not an array for ${book.name} ${chapter} in ${actualVersion}`);
    }
    
    // Map API response to BibleVerse format
    const verses: ExtendedBibleVerse[] = [];
    
    for (const item of response.chapter.content) {
      if (item.type === 'verse') {
        let verseText = '';
        
        // Process the content array which may contain strings and objects with wordsOfJesus
        if (Array.isArray(item.content)) {
          for (const contentItem of item.content) {
            if (typeof contentItem === 'string') {
              verseText += contentItem;
            } else if (typeof contentItem === 'object' && contentItem && contentItem.text) {
              // Handle words of Jesus if they're marked
              verseText += contentItem.text;
            }
          }
        } else if (typeof item.content === 'string') {
          // Handle case where content might be a direct string
          verseText = item.content;
        } else {
          console.warn(`Unexpected verse content format for verse ${item.number}`);
        }
        
      verses.push({
          verse: item.number,
          text: verseText.trim(),
          book: book.name,
          chapter: chapter
        });
      }
    }
    
    if (verses.length === 0) {
      console.warn(`No verses found for ${book.name} ${chapter} in ${actualVersion} after processing`);
      throw new Error(`No verses found for ${book.name} ${chapter} in ${actualVersion} after processing`);
    }
    
    console.log(`Successfully processed ${verses.length} verses for ${book.name} ${chapter} in ${actualVersion}`);
    
    // Cache the result
    await setCachedData(cacheKey, verses);
    
    return verses;
  } catch (error) {
    console.error(`Error fetching chapter content for ${book.name} ${chapter} in ${actualVersion}:`, error);
    
    // If this is not the default version, try with the default version
    if (actualVersion !== DEFAULT_BIBLE_VERSION) {
      console.log(`Falling back to default version ${DEFAULT_BIBLE_VERSION}`);
      return getChapterContent(bookId, chapter, DEFAULT_BIBLE_VERSION);
    }
    
    throw error;
  }
}

// Initialize the Bible API service
export async function initializeBibleApiService(): Promise<void> {
  try {
    console.log('Initializing Bible API service...');
    
    // Clear the cache to ensure we're using the new API
    await clearBibleCache();
    
    // Clear versions cache specifically to ensure we get fresh versions
    await clearVersionsCache();
    
    // Set the default version if none is set
    const currentVersion = await getPreferredVersion();
    if (currentVersion !== DEFAULT_BIBLE_VERSION) {
      console.log(`Setting default Bible version to ${DEFAULT_BIBLE_VERSION}`);
      await setPreferredVersion(DEFAULT_BIBLE_VERSION);
    }
    
    // Pre-fetch available translations to warm up the cache
    console.log('Pre-fetching available Bible translations...');
    const versions = await getAvailableBibles();
    console.log(`Pre-fetched ${versions.length} Bible versions (filtered to popular languages)`);
    
    console.log('Bible API service initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Bible API service:', error);
    throw error;
  }
} 