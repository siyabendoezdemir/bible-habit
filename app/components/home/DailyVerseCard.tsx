import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, IconButton, Surface, useTheme } from 'react-native-paper';

interface DailyVerseProps {
  verse: {
    text: string;
    reference: string;
  };
}

const DailyVerseCard: React.FC<DailyVerseProps> = ({ verse }) => {
  const theme = useTheme();

  return (
    <Surface style={[styles.verseCard, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.verseHeader}>
        <IconButton 
          icon="book-open-page-variant" 
          size={20} 
          iconColor={theme.colors.primary} 
          style={styles.verseIcon} 
        />
        <Text style={[styles.verseTitle, { color: theme.colors.primary }]}>
          Verse of the Day
        </Text>
      </View>
      <Text style={[styles.verseText, { color: theme.colors.primary }]}>
        "{verse.text}"
      </Text>
      <Text style={[styles.verseReference, { color: theme.colors.secondary }]}>
        {verse.reference}
      </Text>
    </Surface>
  );
};

const styles = StyleSheet.create({
  verseCard: {
    marginBottom: 24,
    padding: 16,
    borderRadius: 16,
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
  },
  verseText: {
    fontSize: 15,
    fontStyle: 'italic',
    marginBottom: 8,
    lineHeight: 22,
  },
  verseReference: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
  },
});

export default DailyVerseCard; 