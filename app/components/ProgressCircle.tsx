import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';
import Svg, { Circle } from 'react-native-svg';

interface ProgressCircleProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}

export default function ProgressCircle({
  progress,
  size = 36,
  strokeWidth = 1.5,
  color,
}: ProgressCircleProps) {
  const theme = useTheme();
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress * circumference);

  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        <Circle
          stroke={theme.colors.progressBg}
          fill="none"
          strokeWidth={strokeWidth}
          cx={size / 2}
          cy={size / 2}
          r={radius}
        />
        <Circle
          stroke={color || theme.colors.accent}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
}); 