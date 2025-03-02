import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Surface, Button, useTheme } from 'react-native-paper';
import { format, isToday } from 'date-fns';
import { BibleReading } from '../../types';
import * as ReadingStorage from '../../utils/readingStorage';

interface ReadingListSectionProps {
  date: Date;
  readings: BibleReading[];
  onStartReading?: () => void;
}

const ReadingListSection: React.FC<ReadingListSectionProps> = ({ 
  date, 
  readings, 
  onStartReading 
}) => {
  const theme = useTheme();
  
  // Filter out duplicate readings
  const uniqueReadings = useMemo(() => {
    return ReadingStorage.getUniqueReadings(readings);
  }, [readings]);

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
          {isToday(date) ? 'Today\'s Readings' : `Readings for ${format(date, 'MMM d')}`}
        </Text>
        <Text style={[styles.sectionSubtitle, { color: theme.colors.secondary }]}>
          {uniqueReadings.length > 0 ? `${uniqueReadings.length} ${uniqueReadings.length === 1 ? 'chapter' : 'chapters'} read` : ''}
        </Text>
      </View>

      {uniqueReadings.length > 0 ? (
        uniqueReadings.map((reading) => (
          <Surface key={reading.id} style={[styles.readingCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.readingInfo}>
              <Text style={[styles.readingTitle, { color: theme.colors.primary }]}>
                {reading.book} {reading.chapter}
              </Text>
              {reading.notes && (
                <View style={styles.readingMeta}>
                  <Text style={[styles.readingMetaText, { color: theme.colors.secondary }]} numberOfLines={2}>
                    {reading.notes}
                  </Text>
                </View>
              )}
            </View>
            <Text style={[styles.readingTime, { color: theme.colors.secondary }]}>
              {format(new Date(reading.date), 'h:mma')}
            </Text>
          </Surface>
        ))
      ) : (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyStateText, { color: theme.colors.secondary }]}>
            No readings for this day
          </Text>
          {isToday(date) && onStartReading && (
            <Button 
              mode="outlined" 
              onPress={onStartReading}
              style={styles.emptyStateButton}
              icon="book-open-variant"
            >
              Start Reading
            </Button>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
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
  },
  sectionSubtitle: {
    fontSize: 14,
  },
  readingCard: {
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
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
    marginBottom: 4,
  },
  readingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  readingMetaText: {
    fontSize: 14,
  },
  readingTime: {
    fontSize: 14,
    marginLeft: 'auto',
  },
  emptyState: {
    paddingVertical: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    marginBottom: 16,
  },
  emptyStateButton: {
    marginTop: 8,
  },
});

export default ReadingListSection; 