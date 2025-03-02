import React, { ReactNode } from 'react';
import { View, StyleSheet, Pressable, Platform } from 'react-native';
import { useTheme, Text, IconButton } from 'react-native-paper';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, usePathname } from 'expo-router';

interface AppLayoutProps {
  children: React.ReactNode;
  hideNavigation?: boolean;
  header?: ReactNode;
  footer?: ReactNode;
}

export default function AppLayout({ children, hideNavigation = false, header, footer }: AppLayoutProps) {
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  // Determine which tab is active
  const isHomeActive = pathname === '/' || pathname === '/index';
  const isBibleActive = pathname === '/bible';
  const isAnalyticsActive = pathname === '/analytics';

  // Calculate header and footer heights with safe area insets
  const headerHeight = 56 + insets.top;
  const footerHeight = 72 + insets.bottom;

  // Use fixed values for header and footer to prevent layout shifts
  const fixedHeaderHeight = Platform.OS === 'ios' ? 56 + insets.top : 56;
  const fixedFooterHeight = Platform.OS === 'ios' ? 72 + insets.bottom : 72;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Main content with padding to account for fixed header and footer */}
      <View 
        style={[
          styles.contentContainer, 
          { 
            paddingTop: hideNavigation || !header ? 0 : fixedHeaderHeight,
            paddingBottom: hideNavigation || !footer ? 0 : fixedFooterHeight,
          }
        ]}
      >
        {children}
      </View>

      {!hideNavigation && (
        <>
          {/* Fixed Header */}
          {header && (
            <View 
              style={[
                styles.fixedHeader, 
                { 
                  backgroundColor: theme.colors.background,
                  height: fixedHeaderHeight,
                  paddingTop: insets.top,
                }
              ]}
            >
              {header}
            </View>
          )}

          {/* Fixed Footer */}
          {footer ? (
            <View 
              style={[
                styles.fixedFooter, 
                { 
                  backgroundColor: theme.colors.background,
                  height: fixedFooterHeight,
                  paddingBottom: insets.bottom,
                }
              ]}
            >
              {footer}
            </View>
          ) : (
            <View 
              style={[
                styles.fixedFooter, 
                { 
                  backgroundColor: theme.colors.background,
                  height: fixedFooterHeight,
                  paddingBottom: insets.bottom,
                }
              ]}
            >
              <View style={styles.bottomNav}>
                <Pressable 
                  style={[styles.navItem, isHomeActive && styles.navItemActive]}
                  onPress={() => {
                    if (!isHomeActive) {
                      router.replace('/');
                    }
                  }}
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
                  onPress={() => {
                    if (!isAnalyticsActive) {
                      router.replace('/analytics');
                    }
                  }}
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
                  onPress={() => {
                    if (!isBibleActive) {
                      router.replace('/bible');
                    }
                  }}
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
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden', // Prevent content from overflowing during transitions
  },
  contentContainer: {
    flex: 1,
  },
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    justifyContent: 'flex-end',
    borderBottomWidth: 0,
    elevation: 4, // Add elevation for Android
    shadowColor: 'rgba(0,0,0,0.1)', // Add shadow for iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
  },
  fixedFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    justifyContent: 'flex-start',
    borderTopWidth: 0,
    elevation: 4, // Add elevation for Android
    shadowColor: 'rgba(0,0,0,0.1)', // Add shadow for iOS
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 4,
    paddingBottom: 8,
    paddingHorizontal: 16,
    height: 72,
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