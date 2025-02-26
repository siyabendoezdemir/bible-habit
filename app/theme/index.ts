import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

interface CustomColors {
  accent: string;
  card: string;
  border: string;
  placeholder: string;
  shadow: string;
  progressBg: string;
  protein: string;
  carbs: string;
  fats: string;
  gradient: {
    start: string;
    end: string;
  };
}

declare global {
  namespace ReactNativePaper {
    interface ThemeColors extends CustomColors {}
  }
}

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#2C3E50',
    secondary: '#7F8C8D',
    accent: '#C0392B',
    background: '#F9F6F1',  // Subtle warm paper color
    surface: '#FFFFFF',
    text: '#2C3E50',
    error: '#E74C3C',
    success: '#27AE60',
    card: '#FFFFFF',
    border: '#ECE5D8',     // Warm paper border
    placeholder: '#95A5A6',
    shadow: 'rgba(0, 0, 0, 0.08)',
    progressBg: 'rgba(44, 62, 80, 0.1)',
    protein: '#E74C3C',    // Warm red
    carbs: '#F39C12',      // Warm orange
    fats: '#2980B9',       // Cool blue
    gradient: {
      start: '#FFFFFF',
      end: '#F9F6F1',
    },
  },
  roundness: 16,
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#ECF0F1',
    secondary: '#BDC3C7',
    accent: '#E74C3C',
    background: '#1A1F25',  // Softer than pure black
    surface: '#22272E',    // Slightly lighter than background
    text: '#ECF0F1',
    error: '#E74C3C',
    success: '#2ECC71',
    card: '#22272E',
    border: '#2C3E50',
    placeholder: '#7F8C8D',
    shadow: 'rgba(0, 0, 0, 0.3)',
    progressBg: 'rgba(236, 240, 241, 0.1)',
    protein: '#E74C3C',    // Warm red
    carbs: '#F39C12',      // Warm orange
    fats: '#3498DB',       // Bright blue
    gradient: {
      start: '#22272E',
      end: '#1A1F25',
    },
  },
  roundness: 16,
}; 