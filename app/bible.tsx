import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, Animated, StatusBar, ActivityIndicator } from 'react-native';
import { useTheme, Text, Snackbar } from 'react-native-paper';
import { Stack } from 'expo-router';
import { Drawer } from 'react-native-drawer-layout';
import AppLayout from './components/AppLayout';
import { BibleReading } from './types';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import components
import {
  BibleHeader,
  BibleVerseList,
  BibleSelectionModal,
  SettingsDrawer
} from './components/bible';

// Import utilities and constants
import { loadRecentlyRead, markAsRead, isChapterAlreadyRead } from './utils/bibleUtils';
import { SAMPLE_BIBLE_CONTENT } from './constants/BibleContent';

// Storage keys
const LAST_READ_BOOK_KEY = 'bible-habit:lastReadBook';
const LAST_READ_CHAPTER_KEY = 'bible-habit:lastReadChapter';

export default function BibleScreen() {
  const theme = useTheme();
  const [loading, setLoading] = useState(true); // Start with loading true
  const [selectedBook, setSelectedBook] = useState('');
  const [selectedChapter, setSelectedChapter] = useState(0);
  const [isBookSelectionVisible, setIsBookSelectionVisible] = useState(false);
  const [isChapterSelectionVisible, setIsChapterSelectionVisible] = useState(false);
  const [fontSize, setFontSize] = useState(18);
  const [recentlyRead, setRecentlyRead] = useState<BibleReading[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [readingStartTime, setReadingStartTime] = useState<Date | null>(null);
  const [autoTrackingEnabled, setAutoTrackingEnabled] = useState(true);
  const [timeSpentReading, setTimeSpentReading] = useState(0); // in seconds
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [autoMarkThreshold, setAutoMarkThreshold] = useState(60); // seconds
  const [isBibleSelectionVisible, setIsBibleSelectionVisible] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load initial data - recently read chapters and last position
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Fetch recently read chapters
        const readings = await loadRecentlyRead();
        setRecentlyRead(readings);
        
        // Load last read position from AsyncStorage
        let savedBook = await AsyncStorage.getItem(LAST_READ_BOOK_KEY);
        let savedChapter = await AsyncStorage.getItem(LAST_READ_CHAPTER_KEY);
        
        // Use default values if nothing is saved yet
        if (!savedBook) {
          savedBook = 'Psalms';
        }
        
        if (!savedChapter) {
          savedChapter = '40';
        }
        
        // Set state with saved or default values
        setSelectedBook(savedBook);
        setSelectedChapter(Number(savedChapter));
        setIsInitialized(true);
        setLoading(false); // Stop loading when data is ready
      } catch (error) {
        console.error('Error initializing Bible screen:', error);
        // Set defaults if there's an error
        setSelectedBook('Psalms');
        setSelectedChapter(40);
        setIsInitialized(true);
        setLoading(false); // Stop loading even on error
      }
    };
    
    initializeApp();
  }, []);

  // Start tracking reading time when a chapter is selected
  useEffect(() => {
    // Only start tracking if initialized
    if (!isInitialized) return;
    
    // Reset the timer when changing chapters
    setReadingStartTime(new Date());
    setTimeSpentReading(0);
    
    // Set up interval to track reading time
    const interval = setInterval(() => {
      if (readingStartTime) {
        const now = new Date();
        const secondsElapsed = Math.floor((now.getTime() - readingStartTime.getTime()) / 1000);
        setTimeSpentReading(secondsElapsed);
        
        // Auto-mark as read after the threshold time
        if (autoTrackingEnabled && secondsElapsed >= autoMarkThreshold && !isChapterAlreadyRead(recentlyRead, selectedBook, selectedChapter)) {
          handleMarkAsRead(true);
        }
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [selectedBook, selectedChapter, autoTrackingEnabled, autoMarkThreshold, recentlyRead, isInitialized]);

  // Save the current book and chapter whenever they change
  useEffect(() => {
    if (isInitialized && selectedBook && selectedChapter > 0) { // Only save after initial load to prevent overwriting with default values
      const saveCurrentPosition = async () => {
        try {
          await AsyncStorage.setItem(LAST_READ_BOOK_KEY, selectedBook);
          await AsyncStorage.setItem(LAST_READ_CHAPTER_KEY, selectedChapter.toString());
        } catch (error) {
          console.error('Error saving current position:', error);
        }
      };
      
      saveCurrentPosition();
    }
  }, [selectedBook, selectedChapter, isInitialized]);

  const handleMarkAsRead = useCallback(async (isAutomatic = false) => {
    setIsProcessing(true);
    try {
      const result = await markAsRead(selectedBook, selectedChapter, recentlyRead, isAutomatic);
      
      if (result.success) {
        setRecentlyRead(result.updatedReadings);
        
        if (isAutomatic && result.message) {
          setSnackbarMessage(result.message);
          setSnackbarVisible(true);
          
          // Also show a temporary visual indicator
          Animated.sequence([
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.delay(1500),
            Animated.timing(fadeAnim, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
          ]).start();
        }
      }
    } catch (error) {
      console.error('Error in handleMarkAsRead:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [selectedBook, selectedChapter, recentlyRead, fadeAnim]);

  const handleSelectBookAndChapter = useCallback((book: string, chapter: number) => {
    setSelectedBook(book);
    setSelectedChapter(chapter);
    setIsBibleSelectionVisible(false);
    
    // We don't need to explicitly save here as the useEffect will handle it
  }, []);

  // Get the verses for the current book and chapter
  const getCurrentVerses = () => {
    const chapterStr = selectedChapter.toString();
    if (SAMPLE_BIBLE_CONTENT[selectedBook] && SAMPLE_BIBLE_CONTENT[selectedBook][chapterStr]) {
      return SAMPLE_BIBLE_CONTENT[selectedBook][chapterStr];
    }
    return [];
  };

  // Create header component with updated handler
  const Header = (
    <BibleHeader
      selectedBook={loading ? '' : selectedBook}
      selectedChapter={loading ? 0 : selectedChapter}
      onBookSelect={() => !loading && setIsBibleSelectionVisible(true)}
      onSettingsOpen={() => !loading && setIsSettingsOpen(true)}
    />
  );

  // For backwards compatibility - not needed for new implementation
  useEffect(() => {
    setIsBookSelectionVisible(isBibleSelectionVisible);
  }, [isBibleSelectionVisible]);

  return (
    <AppLayout header={Header}>
      <StatusBar barStyle="light-content" />
      <Drawer
        open={isSettingsOpen}
        onOpen={() => setIsSettingsOpen(true)}
        onClose={() => setIsSettingsOpen(false)}
        renderDrawerContent={() => (
          <SettingsDrawer
            onClose={() => setIsSettingsOpen(false)}
            fontSize={fontSize}
            setFontSize={setFontSize}
            autoTrackingEnabled={autoTrackingEnabled}
            setAutoTrackingEnabled={setAutoTrackingEnabled}
            autoMarkThreshold={autoMarkThreshold}
            setAutoMarkThreshold={setAutoMarkThreshold}
          />
        )}
        drawerPosition="right"
        drawerType="front"
        drawerStyle={{ width: '80%' }}
      >
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
          <Stack.Screen options={{ headerShown: false }} />
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.loadingText}>Loading your Bible...</Text>
            </View>
          ) : (
            <>
              {/* Bible Content */}
              <BibleVerseList
                selectedBook={selectedBook}
                selectedChapter={selectedChapter}
                verses={getCurrentVerses()}
                fontSize={fontSize}
              >
                {/* Auto-read notification overlay */}
                <Animated.View 
                  style={[
                    styles.autoReadOverlay, 
                    { opacity: fadeAnim, backgroundColor: theme.colors.primaryContainer }
                  ]}
                  pointerEvents="none"
                >
                  <Text style={[styles.autoReadText, { color: theme.colors.primary }]}>
                    Chapter marked as read!
                  </Text>
                </Animated.View>
              </BibleVerseList>
            </>
          )}
          
          {/* Snackbar notification */}
          <Snackbar
            visible={snackbarVisible}
            onDismiss={() => setSnackbarVisible(false)}
            duration={3000}
            action={{
              label: 'OK',
              onPress: () => setSnackbarVisible(false),
            }}
          >
            {snackbarMessage}
          </Snackbar>
        </View>
      </Drawer>
      
      {/* Unified Bible Selection Modal - render outside the AppLayout for correct rendering */}
      {isBibleSelectionVisible && !loading && (
        <BibleSelectionModal
          selectedBook={selectedBook}
          selectedChapter={selectedChapter}
          onSelectBookAndChapter={handleSelectBookAndChapter}
          onClose={() => setIsBibleSelectionVisible(false)}
        />
      )}
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  autoReadOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -100 }, { translateY: -50 }],
    width: 200,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  autoReadText: {
    fontWeight: '700',
    fontSize: 16,
  },
}); 