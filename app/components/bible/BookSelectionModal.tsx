import React from 'react';
import { View, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { Text, IconButton, Surface, Divider, useTheme } from 'react-native-paper';
import { BIBLE_BOOKS } from '../../constants';

interface BookSelectionModalProps {
  selectedBook: string;
  onBookSelect: (book: string) => void;
  onClose: () => void;
}

const BookSelectionModal: React.FC<BookSelectionModalProps> = ({
  selectedBook,
  onBookSelect,
  onClose,
}) => {
  const theme = useTheme();

  return (
    <Surface style={[styles.selectionModal, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.selectionHeader}>
        <Text style={[styles.selectionTitle, { color: theme.colors.primary }]}>Select Book</Text>
        <IconButton 
          icon="close" 
          size={24} 
          onPress={onClose} 
          iconColor={theme.colors.primary}
        />
      </View>
      <Divider />
      <FlatList
        data={BIBLE_BOOKS}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.selectionItem,
              selectedBook === item && { backgroundColor: theme.colors.primaryContainer }
            ]}
            onPress={() => {
              onBookSelect(item);
            }}
          >
            <Text style={{ 
              color: selectedBook === item ? theme.colors.primary : theme.colors.onSurface,
              fontWeight: selectedBook === item ? '700' : '400'
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
  selectionItem: {
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
});

export default BookSelectionModal; 