import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, IconButton, useTheme } from 'react-native-paper';
import { ReadingStreak } from '../../types';
import { isActiveStreak } from '../../utils/readingStorage';

interface HeaderProps {
  streak: ReadingStreak;
}

const Header: React.FC<HeaderProps> = ({ streak }) => {
  const theme = useTheme();
  const isActive = isActiveStreak(streak);
  
  // Active streak colors
  const activeColor = '#F39C12'; // Orange color for active streak
  const inactiveColor = theme.colors.secondary; // Use secondary color for inactive streak
  
  // Choose color based on streak status
  const badgeColor = isActive ? activeColor : inactiveColor;
  const iconColor = isActive ? '#FFFFFF' : '#FFFFFF';

  return (
    <View style={styles.header}>
      <Text style={[styles.headerTitle, { color: theme.colors.primary }]}>Bible Habit</Text>
      <View style={[styles.streakBadge, { backgroundColor: badgeColor }]}>
        <IconButton 
          icon="fire" 
          size={18} 
          iconColor={iconColor} 
          style={styles.streakIcon} 
        />
        <Text style={styles.streakValue}>{streak.currentStreak}</Text>
      </View>
    </View>
  );
};

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
});

export default Header; 