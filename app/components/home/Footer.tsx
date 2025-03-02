import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, IconButton, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';

interface FooterProps {
  onAddReading: () => void;
}

const Footer: React.FC<FooterProps> = ({ onAddReading }) => {
  const theme = useTheme();
  const router = useRouter();

  return (
    <View style={styles.bottomNav}>
      <View style={[styles.navItem, styles.navItemActive]}>
        <IconButton 
          icon="home-outline" 
          size={24} 
          iconColor={theme.colors.primary} 
          style={{ margin: 0 }} 
        />
        <Text style={[styles.navLabel, { color: theme.colors.primary }]}>Home</Text>
      </View>
      <View 
        style={styles.navItem}
        onTouchEnd={() => {
          // Use replace to avoid adding to history stack
          router.replace('/analytics');
        }}
      >
        <IconButton 
          icon="chart-line" 
          size={24} 
          iconColor={theme.colors.secondary} 
          style={{ margin: 0 }} 
        />
        <Text style={[styles.navLabel, { color: theme.colors.secondary }]}>Analytics</Text>
      </View>
      <View 
        style={styles.navItem}
        onTouchEnd={() => {
          // Use replace to avoid adding to history stack
          router.replace('/bible');
        }}
      >
        <IconButton 
          icon="book-open-variant" 
          size={24} 
          iconColor={theme.colors.secondary} 
          style={{ margin: 0 }} 
        />
        <Text style={[styles.navLabel, { color: theme.colors.secondary }]}>Bible</Text>
      </View>
      <View style={styles.addButtonContainer}>
        <View 
          style={[styles.addButton, { backgroundColor: theme.dark ? '#FFFFFF' : '#000000' }]} 
          onTouchEnd={onAddReading}
        >
          <IconButton 
            icon="plus" 
            size={32} 
            iconColor={theme.dark ? '#000000' : '#FFFFFF'} 
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 4,
    paddingBottom: 28,
    borderTopWidth: 0,
    height: 72,
    paddingHorizontal: 16,
  },
  navItem: {
    alignItems: 'center',
    opacity: 0.5,
    flex: 1,
  },
  navItemActive: {
    opacity: 1,
  },
  navLabel: {
    fontSize: 12,
    marginTop: -4,
  },
  addButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(0, 0, 0, 0.3)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginTop: -32,
  },
  addButtonContainer: {
    flex: 1,
    alignItems: 'center',
  },
});

export default Footer; 