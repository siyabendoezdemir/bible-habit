import React, { useRef, useEffect, useState } from 'react';
import { FlatList, Dimensions, StyleSheet } from 'react-native';
import { subDays } from 'date-fns';
import { BibleReading } from '../../types';
import { DatePage } from './';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DAYS_TO_SHOW = 7; // Number of days to show in the carousel

interface DateCarouselProps {
  readings: BibleReading[];
  onDateChange: (date: Date) => void;
  onStartReading: () => void;
  chaptersLeftToday: number;
  dailyVerse: {
    text: string;
    reference: string;
  };
  readingPlanItems: Array<{
    book: string;
    description: string;
    completed: boolean;
  }>;
}

const DateCarousel: React.FC<DateCarouselProps> = ({
  readings,
  onDateChange,
  onStartReading,
  chaptersLeftToday,
  dailyVerse,
  readingPlanItems
}) => {
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(DAYS_TO_SHOW - 1); // Start with today (last item)
  const [isInitialized, setIsInitialized] = useState(false);
  const [mountKey, setMountKey] = useState(Date.now().toString());

  // Generate dates for the carousel (today and previous days)
  const dates = Array.from({ length: DAYS_TO_SHOW }, (_, i) => 
    subDays(new Date(), DAYS_TO_SHOW - 1 - i)
  );

  // Initialize the carousel to show today's date
  useEffect(() => {
    // Set a small timeout to ensure the FlatList is fully rendered
    const timer = setTimeout(() => {
      if (flatListRef.current) {
        const todayIndex = DAYS_TO_SHOW - 1; // Index of today (last item)
        flatListRef.current.scrollToIndex({
          index: todayIndex,
          animated: false
        });
        setCurrentIndex(todayIndex);
        onDateChange(dates[todayIndex]);
        setIsInitialized(true);
      }
    }, 50);

    return () => clearTimeout(timer);
  }, []);

  // Handle scroll events
  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    
    if (index !== currentIndex) {
      setCurrentIndex(index);
      onDateChange(dates[index]);
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

  // Render a date page
  const renderDatePage = ({ item, index }: { item: Date, index: number }) => {
    const dateReadings = getFilteredReadings(item);
    
    return (
      <DatePage 
        key={index}
        date={item}
        readings={dateReadings}
        chaptersLeft={index === DAYS_TO_SHOW - 1 ? chaptersLeftToday : 0}
        onStartReading={onStartReading}
        readingPlanItems={readingPlanItems}
        dailyVerse={dailyVerse}
      />
    );
  };

  return (
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
      renderItem={renderDatePage}
      keyExtractor={(_, index) => index.toString()}
      getItemLayout={(_, index) => ({
        length: SCREEN_WIDTH,
        offset: SCREEN_WIDTH * index,
        index,
      })}
    />
  );
};

export default DateCarousel; 