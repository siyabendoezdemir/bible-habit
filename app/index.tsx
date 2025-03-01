import { View, StyleSheet, ScrollView, Pressable, Platform, Dimensions, Image, ImageBackground, FlatList } from 'react-native';
import { useTheme, Text, IconButton, Surface, Button, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, isToday, differenceInDays, subDays, addDays, parseISO } from 'date-fns';
import { BibleReading, ReadingStreak } from './types';
import AddReadingDrawer from './components/AddReadingDrawer';
import ProgressCircle from './components/ProgressCircle';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AppLayout from './components/AppLayout';

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

  // Get streak calendar data (simplified version)
  const getStreakCalendar = () => {
    // In a real implementation, this would return actual reading dates
    const today = new Date();
    const lastWeek = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(today, 6 - i);
      // Simulate some reading days
      const hasReading = [0, 2, 3, 5, 6].includes(i);
      return {
        date,
        hasReading
      };
    });
    return lastWeek;
  };

  const renderDatePage = (date: Date, index: number) => {
    const dateReadings = getFilteredReadings(date);
    const progress = getTestamentProgress();
    const overallProgress = getOverallProgress();
    const chaptersLeft = getChaptersLeftToday();
    const dailyVerse = getDailyVerse();
    
    return (
      <View key={index} style={styles.pageContainer}>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.pageScrollContent}
          bounces={true}
          alwaysBounceVertical={true}
        >
          {/* Date Header */}
          <Text style={styles.dateHeader}>
            {isToday(date) ? 'Today' : format(date, 'EEEE, MMMM d')}
          </Text>

          {/* Combined Card with Extension Effect */}
          <View style={styles.cardContainer}>
            {/* Main Goal Card */}
            <Surface style={styles.primaryCard}>
              <View style={styles.todayGoalSection}>
                <View style={styles.goalMainContent}>
                  <Text style={styles.chaptersLeftValue}>{chaptersLeft}</Text>
                  <Text style={styles.chaptersLeftLabel}>Chapters left</Text>
                </View>
                <View style={styles.goalCircleContainer}>
                  <ProgressCircle 
                    progress={(3-chaptersLeft)/3} 
                    size={80} 
                    strokeWidth={6} 
                    color={theme.colors.primary} 
                    icon="book-open-variant"
                    iconSize={28}
                  />
                </View>
              </View>
            </Surface>

            {/* Progress Section */}
            <View style={styles.progressSection}>
              <Divider style={styles.progressDivider} />
              <View style={styles.progressRow}>
                <View style={styles.fullWidthItem}>
                  <Text style={styles.progressValue}>Today's Reading Plan</Text>
                  
                  <View style={styles.readingPlanContainer}>
                    <View style={styles.readingPlanRow}>
                      {/* First Column */}
                      <View style={styles.readingPlanColumn}>
                        <View style={styles.readingPlanItem}>
                          <View style={[styles.readingCheckbox, styles.readingCompleted]}>
                            <IconButton 
                              icon="check" 
                              size={14} 
                              iconColor="#FFFFFF" 
                              style={styles.checkIcon} 
                            />
                          </View>
                          <View style={styles.readingPlanContent}>
                            <Text style={styles.readingPlanBook}>Genesis 1-2</Text>
                            <Text style={styles.readingPlanDescription}>Creation</Text>
                          </View>
                        </View>
                        
                        <View style={styles.readingPlanItem}>
                          <View style={[styles.readingCheckbox, styles.readingCompleted]}>
                            <IconButton 
                              icon="check" 
                              size={14} 
                              iconColor="#FFFFFF" 
                              style={styles.checkIcon} 
                            />
                          </View>
                          <View style={styles.readingPlanContent}>
                            <Text style={styles.readingPlanBook}>Psalms 1</Text>
                            <Text style={styles.readingPlanDescription}>Blessed is the one</Text>
                          </View>
                        </View>
                        
                        <View style={styles.readingPlanItem}>
                          <View style={[styles.readingCheckbox, styles.readingCompleted]}>
                            <IconButton 
                              icon="check" 
                              size={14} 
                              iconColor="#FFFFFF" 
                              style={styles.checkIcon} 
                            />
                          </View>
                          <View style={styles.readingPlanContent}>
                            <Text style={styles.readingPlanBook}>Luke 1</Text>
                            <Text style={styles.readingPlanDescription}>John's birth foretold</Text>
                          </View>
                        </View>
                      </View>
                      
                      {/* Second Column */}
                      <View style={styles.readingPlanColumn}>
                        <View style={styles.readingPlanItem}>
                          <View style={styles.readingCheckbox}>
                            <IconButton 
                              icon="circle-outline" 
                              size={14} 
                              iconColor={theme.colors.primary} 
                              style={styles.checkIcon} 
                            />
                          </View>
                          <View style={styles.readingPlanContent}>
                            <Text style={styles.readingPlanBook}>John 1</Text>
                            <Text style={styles.readingPlanDescription}>The Word</Text>
                          </View>
                        </View>
                        
                        <View style={styles.readingPlanItem}>
                          <View style={styles.readingCheckbox}>
                            <IconButton 
                              icon="circle-outline" 
                              size={14} 
                              iconColor={theme.colors.primary} 
                              style={styles.checkIcon} 
                            />
                          </View>
                          <View style={styles.readingPlanContent}>
                            <Text style={styles.readingPlanBook}>Exodus 1</Text>
                            <Text style={styles.readingPlanDescription}>Israelites oppressed</Text>
                          </View>
                        </View>
                        
                        <View style={styles.readingPlanItem}>
                          <View style={styles.readingCheckbox}>
                            <IconButton 
                              icon="circle-outline" 
                              size={14} 
                              iconColor={theme.colors.primary} 
                              style={styles.checkIcon} 
                            />
                          </View>
                          <View style={styles.readingPlanContent}>
                            <Text style={styles.readingPlanBook}>1 Samuel 1</Text>
                            <Text style={styles.readingPlanDescription}>Samuel's birth</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Daily Verse Card */}
          <Surface style={styles.verseCard}>
            <View style={styles.verseHeader}>
              <IconButton icon="book-open-page-variant" size={20} iconColor={theme.colors.primary} style={styles.verseIcon} />
              <Text style={styles.verseTitle}>Verse of the Day</Text>
            </View>
            <Text style={styles.verseText}>"{dailyVerse.text}"</Text>
            <Text style={styles.verseReference}>{dailyVerse.reference}</Text>
          </Surface>

          {/* Today's Readings */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {isToday(date) ? 'Today\'s Readings' : `Readings for ${format(date, 'MMM d')}`}
            </Text>
            <Text style={styles.sectionSubtitle}>
              {dateReadings.length > 0 ? `${dateReadings.length} ${dateReadings.length === 1 ? 'chapter' : 'chapters'} read` : ''}
            </Text>
          </View>

          {dateReadings.length > 0 ? (
            dateReadings.map((reading) => (
              <Surface key={reading.id} style={styles.readingCard}>
                <View style={styles.readingInfo}>
                  <Text style={styles.readingTitle}>
                    {reading.book} {reading.chapter}
                  </Text>
                  {reading.notes && (
                    <View style={styles.readingMeta}>
                      <Text style={styles.readingMetaText} numberOfLines={2}>
                        {reading.notes}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.readingTime}>
                  {format(new Date(reading.date), 'h:mma')}
                </Text>
              </Surface>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No readings for this day</Text>
              {isToday(date) && (
                <Button 
                  mode="outlined" 
                  onPress={() => setModalVisible(true)}
                  style={styles.emptyStateButton}
                  icon="book-open-variant"
                >
                  Start Reading
                </Button>
              )}
            </View>
          )}
          
          {/* Add some bottom padding to ensure content doesn't get cut off */}
          <View style={styles.pageBottomPadding} />
        </ScrollView>
      </View>
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 12,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottomWidth: 0,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.colors.primary,
    },
    streakBadge: {
      backgroundColor: theme.colors.primary,
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
    pageContainer: {
      width: SCREEN_WIDTH,
      height: '100%',
    },
    pageScrollContent: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 20,
    },
    pageBottomPadding: {
      height: 40,
    },
    dateHeader: {
      fontSize: 24,
      fontWeight: '700',
      color: theme.colors.primary,
      marginBottom: 16,
    },
    cardContainer: {
      marginBottom: 16,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.roundness,
      elevation: 2,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      overflow: 'hidden',
    },
    primaryCard: {
      padding: 16,
      backgroundColor: theme.colors.surface,
      borderRadius: 0,
      elevation: 0,
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
    },
    todayGoalSection: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    goalMainContent: {
      flex: 1,
    },
    chaptersLeftValue: {
      fontSize: 48,
      fontWeight: '700',
      color: theme.colors.primary,
      marginBottom: 4,
    },
    chaptersLeftLabel: {
      fontSize: 16,
      color: theme.colors.secondary,
    },
    goalCircleContainer: {
      marginLeft: 16,
      position: 'relative',
    },
    progressSection: {
      backgroundColor: theme.colors.surface,
      padding: 16,
      paddingTop: 0,
      paddingBottom: 8,
    },
    progressDivider: {
      backgroundColor: theme.colors.surfaceVariant,
      height: 1,
      marginBottom: 12,
      opacity: 0.5,
    },
    progressRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    fullWidthItem: {
      flex: 1,
      alignItems: 'flex-start',
      paddingHorizontal: 0,
    },
    progressValue: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.primary,
      marginTop: 0,
      marginBottom: 8,
      textAlign: 'left',
      alignSelf: 'flex-start',
    },
    readingPlanContainer: {
      width: '100%',
    },
    readingPlanRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    readingPlanColumn: {
      width: '48%',
    },
    readingPlanItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 6,
      width: '100%',
    },
    readingCheckbox: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 8,
      marginTop: 2,
    },
    readingCompleted: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    checkIcon: {
      margin: 0,
      padding: 0,
      width: 18,
      height: 18,
    },
    readingPlanContent: {
      flex: 1,
    },
    readingPlanBook: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.primary,
      marginBottom: 0,
    },
    readingPlanDescription: {
      fontSize: 11,
      color: theme.colors.secondary,
      lineHeight: 14,
    },
    verseCard: {
      marginBottom: 24,
      padding: 16,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.roundness,
      elevation: 2,
    },
    verseHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    verseIcon: {
      margin: 0,
      marginRight: 4,
    },
    verseTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.primary,
    },
    verseText: {
      fontSize: 15,
      fontStyle: 'italic',
      color: theme.colors.primary,
      marginBottom: 8,
      lineHeight: 22,
    },
    verseReference: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.secondary,
      textAlign: 'right',
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.primary,
    },
    sectionSubtitle: {
      fontSize: 14,
      color: theme.colors.secondary,
    },
    readingCard: {
      marginBottom: 12,
      padding: 16,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.roundness,
      flexDirection: 'row',
      alignItems: 'center',
      elevation: 2,
    },
    readingInfo: {
      flex: 1,
    },
    readingTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.primary,
      marginBottom: 4,
    },
    readingMeta: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    readingMetaText: {
      fontSize: 14,
      color: theme.colors.secondary,
    },
    readingTime: {
      fontSize: 14,
      color: theme.colors.secondary,
      marginLeft: 'auto',
    },
    emptyState: {
      paddingVertical: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyStateText: {
      color: theme.colors.secondary,
      marginBottom: 16,
    },
    emptyStateButton: {
      marginTop: 8,
    },
    bottomNav: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingTop: 4,
      paddingBottom: 28,
      borderTopWidth: 0,
      backgroundColor: theme.colors.background,
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
      color: theme.colors.primary,
      marginTop: -4,
    },
    addButton: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: theme.dark ? '#FFFFFF' : '#000000',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: theme.colors.shadow,
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

  return (
    <AppLayout hideNavigation>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bible Habit</Text>
        <View style={styles.streakBadge}>
          <IconButton 
            icon="fire" 
            size={18} 
            iconColor="#FFFFFF" 
            style={styles.streakIcon} 
          />
          <Text style={styles.streakValue}>{streak.currentStreak}</Text>
        </View>
      </View>

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

      <View style={styles.bottomNav}>
        <Pressable style={[styles.navItem, styles.navItemActive]}>
          <IconButton icon="home-outline" size={24} iconColor={theme.colors.primary} style={{ margin: 0 }} />
          <Text style={styles.navLabel}>Home</Text>
        </Pressable>
        <Pressable style={styles.navItem}>
          <IconButton icon="chart-line" size={24} iconColor={theme.colors.secondary} style={{ margin: 0 }} />
          <Text style={styles.navLabel}>Analytics</Text>
        </Pressable>
        <Pressable 
          style={styles.navItem}
          onPress={() => router.replace('/bible')}
        >
          <IconButton icon="book-open-variant" size={24} iconColor={theme.colors.secondary} style={{ margin: 0 }} />
          <Text style={styles.navLabel}>Bible</Text>
        </Pressable>
        <View style={styles.addButtonContainer}>
          <Pressable style={styles.addButton} onPress={() => setModalVisible(true)}>
            <IconButton icon="plus" size={32} iconColor={theme.dark ? '#000000' : '#FFFFFF'} />
          </Pressable>
        </View>
      </View>

      <AddReadingDrawer
        visible={modalVisible}
        onDismiss={() => setModalVisible(false)}
        onSave={handleAddReading}
      />
    </AppLayout>
  );
} 