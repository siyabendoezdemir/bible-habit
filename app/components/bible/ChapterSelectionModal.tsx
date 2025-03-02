import React from 'react';
import { View, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { Text, IconButton, Surface, Divider, useTheme } from 'react-native-paper';
import { getChapterCount } from '../../constants/BibleContent';

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
  const chapters = Array.from({ length: getChapterCount(selectedBook) }, (_, i) => i + 1);

  return (
    <Surface style={[styles.selectionModal, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.selectionHeader}>
        <Text style={[styles.selectionTitle, { color: theme.colors.primary }]}>Select Chapter</Text>
        <IconButton 
          icon="close" 
          size={24} 
          onPress={onClose} 
          iconColor={theme.colors.primary}
        />
      </View>
      <Divider />
      <FlatList
        data={chapters}
        numColumns={5}
        keyExtractor={(item) => item.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.chapterItem,
              selectedChapter === item && { backgroundColor: theme.colors.primaryContainer }
            ]}
            onPress={() => {
              onChapterSelect(item);
            }}
          >
            <Text style={{ 
              color: selectedChapter === item ? theme.colors.primary : theme.colors.onSurface,
              fontWeight: selectedChapter === item ? '700' : '400'
            }}>
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />
    </Surface>
  );
};

const styles = StyleSheet.create({
  selectionModal: {
    position: 'absolute',
    top: 80,
    left: 20,
    right: 20,
    maxHeight: '70%',
    borderRadius: 12,
    elevation: 5,
    shadowColor: 'rgba(0, 0, 0, 0.3)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    zIndex: 100,
  },
  selectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  selectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  chapterItem: {
    width: '20%',
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ChapterSelectionModal; 