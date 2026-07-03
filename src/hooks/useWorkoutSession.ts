import { useCallback, useMemo, useState } from 'react';

import { Workout } from '@/types';
import { useStopwatch } from './useStopwatch';

/** Pausa padrão entre séries (segundos), ajustável durante o treino. */
export const DEFAULT_REST_SECONDS = 90;

export interface SessionSet {
  exerciseId: string;
  setIndex: number;
  completed: boolean;
}

/**
 * Orquestra a execução de um treino: duração total (cronômetro), controle de
 * séries concluídas, progresso e navegação entre exercícios. O timer de pausa
 * em si vive no RestTimer/useCountdown.
 */
export function useWorkoutSession(workout: Workout) {
  const stopwatch = useStopwatch(true);

  // Sequência achatada de exercícios, cada um com o nome do seu grupo.
  const items = useMemo(
    () =>
      workout.groups.flatMap((g) =>
        g.exercises.map((exercise) => ({ exercise, groupName: g.name })),
      ),
    [workout],
  );

  const [sets, setSets] = useState<SessionSet[]>(() =>
    items.flatMap(({ exercise }) =>
      Array.from({ length: exercise.sets }, (_, setIndex) => ({
        exerciseId: exercise.id,
        setIndex,
        completed: false,
      })),
    ),
  );
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [finished, setFinished] = useState(false);

  const totalSets = sets.length;
  const completedSets = sets.filter((s) => s.completed).length;
  const progress = totalSets > 0 ? completedSets / totalSets : 0;

  const currentItem = items[currentExerciseIndex];
  const currentExercise = currentItem?.exercise;
  const currentGroupName = currentItem?.groupName ?? '';
  const isLastExercise = currentExerciseIndex === items.length - 1;

  const currentExerciseSets = useMemo(
    () => sets.filter((s) => s.exerciseId === currentExercise?.id),
    [sets, currentExercise?.id],
  );

  /** Marca/desmarca uma série; retorna se ficou concluída. */
  const toggleSet = useCallback((exerciseId: string, setIndex: number): boolean => {
    let nowCompleted = false;
    setSets((prev) =>
      prev.map((s) => {
        if (s.exerciseId === exerciseId && s.setIndex === setIndex) {
          nowCompleted = !s.completed;
          return { ...s, completed: nowCompleted };
        }
        return s;
      }),
    );
    return nowCompleted;
  }, []);

  const nextExercise = useCallback(
    () => setCurrentExerciseIndex((i) => Math.min(i + 1, items.length - 1)),
    [items.length],
  );
  const prevExercise = useCallback(
    () => setCurrentExerciseIndex((i) => Math.max(i - 1, 0)),
    [],
  );

  const finish = useCallback(() => {
    stopwatch.pause();
    setFinished(true);
  }, [stopwatch]);

  return {
    elapsedMs: stopwatch.elapsedMs,
    running: stopwatch.running,
    pause: stopwatch.pause,
    resume: stopwatch.start,
    sets,
    totalSets,
    completedSets,
    progress,
    totalExercises: items.length,
    nextExerciseName: items[currentExerciseIndex + 1]?.exercise.name,
    currentExercise,
    currentGroupName,
    currentExerciseIndex,
    currentExerciseSets,
    isLastExercise,
    toggleSet,
    nextExercise,
    prevExercise,
    finish,
    finished,
  };
}
