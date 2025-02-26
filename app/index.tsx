import { View, StyleSheet, ScrollView, Pressable, Platform } from 'react-native';
import { useTheme, Text, IconButton, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, isToday, differenceInDays } from 'date-fns';
import { BibleReading, ReadingStreak } from './types';
import AddReadingDrawer from './components/AddReadingDrawer';
import ProgressCircle from './components/ProgressCircle';

export default function HomeScreen() {
  const theme = useTheme();
  const [readings, setReadings] = useState<BibleReading[]>([]);
  const [streak, setStreak] = useState<ReadingStreak>({
    currentStreak: 0,
    lastReadDate: null,
    totalDaysRead: 0,
  });
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

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

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      flex: 1,
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
    tabs: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      paddingVertical: 8,
      gap: 24,
    },
    tab: {
      paddingVertical: 4,
    },
    tabText: {
      fontSize: 16,
      color: theme.colors.secondary,
    },
    activeTab: {
      borderBottomWidth: 2,
      borderBottomColor: theme.colors.primary,
    },
    activeTabText: {
      color: theme.colors.primary,
    },
    statsCard: {
      margin: 20,
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
      marginHorizontal: 20,
      marginBottom: 12,
      marginTop: 20,
    },
    readingCard: {
      marginHorizontal: 20,
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
      borderTopWidth: 1,
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
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bible AI</Text>
      </View>

      <View style={styles.tabs}>
        <Pressable style={[styles.tab, styles.activeTab]}>
          <Text style={[styles.tabText, styles.activeTabText]}>Today</Text>
        </Pressable>
        <Pressable style={styles.tab}>
          <Text style={styles.tabText}>Yesterday</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.content}>
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

        <Text style={styles.sectionTitle}>Recently read</Text>

        {readings.map((reading) => (
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
        ))}
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