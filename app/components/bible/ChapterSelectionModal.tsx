import React, { useEffect, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  SafeAreaView, 
  Dimensions, 
  Animated, 
  Easing,
  Platform
} from 'react-native';
import { Text, IconButton, useTheme } from 'react-native-paper';
import { getChapterCount } from '../../constants/BibleContent';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';

interface ChapterSelectionModalProps {
  selectedBook: string;
  selectedChapter: number;
  onChapterSelect: (chapter: number) => void;
  onClose: () => void;
}

const ChapterSelectionModal: React.FC<ChapterSelectionModalProps> = ({
  selectedBook,
  selectedChapter,
  onChapterSelect,
  onClose,
}) => {
  const theme = useTheme();
  const windowWidth = Dimensions.get('window').width;
  const windowHeight = Dimensions.get('window').height;
  const ITEMS_PER_ROW = 5;
  const ITEM_MARGIN = 8;
  const itemWidth = (windowWidth - (ITEMS_PER_ROW + 1) * ITEM_MARGIN * 2) / ITEMS_PER_ROW;
  
  // Animation values
  const slideAnimation = useRef(new Animated.Value(windowHeight)).current;
  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);

  // Generate array of chapters for the selected book
  const chapters = Array.from({ length: getChapterCount(selectedBook) }, (_, i) => i + 1);
  
  // Entry animation
  useEffect(() => {
    // Scroll to show the selected chapter
    setTimeout(() => {
      if (flatListRef.current && selectedChapter > 1) {
        const rowIndex = Math.floor((selectedChapter - 1) / ITEMS_PER_ROW);
        flatListRef.current.scrollToOffset({
          offset: rowIndex * (itemWidth + ITEM_MARGIN * 2),
          animated: false
        });
      }
    }, 300);
    
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

  const handleChapterSelect = (chapter: number) => {
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
      onChapterSelect(chapter);
    });
  };

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
              accessibilityHint="Double tap to close chapter selection"
            >
              <Text style={[styles.cancelButton, { color: theme.colors.primary }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>{selectedBook}</Text>
            <View style={styles.spacer} />
          </View>

          <FlatList
            ref={flatListRef}
            data={chapters}
            keyExtractor={(item) => item.toString()}
            numColumns={ITEMS_PER_ROW}
            contentContainerStyle={styles.chaptersContainer}
            columnWrapperStyle={styles.row}
            initialNumToRender={20}
            maxToRenderPerBatch={20}
            windowSize={10}
            renderItem={({ item }) => {
              const isSelected = selectedChapter === item;
              
              // Platform-specific styles for selected items
              const selectedItemShadow = Platform.OS === 'ios' && isSelected ? {
                shadowColor: theme.colors.primary,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.5,
                shadowRadius: 3,
              } : {};
              
              const selectedItemElevation = Platform.OS === 'android' && isSelected ? {
                elevation: 4
              } : {};
              
              return (
                <TouchableOpacity
                  style={[
                    styles.chapterItem,
                    { 
                      width: itemWidth, 
                      height: itemWidth,
                      backgroundColor: isSelected 
                        ? theme.colors.primary 
                        : theme.colors.surfaceVariant,
                    },
                    selectedItemShadow,
                    selectedItemElevation
                  ]}
                  onPress={() => handleChapterSelect(item)}
                  accessibilityRole="button"
                  accessibilityLabel={`Chapter ${item}${isSelected ? ', selected' : ''}`}
                  accessibilityHint="Double tap to select this chapter"
                  accessibilityState={{ selected: isSelected }}
                >
                  <Text 
                    style={[
                      styles.chapterText, 
                      { 
                        color: isSelected 
                          ? theme.colors.onPrimary 
                          : theme.colors.onSurface,
                        fontWeight: isSelected ? '600' : '400'
                      }
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
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
  spacer: {
    width: 50,
  },
  chaptersContainer: {
    padding: 16,
  },
  row: {
    justifyContent: 'flex-start',
    marginBottom: 16,
  },
  chapterItem: {
    margin: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    aspectRatio: 1,
  },
  chapterText: {
    fontSize: 18,
    fontWeight: '500',
  },
});

export default ChapterSelectionModal; 