import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { activeSessionRepository } from '@/repositories/activeSessionRepository';
import { sessionRepository } from '@/repositories/sessionRepository';
import { workoutRepository } from '@/repositories/workoutRepository';
import {
  ActiveSession,
  Exercise,
  ExerciseGroup,
  Workout,
  WorkoutInput,
  WorkoutSession,
} from '@/types';
import { createId } from '@/utils/id';
import { normalizeWorkout } from '@/utils/workout';

/** Dados de uma sessão concluída, sem os campos gerados (id/completedAt). */
export type SessionInput = Omit<WorkoutSession, 'id' | 'completedAt'>;

/** Um treino em andamento expira após 3h sem atualização. */
export const ACTIVE_SESSION_EXPIRY_MS = 3 * 60 * 60 * 1000;

/** Retorna a sessão se ainda válida (não expirada); senão null. */
function freshOrNull(s: ActiveSession | null): ActiveSession | null {
  if (!s) return null;
  return Date.now() - s.updatedAt <= ACTIVE_SESSION_EXPIRY_MS ? s : null;
}

/**
 * Store global de treinos: expõe o CRUD, centraliza o estado e persiste
 * automaticamente. As telas consomem via `useWorkouts()` e ficam sem lógica
 * de dados.
 */
interface WorkoutStoreValue {
  workouts: Workout[];
  /** Histórico de sessões concluídas, do mais recente para o mais antigo. */
  sessions: WorkoutSession[];
  /** Treino em andamento (ou null). Já filtrado por expiração. */
  activeSession: ActiveSession | null;
  loading: boolean;
  getWorkout: (id: string) => Workout | undefined;
  createWorkout: (input: WorkoutInput) => Workout;
  updateWorkout: (id: string, input: WorkoutInput) => void;
  deleteWorkout: (id: string) => void;
  /** Define a nova ordem completa dos treinos (usado no arrastar-e-soltar). */
  reorderWorkouts: (ordered: Workout[]) => void;
  /** Reordena os grupos de um treino. */
  reorderGroups: (workoutId: string, ordered: ExerciseGroup[]) => void;
  /** Reordena os exercícios de um grupo. */
  reorderExercises: (workoutId: string, groupId: string, ordered: Exercise[]) => void;
  /** Registra uma sessão concluída no histórico. */
  logSession: (input: SessionInput) => void;
  /** Limpa todo o histórico de sessões (recentes). */
  clearSessions: () => void;
  /** Cria/atualiza o treino em andamento (persiste). */
  saveActiveSession: (session: ActiveSession) => void;
  /** Encerra o treino em andamento. */
  clearActiveSession: () => void;
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
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [loading, setLoading] = useState(true);

  // Carrega treinos, histórico e treino em andamento na montagem.
  useEffect(() => {
    let active = true;
    (async () => {
      const [storedWorkouts, storedSessions, storedActive] = await Promise.all([
        workoutRepository.getAll(),
        sessionRepository.getAll(),
        activeSessionRepository.get(),
      ]);
      if (!active) return;
      setWorkouts(storedWorkouts.map(normalizeWorkout));
      setSessions(sortRecent(storedSessions));
      const fresh = freshOrNull(storedActive);
      if (!fresh && storedActive) void activeSessionRepository.clear();
      setActiveSession(fresh);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const clearSessions = useCallback(() => {
    setSessions([]);
    void sessionRepository.clear();
  }, []);

  const saveActiveSession = useCallback((session: ActiveSession) => {
    setActiveSession(session);
    void activeSessionRepository.save(session);
  }, []);

  const clearActiveSession = useCallback(() => {
    setActiveSession(null);
    void activeSessionRepository.clear();
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
      commit((prev) => [...prev, workout]);
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

  const reorderWorkouts = useCallback(
    (ordered: Workout[]) => {
      commit(() => ordered);
    },
    [commit],
  );

  const reorderGroups = useCallback(
    (workoutId: string, ordered: ExerciseGroup[]) => {
      commit((prev) =>
        prev.map((w) =>
          w.id === workoutId ? { ...w, groups: ordered, updatedAt: Date.now() } : w,
        ),
      );
    },
    [commit],
  );

  const reorderExercises = useCallback(
    (workoutId: string, groupId: string, ordered: Exercise[]) => {
      commit((prev) =>
        prev.map((w) =>
          w.id === workoutId
            ? {
                ...w,
                groups: w.groups.map((g) =>
                  g.id === groupId ? { ...g, exercises: ordered } : g,
                ),
                updatedAt: Date.now(),
              }
            : w,
        ),
      );
    },
    [commit],
  );

  const value = useMemo<WorkoutStoreValue>(
    () => ({
      workouts,
      sessions,
      activeSession,
      loading,
      getWorkout,
      createWorkout,
      updateWorkout,
      deleteWorkout,
      reorderWorkouts,
      reorderGroups,
      reorderExercises,
      logSession,
      clearSessions,
      saveActiveSession,
      clearActiveSession,
    }),
    [
      workouts,
      sessions,
      activeSession,
      loading,
      getWorkout,
      createWorkout,
      updateWorkout,
      deleteWorkout,
      reorderWorkouts,
      reorderGroups,
      reorderExercises,
      logSession,
      clearSessions,
      saveActiveSession,
      clearActiveSession,
    ],
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
