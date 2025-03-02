import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, Animated, StatusBar } from 'react-native';
import { useTheme, Text, Snackbar } from 'react-native-paper';
import { Stack } from 'expo-router';
import { Drawer } from 'react-native-drawer-layout';
import AppLayout from './components/AppLayout';
import { BibleReading } from './types';

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

export default function BibleScreen() {
  const theme = useTheme();
  const [selectedBook, setSelectedBook] = useState('Psalms');
  const [selectedChapter, setSelectedChapter] = useState(40);
  const [isBookSelectionVisible, setIsBookSelectionVisible] = useState(false);
  const [isChapterSelectionVisible, setIsChapterSelectionVisible] = useState(false);
  const [fontSize, setFontSize] = useState(18);
  const [recentlyRead, setRecentlyRead] = useState<BibleReading[]>([]);
  const [loading, setLoading] = useState(false);
  const [readingStartTime, setReadingStartTime] = useState<Date | null>(null);
  const [autoTrackingEnabled, setAutoTrackingEnabled] = useState(true);
  const [timeSpentReading, setTimeSpentReading] = useState(0); // in seconds
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [autoMarkThreshold, setAutoMarkThreshold] = useState(60); // seconds
  const [isBibleSelectionVisible, setIsBibleSelectionVisible] = useState(false);

  useEffect(() => {
    const fetchRecentlyRead = async () => {
      const readings = await loadRecentlyRead();
      setRecentlyRead(readings);
    };
    
    fetchRecentlyRead();
  }, []);

  // Start tracking reading time when a chapter is selected
  useEffect(() => {
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
  }, [selectedBook, selectedChapter, autoTrackingEnabled, autoMarkThreshold, recentlyRead]);

  const handleMarkAsRead = useCallback(async (isAutomatic = false) => {
    setLoading(true);
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
      setLoading(false);
    }
  }, [selectedBook, selectedChapter, recentlyRead, fadeAnim]);

  const handleSelectBookAndChapter = useCallback((book: string, chapter: number) => {
    setSelectedBook(book);
    setSelectedChapter(chapter);
    setIsBibleSelectionVisible(false);
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
      selectedBook={selectedBook}
      selectedChapter={selectedChapter}
      onBookSelect={() => setIsBibleSelectionVisible(true)}
      onSettingsOpen={() => setIsSettingsOpen(true)}
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
      {isBibleSelectionVisible && (
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