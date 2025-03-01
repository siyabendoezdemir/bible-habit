import { View, StyleSheet, ScrollView, Pressable, Platform, Dimensions } from 'react-native';
import { useTheme, Text, IconButton, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, isToday, differenceInDays, subDays, addDays } from 'date-fns';
import { BibleReading, ReadingStreak } from './types';
import AddReadingDrawer from './components/AddReadingDrawer';
import ProgressCircle from './components/ProgressCircle';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DAYS_TO_SHOW = 7; // Number of days to show in the carousel

export default function HomeScreen() {
  const theme = useTheme();
  const [readings, setReadings] = useState<BibleReading[]>([]);
  const [streak, setStreak] = useState<ReadingStreak>({
    currentStreak: 0,
    lastReadDate: null,
    totalDaysRead: 0,
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentIndex, setCurrentIndex] = useState(DAYS_TO_SHOW - 1); // Start with today (last item)
  const horizontalScrollViewRef = useRef<ScrollView>(null);

  // Generate dates for the carousel (today and previous days)
  const dates = Array.from({ length: DAYS_TO_SHOW }, (_, i) => 
    subDays(new Date(), DAYS_TO_SHOW - 1 - i)
  );

  useEffect(() => {
    loadData();
    // Scroll to today (last item) on initial render
    setTimeout(() => {
      scrollToIndex(DAYS_TO_SHOW - 1);
    }, 100);
  }, []);

  const scrollToIndex = (index: number) => {
    if (horizontalScrollViewRef.current) {
      horizontalScrollViewRef.current.scrollTo({ x: index * SCREEN_WIDTH, animated: true });
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

  const renderDatePage = (date: Date, index: number) => {
    const dateReadings = getFilteredReadings(date);
    
    return (
      <View key={index} style={styles.pageContainer}>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.pageScrollContent}
        >
          <Text style={styles.dateHeader}>
            {isToday(date) ? 'Today' : format(date, 'EEEE, MMMM d')}
          </Text>

          <Surface style={styles.statsCard}>
            <View style={styles.mainStat}>
              <View style={styles.mainStatContent}>
                <Text style={styles.mainStatValue}>0</Text>
                <Text style={styles.mainStatLabel}>Chapters left</Text>
              </View>
              <ProgressCircle progress={0.7} size={56} strokeWidth={2} color={theme.colors.primary} />
            </View>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <ProgressCircle progress={0.7} size={32} strokeWidth={1.5} color={theme.colors.error} />
                <Text style={styles.statValue}>0g</Text>
                <Text style={styles.statLabel}>Old Testament</Text>
              </View>
              <View style={styles.statItem}>
                <ProgressCircle progress={0.45} size={32} strokeWidth={1.5} color={theme.colors.tertiary} />
                <Text style={styles.statValue}>89g</Text>
                <Text style={styles.statLabel}>New Testament</Text>
              </View>
              <View style={styles.statItem}>
                <ProgressCircle progress={0.3} size={32} strokeWidth={1.5} color={theme.colors.secondary} />
                <Text style={styles.statValue}>48g</Text>
                <Text style={styles.statLabel}>Psalms</Text>
              </View>
            </View>
          </Surface>

          <Text style={styles.sectionTitle}>
            {isToday(date) ? 'Today\'s readings' : `Readings for ${format(date, 'MMM d')}`}
          </Text>

          {dateReadings.length > 0 ? (
            dateReadings.map((reading) => (
              <Surface key={reading.id} style={styles.readingCard}>
                <View style={styles.readingInfo}>
                  <Text style={styles.readingTitle}>
                    {reading.book} {reading.chapter}
                  </Text>
                  {reading.notes && (
                    <View style={styles.readingMeta}>
                      <Text style={styles.readingMetaText} numberOfLines={1}>
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
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.colors.primary,
    },
    pageContainer: {
      width: SCREEN_WIDTH,
      height: '100%',
    },
    pageScrollContent: {
      paddingHorizontal: 20,
      paddingTop: 20,
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
    statsCard: {
      marginBottom: 20,
      padding: 20,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.roundness,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 1,
      shadowRadius: 20,
      elevation: 5,
    },
    mainStat: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: 40,
    },
    mainStatContent: {
      flex: 1,
    },
    mainStatValue: {
      fontSize: 72,
      fontWeight: '700',
      color: theme.colors.primary,
      marginBottom: 4,
      letterSpacing: -2,
    },
    mainStatLabel: {
      fontSize: 15,
      color: theme.colors.secondary,
    },
    statsGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 20,
    },
    statItem: {
      flex: 1,
      backgroundColor: theme.colors.background,
      padding: 16,
      borderRadius: theme.roundness - 4,
      alignItems: 'flex-start',
    },
    statValue: {
      fontSize: 17,
      fontWeight: '600',
      color: theme.colors.primary,
      marginTop: 12,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 13,
      color: theme.colors.secondary,
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.colors.primary,
      marginBottom: 12,
    },
    readingCard: {
      marginBottom: 12,
      padding: 16,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.roundness,
      flexDirection: 'row',
      alignItems: 'center',
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 1,
      shadowRadius: 20,
      elevation: 5,
    },
    readingInfo: {
      flex: 1,
    },
    readingTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.colors.primary,
      marginBottom: 4,
    },
    readingMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    readingMetaText: {
      fontSize: 13,
      color: theme.colors.secondary,
    },
    readingTime: {
      fontSize: 13,
      color: theme.colors.secondary,
      marginLeft: 'auto',
    },
    bottomNav: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingTop: 4,
      paddingBottom: 28,
      borderTopWidth: 0,
      borderTopColor: theme.colors.outline,
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
    emptyState: {
      paddingVertical: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyStateText: {
      color: theme.colors.secondary,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bible AI</Text>
      </View>

      {/* Full Page Carousel */}
      <ScrollView
        ref={horizontalScrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
        decelerationRate="fast"
        style={{ flex: 1 }}
      >
        {dates.map((date, index) => renderDatePage(date, index))}
      </ScrollView>

      <View style={styles.bottomNav}>
        <Pressable style={[styles.navItem, styles.navItemActive]}>
          <IconButton icon="home-outline" size={24} iconColor={theme.colors.primary} style={{ margin: 0 }} />
          <Text style={styles.navLabel}>Home</Text>
        </Pressable>
        <Pressable style={styles.navItem}>
          <IconButton icon="chart-line" size={24} iconColor={theme.colors.secondary} style={{ margin: 0 }} />
          <Text style={styles.navLabel}>Analytics</Text>
        </Pressable>
        <Pressable style={styles.navItem}>
          <IconButton icon="cog-outline" size={24} iconColor={theme.colors.secondary} style={{ margin: 0 }} />
          <Text style={styles.navLabel}>Settings</Text>
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
    </SafeAreaView>
  );
} 