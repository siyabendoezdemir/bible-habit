import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, FlatList, Animated, StatusBar } from 'react-native';
import { useTheme, Text, IconButton, Surface, Divider, ActivityIndicator, Snackbar } from 'react-native-paper';
import { Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BIBLE_BOOKS } from './constants';
import { BibleReading } from './types';
import { Drawer } from 'react-native-drawer-layout';
import AppLayout from './components/AppLayout';

// Sample Bible content - in a real app, this would come from an API or local database
interface BibleVerse {
  verse: number;
  text: string;
}

interface BibleContent {
  [book: string]: {
    [chapter: string]: BibleVerse[];
  };
}

const SAMPLE_BIBLE_CONTENT: BibleContent = {
  "Genesis": {
    "1": [
      { verse: 1, text: "In the beginning God created the heavens and the earth." },
      { verse: 2, text: "Now the earth was formless and empty, darkness was over the surface of the deep, and the Spirit of God was hovering over the waters." },
      { verse: 3, text: "And God said, \"Let there be light,\" and there was light." },
      { verse: 4, text: "God saw that the light was good, and he separated the light from the darkness." },
      { verse: 5, text: "God called the light \"day,\" and the darkness he called \"night.\" And there was evening, and there was morning—the first day." },
      // More verses would be here
    ]
  },
  "Psalms": {
    "40": [
      { verse: 1, text: "I waited patiently for the LORD; he turned to me and heard my cry." },
      { verse: 2, text: "He lifted me out of the slimy pit, out of the mud and mire; he set my feet on a rock and gave me a firm place to stand." },
      { verse: 3, text: "He put a new song in my mouth, a hymn of praise to our God. Many will see and fear the LORD and put their trust in him." },
      { verse: 4, text: "Blessed is the one who trusts in the LORD, who does not look to the proud, to those who turn aside to false gods." },
      { verse: 5, text: "Many, LORD my God, are the wonders you have done, the things you planned for us. None can compare with you; were I to speak and tell of your deeds, they would be too many to declare." },
      // More verses would be here
    ]
  },
  "John": {
    "1": [
      { verse: 1, text: "In the beginning was the Word, and the Word was with God, and the Word was God." },
      { verse: 2, text: "He was with God in the beginning." },
      { verse: 3, text: "Through him all things were made; without him nothing was made that has been made." },
      { verse: 4, text: "In him was life, and that life was the light of all mankind." },
      { verse: 5, text: "The light shines in the darkness, and the darkness has not overcome it." },
      // More verses would be here
    ]
  }
};

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
  
  // Get the number of chapters for the selected book
  const getChapterCount = (book: string) => {
    // This would be replaced with actual data in a real implementation
    const chapterCounts: {[key: string]: number} = {
      'Genesis': 50, 'Exodus': 40, 'Leviticus': 27, 'Numbers': 36, 'Deuteronomy': 34,
      'Joshua': 24, 'Judges': 21, 'Ruth': 4, '1 Samuel': 31, '2 Samuel': 24,
      '1 Kings': 22, '2 Kings': 25, '1 Chronicles': 29, '2 Chronicles': 36,
      'Ezra': 10, 'Nehemiah': 13, 'Esther': 10, 'Job': 42, 'Psalms': 150,
      'Proverbs': 31, 'Ecclesiastes': 12, 'Song of Solomon': 8, 'Isaiah': 66,
      'Jeremiah': 52, 'Lamentations': 5, 'Ezekiel': 48, 'Daniel': 12, 'Hosea': 14,
      'Joel': 3, 'Amos': 9, 'Obadiah': 1, 'Jonah': 4, 'Micah': 7, 'Nahum': 3,
      'Habakkuk': 3, 'Zephaniah': 3, 'Haggai': 2, 'Zechariah': 14, 'Malachi': 4,
      'Matthew': 28, 'Mark': 16, 'Luke': 24, 'John': 21, 'Acts': 28,
      'Romans': 16, '1 Corinthians': 16, '2 Corinthians': 13, 'Galatians': 6,
      'Ephesians': 6, 'Philippians': 4, 'Colossians': 4, '1 Thessalonians': 5,
      '2 Thessalonians': 3, '1 Timothy': 6, '2 Timothy': 4, 'Titus': 3,
      'Philemon': 1, 'Hebrews': 13, 'James': 5, '1 Peter': 5, '2 Peter': 3,
      '1 John': 5, '2 John': 1, '3 John': 1, 'Jude': 1, 'Revelation': 22
    };
    return chapterCounts[book] || 1;
  };

  useEffect(() => {
    loadRecentlyRead();
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
        if (autoTrackingEnabled && secondsElapsed >= autoMarkThreshold && !isChapterAlreadyRead()) {
          markAsRead(true);
        }
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [selectedBook, selectedChapter, autoTrackingEnabled, autoMarkThreshold]);

  const isChapterAlreadyRead = useCallback(() => {
    return recentlyRead.some(
      reading => 
        reading.book === selectedBook && 
        reading.chapter === selectedChapter &&
        new Date(reading.date).toDateString() === new Date().toDateString()
    );
  }, [recentlyRead, selectedBook, selectedChapter]);

  const loadRecentlyRead = async () => {
    try {
      const storedReadings = await AsyncStorage.getItem('readings');
      if (storedReadings) {
        const readings = JSON.parse(storedReadings) as BibleReading[];
        setRecentlyRead(readings.slice(0, 5)); // Get the 5 most recent readings
      }
    } catch (error) {
      console.error('Error loading recently read:', error);
    }
  };

  const markAsRead = useCallback(async (isAutomatic = false) => {
    // Don't mark as read if already read today
    if (isChapterAlreadyRead()) {
      return;
    }
    
    setLoading(true);
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
      
      // Update recently read
      setRecentlyRead(readings.slice(0, 5));
      
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

      // Show notification if automatically marked as read
      if (isAutomatic) {
        setSnackbarMessage(`${selectedBook} ${selectedChapter} automatically marked as read!`);
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
    } catch (error) {
      console.error('Error marking as read:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedBook, selectedChapter, isChapterAlreadyRead, fadeAnim]);

  const renderVerses = () => {
    // Check if we have content for this book and chapter
    const chapterStr = selectedChapter.toString();
    
    // Get the book introduction (first lines before verse 1)
    const bookIntro = selectedBook === "Psalms" && selectedChapter === 40 ? (
      <View style={styles.introContainer}>
        <Text style={[styles.introText, { color: theme.colors.onSurface, opacity: 0.8 }]}>
          For the director of music. Of David.
        </Text>
        <Text style={[styles.introText, { color: theme.colors.onSurface, opacity: 0.8 }]}>
          A psalm.
        </Text>
      </View>
    ) : null;
    
    if (SAMPLE_BIBLE_CONTENT[selectedBook] && SAMPLE_BIBLE_CONTENT[selectedBook][chapterStr]) {
      return (
        <>
          {bookIntro}
          {SAMPLE_BIBLE_CONTENT[selectedBook][chapterStr].map((verse: BibleVerse) => (
            <View key={verse.verse} style={styles.verseContainer}>
              <Text style={[styles.verseNumber, { color: theme.colors.primary }]}>{verse.verse}</Text>
              <Text style={[styles.verseText, { fontSize, color: theme.colors.onSurface }]}>{verse.text}</Text>
            </View>
          ))}
        </>
      );
    } else {
      // If we don't have content, show a placeholder
      return (
        <View style={styles.placeholderContainer}>
          <Text style={{ color: theme.colors.secondary, textAlign: 'center' }}>
            {selectedBook} {selectedChapter} content would be loaded here.
          </Text>
          <Text style={{ color: theme.colors.secondary, textAlign: 'center', marginTop: 8 }}>
            In a full implementation, this would fetch from a Bible API or local database.
          </Text>
        </View>
      );
    }
  };

  const renderBookSelection = () => {
    return (
      <Surface style={[styles.selectionModal, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.selectionHeader}>
          <Text style={[styles.selectionTitle, { color: theme.colors.primary }]}>Select Book</Text>
          <IconButton 
            icon="close" 
            size={24} 
            onPress={() => setIsBookSelectionVisible(false)} 
            iconColor={theme.colors.primary}
          />
        </View>
        <Divider />
        <FlatList
          data={BIBLE_BOOKS}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.selectionItem,
                selectedBook === item && { backgroundColor: theme.colors.primaryContainer }
              ]}
              onPress={() => {
                setSelectedBook(item);
                setSelectedChapter(1); // Reset to chapter 1 when book changes
                setIsBookSelectionVisible(false);
              }}
            >
              <Text style={{ 
                color: selectedBook === item ? theme.colors.primary : theme.colors.onSurface,
                fontWeight: selectedBook === item ? '700' : '400'
              }}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </Surface>
    );
  };

  const renderChapterSelection = () => {
    const chapters = Array.from({ length: getChapterCount(selectedBook) }, (_, i) => i + 1);
    
    return (
      <Surface style={[styles.selectionModal, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.selectionHeader}>
          <Text style={[styles.selectionTitle, { color: theme.colors.primary }]}>Select Chapter</Text>
          <IconButton 
            icon="close" 
            size={24} 
            onPress={() => setIsChapterSelectionVisible(false)} 
            iconColor={theme.colors.primary}
          />
        </View>
        <Divider />
        <FlatList
          data={chapters}
          numColumns={5}
          keyExtractor={(item) => item.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.chapterItem,
                selectedChapter === item && { backgroundColor: theme.colors.primaryContainer }
              ]}
              onPress={() => {
                setSelectedChapter(item);
                setIsChapterSelectionVisible(false);
              }}
            >
              <Text style={{ 
                color: selectedChapter === item ? theme.colors.primary : theme.colors.onSurface,
                fontWeight: selectedChapter === item ? '700' : '400'
              }}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </Surface>
    );
  };

  const renderSettingsDrawer = () => {
    return (
      <View style={[styles.settingsContainer, { backgroundColor: theme.colors.background }]}>
        <View style={styles.settingsHeader}>
          <Text style={[styles.settingsTitle, { color: theme.colors.primary }]}>Reading Settings</Text>
          <IconButton 
            icon="close" 
            size={24} 
            onPress={() => setIsSettingsOpen(false)} 
            iconColor={theme.colors.primary}
          />
        </View>
        <Divider />
        
        <ScrollView style={styles.settingsContent}>
          <View style={styles.settingSection}>
            <Text style={[styles.settingSectionTitle, { color: theme.colors.primary }]}>Automatic Tracking</Text>
            
            <View style={styles.settingRow}>
              <Text style={{ color: theme.colors.onSurface }}>Auto-mark chapters as read</Text>
              <View style={styles.switchContainer}>
                <IconButton 
                  icon={autoTrackingEnabled ? "check-circle" : "circle-outline"} 
                  size={24} 
                  iconColor={theme.colors.primary} 
                  onPress={() => setAutoTrackingEnabled(!autoTrackingEnabled)}
                />
              </View>
            </View>
            
            {autoTrackingEnabled && (
              <View style={styles.settingRow}>
                <Text style={{ color: theme.colors.onSurface }}>Time threshold (seconds)</Text>
                <View style={styles.thresholdContainer}>
                  <IconButton 
                    icon="minus" 
                    size={20} 
                    iconColor={theme.colors.primary} 
                    onPress={() => setAutoMarkThreshold(Math.max(30, autoMarkThreshold - 10))}
                  />
                  <Text style={[styles.thresholdText, { color: theme.colors.primary }]}>{autoMarkThreshold}</Text>
                  <IconButton 
                    icon="plus" 
                    size={20} 
                    iconColor={theme.colors.primary} 
                    onPress={() => setAutoMarkThreshold(Math.min(300, autoMarkThreshold + 10))}
                  />
                </View>
              </View>
            )}
          </View>
          
          <View style={styles.settingSection}>
            <Text style={[styles.settingSectionTitle, { color: theme.colors.primary }]}>Display</Text>
            
            <View style={styles.settingRow}>
              <Text style={{ color: theme.colors.onSurface }}>Font Size</Text>
              <View style={styles.thresholdContainer}>
                <IconButton 
                  icon="format-font-size-decrease" 
                  size={20} 
                  iconColor={theme.colors.primary} 
                  onPress={() => setFontSize(Math.max(14, fontSize - 2))}
                />
                <Text style={[styles.thresholdText, { color: theme.colors.primary }]}>{fontSize}</Text>
                <IconButton 
                  icon="format-font-size-increase" 
                  size={20} 
                  iconColor={theme.colors.primary} 
                  onPress={() => setFontSize(Math.min(24, fontSize + 2))}
                />
              </View>
            </View>
          </View>
          
          <View style={styles.settingSection}>
            <Text style={[styles.settingSectionTitle, { color: theme.colors.primary }]}>About</Text>
            <Text style={[styles.aboutText, { color: theme.colors.onSurface }]}>
              The Bible reader allows you to read scripture and automatically tracks your progress.
              Your reading history is saved and contributes to your daily streak.
            </Text>
          </View>
        </ScrollView>
      </View>
    );
  };

  return (
    <AppLayout>
      <StatusBar barStyle="light-content" />
      <Drawer
        open={isSettingsOpen}
        onOpen={() => setIsSettingsOpen(true)}
        onClose={() => setIsSettingsOpen(false)}
        renderDrawerContent={renderSettingsDrawer}
        drawerPosition="right"
        drawerType="front"
        drawerStyle={{ width: '80%' }}
      >
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
          <Stack.Screen options={{ headerShown: false }} />
          
          {/* Bible Reader Header */}
          <Surface style={[styles.header, { backgroundColor: theme.colors.background }]}>
            <View style={styles.headerContent}>
              <TouchableOpacity 
                style={styles.bookSelector}
                onPress={() => setIsBookSelectionVisible(true)}
              >
                <Text style={[styles.bookTitle, { color: theme.colors.onSurface }]}>{selectedBook} {selectedChapter}</Text>
                <IconButton icon="chevron-down" size={20} iconColor={theme.colors.onSurface} style={styles.selectorIcon} />
              </TouchableOpacity>
              
              <View style={styles.headerActions}>
                <IconButton icon="volume-high" size={24} iconColor={theme.colors.onSurface} onPress={() => {}} />
                <IconButton icon="magnify" size={24} iconColor={theme.colors.onSurface} onPress={() => {}} />
                <IconButton icon="dots-horizontal" size={24} iconColor={theme.colors.onSurface} onPress={() => setIsSettingsOpen(true)} />
              </View>
            </View>
          </Surface>
          
          {/* Bible Content */}
          <ScrollView 
            style={styles.contentContainer} 
            contentContainerStyle={styles.contentInner}
            showsVerticalScrollIndicator={false}
          >
            {renderVerses()}
            
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
          </ScrollView>
          
          {/* Book Selection Modal */}
          {isBookSelectionVisible && renderBookSelection()}
          
          {/* Chapter Selection Modal */}
          {isChapterSelectionVisible && renderChapterSelection()}
          
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
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 8,
    paddingBottom: 8,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bookSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  bookTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  chapterSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  chapterTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  selectorIcon: {
    margin: 0,
    padding: 0,
  },
  contentContainer: {
    flex: 1,
  },
  contentInner: {
    padding: 20,
    paddingBottom: 100,
  },
  introContainer: {
    marginBottom: 24,
  },
  introText: {
    fontSize: 18,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  verseContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  verseNumber: {
    fontSize: 12,
    fontWeight: '700',
    marginRight: 8,
    marginTop: 4,
    opacity: 0.6,
  },
  verseText: {
    flex: 1,
    lineHeight: 28,
    letterSpacing: 0.3,
  },
  placeholderContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectionModal: {
    position: 'absolute',
    top: 80,
    left: 20,
    right: 20,
    maxHeight: '70%',
    borderRadius: 12,
    elevation: 5,
    shadowColor: 'rgba(0, 0, 0, 0.3)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    zIndex: 100,
  },
  selectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  selectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  selectionItem: {
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  chapterItem: {
    width: '20%',
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentlyReadContainer: {
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  recentlyReadTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  recentlyReadScroll: {
    flexDirection: 'row',
  },
  recentlyReadItem: {
    padding: 12,
    marginRight: 8,
    borderRadius: 8,
  },
  readingTimeContainer: {
    paddingHorizontal: 16,
    paddingBottom: 4,
    alignItems: 'center',
  },
  readingTimeText: {
    fontSize: 12,
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
  settingsContainer: {
    flex: 1,
  },
  settingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  settingsTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  settingsContent: {
    flex: 1,
    padding: 16,
  },
  settingSection: {
    marginBottom: 24,
  },
  settingSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thresholdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thresholdText: {
    fontSize: 16,
    fontWeight: '600',
    width: 40,
    textAlign: 'center',
  },
  aboutText: {
    lineHeight: 20,
  },
}); 