import type { NavigatorScreenParams } from '@react-navigation/native';

/**
 * Tipos de rotas. Estrutura:
 *  RootStack
 *   ├─ Tabs (Home | Workouts(stack) | History | Profile)
 *   └─ Create (modal, sobre as tabs)
 */
export type WorkoutsStackParamList = {
  WorkoutsList: undefined;
  Details: { workoutId?: string } | undefined;
};

export type TabsParamList = {
  Home: undefined;
  Workouts: NavigatorScreenParams<WorkoutsStackParamList>;
  History: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabsParamList>;
  Create: { workoutId?: string; mode?: 'simple' | 'grouped' } | undefined;
  ActiveWorkout: { workoutId: string; groupId?: string };
  SessionSummary: { sessionId: string };
};
