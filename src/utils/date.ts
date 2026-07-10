/**
 * Utilitários de data reais (sem dados fictícios). Baseados na data atual do
 * dispositivo. Usados no cabeçalho e no calendário semanal da Home.
 *
 * Localizados: os nomes de dia/mês e "Hoje/Ontem" seguem o idioma ativo do
 * i18n. Usamos tabelas por idioma (em vez de Intl) para manter o estilo
 * maiúsculo do design e evitar diferenças de suporte a Intl no Hermes.
 */
import i18n from '@/i18n';

interface DateStrings {
  weekdayShort: string[]; // índice por getDay(): 0=dom..6=sáb
  monthShort: string[];
  weekLetters: string[]; // semana começando na segunda
  today: string;
  yesterday: string;
}

const STRINGS: Record<string, DateStrings> = {
  en: {
    weekdayShort: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
    monthShort: [
      'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
      'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
    ],
    weekLetters: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
    today: 'Today',
    yesterday: 'Yesterday',
  },
  'pt-BR': {
    weekdayShort: ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'],
    monthShort: [
      'JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN',
      'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ',
    ],
    weekLetters: ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'],
    today: 'Hoje',
    yesterday: 'Ontem',
  },
};

/** Tabela de textos do idioma ativo (fallback para inglês). */
function strings(): DateStrings {
  return STRINGS[i18n.language] ?? STRINGS.en;
}

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
  const s = strings();
  const d = new Date(ts);
  const diffDays = Math.round(
    (dayStart(now).getTime() - dayStart(d).getTime()) / 86400000,
  );
  if (diffDays === 0) return s.today;
  if (diffDays === 1) return s.yesterday;
  return `${s.weekdayShort[d.getDay()]}, ${d.getDate()} ${s.monthShort[d.getMonth()]}`;
}

function dayStart(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Cabeçalho tipo "QUA, 2 JUL" com a data atual. */
export function headerDate(now: Date = new Date()): string {
  const s = strings();
  return `${s.weekdayShort[now.getDay()]}, ${now.getDate()} ${s.monthShort[now.getMonth()]}`;
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

  return strings().weekLetters.map((letter, i) => {
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
