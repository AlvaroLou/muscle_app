/**
 * Utilitários de data reais (sem dados fictícios). Baseados na data atual do
 * dispositivo. Usados no cabeçalho e no calendário semanal da Home.
 */

const WEEKDAY_SHORT = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
const MONTH_SHORT = [
  'JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN',
  'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ',
];
/** Letras da semana começando na segunda (Seg..Dom). */
const WEEK_LETTERS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];

export interface WeekDay {
  letter: string;
  dayOfMonth: number;
  isToday: boolean;
  /** Houve pelo menos uma sessão concluída neste dia. */
  trained: boolean;
}

/** Chave "AAAA-MM-DD" (local) de um timestamp, para comparar por dia. */
export function dayKey(ts: number | Date): string {
  const d = typeof ts === 'number' ? new Date(ts) : ts;
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/** Rótulo relativo do dia: "Hoje", "Ontem" ou "SEG, 2 JUL". */
export function relativeDay(ts: number, now: Date = new Date()): string {
  const d = new Date(ts);
  const diffDays = Math.round(
    (dayStart(now).getTime() - dayStart(d).getTime()) / 86400000,
  );
  if (diffDays === 0) return 'Hoje';
  if (diffDays === 1) return 'Ontem';
  return `${WEEKDAY_SHORT[d.getDay()]}, ${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`;
}

function dayStart(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Cabeçalho tipo "QUA, 2 JUL" com a data atual. */
export function headerDate(now: Date = new Date()): string {
  return `${WEEKDAY_SHORT[now.getDay()]}, ${now.getDate()} ${MONTH_SHORT[now.getMonth()]}`;
}

/**
 * Os 7 dias da semana atual (segunda a domingo), com o dia real destacado.
 * `trainedKeys` (via `dayKey`) marca os dias com sessão concluída.
 */
export function currentWeek(
  trainedKeys: Set<string> = new Set(),
  now: Date = new Date(),
): WeekDay[] {
  // Deslocamento até a segunda-feira (getDay: 0=dom..6=sáb).
  const offsetToMonday = (now.getDay() + 6) % 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - offsetToMonday);

  return WEEK_LETTERS.map((letter, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return {
      letter,
      dayOfMonth: d.getDate(),
      isToday: d.toDateString() === now.toDateString(),
      trained: trainedKeys.has(dayKey(d)),
    };
  });
}
