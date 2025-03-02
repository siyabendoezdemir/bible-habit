import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList,
  Animated, 
  Easing,
  Platform,
  Dimensions,
  StatusBar as RNStatusBar,
  TextInput,
  KeyboardAvoidingView,
  ScrollView
} from 'react-native';
import { Text, IconButton, useTheme, Surface } from 'react-native-paper';
import { OT_BOOKS, NT_BOOKS } from '../../utils/bibleDataUtils';
import { getChapterCount } from '../../constants/BibleContent';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface BibleSelectionModalProps {
  selectedBook: string;
  selectedChapter: number;
  onSelectBookAndChapter: (book: string, chapter: number) => void;
  onClose: () => void;
}

// Combine all books into a single array
const ALL_BOOKS = [...OT_BOOKS, ...NT_BOOKS];

const BibleSelectionModal: React.FC<BibleSelectionModalProps> = ({
  selectedBook,
  selectedChapter,
  onSelectBookAndChapter,
  onClose,
}) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedView, setSelectedView] = useState<'books' | 'chapters'>('books');
  const [activeBook, setActiveBook] = useState(selectedBook);
  const { height: windowHeight } = Dimensions.get('window');
  
  // Custom colors for a paper-like appearance
  const customColors = {
    accent: '#8D6E63',         // Warm brown (like aged paper)
    accentLight: '#F5F5F0',    // Off-white paper color
    text: '#3E2723',           // Dark brown for text
    border: '#D7CCC8',         // Light taupe for borders
    highlight: '#EFEBE9',      // Very light tan for highlights
    background: '#FFFAF0',     // Floral white for background
    shadow: 'rgba(0, 0, 0, 0.1)' // Subtle shadow
  };

  // Animation values
  const slideAnimation = useRef(new Animated.Value(windowHeight)).current;
  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const booksListRef = useRef<FlatList>(null);
  
  // Filtered books based on search
  const filteredBooks = ALL_BOOKS.filter(book => 
    book.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Entry animation
  useEffect(() => {
    // Start with the slide animation at windowHeight (off-screen)
    slideAnimation.setValue(windowHeight);
    
    // Run entrance animation
    Animated.parallel([
      Animated.timing(slideAnimation, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic)
      }),
      Animated.timing(fadeAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true
      })
    ]).start();
    
    return () => {
      // Reset animations on unmount
      slideAnimation.setValue(windowHeight);
      fadeAnimation.setValue(0);
    };
  }, []);
  
  // Scroll to selected book when modal opens
  useEffect(() => {
    if (booksListRef.current && selectedBook) {
      const index = ALL_BOOKS.findIndex(book => book === selectedBook);
      if (index !== -1) {
        setTimeout(() => {
          booksListRef.current?.scrollToIndex({
            index,
            animated: false,
            viewPosition: 0.3
          });
        }, 300);
      }
    }
  }, [selectedBook]);

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    Animated.parallel([
      Animated.timing(slideAnimation, {
        toValue: windowHeight,
        duration: 250,
        useNativeDriver: true,
        easing: Easing.in(Easing.cubic)
      }),
      Animated.timing(fadeAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true
      })
    ]).start(() => {
      onClose();
    });
  };

  const handleSelectBook = useCallback((book: string) => {
    Haptics.selectionAsync();
    setActiveBook(book);
    setSelectedView('chapters');
  }, []);

  const handleSelectChapter = useCallback((chapter: number) => {
    Haptics.selectionAsync();
    
    Animated.parallel([
      Animated.timing(slideAnimation, {
        toValue: windowHeight,
        duration: 250,
        useNativeDriver: true,
        easing: Easing.in(Easing.cubic)
      }),
      Animated.timing(fadeAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true
      })
    ]).start(() => {
      onSelectBookAndChapter(activeBook, chapter);
    });
  }, [activeBook, onSelectBookAndChapter]);

  const handleBackToBooks = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedView('books');
  };

  const renderBookItem = useCallback(({ item: book }: { item: string }) => {
    const isSelected = selectedBook === book;
    
    return (
      <Surface
        style={[
          styles.bookItem,
          { 
            backgroundColor: isSelected 
              ? customColors.highlight 
              : customColors.accentLight,
            borderColor: isSelected
              ? customColors.accent
              : customColors.border,
          }
        ]}
        elevation={isSelected ? 1 : 0}
      >
        <TouchableOpacity
          style={styles.bookItemTouchable}
          onPress={() => handleSelectBook(book)}
          accessibilityRole="button"
          accessibilityLabel={`${book}${isSelected ? ', selected' : ''}`}
          accessibilityHint="Select this book to view chapters"
          accessibilityState={{ selected: isSelected }}
        >
          <Text 
            style={[
              styles.bookText, 
              { 
                color: isSelected ? customColors.accent : customColors.text,
                fontWeight: isSelected ? '600' : '400'
              }
            ]}
            numberOfLines={1}
          >
            {book}
          </Text>
          {isSelected && (
            <IconButton 
              icon="chevron-right" 
              iconColor={customColors.accent}
              size={20}
              style={styles.selectedBookIcon}
            />
          )}
        </TouchableOpacity>
      </Surface>
    );
  }, [selectedBook, theme, handleSelectBook]);

  const renderChapters = () => {
    const chapterCount = getChapterCount(activeBook);
    const chapters = Array.from({ length: chapterCount }, (_, i) => i + 1);
    
    return (
      <View style={styles.chaptersView}>
        <Text style={[styles.chapterSectionTitle, { color: customColors.text }]}>
          Select a chapter
        </Text>
        <FlatList
          data={chapters}
          numColumns={4}
          keyExtractor={(item) => `chapter-${item}`}
          contentContainerStyle={styles.chaptersGrid}
          renderItem={({ item: chapter }) => {
            const isSelected = selectedBook === activeBook && selectedChapter === chapter;
            
            return (
              <Surface
                style={[
                  styles.chapterItem,
                  { 
                    backgroundColor: isSelected 
                      ? customColors.highlight 
                      : customColors.accentLight,
                    borderColor: isSelected
                      ? customColors.accent
                      : customColors.border,
                  }
                ]}
                elevation={isSelected ? 1 : 0}
              >
                <TouchableOpacity
                  style={styles.chapterItemTouchable}
                  onPress={() => handleSelectChapter(chapter)}
                  accessibilityRole="button"
                  accessibilityLabel={`Chapter ${chapter}${isSelected ? ', selected' : ''}`}
                  accessibilityHint="Select this chapter"
                  accessibilityState={{ selected: isSelected }}
                >
                  <Text 
                    style={[
                      styles.chapterText, 
                      { 
                        color: isSelected ? customColors.accent : customColors.text,
                        fontWeight: isSelected ? '600' : '400'
                      }
                    ]}
                  >
                    {chapter}
                  </Text>
                </TouchableOpacity>
              </Surface>
            );
          }}
        />
      </View>
    );
  };

  return (
    <>
      {/* Backdrop/overlay */}
      <Animated.View 
        style={[
          styles.backdrop,
          { 
            opacity: fadeAnimation, 
            backgroundColor: 'rgba(0,0,0,0.3)' 
          }
        ]}
      />
      
      {/* Modal content */}
      <StatusBar style={theme.dark ? "light" : "dark"} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
        pointerEvents="box-none"
      >
        <Animated.View 
          style={[
            styles.modalContainer, 
            { 
              backgroundColor: customColors.background,
              transform: [{ translateY: slideAnimation }],
              paddingTop: Platform.OS === 'ios' ? insets.top : RNStatusBar.currentHeight || 0,
              paddingBottom: Math.max(insets.bottom, 20), // Ensure padding at bottom
              paddingLeft: insets.left,
              paddingRight: insets.right,
            }
          ]}
        >
          {/* Header with back button for chapters view */}
          <View style={[styles.header, { borderBottomColor: customColors.border }]}>
            {selectedView === 'chapters' ? (
              <IconButton
                icon="arrow-left"
                size={24}
                onPress={handleBackToBooks}
                accessibilityLabel="Back to books"
                iconColor={customColors.accent}
              />
            ) : null}
            
            <Text style={[styles.headerTitle, { color: customColors.text }]}>
              {selectedView === 'books' 
                ? 'Select a Book' 
                : `${activeBook} - Select a Chapter`}
            </Text>
            
            <IconButton 
              icon="close"
              mode="contained"
              onPress={handleClose}
              size={24}
              style={styles.closeButton}
              iconColor={customColors.accentLight}
              containerColor={customColors.accent}
            />
          </View>

          {/* Search Bar (only shown in books view) */}
          {selectedView === 'books' && (
            <View style={styles.searchContainer}>
              <View 
                style={[
                  styles.searchBar, 
                  { 
                    backgroundColor: customColors.accentLight,
                    borderColor: customColors.border
                  }
                ]}
              >
                <IconButton
                  icon="magnify"
                  size={20}
                  style={styles.searchIcon}
                  iconColor={customColors.accent}
                />
                <TextInput
                  placeholder="Search books..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  style={[
                    styles.searchInput,
                    { color: customColors.text }
                  ]}
                  placeholderTextColor={customColors.border}
                  clearButtonMode="while-editing"
                />
              </View>
            </View>
          )}

          {/* Main content */}
          {selectedView === 'books' ? (
            <FlatList
              ref={booksListRef}
              data={filteredBooks}
              keyExtractor={(item) => `book-${item}`}
              renderItem={renderBookItem}
              contentContainerStyle={styles.listContent}
              initialNumToRender={15}
              windowSize={10}
              showsVerticalScrollIndicator={true}
              onScrollToIndexFailed={(info) => {
                console.warn('Failed to scroll to index', info);
              }}
            />
          ) : (
            renderChapters()
          )}
        </Animated.View>
      </KeyboardAvoidingView>
    </>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9998,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    elevation: 9999,
  },
  keyboardAvoidingView: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    elevation: 9999,
  },
  modalContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0, 0, 0, 0.2)',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
      },
      android: {
        elevation: 4,
      }
    })
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    flex: 1,
    marginLeft: 8,
    paddingHorizontal: 8,
  },
  closeButton: {
    margin: 0,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  searchIcon: {
    margin: 0,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    paddingRight: 16,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 100, // Extra padding at bottom
  },
  bookItem: {
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  bookItemTouchable: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookText: {
    fontSize: 18,
  },
  chaptersView: {
    flex: 1,
  },
  chaptersGrid: {
    padding: 16,
    paddingBottom: 100, // Extra padding at bottom
  },
  chapterItem: {
    borderRadius: 12,
    margin: 6,
    flex: 1,
    borderWidth: 1,
    overflow: 'hidden',
    aspectRatio: 1,
  },
  chapterItemTouchable: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  chapterText: {
    fontSize: 20,
    fontWeight: '500',
  },
  selectedBookIcon: {
    margin: 0,
    marginLeft: 8,
  },
  chapterSectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 16,
    marginTop: 8,
    marginBottom: 4,
  },
});

export default BibleSelectionModal; 