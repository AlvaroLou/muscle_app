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
  /** Índice do treino na rotação no momento da conclusão (0=A, 1=B...). */
  order: number;
  completedAt: number;
  durationMs: number;
  completedSets: number;
  totalSets: number;
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
}

export interface EditGroup {
  name: string;
  exercises: EditExercise[];
}
