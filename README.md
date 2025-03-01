# Bible Habit App

A mobile application built with Expo and React Native for Bible reading, tracking, and exploration.

## Getting Started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
    npx expo start
   ```

In the output, you'll find options to open the app in a:
- [Development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go)

## Project Structure

### Root Structure
```
bible-habit/
├── app/                  # Main application code with file-based routing
├── assets/               # Static assets like images and fonts
├── components/           # Reusable UI components
├── constants/            # App-wide constants
├── hooks/                # Custom React hooks
├── scripts/              # Utility scripts
├── app.json              # Expo configuration
├── package.json          # Dependencies and scripts
└── tsconfig.json         # TypeScript configuration
```

### App Directory Structure
```
app/
├── (tabs)/               # Tab-based navigation
│   ├── _layout.tsx       # Tab layout configuration
│   ├── index.tsx         # Home tab
│   ├── bible.tsx         # Bible tab
│   └── explore.tsx       # Explore tab
├── _layout.tsx           # Main app layout
├── index.tsx             # Main entry point
├── analytics.tsx         # Analytics page
├── bible.tsx             # Bible page
├── +not-found.tsx        # 404 page
├── components/           # App-specific components
├── constants/            # App-specific constants
├── theme/                # Theming configuration
└── types/                # TypeScript type definitions
```

### Components Structure
```
components/
├── ui/                   # UI components
├── Collapsible.tsx       # Collapsible component
├── ExternalLink.tsx      # External link component
├── HapticTab.tsx         # Tab with haptic feedback
├── HelloWave.tsx         # Wave animation component
├── ParallaxScrollView.tsx # Parallax scrolling component
├── ThemedText.tsx        # Themed text component
└── ThemedView.tsx        # Themed view component
```

### Key Features
- **Tab-based Navigation**: Home, Explore, and Bible tabs
- **Theme Support**: Light and dark mode with custom colors
- **Haptic Feedback**: Enhanced user experience with haptic feedback
- **Responsive UI**: Adapts to different screen sizes and orientations

## Technology Stack

- **Framework**: [Expo](https://expo.dev) with [Expo Router](https://docs.expo.dev/router/introduction)
- **UI Libraries**: 
  - React Native Paper
  - React Native Elements
  - Expo Blur
  - Expo Symbols
- **State Management**: React hooks and context
- **Navigation**: Expo Router (file-based)
- **Charts**: React Native Chart Kit
- **Animations**: React Native Reanimated
- **Gestures**: React Native Gesture Handler
- **Storage**: AsyncStorage

## Development

The app uses Expo's file-based routing system. The main navigation is handled through the tab layout in `app/(tabs)/_layout.tsx`.

Key development files:
- `app/(tabs)/index.tsx`: Home screen
- `app/(tabs)/bible.tsx`: Bible reading screen
- `app/(tabs)/explore.tsx`: Explore content screen
- `components/ui/`: UI components used throughout the app

## Learn More

- [Expo documentation](https://docs.expo.dev/)
- [React Native documentation](https://reactnative.dev/docs/getting-started)
- [Expo Router documentation](https://docs.expo.dev/router/introduction)

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
