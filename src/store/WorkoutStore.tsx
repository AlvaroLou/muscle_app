import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { sessionRepository } from '@/repositories/sessionRepository';
import { workoutRepository } from '@/repositories/workoutRepository';
import { ExerciseGroup, Workout, WorkoutInput, WorkoutSession } from '@/types';
import { createId } from '@/utils/id';
import { normalizeWorkout } from '@/utils/workout';

/** Dados de uma sessão concluída, sem os campos gerados (id/completedAt). */
export type SessionInput = Omit<WorkoutSession, 'id' | 'completedAt'>;

/**
 * Store global de treinos: expõe o CRUD, centraliza o estado e persiste
 * automaticamente. As telas consomem via `useWorkouts()` e ficam sem lógica
 * de dados.
 */
interface WorkoutStoreValue {
  workouts: Workout[];
  /** Histórico de sessões concluídas, do mais recente para o mais antigo. */
  sessions: WorkoutSession[];
  loading: boolean;
  getWorkout: (id: string) => Workout | undefined;
  createWorkout: (input: WorkoutInput) => Workout;
  updateWorkout: (id: string, input: WorkoutInput) => void;
  deleteWorkout: (id: string) => void;
  /** Registra uma sessão concluída no histórico. */
  logSession: (input: SessionInput) => void;
}

const WorkoutContext = createContext<WorkoutStoreValue | undefined>(undefined);

/** Ordena sessões da mais recente para a mais antiga. */
function sortRecent(list: WorkoutSession[]): WorkoutSession[] {
  return [...list].sort((a, b) => b.completedAt - a.completedAt);
}

/** Gera grupos e exercícios com ids a partir da entrada do formulário. */
function withIds(input: WorkoutInput): ExerciseGroup[] {
  return input.groups.map((g) => ({
    id: createId('g_'),
    name: g.name.trim(),
    exercises: g.exercises.map((e) => ({ ...e, id: createId('e_') })),
  }));
}

export function WorkoutProvider({ children }: { children: React.ReactNode }) {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);

  // Carrega treinos e histórico salvos na montagem. Sem seed: começa vazio.
  useEffect(() => {
    let active = true;
    (async () => {
      const [storedWorkouts, storedSessions] = await Promise.all([
        workoutRepository.getAll(),
        sessionRepository.getAll(),
      ]);
      if (!active) return;
      setWorkouts(storedWorkouts.map(normalizeWorkout));
      setSessions(sortRecent(storedSessions));
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  /** Aplica transformação imutável, persiste e atualiza o estado. */
  const commit = useCallback((updater: (prev: Workout[]) => Workout[]) => {
    setWorkouts((prev) => {
      const next = updater(prev);
      void workoutRepository.saveAll(next);
      return next;
    });
  }, []);

  const logSession = useCallback((input: SessionInput) => {
    const session: WorkoutSession = {
      ...input,
      id: createId('s_'),
      completedAt: Date.now(),
    };
    setSessions((prev) => {
      const next = [session, ...prev];
      void sessionRepository.saveAll(next);
      return next;
    });
  }, []);

  const getWorkout = useCallback(
    (id: string) => workouts.find((w) => w.id === id),
    [workouts],
  );

  const createWorkout = useCallback(
    (input: WorkoutInput) => {
      const now = Date.now();
      const workout: Workout = {
        id: createId('w_'),
        name: input.name.trim(),
        groups: withIds(input),
        createdAt: now,
        updatedAt: now,
      };
      commit((prev) => [workout, ...prev]);
      return workout;
    },
    [commit],
  );

  const updateWorkout = useCallback(
    (id: string, input: WorkoutInput) => {
      commit((prev) =>
        prev.map((w) =>
          w.id === id
            ? {
                ...w,
                name: input.name.trim(),
                groups: withIds(input),
                updatedAt: Date.now(),
              }
            : w,
        ),
      );
    },
    [commit],
  );

  const deleteWorkout = useCallback(
    (id: string) => {
      commit((prev) => prev.filter((w) => w.id !== id));
    },
    [commit],
  );

  const value = useMemo<WorkoutStoreValue>(
    () => ({
      workouts,
      sessions,
      loading,
      getWorkout,
      createWorkout,
      updateWorkout,
      deleteWorkout,
      logSession,
    }),
    [workouts, sessions, loading, getWorkout, createWorkout, updateWorkout, deleteWorkout, logSession],
  );

  return <WorkoutContext.Provider value={value}>{children}</WorkoutContext.Provider>;
}

/** Hook de acesso ao store. Lança se usado fora do provider. */
export function useWorkouts(): WorkoutStoreValue {
  const ctx = useContext(WorkoutContext);
  if (!ctx) {
    throw new Error('useWorkouts deve ser usado dentro de <WorkoutProvider>.');
  }
  return ctx;
}
