import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList,
  Animated, 
  Dimensions,
  TextInput,
  Modal,
  ActivityIndicator,
  Platform,
  SectionList,
  KeyboardAvoidingView,
  ScrollView
} from 'react-native';
import { Text, IconButton, useTheme, Surface, Chip, Divider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as BibleApiService from '../../utils/bibleApiService';

interface BibleVersionModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSelectVersion: (version: string) => void;
}

// Extended Bible version interface with additional info
interface BibleVersion {
  id: string;
  name: string;
  language: string;
  languageName: string;
  description?: string;
  shortName?: string;
}

// For sectioned list data
interface SectionData {
  title: string;
  data: BibleVersion[];
}

const BibleVersionModal: React.FC<BibleVersionModalProps> = ({
  isVisible,
  onClose,
  onSelectVersion,
}) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [versions, setVersions] = useState<BibleVersion[]>([]);
  const [filteredVersions, setFilteredVersions] = useState<BibleVersion[]>([]);
  const [sectionedVersions, setSectionedVersions] = useState<SectionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentVersion, setCurrentVersion] = useState<string>('');
  const { height: windowHeight } = Dimensions.get('window');
  const [activeLanguageFilter, setActiveLanguageFilter] = useState<string | null>(null);
  const [languages, setLanguages] = useState<string[]>([]);
  const [showSectionedList, setShowSectionedList] = useState(true);
  
  // Paper-like appearance colors
  const paperColors = {
    background: '#F8F5E6', // Cream paper color
    surface: '#FFFEF0',    // Slightly lighter cream for surface elements
    card: '#F9F5E8',       // Card background
    selected: '#F2ECD9',   // Selected item background
    text: '#5D4037',       // Dark brown text
    secondaryText: '#8D6E63', // Medium brown text
    border: '#E0D9C5',     // Light tan border
    shadow: 'rgba(0, 0, 0, 0.1)', // Subtle shadow
    primaryAccent: '#9C6B30' // Brown accent color
  };
  
  // Animation values
  const slideAnimation = useRef(new Animated.Value(windowHeight)).current;
  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const searchInputRef = useRef<TextInput>(null);

  // Load Bible versions and current selected version
  useEffect(() => {
    // Only load data when the modal is visible
    if (!isVisible) return;
    
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get the currently selected version
        const preferredVersion = await BibleApiService.getPreferredVersion();
        setCurrentVersion(preferredVersion);
        console.log(`Current preferred version: ${preferredVersion}`);
        
        // Clear the versions cache to ensure we get fresh data
        await BibleApiService.clearVersionsCache();
        
        console.log('BibleVersionModal: Fetching available Bible versions from new endpoint');
        try {
          // Get all available versions
          const availableVersions = await BibleApiService.getAvailableBibles();
          console.log(`BibleVersionModal: Fetched ${availableVersions.length} Bible versions`);
          
          // Only update state if the modal is still visible
          if (isVisible) {
            if (availableVersions.length === 0) {
              console.error('BibleVersionModal: No Bible versions returned from API');
              setError('No Bible versions available. Please check your internet connection and try again.');
            } else {
              console.log('BibleVersionModal: Setting versions in state');
              setVersions(availableVersions);
              
              // Extract unique languages and sort them
              const uniqueLanguages = Array.from(new Set(
                availableVersions.map(version => version.languageName)
              )).sort();
              console.log(`BibleVersionModal: Found ${uniqueLanguages.length} unique languages`);
              setLanguages(uniqueLanguages);
              
              // Process versions initially
              processVersions(availableVersions, activeLanguageFilter, searchQuery);
            }
          }
        } catch (error: any) {
          console.error('BibleVersionModal: Error fetching Bible versions:', error);
          setError(`Failed to load Bible versions: ${error.message || 'Unknown error'}`);
          
          // Use fallback versions from the default list
          console.log('BibleVersionModal: Using fallback versions');
          
          // Create a minimal set of fallback versions
          const fallbackVersions: BibleVersion[] = [
            { id: 'eng-kjv', name: 'King James Version', language: 'eng', languageName: 'English', description: 'KJV - English' },
            { id: 'eng-web', name: 'World English Bible', language: 'eng', languageName: 'English', description: 'WEB - English' },
            { id: 'deu-luth1545', name: 'Luther Bible 1545', language: 'deu', languageName: 'German', description: 'LUTH1545 - German' }
          ];
          
          if (fallbackVersions.length > 0) {
            console.log(`BibleVersionModal: Using ${fallbackVersions.length} fallback versions`);
            setVersions(fallbackVersions);
            
            // Extract unique languages and sort them
            const uniqueLanguages = Array.from(new Set(
              fallbackVersions.map(version => version.languageName)
            )).sort();
            setLanguages(uniqueLanguages);
            
            // Process versions initially
            processVersions(fallbackVersions, activeLanguageFilter, searchQuery);
          }
        }
        
        setLoading(false);
      } catch (error: any) {
        console.error('BibleVersionModal: Error in loadData:', error);
        setError(`Failed to load Bible versions: ${error.message || 'Unknown error'}`);
        setLoading(false);
      }
    };
    
    loadData();
    startAnimations();
  }, [isVisible]);
  
  // Process versions based on filters
  const processVersions = useCallback((allVersions: BibleVersion[], languageFilter: string | null, query: string) => {
    console.log(`Processing ${allVersions.length} versions with language filter: ${languageFilter || 'none'} and query: ${query || 'none'}`);
    
    let filtered = allVersions;
    if (query.trim() !== '') {
      const lowercaseQuery = query.toLowerCase();
      filtered = allVersions.filter(
        version => 
          version.name.toLowerCase().includes(lowercaseQuery) || 
          version.id.toLowerCase().includes(lowercaseQuery) || 
          version.languageName.toLowerCase().includes(lowercaseQuery) ||
          (version.description || '').toLowerCase().includes(lowercaseQuery)
      );
      console.log(`Found ${filtered.length} versions matching query: ${query}`);
      // When searching, always show flat list
      setShowSectionedList(false);
      setFilteredVersions(filtered);
      return;
    }
    
    // Apply language filter if active
    if (languageFilter) {
      filtered = allVersions.filter(version => version.languageName === languageFilter);
      console.log(`Found ${filtered.length} versions for language: ${languageFilter}`);
      // When filtering by language, show flat list
      setShowSectionedList(false);
      setFilteredVersions(filtered);
      return;
    }
    
    // Otherwise organize by language sections
    const sectionMap = new Map<string, BibleVersion[]>();
    
    // Group versions by language
    filtered.forEach(version => {
      const languageName = version.languageName || 'Unknown';
      if (!sectionMap.has(languageName)) {
        sectionMap.set(languageName, []);
      }
      sectionMap.get(languageName)!.push(version);
    });
    
    // Convert map to array and sort sections alphabetically
    const sections: SectionData[] = Array.from(sectionMap.entries())
      .map(([title, data]) => ({
        title,
        data: data.sort((a, b) => a.name.localeCompare(b.name))
      }))
      .sort((a, b) => {
        // Prioritize English and German sections
        if (a.title === 'English') return -1;
        if (b.title === 'English') return 1;
        if (a.title === 'German') return -1;
        if (b.title === 'German') return 1;
        return a.title.localeCompare(b.title);
      });
    
    console.log(`Created ${sections.length} language sections`);
    
    // Update state
    setSectionedVersions(sections);
    setFilteredVersions(filtered); // Also update filtered versions for consistency
    setShowSectionedList(true);
  }, []);
  
  // Handle search query and language filter changes
  useEffect(() => {
    if (versions.length > 0) {
      processVersions(versions, activeLanguageFilter, searchQuery);
    }
  }, [searchQuery, activeLanguageFilter, versions, processVersions]);
  
  // Handle language filter changes
  const handleLanguageFilter = (language: string | null) => {
    // Toggle off if clicking the same filter
    if (activeLanguageFilter === language) {
      setActiveLanguageFilter(null);
    } else {
      setActiveLanguageFilter(language);
      // When setting a language filter, clear the search
      setSearchQuery('');
    }
  };
  
  // Animation functions
  const startAnimations = () => {
    // Reset animations to initial values
    slideAnimation.setValue(windowHeight);
    fadeAnimation.setValue(0);
    
    // Start animations
    Animated.parallel([
      Animated.timing(slideAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };
  
  const closeWithAnimation = (callback?: () => void) => {
    Animated.parallel([
      Animated.timing(slideAnimation, {
        toValue: windowHeight,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (callback) callback();
    });
  };
  
  const handleClose = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    closeWithAnimation(onClose);
  };
  
  const handleSelectVersion = (version: BibleVersion) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    console.log(`BibleVersionModal: Selected version ${version.id} (${version.name})`);
    
    // Update the current version state immediately for better UX
    setCurrentVersion(version.id);
    
    // Call the parent component's handler
    onSelectVersion(version.id);
    
    // Close the modal with animation
    closeWithAnimation(onClose);
  };
  
  // Clear search and filters
  const handleClearSearch = () => {
    setSearchQuery('');
    setActiveLanguageFilter(null);
    processVersions(versions, null, '');
    searchInputRef.current?.blur();
  };
  
  // Render item for the flat list
  const renderVersionItem = ({ item }: { item: BibleVersion }) => (
    <TouchableOpacity
      style={[
        styles.versionItem,
        { backgroundColor: paperColors.card },
        currentVersion === item.id && { 
          backgroundColor: paperColors.selected,
          borderLeftWidth: 4,
          borderLeftColor: paperColors.primaryAccent
        }
      ]}
      onPress={() => handleSelectVersion(item)}
    >
      <View style={styles.versionInfo}>
        <Text 
          style={[
            styles.versionName, 
            { color: paperColors.text }
          ]}
        >
          {item.shortName ? `${item.shortName} - ${item.name}` : item.name}
        </Text>
        <Text 
          style={[
            styles.versionId, 
            { color: paperColors.secondaryText }
          ]}
        >
          {item.id} • {item.languageName}
        </Text>
        {item.description && (
          <Text 
            style={[
              styles.versionDescription, 
              { color: paperColors.secondaryText }
            ]}
            numberOfLines={2}
          >
            {item.description}
          </Text>
        )}
      </View>
      
      {currentVersion === item.id && (
        <IconButton
          icon="check"
          size={20}
          iconColor={paperColors.primaryAccent}
          style={styles.checkIcon}
        />
      )}
    </TouchableOpacity>
  );
  
  // Render section header for the sectioned list
  const renderSectionHeader = ({ section }: { section: SectionData }) => (
    <View style={[styles.sectionHeader, { backgroundColor: paperColors.background }]}>
      <Text style={[styles.sectionTitle, { color: paperColors.primaryAccent }]}>
        {section.title} ({section.data.length})
      </Text>
    </View>
  );

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <StatusBar style="light" />
      <Animated.View 
        style={[
          styles.overlay,
          { opacity: fadeAnimation }
        ]}
      >
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1} 
          onPress={handleClose}
        />
        
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardAvoid}
        >
          <Animated.View 
            style={[
              styles.modalContainer,
              { 
                backgroundColor: paperColors.background,
                transform: [{ translateY: slideAnimation }],
                paddingBottom: insets.bottom,
                paddingTop: insets.top,
                height: windowHeight,
              }
            ]}
          >
            <View style={styles.header}>
              <Text style={[styles.title, { color: paperColors.text }]}>
                Select Bible Version
              </Text>
              <IconButton 
                icon="close" 
                size={24} 
                onPress={handleClose} 
                iconColor={paperColors.text}
              />
            </View>
            
            <View style={[styles.searchContainer, { borderColor: paperColors.border }]}>
              <IconButton 
                icon="magnify" 
                size={20} 
                iconColor={paperColors.secondaryText}
                style={styles.searchIcon}
              />
              <TextInput
                ref={searchInputRef}
                style={[styles.searchInput, { color: paperColors.text }]}
                placeholder="Search by version, language or ID..."
                placeholderTextColor={paperColors.secondaryText}
                value={searchQuery}
                onChangeText={setSearchQuery}
                clearButtonMode="while-editing"
              />
              {searchQuery.length > 0 && (
                <IconButton 
                  icon="close-circle" 
                  size={16} 
                  onPress={handleClearSearch}
                  iconColor={paperColors.secondaryText}
                  style={styles.clearButton}
                />
              )}
            </View>
            
            {languages.length > 0 && !loading && (
              <View style={styles.languageFilters}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.languageChips}>
                  {activeLanguageFilter && (
                    <Chip
                      mode="outlined"
                      selected={true}
                      onPress={handleClearSearch}
                      style={[styles.languageChip, { borderColor: paperColors.primaryAccent }]}
                      textStyle={{ color: paperColors.primaryAccent }}
                      icon="close-circle"
                    >
                      Clear Filters
                    </Chip>
                  )}
                  {languages.map((language) => (
                    <Chip
                      key={language}
                      mode="outlined"
                      selected={activeLanguageFilter === language}
                      onPress={() => handleLanguageFilter(language)}
                      style={[
                        styles.languageChip, 
                        { 
                          backgroundColor: activeLanguageFilter === language 
                            ? paperColors.primaryAccent 
                            : 'transparent',
                          borderColor: paperColors.border
                        }
                      ]}
                      textStyle={{ 
                        color: activeLanguageFilter === language 
                          ? 'white' 
                          : paperColors.text 
                      }}
                    >
                      {language}
                    </Chip>
                  ))}
                </ScrollView>
              </View>
            )}
            
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={paperColors.secondaryText} />
                <Text style={{ color: paperColors.text, marginTop: 10 }}>
                  Loading Bible versions...
                </Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Text style={{ color: theme.colors.error }}>{error}</Text>
              </View>
            ) : (
              <>
                {showSectionedList ? (
                  <SectionList
                    sections={sectionedVersions}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    renderItem={renderVersionItem}
                    renderSectionHeader={renderSectionHeader}
                    stickySectionHeadersEnabled={true}
                    ListEmptyComponent={
                      <View style={styles.emptyContainer}>
                        <Text style={{ color: paperColors.secondaryText }}>
                          No Bible versions found. Try a different search.
                        </Text>
                      </View>
                    }
                  />
                ) : (
                  <FlatList
                    data={filteredVersions}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    renderItem={renderVersionItem}
                    ListEmptyComponent={
                      <View style={styles.emptyContainer}>
                        <Text style={{ color: paperColors.secondaryText }}>
                          No Bible versions found matching "{searchQuery}"
                        </Text>
                      </View>
                    }
                  />
                )}
              </>
            )}
          </Animated.View>
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  keyboardAvoid: {
    width: '100%',
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    width: '100%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  searchIcon: {
    margin: 0,
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  clearButton: {
    margin: 0,
  },
  listContent: {
    paddingBottom: 40,
  },
  versionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  versionInfo: {
    flex: 1,
  },
  versionName: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  versionId: {
    fontSize: 14,
    marginTop: 2,
    opacity: 0.7,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  versionDescription: {
    fontSize: 12,
    marginTop: 4,
    opacity: 0.7,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  checkIcon: {
    margin: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 60,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  sectionHeader: {
    padding: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  languageFilters: {
    marginBottom: 10,
    paddingHorizontal: 8,
  },
  languageChips: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
  },
  languageChip: {
    marginHorizontal: 4,
    marginVertical: 2,
  },
});

export default BibleVersionModal; 