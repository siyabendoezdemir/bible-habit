import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, IconButton, useTheme } from 'react-native-paper';

interface BibleHeaderProps {
  selectedBook: string;
  selectedChapter: number;
  onBookSelect: () => void;
  onSettingsOpen: () => void;
}

const BibleHeader: React.FC<BibleHeaderProps> = ({
  selectedBook,
  selectedChapter,
  onBookSelect,
  onSettingsOpen,
}) => {
  const theme = useTheme();

  return (
    <View style={[styles.header, { backgroundColor: theme.colors.background }]}>
      <View style={styles.headerContent}>
        <TouchableOpacity 
          style={styles.bookSelector}
          onPress={onBookSelect}
        >
          <Text style={[styles.bookTitle, { color: theme.colors.onSurface }]}>
            {selectedBook} {selectedChapter}
          </Text>
          <IconButton 
            icon="chevron-down" 
            size={20} 
            iconColor={theme.colors.onSurface} 
            style={styles.selectorIcon} 
          />
        </TouchableOpacity>
        
        <View style={styles.headerActions}>
          <IconButton 
            icon="volume-high" 
            size={24} 
            iconColor={theme.colors.onSurface} 
            onPress={() => {}} 
          />
          <IconButton 
            icon="magnify" 
            size={24} 
            iconColor={theme.colors.onSurface} 
            onPress={() => {}} 
          />
          <IconButton 
            icon="dots-horizontal" 
            size={24} 
            iconColor={theme.colors.onSurface} 
            onPress={onSettingsOpen} 
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    elevation: 0,
    shadowOpacity: 0,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bookSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  bookTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  selectorIcon: {
    margin: 0,
    padding: 0,
  },
});

export default BibleHeader; 