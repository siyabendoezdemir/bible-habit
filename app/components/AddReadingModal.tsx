import { View, StyleSheet, ScrollView } from 'react-native';
import { Modal, Portal, TextInput, Button, useTheme, Text } from 'react-native-paper';
import { useState } from 'react';
import { BibleReading } from '../types';

interface AddReadingModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSave: (reading: BibleReading) => void;
}

const BIBLE_BOOKS = [
  'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
  'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel',
  '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra',
  'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs',
  'Ecclesiastes', 'Song of Solomon', 'Isaiah', 'Jeremiah', 'Lamentations',
  'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos',
  'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk',
  'Zephaniah', 'Haggai', 'Zechariah', 'Malachi',
  'Matthew', 'Mark', 'Luke', 'John', 'Acts',
  'Romans', '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians',
  'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians', '1 Timothy',
  '2 Timothy', 'Titus', 'Philemon', 'Hebrews', 'James',
  '1 Peter', '2 Peter', '1 John', '2 John', '3 John',
  'Jude', 'Revelation'
];

export default function AddReadingModal({ visible, onDismiss, onSave }: AddReadingModalProps) {
  const theme = useTheme();
  const [book, setBook] = useState('');
  const [chapter, setChapter] = useState('');
  const [notes, setNotes] = useState('');
  const [bookError, setBookError] = useState('');

  const handleSave = () => {
    if (!BIBLE_BOOKS.includes(book)) {
      setBookError('Please enter a valid book of the Bible');
      return;
    }

    const chapterNum = parseInt(chapter);
    if (isNaN(chapterNum) || chapterNum < 1) {
      return;
    }

    const newReading: BibleReading = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      book,
      chapter: chapterNum,
      completed: true,
      notes: notes.trim() || undefined,
    };

    onSave(newReading);
    onDismiss();
    resetForm();
  };

  const resetForm = () => {
    setBook('');
    setChapter('');
    setNotes('');
    setBookError('');
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.background,
      padding: 20,
      margin: 20,
      borderRadius: 8,
    },
    input: {
      marginBottom: 16,
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 8,
    },
    suggestions: {
      maxHeight: 200,
      marginBottom: 16,
    },
    suggestion: {
      padding: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outline,
    },
  });

  const filteredBooks = BIBLE_BOOKS.filter(b => 
    b.toLowerCase().includes(book.toLowerCase())
  );

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.container}>
        <Text variant="headlineSmall" style={{ marginBottom: 16 }}>Add Reading</Text>
        
        <TextInput
          label="Book"
          value={book}
          onChangeText={setBook}
          style={styles.input}
          error={!!bookError}
          mode="outlined"
        />
        
        {book.length > 0 && (
          <ScrollView style={styles.suggestions}>
            {filteredBooks.map((suggestion) => (
              <Button
                key={suggestion}
                onPress={() => setBook(suggestion)}
                mode="text"
                style={styles.suggestion}
              >
                {suggestion}
              </Button>
            ))}
          </ScrollView>
        )}

        <TextInput
          label="Chapter"
          value={chapter}
          onChangeText={setChapter}
          keyboardType="number-pad"
          style={styles.input}
          mode="outlined"
        />

        <TextInput
          label="Notes (optional)"
          value={notes}
          onChangeText={setNotes}
          multiline
          style={[styles.input, { height: 100 }]}
          mode="outlined"
        />

        <View style={styles.buttonContainer}>
          <Button onPress={onDismiss} mode="outlined">Cancel</Button>
          <Button 
            onPress={handleSave}
            mode="contained"
            disabled={!book || !chapter}
          >
            Save
          </Button>
        </View>
      </Modal>
    </Portal>
  );
} 