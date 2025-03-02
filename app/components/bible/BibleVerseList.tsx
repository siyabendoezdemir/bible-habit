import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { BibleVerse } from '../../constants/BibleContent';

interface BibleVerseListProps {
  selectedBook: string;
  selectedChapter: number;
  verses: BibleVerse[];
  fontSize: number;
  children?: React.ReactNode;
}

const BibleVerseList: React.FC<BibleVerseListProps> = ({
  selectedBook,
  selectedChapter,
  verses,
  fontSize,
  children,
}) => {
  const theme = useTheme();

  // Get the book introduction (first lines before verse 1)
  const bookIntro = selectedBook === "Psalms" && selectedChapter === 40 ? (
    <View style={styles.introContainer}>
      <Text style={[styles.introText, { color: theme.colors.onSurface, opacity: 0.8 }]}>
        For the director of music. Of David.
      </Text>
      <Text style={[styles.introText, { color: theme.colors.onSurface, opacity: 0.8 }]}>
        A psalm.
      </Text>
    </View>
  ) : null;

  if (!verses || verses.length === 0) {
    // If we don't have content, show a placeholder
    return (
      <ScrollView 
        style={styles.contentContainer} 
        contentContainerStyle={styles.contentInner}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.placeholderContainer}>
          <Text style={{ color: theme.colors.secondary, textAlign: 'center' }}>
            {selectedBook} {selectedChapter} content would be loaded here.
          </Text>
          <Text style={{ color: theme.colors.secondary, textAlign: 'center', marginTop: 8 }}>
            In a full implementation, this would fetch from a Bible API or local database.
          </Text>
        </View>
        {children}
      </ScrollView>
    );
  }

  return (
    <ScrollView 
      style={styles.contentContainer} 
      contentContainerStyle={styles.contentInner}
      showsVerticalScrollIndicator={false}
    >
      {bookIntro}
      {verses.map((verse: BibleVerse) => (
        <View key={verse.verse} style={styles.verseContainer}>
          <Text style={[styles.verseNumber, { color: theme.colors.primary }]}>{verse.verse}</Text>
          <Text style={[styles.verseText, { fontSize, color: theme.colors.onSurface }]}>{verse.text}</Text>
        </View>
      ))}
      {children}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
  },
  contentInner: {
    padding: 20,
    paddingBottom: 100,
  },
  introContainer: {
    marginBottom: 24,
  },
  introText: {
    fontSize: 18,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  verseContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  verseNumber: {
    fontSize: 12,
    fontWeight: '700',
    marginRight: 8,
    marginTop: 4,
    opacity: 0.6,
  },
  verseText: {
    flex: 1,
    lineHeight: 28,
    letterSpacing: 0.3,
  },
  placeholderContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default BibleVerseList; 