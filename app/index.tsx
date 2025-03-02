import { View, StyleSheet, Dimensions, FlatList } from 'react-native';
import { useTheme, Text, IconButton } from 'react-native-paper';
import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isToday, differenceInDays, subDays, parseISO } from 'date-fns';
import { BibleReading, ReadingStreak } from './types';
import AddReadingDrawer from './components/AddReadingDrawer';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AppLayout from './components/AppLayout';
import { DatePage } from './components/home';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DAYS_TO_SHOW = 7; // Number of days to show in the carousel

// Bible stats - would be calculated from actual reading data in a full implementation
const TOTAL_CHAPTERS = 1189;
const TOTAL_OT_CHAPTERS = 929;
const TOTAL_NT_CHAPTERS = 260;
const TOTAL_PSALMS = 150;

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { openAddReading } = useLocalSearchParams();
  const [readings, setReadings] = useState<BibleReading[]>([]);
  const [streak, setStreak] = useState<ReadingStreak>({
    currentStreak: 0,
    lastReadDate: null,
    totalDaysRead: 0,
  });
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentIndex, setCurrentIndex] = useState(DAYS_TO_SHOW - 1); // Start with today (last item)
  const flatListRef = useRef<FlatList>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  // Add a unique key that changes each time the component mounts
  const [mountKey, setMountKey] = useState(Date.now().toString());

  // Generate dates for the carousel (today and previous days)
  const dates = Array.from({ length: DAYS_TO_SHOW }, (_, i) => 
    subDays(new Date(), DAYS_TO_SHOW - 1 - i)
  );

  // Load data first
  useEffect(() => {
    loadData();
    
    // Check if we should open the add reading drawer
    if (openAddReading === 'true') {
      setModalVisible(true);
    }

    // Generate a new key each time the component mounts
    setMountKey(Date.now().toString());
  }, [openAddReading]);

  // Use a separate effect to handle scrolling after component is mounted
  useLayoutEffect(() => {
    // Set a small timeout to ensure the FlatList is fully rendered
    const timer = setTimeout(() => {
      if (flatListRef.current) {
        const todayIndex = DAYS_TO_SHOW - 1; // Index of today (last item)
        flatListRef.current.scrollToIndex({
          index: todayIndex,
          animated: false
        });
        setCurrentIndex(todayIndex);
        setSelectedDate(dates[todayIndex]);
        setIsInitialized(true);
      }
    }, 50);

    return () => clearTimeout(timer);
  }, []);

  const scrollToIndex = (index: number) => {
    if (flatListRef.current) {
      flatListRef.current.scrollToIndex({ 
        index: index, 
        animated: true 
      });
      setCurrentIndex(index);
      setSelectedDate(dates[index]);
    }
  };

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    
    if (index !== currentIndex) {
      setCurrentIndex(index);
      setSelectedDate(dates[index]);
    }
  };

  // Function to navigate to a specific date
  const goToDate = (index: number) => {
    if (index >= 0 && index < DAYS_TO_SHOW) {
      scrollToIndex(index);
    }
  };

  async function loadData() {
    try {
      const storedReadings = await AsyncStorage.getItem('readings');
      const storedStreak = await AsyncStorage.getItem('streak');
      
      if (storedReadings) {
        setReadings(JSON.parse(storedReadings));
      }
      if (storedStreak) {
        setStreak(JSON.parse(storedStreak));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }

  const updateStreak = (newReading: BibleReading) => {
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

  const handleAddReading = async (newReading: BibleReading) => {
    const updatedReadings = [newReading, ...readings];
    const updatedStreak = updateStreak(newReading);

    try {
      await AsyncStorage.setItem('readings', JSON.stringify(updatedReadings));
      await AsyncStorage.setItem('streak', JSON.stringify(updatedStreak));
      
      setReadings(updatedReadings);
      setStreak(updatedStreak);
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  const handleDeleteReading = async (id: string) => {
    const updatedReadings = readings.filter(reading => reading.id !== id);
    try {
      await AsyncStorage.setItem('readings', JSON.stringify(updatedReadings));
      setReadings(updatedReadings);
    } catch (error) {
      console.error('Error deleting reading:', error);
    }
  };

  // Filter readings based on selected date
  const getFilteredReadings = (date: Date) => {
    return readings.filter(reading => {
      const readingDate = new Date(reading.date);
      return (
        readingDate.getDate() === date.getDate() &&
        readingDate.getMonth() === date.getMonth() &&
        readingDate.getFullYear() === date.getFullYear()
      );
    });
  };

  // Calculate total chapters read
  const getTotalChaptersRead = () => {
    return readings.length;
  };

  // Calculate chapters read by testament
  const getTestamentProgress = () => {
    const otChapters = readings.filter(reading => {
      // This is a simplified check - would need a proper mapping of books to testaments
      const otBooks = ["Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", "Joshua", "Judges", "Ruth", 
                      "1 Samuel", "2 Samuel", "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra", 
                      "Nehemiah", "Esther", "Job", "Psalms", "Proverbs", "Ecclesiastes", "Song of Solomon", 
                      "Isaiah", "Jeremiah", "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel", "Amos", 
                      "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah", "Malachi"];
      return otBooks.includes(reading.book);
    }).length;
    
    const ntChapters = readings.filter(reading => {
      const ntBooks = ["Matthew", "Mark", "Luke", "John", "Acts", "Romans", "1 Corinthians", "2 Corinthians", 
                      "Galatians", "Ephesians", "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians", 
                      "1 Timothy", "2 Timothy", "Titus", "Philemon", "Hebrews", "James", "1 Peter", "2 Peter", 
                      "1 John", "2 John", "3 John", "Jude", "Revelation"];
      return ntBooks.includes(reading.book);
    }).length;
    
    const psalmsChapters = readings.filter(reading => reading.book === "Psalms").length;
    
    return {
      ot: otChapters / TOTAL_OT_CHAPTERS,
      nt: ntChapters / TOTAL_NT_CHAPTERS,
      psalms: psalmsChapters / TOTAL_PSALMS
    };
  };

  // Get overall Bible reading progress
  const getOverallProgress = () => {
    return getTotalChaptersRead() / TOTAL_CHAPTERS;
  };

  // Get chapters left to read today based on a goal of 3 chapters per day
  const getChaptersLeftToday = () => {
    const todayReadings = getFilteredReadings(new Date()).length;
    const dailyGoal = 3; // This could be a user setting
    return Math.max(0, dailyGoal - todayReadings);
  };

  // Get a verse of the day (this would be from an API in a real implementation)
  const getDailyVerse = () => {
    return {
      text: "But seek first his kingdom and his righteousness, and all these things will be given to you as well.",
      reference: "Matthew 6:33"
    };
  };

  // Get sample reading plan items
  const getReadingPlanItems = () => {
    return [
      { book: "Genesis 1-2", description: "Creation", completed: true },
      { book: "Psalms 1", description: "Blessed is the one", completed: true },
      { book: "Luke 1", description: "John's birth foretold", completed: true },
      { book: "John 1", description: "The Word", completed: false },
      { book: "Exodus 1", description: "Israelites oppressed", completed: false },
      { book: "1 Samuel 1", description: "Samuel's birth", completed: false }
    ];
  };

  const renderDatePage = (date: Date, index: number) => {
    const dateReadings = getFilteredReadings(date);
    const chaptersLeft = isToday(date) ? getChaptersLeftToday() : 0;
    const dailyVerse = getDailyVerse();
    const readingPlanItems = getReadingPlanItems();
    
    return (
      <DatePage 
        key={index}
        date={date}
        readings={dateReadings}
        chaptersLeft={chaptersLeft}
        onStartReading={() => setModalVisible(true)}
        readingPlanItems={readingPlanItems}
        dailyVerse={dailyVerse}
      />
    );
  };

  // Create header component
  const Header = (
    <View style={styles.header}>
      <Text style={[styles.headerTitle, { color: theme.colors.primary }]}>Bible Habit</Text>
      <View style={[styles.streakBadge, { backgroundColor: theme.colors.primary }]}>
        <IconButton 
          icon="fire" 
          size={18} 
          iconColor="#FFFFFF" 
          style={styles.streakIcon} 
        />
        <Text style={styles.streakValue}>{streak.currentStreak}</Text>
      </View>
    </View>
  );

  // Create footer component
  const Footer = (
    <View style={styles.bottomNav}>
      <View style={[styles.navItem, styles.navItemActive]}>
        <IconButton 
          icon="home-outline" 
          size={24} 
          iconColor={theme.colors.primary} 
          style={{ margin: 0 }} 
        />
        <Text style={[styles.navLabel, { color: theme.colors.primary }]}>Home</Text>
      </View>
      <View 
        style={styles.navItem}
        onTouchEnd={() => {
          // Use replace to avoid adding to history stack
          router.replace('/analytics');
        }}
      >
        <IconButton 
          icon="chart-line" 
          size={24} 
          iconColor={theme.colors.secondary} 
          style={{ margin: 0 }} 
        />
        <Text style={[styles.navLabel, { color: theme.colors.secondary }]}>Analytics</Text>
      </View>
      <View 
        style={styles.navItem}
        onTouchEnd={() => {
          // Use replace to avoid adding to history stack
          router.replace('/bible');
        }}
      >
        <IconButton 
          icon="book-open-variant" 
          size={24} 
          iconColor={theme.colors.secondary} 
          style={{ margin: 0 }} 
        />
        <Text style={[styles.navLabel, { color: theme.colors.secondary }]}>Bible</Text>
      </View>
      <View style={styles.addButtonContainer}>
        <View 
          style={[styles.addButton, { backgroundColor: theme.dark ? '#FFFFFF' : '#000000' }]} 
          onTouchEnd={() => setModalVisible(true)}
        >
          <IconButton 
            icon="plus" 
            size={32} 
            iconColor={theme.dark ? '#000000' : '#FFFFFF'} 
          />
        </View>
      </View>
    </View>
  );

  return (
    <AppLayout header={Header} footer={Footer}>
      {/* Full Page Carousel */}
      <FlatList
        key={mountKey}
        ref={flatListRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
        decelerationRate="fast"
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        disableIntervalMomentum={true}
        snapToInterval={SCREEN_WIDTH}
        snapToAlignment="start"
        initialScrollIndex={DAYS_TO_SHOW - 1}
        data={dates}
        renderItem={({ item, index }) => renderDatePage(item, index)}
        keyExtractor={(_, index) => index.toString()}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
      />

      <AddReadingDrawer
        visible={modalVisible}
        onDismiss={() => setModalVisible(false)}
        onSave={(reading) => handleAddReading(reading)}
      />
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 0,
    width: '100%',
    height: '100%',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 12,
    paddingLeft: 4,
    borderRadius: 20,
  },
  streakIcon: {
    margin: 0,
  },
  streakValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 4,
    paddingBottom: 28,
    borderTopWidth: 0,
    height: 72,
    paddingHorizontal: 16,
  },
  navItem: {
    alignItems: 'center',
    opacity: 0.5,
    flex: 1,
  },
  navItemActive: {
    opacity: 1,
  },
  navLabel: {
    fontSize: 12,
    marginTop: -4,
  },
  addButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(0, 0, 0, 0.3)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginTop: -32,
  },
  addButtonContainer: {
    flex: 1,
    alignItems: 'center',
  },
}); 