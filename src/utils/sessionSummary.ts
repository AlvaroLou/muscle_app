import { RestDurations, restSeconds } from '@/services/rest';
import { MuscleGroup, Workout } from '@/types';
import { allExercises } from '@/utils/workout';

/** Resumo por exercício de uma sessão concluída (valores planejados). */
export interface SessionExerciseSummary {
  name: string;
  muscleGroup?: MuscleGroup;
  setsDone: number;
  setsPlanned: number;
  reps: number;
  weight: number;
  volume: number;
  restSeconds: number;
}

/** Estatísticas agregadas de uma sessão (para o histórico). */
export interface SessionStats {
  completedExercises: number;
  totalExercises: number;
  completedSets: number;
  totalSets: number;
  totalReps: number;
  totalVolume: number;
  totalRestMs: number;
  restCount: number;
  skippedExercises: number;
  exercises: SessionExerciseSummary[];
}

/**
 * Constrói as estatísticas da sessão a partir do treino (valores planejados) e
 * das séries concluídas. O app registra séries marcadas; reps/carga/descanso
 * vêm do plano do exercício, resolvidos pela config global de descanso.
 */
export function buildSessionStats(
  workout: Workout,
  completedSetKeys: string[],
  restDurations: RestDurations,
  setWeights?: Record<string, number>,
): SessionStats {
  const done = new Set(completedSetKeys);
  const weights = setWeights ?? {};
  const exercises = allExercises(workout);

  let completedExercises = 0;
  let skippedExercises = 0;
  let totalSets = 0;
  let completedSets = 0;
  let totalReps = 0;
  let totalVolume = 0;
  let totalRestSeconds = 0;

  const summaries: SessionExerciseSummary[] = exercises.map((ex) => {
    const setsPlanned = ex.sets;
    let setsDone = 0;
    let volume = 0;
    let weightSum = 0;
    for (let i = 0; i < setsPlanned; i++) {
      const key = `${ex.id}:${i}`;
      if (done.has(key)) {
        setsDone++;
        // Carga real informada na série; se não houver, cai no peso planejado.
        const w = weights[key] ?? ex.weight;
        volume += ex.reps * w;
        weightSum += w;
      }
    }
    const rest = restSeconds(ex, restDurations);
    // Carga representativa do exercício = média das séries feitas (ou o plano).
    const weight = setsDone > 0 ? Math.round(weightSum / setsDone) : ex.weight;

    totalSets += setsPlanned;
    completedSets += setsDone;
    totalReps += setsDone * ex.reps;
    totalVolume += volume;
    totalRestSeconds += setsDone * rest;
    if (setsPlanned > 0 && setsDone === setsPlanned) completedExercises++;
    if (setsDone === 0) skippedExercises++;

    return {
      name: ex.name,
      muscleGroup: ex.muscleGroup,
      setsDone,
      setsPlanned,
      reps: ex.reps,
      weight,
      volume,
      restSeconds: rest,
    };
  });

  return {
    completedExercises,
    totalExercises: exercises.length,
    completedSets,
    totalSets,
    totalReps,
    totalVolume,
    totalRestMs: totalRestSeconds * 1000,
    restCount: completedSets,
    skippedExercises,
    exercises: summaries,
  };
}
