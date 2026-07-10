import { useCallback, useMemo, useState } from 'react';

import { ActiveSession, Workout } from '@/types';
import { useStopwatch } from './useStopwatch';

/** Pausa padrão entre séries (segundos), ajustável durante o treino. */
export const DEFAULT_REST_SECONDS = 90;

export interface SessionSet {
  exerciseId: string;
  setIndex: number;
  completed: boolean;
}

/** Chave estável de uma série, usada para persistir/retomar. */
export const setKey = (exerciseId: string, setIndex: number) =>
  `${exerciseId}:${setIndex}`;

/** Tempo decorrido reconstruído de um snapshot (continua contando em 2º plano). */
function elapsedFrom(initial?: ActiveSession): number {
  if (!initial) return 0;
  const extra =
    initial.running && initial.lastResumeAt ? Date.now() - initial.lastResumeAt : 0;
  return initial.accumulatedMs + extra;
}

/**
 * Orquestra a execução de um treino: duração total (cronômetro), controle de
 * séries concluídas, progresso e navegação entre exercícios. O timer de pausa
 * em si vive no RestTimer/useCountdown. Se `initial` for passado, retoma o
 * treino de onde parou.
 */
export function useWorkoutSession(workout: Workout, initial?: ActiveSession) {
  const stopwatch = useStopwatch(initial ? initial.running : true, elapsedFrom(initial));

  // Sequência achatada de exercícios, cada um com o nome do seu grupo.
  const items = useMemo(
    () =>
      workout.groups.flatMap((g) =>
        g.exercises.map((exercise) => ({ exercise, groupName: g.name })),
      ),
    [workout],
  );

  const [sets, setSets] = useState<SessionSet[]>(() => {
    const done = new Set(initial?.completedSetKeys ?? []);
    return items.flatMap(({ exercise }) =>
      Array.from({ length: exercise.sets }, (_, setIndex) => ({
        exerciseId: exercise.id,
        setIndex,
        completed: done.has(setKey(exercise.id, setIndex)),
      })),
    );
  });
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(
    initial?.currentExerciseIndex ?? 0,
  );
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
  const goToExercise = useCallback(
    (index: number) =>
      setCurrentExerciseIndex(Math.max(0, Math.min(index, items.length - 1))),
    [items.length],
  );

  /**
   * Estado por exercício (para a visão geral): um exercício está concluído
   * quando todas as suas séries foram marcadas.
   */
  const exerciseStatus = useMemo(
    () =>
      items.map(({ exercise, groupName }, index) => {
        const exSets = sets.filter((s) => s.exerciseId === exercise.id);
        const done = exSets.filter((s) => s.completed).length;
        return {
          id: exercise.id,
          name: exercise.name,
          groupName,
          index,
          totalSets: exSets.length,
          completedSets: done,
          completed: exSets.length > 0 && done === exSets.length,
        };
      }),
    [items, sets],
  );
  const completedExercises = exerciseStatus.filter((e) => e.completed).length;

  const finish = useCallback(() => {
    stopwatch.pause();
    setFinished(true);
  }, [stopwatch]);

  const completedSetKeys = useMemo(
    () => sets.filter((s) => s.completed).map((s) => setKey(s.exerciseId, s.setIndex)),
    [sets],
  );

  return {
    elapsedMs: stopwatch.elapsedMs,
    running: stopwatch.running,
    pause: stopwatch.pause,
    resume: stopwatch.start,
    sets,
    completedSetKeys,
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
    exerciseStatus,
    completedExercises,
    toggleSet,
    nextExercise,
    prevExercise,
    goToExercise,
    finish,
    finished,
  };
}
