import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, IconButton, useTheme } from 'react-native-paper';
import * as BibleApiService from '../../utils/bibleApiService';

interface BibleHeaderProps {
  selectedBook: string;
  selectedChapter: number;
  onBookSelect: () => void;
  onSettingsOpen: () => void;
  onVersionSelect?: () => void;
}

const BibleHeader: React.FC<BibleHeaderProps> = ({
  selectedBook,
  selectedChapter,
  onBookSelect,
  onSettingsOpen,
  onVersionSelect,
}) => {
  const theme = useTheme();
  const [bibleVersion, setBibleVersion] = useState<string>('');
  const [versionName, setVersionName] = useState<string>('');

  // Fetch the current Bible version
  const fetchVersion = useCallback(async () => {
    try {
      const version = await BibleApiService.getPreferredVersion();
      console.log(`BibleHeader: Current version is ${version}`);
      setBibleVersion(version);
      
      // Get the full version name if possible
      const versions = await BibleApiService.getAvailableBibles();
      console.log(`BibleHeader: Fetched ${versions.length} Bible versions`);
      
      const versionDetails = versions.find(v => v.id === version);
      if (versionDetails) {
        console.log(`BibleHeader: Found version details for ${version}: ${versionDetails.name}`);
        // Use shortName if available, otherwise fall back to name
        if (versionDetails.shortName) {
          console.log(`BibleHeader: Using shortName: ${versionDetails.shortName}`);
          setVersionName(versionDetails.shortName);
        } else {
          console.log(`BibleHeader: No shortName found, using full name: ${versionDetails.name}`);
          setVersionName(versionDetails.name);
        }
      } else {
        console.log(`BibleHeader: No version details found for ${version}, using ID as name`);
        setVersionName(version.toUpperCase());
      }
    } catch (error) {
      console.error('Error fetching Bible version:', error);
      setBibleVersion('KJV');
      setVersionName('KJV');
    }
  }, []);

  // Fetch the current Bible version on component mount
  useEffect(() => {
    fetchVersion();
    
    // Set up an event listener for AsyncStorage changes
    const intervalId = setInterval(fetchVersion, 2000);
    
    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [fetchVersion]);

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
          {onVersionSelect && (
            <TouchableOpacity 
              style={styles.versionSelector}
              onPress={onVersionSelect}
            >
              <Text style={[styles.versionText, { color: theme.colors.primary }]}>
                {versionName || bibleVersion.toUpperCase()}
              </Text>
            </TouchableOpacity>
          )}
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
  versionSelector: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    marginRight: 8,
  },
  versionText: {
    fontSize: 12,
    fontWeight: '700',
  },
});

export default BibleHeader; 