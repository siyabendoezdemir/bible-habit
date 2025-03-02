import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, IconButton, Divider, useTheme } from 'react-native-paper';

interface SettingsDrawerProps {
  onClose: () => void;
  fontSize: number;
  setFontSize: (size: number) => void;
  autoTrackingEnabled: boolean;
  setAutoTrackingEnabled: (enabled: boolean) => void;
  autoMarkThreshold: number;
  setAutoMarkThreshold: (threshold: number) => void;
}

const SettingsDrawer: React.FC<SettingsDrawerProps> = ({
  onClose,
  fontSize,
  setFontSize,
  autoTrackingEnabled,
  setAutoTrackingEnabled,
  autoMarkThreshold,
  setAutoMarkThreshold,
}) => {
  const theme = useTheme();

  return (
    <View style={[styles.settingsContainer, { backgroundColor: theme.colors.background }]}>
      <View style={styles.settingsHeader}>
        <Text style={[styles.settingsTitle, { color: theme.colors.primary }]}>Reading Settings</Text>
        <IconButton 
          icon="close" 
          size={24} 
          onPress={onClose} 
          iconColor={theme.colors.primary}
        />
      </View>
      <Divider />
      
      <ScrollView style={styles.settingsContent}>
        <View style={styles.settingSection}>
          <Text style={[styles.settingSectionTitle, { color: theme.colors.primary }]}>Automatic Tracking</Text>
          
          <View style={styles.settingRow}>
            <Text style={{ color: theme.colors.onSurface }}>Auto-mark chapters as read</Text>
            <View style={styles.switchContainer}>
              <IconButton 
                icon={autoTrackingEnabled ? "check-circle" : "circle-outline"} 
                size={24} 
                iconColor={theme.colors.primary} 
                onPress={() => setAutoTrackingEnabled(!autoTrackingEnabled)}
              />
            </View>
          </View>
          
          {autoTrackingEnabled && (
            <View style={styles.settingRow}>
              <Text style={{ color: theme.colors.onSurface }}>Time threshold (seconds)</Text>
              <View style={styles.thresholdContainer}>
                <IconButton 
                  icon="minus" 
                  size={20} 
                  iconColor={theme.colors.primary} 
                  onPress={() => setAutoMarkThreshold(Math.max(30, autoMarkThreshold - 10))}
                />
                <Text style={[styles.thresholdText, { color: theme.colors.primary }]}>{autoMarkThreshold}</Text>
                <IconButton 
                  icon="plus" 
                  size={20} 
                  iconColor={theme.colors.primary} 
                  onPress={() => setAutoMarkThreshold(Math.min(300, autoMarkThreshold + 10))}
                />
              </View>
            </View>
          )}
        </View>
        
        <View style={styles.settingSection}>
          <Text style={[styles.settingSectionTitle, { color: theme.colors.primary }]}>Display</Text>
          
          <View style={styles.settingRow}>
            <Text style={{ color: theme.colors.onSurface }}>Font Size</Text>
            <View style={styles.thresholdContainer}>
              <IconButton 
                icon="format-font-size-decrease" 
                size={20} 
                iconColor={theme.colors.primary} 
                onPress={() => setFontSize(Math.max(14, fontSize - 2))}
              />
              <Text style={[styles.thresholdText, { color: theme.colors.primary }]}>{fontSize}</Text>
              <IconButton 
                icon="format-font-size-increase" 
                size={20} 
                iconColor={theme.colors.primary} 
                onPress={() => setFontSize(Math.min(24, fontSize + 2))}
              />
            </View>
          </View>
        </View>
        
        <View style={styles.settingSection}>
          <Text style={[styles.settingSectionTitle, { color: theme.colors.primary }]}>About</Text>
          <Text style={[styles.aboutText, { color: theme.colors.onSurface }]}>
            The Bible reader allows you to read scripture and automatically tracks your progress.
            Your reading history is saved and contributes to your daily streak.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  settingsContainer: {
    flex: 1,
  },
  settingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  settingsTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  settingsContent: {
    flex: 1,
    padding: 16,
  },
  settingSection: {
    marginBottom: 24,
  },
  settingSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thresholdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thresholdText: {
    fontSize: 16,
    fontWeight: '600',
    width: 40,
    textAlign: 'center',
  },
  aboutText: {
    lineHeight: 20,
  },
});

export default SettingsDrawer; 