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
  Library: undefined;
  History: undefined;
};

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabsParamList>;
  Create: { workoutId?: string; mode?: 'simple' | 'grouped' } | undefined;
  ActiveWorkout: { workoutId: string; groupId?: string };
  SessionSummary: { sessionId: string };
  Settings: undefined;
  Premium: undefined;
  PremiumStats: undefined;
  ExerciseDetail: { exerciseId: string };
  CustomExerciseEditor: { exerciseId?: string } | undefined;
};
