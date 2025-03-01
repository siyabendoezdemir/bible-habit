import React, { useCallback, useMemo, useRef } from 'react';
import { View, StyleSheet, Platform, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard, ScrollView, TouchableOpacity } from 'react-native';
import { TextInput, Button, useTheme, Text, IconButton } from 'react-native-paper';
import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { BibleReading } from '../types';
import { BIBLE_BOOKS } from '../constants';

interface AddReadingDrawerProps {
  visible: boolean;
  onDismiss: () => void;
  onSave: (reading: BibleReading) => void;
}

export default function AddReadingDrawer({ visible, onDismiss, onSave }: AddReadingDrawerProps) {
  const theme = useTheme();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [book, setBook] = React.useState('');
  const [chapter, setChapter] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [bookError, setBookError] = React.useState('');
  const [showSuggestions, setShowSuggestions] = React.useState(false);

  // Variables
  const snapPoints = useMemo(() => ['75%'], []);

  React.useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [visible]);

  const handleSave = () => {
    if (!BIBLE_BOOKS.includes(book)) {
      setBookError('Please select a valid book');
      return;
    }

    onSave({
      id: Date.now().toString(),
      book,
      chapter: parseInt(chapter),
      notes,
      date: new Date().toISOString(),
      completed: false
    });

    setBook('');
    setChapter('');
    setNotes('');
    setBookError('');
    onDismiss();
  };

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  );

  const sections = useMemo(() => {
    if (!book.trim() || !showSuggestions) return [];

    const searchTerm = book.toLowerCase();
    const matches = BIBLE_BOOKS.filter(b =>
      b.toLowerCase().includes(searchTerm)
    ).slice(0, 5); // Show only top 5 matches

    return matches;
  }, [book, showSuggestions]);

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={visible ? 0 : -1}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={onDismiss}
      backdropComponent={renderBackdrop}
      backgroundStyle={{
        backgroundColor: theme.colors.background,
      }}
      handleIndicatorStyle={{
        backgroundColor: theme.colors.onSurface,
        opacity: 0.5,
      }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={() => {
          Keyboard.dismiss();
          setShowSuggestions(false);
        }}>
          <View style={styles.container}>
            <View style={styles.content}>
              <Text style={[styles.headerTitle, { color: theme.colors.primary }]}>Add Reading</Text>

              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: theme.colors.secondary }]}>Book</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    value={book}
                    onChangeText={(text) => {
                      setBook(text);
                      setShowSuggestions(true);
                      setBookError('');
                    }}
                    style={[styles.input, { backgroundColor: theme.colors.surface }]}
                    error={!!bookError}
                    mode="outlined"
                    placeholder="Type to search books..."
                    right={book ? (
                      <TextInput.Icon
                        icon="close"
                        onPress={() => {
                          setBook('');
                          setBookError('');
                        }}
                      />
                    ) : undefined}
                    onFocus={() => setShowSuggestions(true)}
                  />
                  {showSuggestions && sections.length > 0 && (
                    <View style={[styles.suggestions, { backgroundColor: theme.colors.surface }]}>
                      <ScrollView
                        nestedScrollEnabled
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                      >
                        {sections.map((suggestion) => (
                          <TouchableOpacity
                            key={suggestion}
                            style={styles.suggestionItem}
                            onPress={() => {
                              setBook(suggestion);
                              setShowSuggestions(false);
                              setBookError('');
                            }}
                          >
                            <Text style={styles.suggestionText}>{suggestion}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: theme.colors.secondary }]}>Chapter</Text>
                <TextInput
                  value={chapter}
                  onChangeText={setChapter}
                  keyboardType="number-pad"
                  style={[styles.input, { backgroundColor: theme.colors.surface }]}
                  mode="outlined"
                  placeholder="Enter chapter number"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: theme.colors.secondary }]}>Notes (optional)</Text>
                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  style={[styles.input, { backgroundColor: theme.colors.surface, minHeight: 60 }]}
                  mode="outlined"
                  placeholder="Add your thoughts..."
                />
              </View>
            </View>

            <View style={styles.footer}>
              <Button
                onPress={handleSave}
                mode="contained"
                style={[styles.button]}
                contentStyle={styles.buttonContent}
                labelStyle={[styles.buttonLabel, { color: theme.colors.surface }]}
                buttonColor={theme.colors.primary}
                disabled={!book || !chapter}
              >
                Save
              </Button>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    height: '70%',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  inputContainer: {
    marginBottom: 12,
  },
  inputWrapper: {
    position: 'relative',
    zIndex: 1,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4,
    marginLeft: 4,
  },
  input: {
    fontSize: 16,
    borderRadius: 12,
  },
  footer: {
    position: 'absolute',
    bottom: '4%',
    left: 0,
    right: 0,
    padding: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  button: {
    borderRadius: 12,
  },
  buttonContent: {
    height: 56,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  suggestions: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    borderRadius: 12,
    marginTop: 4,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    zIndex: 1000,
    maxHeight: 200,
    overflow: 'hidden',
  },
  suggestionItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  suggestionText: {
    fontSize: 16,
  },
}); 