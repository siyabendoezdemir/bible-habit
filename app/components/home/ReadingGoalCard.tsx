import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Surface, Divider, useTheme } from 'react-native-paper';
import ProgressCircle from '../ProgressCircle';

interface ReadingGoalCardProps {
  chaptersLeft: number;
  readingPlanComponent: React.ReactNode;
}

const ReadingGoalCard: React.FC<ReadingGoalCardProps> = ({ 
  chaptersLeft,
  readingPlanComponent 
}) => {
  const theme = useTheme();

  return (
    <View style={styles.cardContainer}>
      {/* Main Goal Card */}
      <Surface style={[styles.primaryCard, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.todayGoalSection}>
          <View style={styles.goalMainContent}>
            <Text style={[styles.chaptersLeftValue, { color: theme.colors.primary }]}>
              {chaptersLeft}
            </Text>
            <Text style={[styles.chaptersLeftLabel, { color: theme.colors.secondary }]}>
              Chapters left
            </Text>
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
      <View style={[styles.progressSection, { backgroundColor: theme.colors.surface }]}>
        <Divider style={[styles.progressDivider, { backgroundColor: theme.colors.surfaceVariant }]} />
        <View style={styles.progressRow}>
          <View style={styles.fullWidthItem}>
            {readingPlanComponent}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    marginBottom: 16,
    borderRadius: 16,
    elevation: 2,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    overflow: 'hidden',
  },
  primaryCard: {
    padding: 16,
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
    marginBottom: 4,
  },
  chaptersLeftLabel: {
    fontSize: 16,
  },
  goalCircleContainer: {
    marginLeft: 16,
    position: 'relative',
  },
  progressSection: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: 8,
  },
  progressDivider: {
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
});

export default ReadingGoalCard; 