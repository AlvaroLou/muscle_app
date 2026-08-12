import { MuscleGroup, WorkoutSession } from '@/types';
import { dayKey } from '@/utils/date';

/**
 * Estatísticas avançadas (Pro) derivadas do histórico de sessões. Função PURA e
 * tolerante a sessões antigas (campos ricos são opcionais). A série
 * `weeklyVolume` já vem estruturada para alimentar gráficos no futuro.
 */
export interface AdvancedStats {
  totalWorkouts: number;
  /** Horas treinadas (soma das durações). */
  totalHours: number;
  /** Carga total movimentada (kg). */
  totalVolume: number;
  /** Duração média por treino (ms). */
  avgDurationMs: number;
  mostPerformedExercise?: { name: string; count: number };
  topMuscleGroup?: { group: MuscleGroup; sets: number };
  sessionsThisWeek: number;
  sessionsThisMonth: number;
  activeDaysThisMonth: number;
  longestStreak: number;
  currentStreak: number;
  /** Volume por semana (cronológico), pronto para gráfico. */
  weeklyVolume: { weekStart: number; volume: number }[];
}

/** Início da semana (segunda-feira, meia-noite local) de um timestamp. */
function weekStart(ts: number): number {
  const d = new Date(ts);
  const offsetToMonday = (d.getDay() + 6) % 7;
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - offsetToMonday);
  return monday.getTime();
}

const DAY_MS = 86400000;
const WEEK_MS = 7 * DAY_MS;

export function buildAdvancedStats(
  sessions: WorkoutSession[],
  now: Date = new Date(),
): AdvancedStats {
  const totalWorkouts = sessions.length;
  let totalMs = 0;
  let totalVolume = 0;

  const exerciseCounts = new Map<string, number>();
  const muscleSets = new Map<MuscleGroup, number>();

  for (const s of sessions) {
    totalMs += s.durationMs;
    totalVolume += s.totalVolume ?? 0;
    for (const ex of s.exercises ?? []) {
      exerciseCounts.set(ex.name, (exerciseCounts.get(ex.name) ?? 0) + 1);
      if (ex.muscleGroup) {
        muscleSets.set(ex.muscleGroup, (muscleSets.get(ex.muscleGroup) ?? 0) + ex.setsDone);
      }
    }
  }

  const mostPerformedExercise = topEntry(exerciseCounts, (name, count) => ({ name, count }));
  const topMuscleGroup = topEntry(muscleSets, (group, sets) => ({ group, sets }));

  // Frequência (semana/mês corrente) e dias ativos no mês.
  const thisWeekStart = weekStart(now.getTime());
  const monthY = now.getFullYear();
  const monthM = now.getMonth();
  let sessionsThisWeek = 0;
  let sessionsThisMonth = 0;
  const activeDayKeysThisMonth = new Set<string>();
  for (const s of sessions) {
    if (s.completedAt >= thisWeekStart) sessionsThisWeek++;
    const d = new Date(s.completedAt);
    if (d.getFullYear() === monthY && d.getMonth() === monthM) {
      sessionsThisMonth++;
      activeDayKeysThisMonth.add(dayKey(s.completedAt));
    }
  }

  const { longestStreak, currentStreak } = streaks(sessions, now);
  const weeklyVolume = weeklyVolumeSeries(sessions, now, 8);

  return {
    totalWorkouts,
    totalHours: totalMs / 3600000,
    totalVolume,
    avgDurationMs: totalWorkouts > 0 ? totalMs / totalWorkouts : 0,
    mostPerformedExercise,
    topMuscleGroup,
    sessionsThisWeek,
    sessionsThisMonth,
    activeDaysThisMonth: activeDayKeysThisMonth.size,
    longestStreak,
    currentStreak,
    weeklyVolume,
  };
}

/** Entrada de maior valor do mapa, mapeada para um objeto (ou undefined). */
function topEntry<K, R>(
  map: Map<K, number>,
  make: (key: K, value: number) => R,
): R | undefined {
  let bestKey: K | undefined;
  let best = -1;
  for (const [k, v] of map) {
    if (v > best) {
      best = v;
      bestKey = k;
    }
  }
  return bestKey === undefined ? undefined : make(bestKey, best);
}

/** Maior sequência e sequência atual (em dias consecutivos com treino). */
function streaks(
  sessions: WorkoutSession[],
  now: Date,
): { longestStreak: number; currentStreak: number } {
  if (sessions.length === 0) return { longestStreak: 0, currentStreak: 0 };

  // Dias distintos (meia-noite local), ordenados.
  const days = Array.from(
    new Set(
      sessions.map((s) => {
        const d = new Date(s.completedAt);
        return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      }),
    ),
  ).sort((a, b) => a - b);

  let longest = 1;
  let run = 1;
  for (let i = 1; i < days.length; i++) {
    run = days[i] - days[i - 1] === DAY_MS ? run + 1 : 1;
    if (run > longest) longest = run;
  }

  // Sequência atual: conta para trás a partir de hoje/ontem.
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const daySet = new Set(days);
  let current = 0;
  if (daySet.has(todayStart) || daySet.has(todayStart - DAY_MS)) {
    let cursor = daySet.has(todayStart) ? todayStart : todayStart - DAY_MS;
    while (daySet.has(cursor)) {
      current++;
      cursor -= DAY_MS;
    }
  }

  return { longestStreak: longest, currentStreak: current };
}

/** Volume somado por semana, nas últimas `weeks` semanas (cronológico). */
function weeklyVolumeSeries(
  sessions: WorkoutSession[],
  now: Date,
  weeks: number,
): { weekStart: number; volume: number }[] {
  const currentWeekStart = weekStart(now.getTime());
  const series: { weekStart: number; volume: number }[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    series.push({ weekStart: currentWeekStart - i * WEEK_MS, volume: 0 });
  }
  const indexByStart = new Map(series.map((w, i) => [w.weekStart, i]));
  for (const s of sessions) {
    const ws = weekStart(s.completedAt);
    const idx = indexByStart.get(ws);
    if (idx !== undefined) series[idx].volume += s.totalVolume ?? 0;
  }
  return series;
}
