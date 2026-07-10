/**
 * Modelos de domínio. Um treino é dividido em GRUPOS (seções, ex.: "Perna",
 * "Costas"), e cada grupo tem seus exercícios.
 */

/** Um exercício dentro de um grupo. */
export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  /** Carga em kg. 0 = peso corporal. */
  weight: number;
  /** Descanso entre séries, em segundos. 0 = usar o padrão global. */
  rest: number;
  /** Observação livre (ex.: técnica, cadência). Pode ser vazia. */
  description: string;
  /** Id do exercício na Biblioteca, quando veio de lá. Opcional. */
  libraryId?: string;
  /** Grupo muscular principal, quando vinculado à Biblioteca. Opcional. */
  muscleGroup?: MuscleGroup;
}

/** Grupos musculares usados na Biblioteca de Exercícios (filtros/categorias). */
export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'legs'
  | 'glutes'
  | 'calves'
  | 'core'
  | 'full_body'
  | 'cardio';

export type ExerciseLevel = 'beginner' | 'intermediate' | 'advanced';

/** Equipamento (chave traduzida via `equipment.<key>`). */
export type Equipment =
  | 'barbell'
  | 'dumbbell'
  | 'machine'
  | 'cable'
  | 'bodyweight'
  | 'kettlebell'
  | 'band'
  | 'other';

/**
 * Um item da Biblioteca de Exercícios. Os itens padrão têm os textos
 * (nome/instruções/dicas) resolvidos por i18n a partir do `id`; os
 * personalizados (`isCustom`) guardam o texto literal do usuário.
 */
export interface LibraryExercise {
  id: string;
  muscleGroup: MuscleGroup;
  secondaryMuscles: MuscleGroup[];
  equipment: Equipment;
  level: ExerciseLevel;
  isCustom: boolean;
  /** Só nos personalizados: textos literais (não traduzidos). */
  custom?: {
    name: string;
    notes?: string;
  };
}

/** Um grupo/seção de exercícios dentro do treino (ex.: "Perna"). */
export interface ExerciseGroup {
  id: string;
  name: string;
  exercises: Exercise[];
}

/** Um treino é uma coleção ordenada de grupos. */
export interface Workout {
  id: string;
  name: string;
  groups: ExerciseGroup[];
  createdAt: number;
  updatedAt: number;
}

/**
 * Uma sessão de treino concluída (histórico). Guarda um "retrato" do treino no
 * momento em que foi feito, para que o histórico continue válido mesmo que o
 * treino seja editado ou excluído depois.
 */
export interface WorkoutSession {
  id: string;
  workoutId: string;
  workoutName: string;
  /** Grupo treinado, quando a sessão foi de um grupo específico. */
  groupId?: string;
  /** Índice do treino na rotação no momento da conclusão (0=A, 1=B...). */
  order: number;
  completedAt: number;
  durationMs: number;
  completedSets: number;
  totalSets: number;
}

/**
 * Treino em andamento (persistido) — permite sair e retomar. O tempo decorrido
 * é reconstruído por timestamps: `accumulatedMs` é o tempo já contado até a
 * última pausa; se `running`, soma-se (agora − `lastResumeAt`).
 */
export interface ActiveSession {
  workoutId: string;
  groupId?: string;
  /** Nome exibido (pode incluir o grupo, ex.: "Treino A · Perna"). */
  workoutName: string;
  order: number;
  currentExerciseIndex: number;
  /** Séries concluídas, como `"<exerciseId>:<setIndex>"`. */
  completedSetKeys: string[];
  accumulatedMs: number;
  lastResumeAt: number | null;
  running: boolean;
  updatedAt: number;
}

// ----- Entradas de CRUD (sem ids, gerados ao salvar) -----

export type ExerciseInput = Omit<Exercise, 'id'>;

export interface GroupInput {
  name: string;
  exercises: ExerciseInput[];
}

export interface WorkoutInput {
  name: string;
  groups: GroupInput[];
}

// ----- Representações do formulário (campos como string) -----

export interface EditExercise {
  name: string;
  sets: string;
  reps: string;
  weight: string;
  rest: string;
  description: string;
  libraryId?: string;
  muscleGroup?: MuscleGroup;
}

export interface EditGroup {
  name: string;
  exercises: EditExercise[];
}
