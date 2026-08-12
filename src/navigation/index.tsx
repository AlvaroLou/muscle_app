import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { Icon, IconName } from '@/components/Icon';
import { ActiveWorkoutScreen } from '@/screens/ActiveWorkoutScreen';
import { CustomExerciseEditorScreen } from '@/screens/CustomExerciseEditorScreen';
import { DetailsScreen } from '@/screens/DetailsScreen';
import { CreateScreen } from '@/screens/CreateScreen';
import { ExerciseDetailScreen } from '@/screens/ExerciseDetailScreen';
import { ExerciseLibraryScreen } from '@/screens/ExerciseLibraryScreen';
import { HomeScreen } from '@/screens/HomeScreen';
import { HistoryScreen } from '@/screens/HistoryScreen';
import { StatisticsScreen } from '@/screens/StatisticsScreen';
import { SessionSummaryScreen } from '@/screens/SessionSummaryScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';
import { WorkoutsScreen } from '@/screens/WorkoutsScreen';
import { fonts } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { RootStackParamList, TabsParamList, WorkoutsStackParamList } from './types';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator<TabsParamList>();
const WorkoutsStack = createNativeStackNavigator<WorkoutsStackParamList>();

/** Stack interno da aba "My Workouts": lista -> detalhes. */
function WorkoutsNavigator() {
  return (
    <WorkoutsStack.Navigator screenOptions={{ headerShown: false }}>
      <WorkoutsStack.Screen name="WorkoutsList" component={WorkoutsScreen} />
      <WorkoutsStack.Screen name="Details" component={DetailsScreen} />
    </WorkoutsStack.Navigator>
  );
}

const TAB_ICONS: Record<keyof TabsParamList, IconName> = {
  Home: 'home',
  Workouts: 'dumbbell',
  Library: 'book',
  History: 'history',
};

function TabsNavigator() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.navBar,
          borderTopColor: colors.borderStrong,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontFamily: fonts.bodyMed,
          fontSize: 10,
        },
        tabBarIcon: ({ color }) => (
          <Icon name={TAB_ICONS[route.name]} size={22} color={color} />
        ),
      })}
    >
      <Tabs.Screen name="Home" component={HomeScreen} options={{ title: t('tabs.home') }} />
      <Tabs.Screen
        name="Workouts"
        component={WorkoutsNavigator}
        options={{ title: t('tabs.workouts') }}
      />
      <Tabs.Screen
        name="Library"
        component={ExerciseLibraryScreen}
        options={{ title: t('tabs.library') }}
      />
      <Tabs.Screen name="History" component={HistoryScreen} options={{ title: t('tabs.history') }} />
    </Tabs.Navigator>
  );
}

/** Navegador raiz: as tabs + a tela "Create" apresentada como modal. */
export function RootNavigator() {
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      <RootStack.Screen name="Tabs" component={TabsNavigator} />
      <RootStack.Screen
        name="Create"
        component={CreateScreen}
        options={{ presentation: 'modal' }}
      />
      <RootStack.Screen
        name="ActiveWorkout"
        component={ActiveWorkoutScreen}
        options={{ presentation: 'fullScreenModal' }}
      />
      <RootStack.Screen
        name="SessionSummary"
        component={SessionSummaryScreen}
        options={{ presentation: 'modal' }}
      />
      <RootStack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ presentation: 'modal' }}
      />
      <RootStack.Screen
        name="Statistics"
        component={StatisticsScreen}
        options={{ presentation: 'modal' }}
      />
      <RootStack.Screen
        name="ExerciseDetail"
        component={ExerciseDetailScreen}
        options={{ presentation: 'modal' }}
      />
      <RootStack.Screen
        name="CustomExerciseEditor"
        component={CustomExerciseEditorScreen}
        options={{ presentation: 'modal' }}
      />
    </RootStack.Navigator>
  );
}
