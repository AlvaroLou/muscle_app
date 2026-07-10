import { LibraryExercise } from '@/types';

/**
 * Catálogo padrão de exercícios (bundled). Só metadados — nome, instruções e
 * dicas são resolvidos por i18n a partir do `id` (chave `exercises.<id>.*`).
 * Exercícios personalizados do usuário vêm do exerciseLibraryRepository.
 */
type SeedExercise = Omit<LibraryExercise, 'isCustom' | 'custom'>;

const seed = (e: SeedExercise): LibraryExercise => ({ ...e, isCustom: false });

export const STANDARD_EXERCISES: LibraryExercise[] = [
  // Chest
  seed({ id: 'bench_press', muscleGroup: 'chest', secondaryMuscles: ['triceps', 'shoulders'], equipment: 'barbell', level: 'intermediate' }),
  seed({ id: 'incline_dumbbell_press', muscleGroup: 'chest', secondaryMuscles: ['shoulders', 'triceps'], equipment: 'dumbbell', level: 'intermediate' }),
  seed({ id: 'push_up', muscleGroup: 'chest', secondaryMuscles: ['triceps', 'shoulders', 'core'], equipment: 'bodyweight', level: 'beginner' }),
  seed({ id: 'cable_fly', muscleGroup: 'chest', secondaryMuscles: ['shoulders'], equipment: 'cable', level: 'intermediate' }),
  // Back
  seed({ id: 'pull_up', muscleGroup: 'back', secondaryMuscles: ['biceps', 'forearms'], equipment: 'bodyweight', level: 'intermediate' }),
  seed({ id: 'bent_over_row', muscleGroup: 'back', secondaryMuscles: ['biceps'], equipment: 'barbell', level: 'intermediate' }),
  seed({ id: 'lat_pulldown', muscleGroup: 'back', secondaryMuscles: ['biceps'], equipment: 'cable', level: 'beginner' }),
  seed({ id: 'seated_cable_row', muscleGroup: 'back', secondaryMuscles: ['biceps'], equipment: 'cable', level: 'beginner' }),
  // Shoulders
  seed({ id: 'overhead_press', muscleGroup: 'shoulders', secondaryMuscles: ['triceps'], equipment: 'barbell', level: 'intermediate' }),
  seed({ id: 'lateral_raise', muscleGroup: 'shoulders', secondaryMuscles: [], equipment: 'dumbbell', level: 'beginner' }),
  seed({ id: 'face_pull', muscleGroup: 'shoulders', secondaryMuscles: ['back'], equipment: 'cable', level: 'beginner' }),
  // Biceps
  seed({ id: 'barbell_curl', muscleGroup: 'biceps', secondaryMuscles: ['forearms'], equipment: 'barbell', level: 'beginner' }),
  seed({ id: 'hammer_curl', muscleGroup: 'biceps', secondaryMuscles: ['forearms'], equipment: 'dumbbell', level: 'beginner' }),
  // Triceps
  seed({ id: 'triceps_pushdown', muscleGroup: 'triceps', secondaryMuscles: [], equipment: 'cable', level: 'beginner' }),
  seed({ id: 'overhead_triceps_extension', muscleGroup: 'triceps', secondaryMuscles: [], equipment: 'dumbbell', level: 'beginner' }),
  seed({ id: 'dips', muscleGroup: 'triceps', secondaryMuscles: ['chest', 'shoulders'], equipment: 'bodyweight', level: 'intermediate' }),
  // Forearms
  seed({ id: 'wrist_curl', muscleGroup: 'forearms', secondaryMuscles: [], equipment: 'dumbbell', level: 'beginner' }),
  // Legs
  seed({ id: 'back_squat', muscleGroup: 'legs', secondaryMuscles: ['glutes', 'core'], equipment: 'barbell', level: 'intermediate' }),
  seed({ id: 'leg_press', muscleGroup: 'legs', secondaryMuscles: ['glutes'], equipment: 'machine', level: 'beginner' }),
  seed({ id: 'romanian_deadlift', muscleGroup: 'legs', secondaryMuscles: ['glutes', 'back'], equipment: 'barbell', level: 'intermediate' }),
  seed({ id: 'leg_extension', muscleGroup: 'legs', secondaryMuscles: [], equipment: 'machine', level: 'beginner' }),
  seed({ id: 'leg_curl', muscleGroup: 'legs', secondaryMuscles: ['glutes'], equipment: 'machine', level: 'beginner' }),
  // Glutes
  seed({ id: 'hip_thrust', muscleGroup: 'glutes', secondaryMuscles: ['legs'], equipment: 'barbell', level: 'intermediate' }),
  seed({ id: 'glute_bridge', muscleGroup: 'glutes', secondaryMuscles: ['core'], equipment: 'bodyweight', level: 'beginner' }),
  // Calves
  seed({ id: 'standing_calf_raise', muscleGroup: 'calves', secondaryMuscles: [], equipment: 'machine', level: 'beginner' }),
  // Core
  seed({ id: 'plank', muscleGroup: 'core', secondaryMuscles: ['shoulders'], equipment: 'bodyweight', level: 'beginner' }),
  seed({ id: 'hanging_leg_raise', muscleGroup: 'core', secondaryMuscles: ['forearms'], equipment: 'bodyweight', level: 'intermediate' }),
  seed({ id: 'cable_crunch', muscleGroup: 'core', secondaryMuscles: [], equipment: 'cable', level: 'beginner' }),
  // Full body
  seed({ id: 'deadlift', muscleGroup: 'full_body', secondaryMuscles: ['back', 'legs', 'glutes'], equipment: 'barbell', level: 'advanced' }),
  seed({ id: 'kettlebell_swing', muscleGroup: 'full_body', secondaryMuscles: ['glutes', 'back'], equipment: 'kettlebell', level: 'intermediate' }),
  // Cardio
  seed({ id: 'burpee', muscleGroup: 'cardio', secondaryMuscles: ['full_body'], equipment: 'bodyweight', level: 'intermediate' }),
  seed({ id: 'jump_rope', muscleGroup: 'cardio', secondaryMuscles: ['calves'], equipment: 'other', level: 'beginner' }),
];

/** Ordem canônica dos grupos musculares (para seções/acordeão e filtros). */
export const MUSCLE_GROUP_ORDER: LibraryExercise['muscleGroup'][] = [
  'chest',
  'back',
  'shoulders',
  'biceps',
  'triceps',
  'forearms',
  'legs',
  'glutes',
  'calves',
  'core',
  'full_body',
  'cardio',
];
