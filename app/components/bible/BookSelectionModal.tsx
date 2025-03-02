import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  SectionList, 
  SafeAreaView, 
  Pressable, 
  Animated, 
  Easing,
  Platform,
  Dimensions,
  SectionListData
} from 'react-native';
import { Text, IconButton, Surface, useTheme } from 'react-native-paper';
import { OT_BOOKS, NT_BOOKS } from '../../utils/bibleDataUtils';
import { BIBLE_BOOKS } from '../../constants';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';

interface BookSelectionModalProps {
  selectedBook: string;
  onBookSelect: (book: string) => void;
  onClose: () => void;
}

// Group books by sections (Old and New Testament)
const BOOKS_BY_SECTION = [
  {
    title: 'Old Testament',
    data: OT_BOOKS
  },
  {
    title: 'New Testament',
    data: NT_BOOKS
  }
];

// For alphabetical view
const ALPHABETICAL_SECTIONS = (() => {
  // Get all unique first letters
  const firstLetters = [...new Set(BIBLE_BOOKS.map(book => book[0]))].sort();
  
  // Create sections by first letter
  return firstLetters.map(letter => ({
    title: letter,
    data: BIBLE_BOOKS.filter(book => book[0] === letter)
  }));
})();

// Define proper section type
interface BookSection {
  title: string;
  data: string[];
}

const BookSelectionModal: React.FC<BookSelectionModalProps> = ({
  selectedBook,
  onBookSelect,
  onClose,
}) => {
  const theme = useTheme();
  const [viewMode, setViewMode] = useState<'traditional' | 'alphabetical'>('traditional');
  const [expandedSections, setExpandedSections] = useState<string[]>(['Old Testament', 'New Testament']);
  const sectionListRef = useRef<SectionList<string, BookSection>>(null);
  const { height: windowHeight } = Dimensions.get('window');
  
  // Animation values
  const slideAnimation = useRef(new Animated.Value(windowHeight)).current;
  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const tabBarAnimation = useRef(new Animated.Value(0)).current;
  
  // Animation for section expansion/collapse
  const sectionAnimations = useRef<{[key: string]: Animated.Value}>({}).current;
  
  // Initialize section animations
  useEffect(() => {
    const sections = viewMode === 'traditional' 
      ? ['Old Testament', 'New Testament'] 
      : ALPHABETICAL_SECTIONS.map(section => section.title);
      
    sections.forEach(title => {
      if (!sectionAnimations[title]) {
        sectionAnimations[title] = new Animated.Value(expandedSections.includes(title) ? 1 : 0);
      }
    });
  }, [viewMode, expandedSections]);

  // Reset expanded sections when view mode changes
  useEffect(() => {
    if (viewMode === 'traditional') {
      setExpandedSections(['Old Testament', 'New Testament']);
    } else {
      // For alphabetical view, expand all sections initially
      const allLetters = ALPHABETICAL_SECTIONS.map(section => section.title);
      setExpandedSections(allLetters);
    }
    
    // Animate tab switch
    Animated.timing(tabBarAnimation, {
      toValue: viewMode === 'traditional' ? 0 : 1,
      duration: 250,
      useNativeDriver: false,
      easing: Easing.out(Easing.cubic)
    }).start();
    
    // Scroll to top on tab change
    if (sectionListRef.current) {
      sectionListRef.current.scrollToLocation({
        sectionIndex: 0,
        itemIndex: 0,
        animated: true
      });
    }
  }, [viewMode]);

  // Entry animation
  useEffect(() => {
    // Run entrance animation
    Animated.parallel([
      Animated.timing(slideAnimation, {
        toValue: 0,
        duration: 300,
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
  
  const handleClose = () => {
    // Run exit animation
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

  const toggleSection = useCallback((section: string) => {
    // Provide haptic feedback
    Haptics.selectionAsync();
    
    // Animate section expansion/collapse
    Animated.timing(sectionAnimations[section], {
      toValue: expandedSections.includes(section) ? 0 : 1,
      duration: 300,
      useNativeDriver: false,
      easing: Easing.inOut(Easing.cubic)
    }).start();
    
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section) 
        : [...prev, section]
    );
  }, [expandedSections, sectionAnimations]);

  const handleBookSelect = useCallback((book: string) => {
    // Provide haptic feedback
    Haptics.selectionAsync();
    
    // Animate exit
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
      onBookSelect(book);
    });
  }, [onBookSelect]);

  const renderSectionHeader = useCallback(({ section }: { section: SectionListData<string, BookSection> }) => {
    const title = section.title;
    
    // Create animation if it doesn't exist
    if (!sectionAnimations[title]) {
      sectionAnimations[title] = new Animated.Value(expandedSections.includes(title) ? 1 : 0);
    }
    
    const iconRotation = sectionAnimations[title].interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '90deg']
    });
    
    return (
      <TouchableOpacity 
        style={[
          styles.sectionHeader,
          { backgroundColor: theme.colors.surfaceVariant }
        ]}
        onPress={() => toggleSection(title)}
        accessibilityRole="button"
        accessibilityLabel={`${title}, ${expandedSections.includes(title) ? 'expanded' : 'collapsed'}`}
        accessibilityHint="Double tap to expand or collapse this section"
      >
        <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
          {title}
        </Text>
        <Animated.View style={{ transform: [{ rotate: iconRotation }] }}>
          <IconButton 
            icon="chevron-right"
            size={24} 
            iconColor={theme.colors.onSurface}
          />
        </Animated.View>
      </TouchableOpacity>
    );
  }, [expandedSections, theme.colors, toggleSection, sectionAnimations]);

  const renderItem = useCallback(({ item, section }: { item: string; section: SectionListData<string, BookSection> }) => {
    if (!expandedSections.includes(section.title)) return null;
    
    const isSelected = selectedBook === item;
    
    return (
      <TouchableOpacity
        style={[
          styles.bookItem,
          isSelected && { 
            backgroundColor: theme.colors.primaryContainer,
            borderLeftWidth: 4,
            borderLeftColor: theme.colors.primary
          }
        ]}
        onPress={() => handleBookSelect(item)}
        accessibilityRole="button"
        accessibilityLabel={`${item}${isSelected ? ', selected' : ''}`}
        accessibilityHint="Double tap to select this book"
        accessibilityState={{ selected: isSelected }}
      >
        <Text 
          style={[
            styles.bookText, 
            { 
              color: isSelected ? theme.colors.primary : theme.colors.onSurface,
              fontWeight: isSelected ? '600' : '400'
            }
          ]}
        >
          {item}
        </Text>
        {isSelected && (
          <IconButton 
            icon="check" 
            size={20} 
            iconColor={theme.colors.primary}
            style={styles.checkIcon}
          />
        )}
      </TouchableOpacity>
    );
  }, [selectedBook, theme.colors, handleBookSelect, expandedSections]);

  // Interpolate tab indicator position
  const tabIndicatorPosition = tabBarAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '50%'] 
  });

  return (
    <Animated.View 
      style={[
        styles.overlay,
        {
          opacity: fadeAnimation,
          backgroundColor: 'rgba(0,0,0,0.5)'
        }
      ]}
    >
      <Animated.View 
        style={[
          styles.modalContainer, 
          { 
            backgroundColor: theme.colors.background,
            transform: [{ translateY: slideAnimation }] 
          }
        ]}
      >
        <StatusBar style={theme.dark ? "light" : "dark"} />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity 
              onPress={handleClose}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
              accessibilityHint="Double tap to close book selection"
            >
              <Text style={[styles.cancelButton, { color: theme.colors.primary }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>Books</Text>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="History"
              accessibilityHint="Double tap to view reading history"
            >
              <Text style={[styles.historyButton, { color: theme.colors.primary }]}>History</Text>
            </TouchableOpacity>
          </View>

          <SectionList
            ref={sectionListRef}
            sections={viewMode === 'traditional' ? BOOKS_BY_SECTION : ALPHABETICAL_SECTIONS}
            keyExtractor={(item) => item}
            renderItem={renderItem}
            renderSectionHeader={renderSectionHeader}
            stickySectionHeadersEnabled={true}
            style={styles.bookList}
            initialNumToRender={20}
            maxToRenderPerBatch={20}
            windowSize={10}
            getItemLayout={(data, index) => (
              {length: 56, offset: 56 * index, index}
            )}
            keyboardShouldPersistTaps="handled"
          />

          <Surface style={[styles.tabContainer, { backgroundColor: theme.colors.surfaceVariant }]} elevation={2}>
            <Animated.View 
              style={[
                styles.tabIndicator, 
                {
                  backgroundColor: theme.colors.surface,
                  left: tabIndicatorPosition,
                  ...Platform.select({
                    ios: {
                      shadowColor: 'rgba(0, 0, 0, 0.3)',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.3,
                      shadowRadius: 3,
                    },
                    android: {
                      elevation: 4,
                    }
                  })
                }
              ]} 
            />
            <Pressable 
              style={styles.tab}
              onPress={() => {
                if (viewMode !== 'traditional') {
                  Haptics.selectionAsync();
                  setViewMode('traditional');
                }
              }}
              accessibilityRole="tab"
              accessibilityLabel="Traditional view"
              accessibilityState={{ selected: viewMode === 'traditional' }}
            >
              <Text style={[
                styles.tabText,
                viewMode === 'traditional' && { color: theme.colors.primary, fontWeight: '600' }
              ]}>
                Traditional
              </Text>
            </Pressable>
            <Pressable 
              style={styles.tab}
              onPress={() => {
                if (viewMode !== 'alphabetical') {
                  Haptics.selectionAsync();
                  setViewMode('alphabetical');
                }
              }}
              accessibilityRole="tab"
              accessibilityLabel="Alphabetical view"
              accessibilityState={{ selected: viewMode === 'alphabetical' }}
            >
              <Text style={[
                styles.tabText,
                viewMode === 'alphabetical' && { color: theme.colors.primary, fontWeight: '600' }
              ]}>
                Alphabetical
              </Text>
            </Pressable>
          </Surface>
        </SafeAreaView>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0, 0, 0, 0.3)',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.4,
        shadowRadius: 5,
      },
      android: {
        elevation: 8,
      }
    })
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  cancelButton: {
    fontSize: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  historyButton: {
    fontSize: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  bookList: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  bookItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    minHeight: 56,
  },
  bookText: {
    fontSize: 18,
  },
  checkIcon: {
    margin: 0,
  },
  tabContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    position: 'relative',
    height: 60,
  },
  tabIndicator: {
    position: 'absolute',
    width: '50%',
    height: '80%',
    borderRadius: 8,
    top: '10%',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    zIndex: 1,
    height: '100%',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 16,
    color: 'rgba(0, 0, 0, 0.6)',
  },
});

export default BookSelectionModal; 