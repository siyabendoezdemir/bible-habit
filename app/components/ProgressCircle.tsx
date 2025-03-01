import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme, IconButton } from 'react-native-paper';
import Svg, { Circle } from 'react-native-svg';

interface ProgressCircleProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  icon?: string;
  iconSize?: number;
  iconColor?: string;
}

export default function ProgressCircle({
  progress,
  size = 36,
  strokeWidth = 1.5,
  color,
  icon,
  iconSize,
  iconColor,
}: ProgressCircleProps) {
  const theme = useTheme();
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress * circumference);

  // Calculate default icon size based on the circle size
  const defaultIconSize = Math.max(Math.floor(size / 3), 16);

  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        <Circle
          stroke={theme.colors.surfaceVariant}
          fill="none"
          strokeWidth={strokeWidth}
          cx={size / 2}
          cy={size / 2}
          r={radius}
        />
        <Circle
          stroke={color || theme.colors.primary}
          fill="none"
          strokeWidth={strokeWidth}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {icon && (
        <View style={styles.iconContainer}>
          <IconButton
            icon={icon}
            size={iconSize || defaultIconSize}
            iconColor={iconColor || color || theme.colors.primary}
            style={styles.icon}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  iconContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    margin: 0,
  },
}); 