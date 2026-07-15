import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { STANDARD_EXERCISES } from '@/data/exerciseLibrary';
import { exerciseLibraryRepository } from '@/repositories/exerciseLibraryRepository';
import { Equipment, LibraryExercise, MuscleGroup, RestType } from '@/types';
import { createId } from '@/utils/id';

export interface CustomExerciseInput {
  name: string;
  muscleGroup: MuscleGroup;
  secondaryMuscles: MuscleGroup[];
  equipment: Equipment;
  restType?: RestType;
  instructions?: string;
  tips?: string;
  notes?: string;
}

interface ExerciseLibraryValue {
  /** Catálogo completo (padrão + personalizados). */
  exercises: LibraryExercise[];
  favorites: Set<string>;
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => void;
  addCustom: (input: CustomExerciseInput) => LibraryExercise;
  updateCustom: (id: string, input: CustomExerciseInput) => void;
  deleteCustom: (id: string) => void;
  duplicateCustom: (id: string) => void;
  getById: (id: string) => LibraryExercise | undefined;
}

const ExerciseLibraryContext = createContext<ExerciseLibraryValue | undefined>(undefined);

function customFields(input: CustomExerciseInput): LibraryExercise['custom'] {
  return {
    name: input.name.trim(),
    notes: input.notes?.trim() || undefined,
    instructions: input.instructions?.trim() || undefined,
    tips: input.tips?.trim() || undefined,
  };
}

function toCustom(input: CustomExerciseInput): LibraryExercise {
  return {
    id: createId('lx_'),
    muscleGroup: input.muscleGroup,
    secondaryMuscles: input.secondaryMuscles,
    equipment: input.equipment,
    level: 'beginner',
    restType: input.restType,
    isCustom: true,
    custom: customFields(input),
  };
}

export function ExerciseLibraryProvider({ children }: { children: React.ReactNode }) {
  const [custom, setCustom] = useState<LibraryExercise[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    let active = true;
    (async () => {
      const [storedCustom, storedFavs] = await Promise.all([
        exerciseLibraryRepository.getCustom(),
        exerciseLibraryRepository.getFavorites(),
      ]);
      if (!active) return;
      setCustom(storedCustom);
      setFavorites(new Set(storedFavs));
    })();
    return () => {
      active = false;
    };
  }, []);

  const commitCustom = useCallback((next: LibraryExercise[]) => {
    setCustom(next);
    void exerciseLibraryRepository.saveCustom(next);
  }, []);

  const commitFavorites = useCallback((next: Set<string>) => {
    setFavorites(next);
    void exerciseLibraryRepository.saveFavorites([...next]);
  }, []);

  const exercises = useMemo(() => [...custom, ...STANDARD_EXERCISES], [custom]);

  const getById = useCallback(
    (id: string) => exercises.find((e) => e.id === id),
    [exercises],
  );

  const isFavorite = useCallback((id: string) => favorites.has(id), [favorites]);

  const toggleFavorite = useCallback(
    (id: string) => {
      const next = new Set(favorites);
      next.has(id) ? next.delete(id) : next.add(id);
      commitFavorites(next);
    },
    [favorites, commitFavorites],
  );

  const addCustom = useCallback(
    (input: CustomExerciseInput) => {
      const item = toCustom(input);
      commitCustom([item, ...custom]);
      return item;
    },
    [custom, commitCustom],
  );

  const updateCustom = useCallback(
    (id: string, input: CustomExerciseInput) => {
      commitCustom(
        custom.map((e) =>
          e.id === id
            ? {
                ...e,
                muscleGroup: input.muscleGroup,
                secondaryMuscles: input.secondaryMuscles,
                equipment: input.equipment,
                restType: input.restType,
                custom: customFields(input),
              }
            : e,
        ),
      );
    },
    [custom, commitCustom],
  );

  const deleteCustom = useCallback(
    (id: string) => {
      commitCustom(custom.filter((e) => e.id !== id));
      if (favorites.has(id)) {
        const next = new Set(favorites);
        next.delete(id);
        commitFavorites(next);
      }
    },
    [custom, favorites, commitCustom, commitFavorites],
  );

  const duplicateCustom = useCallback(
    (id: string) => {
      const src = custom.find((e) => e.id === id);
      if (!src) return;
      const copy: LibraryExercise = { ...src, id: createId('lx_') };
      commitCustom([copy, ...custom]);
    },
    [custom, commitCustom],
  );

  const value = useMemo<ExerciseLibraryValue>(
    () => ({
      exercises,
      favorites,
      isFavorite,
      toggleFavorite,
      addCustom,
      updateCustom,
      deleteCustom,
      duplicateCustom,
      getById,
    }),
    [
      exercises,
      favorites,
      isFavorite,
      toggleFavorite,
      addCustom,
      updateCustom,
      deleteCustom,
      duplicateCustom,
      getById,
    ],
  );

  return (
    <ExerciseLibraryContext.Provider value={value}>
      {children}
    </ExerciseLibraryContext.Provider>
  );
}

export function useExerciseLibrary(): ExerciseLibraryValue {
  const ctx = useContext(ExerciseLibraryContext);
  if (!ctx) {
    throw new Error('useExerciseLibrary deve ser usado dentro de <ExerciseLibraryProvider>.');
  }
  return ctx;
}
