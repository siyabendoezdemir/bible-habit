import React from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { format, isToday } from 'date-fns';
import { BibleReading } from '../../types';

import DailyVerseCard from './DailyVerseCard';
import ReadingGoalCard from './ReadingGoalCard';
import ReadingPlanList from './ReadingPlanList';
import ReadingListSection from './ReadingListSection';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface DatePageProps {
  date: Date;
  readings: BibleReading[];
  chaptersLeft: number;
  onStartReading: () => void;
  readingPlanItems: Array<{
    book: string;
    description: string;
    completed: boolean;
  }>;
  dailyVerse: {
    text: string;
    reference: string;
  };
}

const DatePage: React.FC<DatePageProps> = ({ 
  date, 
  readings, 
  chaptersLeft, 
  onStartReading,
  readingPlanItems,
  dailyVerse
}) => {
  const theme = useTheme();

  return (
    <View style={styles.pageContainer}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.pageScrollContent}
        bounces={true}
        alwaysBounceVertical={true}
      >
        {/* Date Header */}
        <Text style={[styles.dateHeader, { color: theme.colors.primary }]}>
          {isToday(date) ? 'Today' : format(date, 'EEEE, MMMM d')}
        </Text>

        {/* Reading Goal Card with Reading Plan */}
        <ReadingGoalCard 
          chaptersLeft={chaptersLeft} 
          readingPlanComponent={<ReadingPlanList items={readingPlanItems} />}
        />

        {/* Daily Verse Card */}
        <DailyVerseCard verse={dailyVerse} />

        {/* Reading List Section */}
        <ReadingListSection 
          date={date} 
          readings={readings} 
          onStartReading={onStartReading}
        />
        
        {/* Add some bottom padding to ensure content doesn't get cut off */}
        <View style={styles.pageBottomPadding} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  pageContainer: {
    width: SCREEN_WIDTH,
    height: '100%',
  },
  pageScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  dateHeader: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
  },
  pageBottomPadding: {
    height: 40,
  },
});

export default DatePage; 