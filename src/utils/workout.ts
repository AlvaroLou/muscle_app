/**
 * Helpers de treino — mantidos fora das telas para reuso e consistência.
 */
import { ThemeColors } from '@/theme';
import {
  EditExercise,
  EditGroup,
  Exercise,
  ExerciseInput,
  GroupInput,
  Workout,
  WorkoutSession,
} from '@/types';

/** Paleta de cores das badges (varia por posição na lista) — depende do tema. */
export const badgePalette = (colors: ThemeColors) => [
  { color: colors.accent, tint: colors.accentTint },
  { color: colors.blue, tint: colors.blueTint },
  { color: colors.orange, tint: colors.orangeTint },
];

export const badgeFor = (index: number, colors: ThemeColors) => {
  const palette = badgePalette(colors);
  return palette[index % palette.length];
};

/** Letra do treino pela posição: 0 -> A, 1 -> B... */
export const workoutLetter = (index: number) =>
  String.fromCharCode(65 + (index % 26));

/** Todos os exercícios do treino, achatados (na ordem dos grupos). */
export const allExercises = (workout: Workout): Exercise[] =>
  workout.groups.flatMap((g) => g.exercises);

/** Nomes dos grupos, usados como tags do treino. */
export const groupTags = (workout: Workout): string[] =>
  workout.groups.map((g) => g.name.trim()).filter(Boolean);

/**
 * Índice do próximo treino da rotação (A→B→C→A). Avança 1 a partir do último
 * treino concluído — MAS, se o último treino tem grupos e ainda faltam grupos
 * (a última sessão não foi do último grupo), permanece no mesmo treino para
 * concluir a cascata de grupos antes de trocar de treino. Sem histórico,
 * começa no primeiro (A). Se o último treino foi excluído, recomeça do A.
 * `sessions` deve estar ordenado do mais recente para o mais antigo.
 */
export function nextWorkoutIndex(
  workouts: Workout[],
  sessions: WorkoutSession[],
): number {
  if (workouts.length === 0) return -1;
  const last = sessions[0];
  if (!last) return 0;
  const lastIndex = workouts.findIndex((w) => w.id === last.workoutId);
  if (lastIndex < 0) return 0;

  // Ainda há grupos a fazer neste treino? Então continua nele.
  const lastWorkout = workouts[lastIndex];
  if (isGrouped(lastWorkout) && last.groupId != null) {
    const gi = lastWorkout.groups.findIndex((g) => g.id === last.groupId);
    if (gi >= 0 && gi < lastWorkout.groups.length - 1) {
      return lastIndex;
    }
  }

  return (lastIndex + 1) % workouts.length;
}

/** Treino com seções: mais de um grupo ou algum grupo nomeado. */
export const isGrouped = (workout: Workout): boolean =>
  workout.groups.length > 1 || workout.groups.some((g) => g.name.trim().length > 0);

/**
 * Índice do próximo grupo a treinar dentro de um treino (rotação Perna→Peito→
 * Perna). Avança 1 a partir do último grupo concluído daquele treino.
 * `sessions` deve estar ordenado do mais recente para o mais antigo.
 */
export function nextGroupIndex(workout: Workout, sessions: WorkoutSession[]): number {
  if (workout.groups.length <= 1) return 0;
  const last = sessions.find(
    (s) => s.workoutId === workout.id && s.groupId != null,
  );
  if (!last) return 0;
  const idx = workout.groups.findIndex((g) => g.id === last.groupId);
  if (idx < 0) return 0;
  return (idx + 1) % workout.groups.length;
}

/**
 * Parâmetros para iniciar um treino "seguindo a semana": num treino com grupos,
 * começa pelo próximo grupo da rotação; num treino simples, o treino inteiro.
 */
export function startParamsFor(
  workout: Workout,
  sessions: WorkoutSession[],
): { workoutId: string; groupId?: string } {
  if (isGrouped(workout)) {
    const gi = nextGroupIndex(workout, sessions);
    return { workoutId: workout.id, groupId: workout.groups[gi]?.id };
  }
  return { workoutId: workout.id };
}

/** Estimativa de duração (min) a partir do total de séries. */
export function estimatedDurationMin(workout: Workout): number {
  const totalSets = allExercises(workout).reduce((sum, e) => sum + e.sets, 0);
  return Math.max(5, Math.round(totalSets * 2.5));
}

// ----- Conversões formulário <-> domínio -----

function toEditExercise(e: Exercise): EditExercise {
  return {
    name: e.name,
    sets: String(e.sets),
    reps: String(e.reps),
    weight: e.weight > 0 ? String(e.weight) : '',
    rest: e.rest > 0 ? String(e.rest) : '',
    description: e.description ?? '',
    libraryId: e.libraryId,
    muscleGroup: e.muscleGroup,
  };
}

/** Converte os grupos de um treino para o formato do formulário. */
export function toEditGroups(workout: Workout): EditGroup[] {
  return workout.groups.map((g) => ({
    name: g.name,
    exercises: g.exercises.map(toEditExercise),
  }));
}

function fromEditExercises(list: EditExercise[]): ExerciseInput[] {
  return list
    .filter((e) => e.name.trim().length > 0)
    .map((e) => ({
      name: e.name.trim(),
      sets: toInt(e.sets),
      reps: toInt(e.reps),
      weight: toNumber(e.weight),
      rest: toInt(e.rest),
      description: e.description.trim(),
      ...(e.libraryId ? { libraryId: e.libraryId } : {}),
      ...(e.muscleGroup ? { muscleGroup: e.muscleGroup } : {}),
    }));
}

/**
 * Converte o formulário para grupos de domínio. Descarta exercícios sem nome e
 * grupos que ficarem sem exercícios.
 */
export function fromEditGroups(list: EditGroup[]): GroupInput[] {
  return list
    .map((g) => ({
      name: g.name.trim(),
      exercises: fromEditExercises(g.exercises),
    }))
    .filter((g) => g.exercises.length > 0);
}

/**
 * Normaliza um treino vindo do storage. Migra o formato antigo (lista plana
 * `exercises`) para grupos, embrulhando tudo num grupo "Geral".
 */
export function normalizeWorkout(raw: any): Workout {
  const base = {
    id: String(raw?.id ?? ''),
    name: String(raw?.name ?? ''),
    createdAt: Number(raw?.createdAt ?? Date.now()),
    updatedAt: Number(raw?.updatedAt ?? Date.now()),
  };
  if (Array.isArray(raw?.groups)) {
    return { ...base, groups: raw.groups };
  }
  if (Array.isArray(raw?.exercises)) {
    return { ...base, groups: [{ id: 'g_geral', name: 'Geral', exercises: raw.exercises }] };
  }
  return { ...base, groups: [] };
}

function toInt(value: string): number {
  const n = parseInt(value, 10);
  return Number.isNaN(n) || n < 0 ? 0 : n;
}

function toNumber(value: string): number {
  const n = parseFloat(value.replace(',', '.'));
  return Number.isNaN(n) || n < 0 ? 0 : n;
}
