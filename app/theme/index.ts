import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#2D3748',
    secondary: '#4A5568',
    accent: '#667EEA',
    background: '#F7FAFC',
    surface: '#FFFFFF',
    text: '#1A202C',
    error: '#E53E3E',
    success: '#48BB78',
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#A0AEC0',
    secondary: '#718096',
    accent: '#667EEA',
    background: '#1A202C',
    surface: '#2D3748',
    text: '#F7FAFC',
    error: '#FC8181',
    success: '#68D391',
  },
}; 