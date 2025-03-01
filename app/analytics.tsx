import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useTheme, Surface } from 'react-native-paper';
import { Stack } from 'expo-router';
import AppLayout from './components/AppLayout';

export default function AnalyticsScreen() {
  const theme = useTheme();

  return (
    <AppLayout>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Surface style={[styles.header, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.headerTitle, { color: theme.colors.primary }]}>Analytics</Text>
        </Surface>
        
        <View style={styles.content}>
          <Text style={{ color: theme.colors.secondary, textAlign: 'center' }}>
            Analytics content would be displayed here.
          </Text>
          <Text style={{ color: theme.colors.secondary, textAlign: 'center', marginTop: 8 }}>
            This is a placeholder for the Analytics screen.
          </Text>
        </View>
      </View>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    elevation: 4,
    shadowColor: 'rgba(0, 0, 0, 0.3)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
}); 