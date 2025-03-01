import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useTheme, Text, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, usePathname } from 'expo-router';

interface AppLayoutProps {
  children: React.ReactNode;
  hideNavigation?: boolean;
}

export default function AppLayout({ children, hideNavigation = false }: AppLayoutProps) {
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();

  // Determine which tab is active
  const isHomeActive = pathname === '/' || pathname === '/index';
  const isBibleActive = pathname === '/bible';
  const isAnalyticsActive = pathname === '/analytics';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {children}

      {!hideNavigation && (
        <View style={[styles.bottomNav, { backgroundColor: theme.colors.background }]}>
          <Pressable 
            style={[styles.navItem, isHomeActive && styles.navItemActive]}
            onPress={() => router.replace('/')}
          >
            <IconButton 
              icon="home-outline" 
              size={24} 
              iconColor={isHomeActive ? theme.colors.primary : theme.colors.secondary} 
              style={{ margin: 0 }} 
            />
            <Text style={[styles.navLabel, { color: isHomeActive ? theme.colors.primary : theme.colors.secondary }]}>Home</Text>
          </Pressable>
          
          <Pressable 
            style={[styles.navItem, isAnalyticsActive && styles.navItemActive]}
            onPress={() => router.replace('/analytics')}
          >
            <IconButton 
              icon="chart-line" 
              size={24} 
              iconColor={isAnalyticsActive ? theme.colors.primary : theme.colors.secondary} 
              style={{ margin: 0 }} 
            />
            <Text style={[styles.navLabel, { color: isAnalyticsActive ? theme.colors.primary : theme.colors.secondary }]}>Analytics</Text>
          </Pressable>
          
          <Pressable 
            style={[styles.navItem, isBibleActive && styles.navItemActive]}
            onPress={() => router.replace('/bible')}
          >
            <IconButton 
              icon="book-open-variant" 
              size={24} 
              iconColor={isBibleActive ? theme.colors.primary : theme.colors.secondary} 
              style={{ margin: 0 }} 
            />
            <Text style={[styles.navLabel, { color: isBibleActive ? theme.colors.primary : theme.colors.secondary }]}>Bible</Text>
          </Pressable>
          
          <View style={styles.addButtonContainer}>
            <Pressable 
              style={[styles.addButton, { backgroundColor: theme.dark ? '#FFFFFF' : '#000000' }]}
              onPress={() => router.replace('/?openAddReading=true')}
            >
              <IconButton 
                icon="plus" 
                size={32} 
                iconColor={theme.dark ? '#000000' : '#FFFFFF'} 
              />
            </Pressable>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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