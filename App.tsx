import {
  BarlowCondensed_600SemiBold,
  BarlowCondensed_700Bold,
} from '@expo-google-fonts/barlow-condensed';
import { DMMono_400Regular, DMMono_500Medium } from '@expo-google-fonts/dm-mono';
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import '@/i18n';
import { AdsProvider } from '@/ads/AdsProvider';
import { RootNavigator } from '@/navigation';
import { ExerciseLibraryProvider } from '@/store/ExerciseLibraryStore';
import { PreferencesProvider } from '@/store/PreferencesStore';
import { PremiumProvider } from '@/store/PremiumStore';
import { WorkoutProvider } from '@/store/WorkoutStore';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';
import { colors } from '@/theme';

// Container de navegação com o tema (accent) reativo ao preset ativo.
function ThemedNavigation() {
  const { colors: c, base } = useTheme();
  const navTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: c.bg,
      card: c.bg,
      text: c.text,
      border: c.border,
      primary: c.accent,
      notification: c.danger,
    },
  };
  return (
    <NavigationContainer theme={navTheme}>
      <RootNavigator />
      <StatusBar style={base === 'light' ? 'dark' : 'light'} />
    </NavigationContainer>
  );
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    BarlowCondensed_600SemiBold,
    BarlowCondensed_700Bold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
    DMMono_400Regular,
    DMMono_500Medium,
  });

  // Aguarda as fontes; se der erro, segue mesmo assim (usa fallback do sistema).
  if (!fontsLoaded && !fontError) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PreferencesProvider>
          <PremiumProvider>
            <AdsProvider>
              <ThemeProvider>
                <ExerciseLibraryProvider>
                  <WorkoutProvider>
                    <ThemedNavigation />
                  </WorkoutProvider>
                </ExerciseLibraryProvider>
              </ThemeProvider>
            </AdsProvider>
          </PremiumProvider>
        </PreferencesProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
