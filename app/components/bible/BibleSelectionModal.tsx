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
  Modal,
  ActivityIndicator
} from 'react-native';
import { Text, IconButton, useTheme, Surface } from 'react-native-paper';
import { getChapterCount } from '../../constants/BibleContent';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as BibleApiService from '../../utils/bibleApiService';

interface BibleSelectionModalProps {
  isVisible: boolean;
  currentBook: string;
  currentChapter: number;
  onSelectBookAndChapter: (book: string, chapter: number) => void;
  onClose: () => void;
}

interface BibleBook {
  id: string;
  name: string;
  testament: 'OT' | 'NT';
}

const BibleSelectionModal: React.FC<BibleSelectionModalProps> = ({
  isVisible,
  currentBook,
  currentChapter,
  onSelectBookAndChapter,
  onClose,
}) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedView, setSelectedView] = useState<'books' | 'chapters'>('books');
  const [activeBook, setActiveBook] = useState(currentBook);
  const [books, setBooks] = useState<BibleBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chaptersList, setChaptersList] = useState<number[]>([]);
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

  // Load books from API
  const loadBooks = async () => {
    try {
      setLoading(true);
      setError(null);
      const bibleBooks = await BibleApiService.getBibleBooks();
      
      if (bibleBooks && bibleBooks.length > 0) {
        setBooks(bibleBooks);
      } else {
        throw new Error('No Bible books found');
      }
    } catch (err) {
      console.error('Error loading Bible books:', err);
      setError('Unable to load Bible books. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  // Load book chapters when a book is selected
  const loadChapters = useCallback(async (bookId: string) => {
    try {
      setLoading(true);
      const chapters = await BibleApiService.getBookChapters(bookId);
      const chapterNumbers = chapters.map(chapter => parseInt(chapter.number));
      setChaptersList(chapterNumbers);
    } catch (err) {
      console.error('Error loading chapters:', err);
      setError('Unable to load chapters. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Load books when component mounts or becomes visible
  useEffect(() => {
    if (isVisible) {
      loadBooks();
      // Reset view to books when modal opens
      setSelectedView('books');
      // Reset animation values
      slideAnimation.setValue(windowHeight);
      fadeAnimation.setValue(0);
      
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
    }
  }, [isVisible]);
  
  // Scroll to selected book when modal opens
  useEffect(() => {
    if (isVisible && booksListRef.current && currentBook && books.length > 0) {
      const index = books.findIndex(book => book.name === currentBook);
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
  }, [currentBook, books, isVisible]);

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  const handleSelectBook = useCallback((book: BibleBook) => {
    Haptics.selectionAsync();
    setActiveBook(book.name);
    loadChapters(book.id);
    setSelectedView('chapters');
  }, [loadChapters]);

  const handleSelectChapter = useCallback((chapter: number) => {
    Haptics.selectionAsync();
    onSelectBookAndChapter(activeBook, chapter);
  }, [activeBook, onSelectBookAndChapter]);

  const handleBackToBooks = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedView('books');
  };

  // Filtered books based on search
  const filteredBooks = searchQuery
    ? books.filter(book => book.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : books;

  const renderBookItem = useCallback(({ item: book }: { item: BibleBook }) => {
    const isSelected = currentBook === book.name;
    
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
          accessibilityLabel={`${book.name}${isSelected ? ', selected' : ''}`}
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
            {book.name}
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
  }, [currentBook, handleSelectBook]);

  const renderChapters = () => {
    return (
      <View style={styles.chaptersView}>
        <Text style={[styles.chapterSectionTitle, { color: customColors.text }]}>
          Select a chapter
        </Text>
        <FlatList
          data={chaptersList}
          numColumns={4}
          keyExtractor={(item) => `chapter-${item}`}
          contentContainerStyle={styles.chaptersGrid}
          renderItem={({ item: chapter }) => {
            const isSelected = currentBook === activeBook && currentChapter === chapter;
            
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
                        fontWeight: isSelected ? '600' : '500'
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
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <StatusBar style="light" />
      <View style={styles.modalOverlay}>
        <View 
          style={[
            styles.modalContent,
            { backgroundColor: customColors.background }
          ]}
        >
          {/* Header with back button for chapters view */}
          <View 
            style={[
              styles.header, 
              { 
                borderBottomColor: customColors.border,
                paddingTop: insets.top || RNStatusBar.currentHeight || 0,
              }
            ]}
          >
            {selectedView === 'chapters' ? (
              <IconButton
                icon="arrow-left"
                size={24}
                onPress={handleBackToBooks}
                accessibilityLabel="Back to books"
                iconColor={customColors.accent}
              />
            ) : (
              <View style={{ width: 40 }} /> /* Empty space for alignment */
            )}
            
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

          {/* Main content with loading state */}
          <View style={styles.contentContainer}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={customColors.accent} />
                <Text style={{ color: customColors.text, marginTop: 16 }}>
                  Loading {selectedView === 'books' ? 'Bible books' : 'chapters'}...
                </Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Text style={{ color: customColors.text, marginBottom: 16 }}>
                  {error}
                </Text>
                <TouchableOpacity 
                  style={[styles.retryButton, { backgroundColor: customColors.accent }]}
                  onPress={selectedView === 'books' ? loadBooks : () => {
                    const selectedBook = books.find(book => book.name === activeBook);
                    if (selectedBook) loadChapters(selectedBook.id);
                  }}
                >
                  <Text style={{ color: customColors.accentLight }}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : (
              selectedView === 'books' ? (
                <FlatList
                  ref={booksListRef}
                  data={filteredBooks}
                  keyExtractor={(item) => `book-${item.id}`}
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
              )
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    flex: 1,
    width: '100%',
    height: '100%',
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0, 0, 0, 0.3)',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
      },
      android: {
        elevation: 24,
      }
    })
  },
  contentContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
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
    paddingBottom: 120, // Extra padding at bottom
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
    paddingBottom: 120, // Extra padding at bottom
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
});

export default BibleSelectionModal; 