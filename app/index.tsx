import { View, StyleSheet, ScrollView } from 'react-native';
import { useTheme, Text, Card, Button, FAB, Portal, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, isToday, differenceInDays } from 'date-fns';
import { BibleReading, ReadingStreak } from './types';
import AddReadingModal from './components/AddReadingModal';
import * as Notifications from 'expo-notifications';

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
    scheduleReminder();
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

  async function scheduleReminder() {
    await Notifications.cancelAllScheduledNotificationsAsync();
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Time for Bible Reading! 📖",
        body: "Don't forget to read your daily Bible chapter and maintain your streak!",
      },
      trigger: {
        hour: 9, // 9 AM
        minute: 0,
        repeats: true,
        type: 'calendar',
      },
    });
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
      padding: 16,
    },
    streakCard: {
      marginBottom: 16,
      backgroundColor: theme.colors.surface,
    },
    streakText: {
      fontSize: 48,
      fontWeight: 'bold',
      textAlign: 'center',
      color: theme.colors.primary,
    },
    streakLabel: {
      fontSize: 16,
      textAlign: 'center',
      color: theme.colors.secondary,
      marginTop: 8,
    },
    readingCard: {
      marginBottom: 12,
      backgroundColor: theme.colors.surface,
    },
    fab: {
      position: 'absolute',
      margin: 16,
      right: 0,
      bottom: 0,
      backgroundColor: theme.colors.primary,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <Card style={styles.streakCard}>
          <Card.Content>
            <Text style={styles.streakText}>{streak.currentStreak}</Text>
            <Text style={styles.streakLabel}>Day Streak</Text>
            <Text style={styles.streakLabel}>
              Total Days Read: {streak.totalDaysRead}
            </Text>
          </Card.Content>
        </Card>

        {readings.map((reading) => (
          <Card key={reading.id} style={styles.readingCard}>
            <Card.Content>
              <View style={styles.cardHeader}>
                <View>
                  <Text variant="titleMedium">
                    {reading.book} Chapter {reading.chapter}
                  </Text>
                  <Text variant="bodyMedium">
                    {format(new Date(reading.date), 'MMMM d, yyyy')}
                  </Text>
                </View>
                <IconButton
                  icon="delete"
                  size={20}
                  onPress={() => handleDeleteReading(reading.id)}
                />
              </View>
              {reading.notes && (
                <Text variant="bodySmall" style={{ marginTop: 8 }}>
                  {reading.notes}
                </Text>
              )}
            </Card.Content>
          </Card>
        ))}
      </ScrollView>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      />

      <AddReadingModal
        visible={modalVisible}
        onDismiss={() => setModalVisible(false)}
        onSave={handleAddReading}
      />
    </SafeAreaView>
  );
} 