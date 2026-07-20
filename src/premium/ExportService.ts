import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { RestDurations, restSeconds } from '@/services/rest';
import { Exercise, Workout } from '@/types';

/**
 * Serviço de EXPORTAÇÃO de treinos (Pro). Gera PDF (via expo-print) ou TXT e
 * abre a folha de compartilhamento do sistema (WhatsApp, e-mail, Drive,
 * impressão...). Desacoplado da UI: recebe o treino, o `t` e a config de
 * descanso e devolve/compartilha o arquivo.
 */
export type ExportFormat = 'pdf' | 'txt';

type TFn = (key: string, options?: Record<string, unknown>) => string;

const isGrouped = (w: Workout) =>
  w.groups.length > 1 || w.groups.some((g) => g.name.trim().length > 0);

/** Descrição do descanso: categoria + segundos (ou só segundos no legado). */
function restLabel(ex: Exercise, durations: RestDurations, t: TFn): string {
  const secs = restSeconds(ex, durations);
  const seconds = t('rest.seconds', { count: secs });
  return ex.restType ? `${t(`rest.${ex.restType}`)} (${seconds})` : seconds;
}

function loadLabel(ex: Exercise, t: TFn): string {
  return ex.weight > 0 ? t('details.weightKg', { weight: ex.weight }) : t('details.bodyweight');
}

/** Nome de arquivo seguro a partir do nome do treino. */
function safeFileName(name: string): string {
  const base = name.trim().replace(/[^\p{L}\p{N}]+/gu, '_').replace(/^_+|_+$/g, '');
  return base.length > 0 ? base : 'workout';
}

// ---------- TXT ----------

export function buildWorkoutText(workout: Workout, t: TFn, durations: RestDurations): string {
  const grouped = isGrouped(workout);
  const lines: string[] = [];
  lines.push(workout.name.toUpperCase());
  lines.push('='.repeat(Math.max(4, workout.name.length)));
  lines.push('');

  workout.groups.forEach((g) => {
    if (grouped && g.name.trim().length > 0) {
      lines.push(`## ${g.name.trim().toUpperCase()}`);
    }
    g.exercises.forEach((ex, i) => {
      lines.push(`${i + 1}. ${ex.name}`);
      lines.push(
        `   ${t('details.setsReps', { sets: ex.sets, reps: ex.reps })} · ` +
          `${loadLabel(ex, t)} · ${t('export.rest')}: ${restLabel(ex, durations, t)}`,
      );
      if (ex.description?.trim()) {
        lines.push(`   ${t('export.notes')}: ${ex.description.trim()}`);
      }
      lines.push('');
    });
  });

  lines.push('—');
  lines.push(t('export.generatedBy'));
  return lines.join('\n');
}

// ---------- PDF (HTML) ----------

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildWorkoutHtml(workout: Workout, t: TFn, durations: RestDurations): string {
  const grouped = isGrouped(workout);
  const groupsHtml = workout.groups
    .map((g) => {
      const head =
        grouped && g.name.trim().length > 0
          ? `<h2>${escapeHtml(g.name.trim())}</h2>`
          : '';
      const items = g.exercises
        .map((ex, i) => {
          const notes = ex.description?.trim()
            ? `<div class="notes">${escapeHtml(ex.description.trim())}</div>`
            : '';
          return `<div class="ex">
              <div class="ex-h"><span class="num">${i + 1}</span><span class="name">${escapeHtml(
                ex.name,
              )}</span></div>
              <div class="meta">${escapeHtml(
                `${t('details.setsReps', { sets: ex.sets, reps: ex.reps })} · ${loadLabel(
                  ex,
                  t,
                )} · ${t('export.rest')}: ${restLabel(ex, durations, t)}`,
              )}</div>
              ${notes}
            </div>`;
        })
        .join('');
      return head + items;
    })
    .join('');

  return `<!doctype html>
<html>
<head><meta charset="utf-8" />
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, Roboto, Helvetica, Arial, sans-serif; color: #1a1a1a; padding: 32px; }
  h1 { font-size: 26px; margin: 0 0 4px; color: #ff149d; }
  h2 { font-size: 13px; letter-spacing: 2px; text-transform: uppercase; color: #888; margin: 24px 0 10px; }
  .ex { border: 1px solid #eee; border-radius: 12px; padding: 12px 14px; margin-bottom: 10px; }
  .ex-h { display: flex; align-items: center; gap: 10px; }
  .num { display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; border-radius: 8px; background: #ffe6f4; color: #ff149d; font-weight: 700; font-size: 13px; }
  .name { font-weight: 700; font-size: 15px; }
  .meta { color: #555; font-size: 13px; margin-top: 6px; }
  .notes { color: #777; font-size: 12px; margin-top: 4px; font-style: italic; }
  .footer { margin-top: 28px; color: #aaa; font-size: 11px; text-align: center; }
</style>
</head>
<body>
  <h1>${escapeHtml(workout.name)}</h1>
  ${groupsHtml}
  <div class="footer">${escapeHtml(t('export.generatedBy'))}</div>
</body>
</html>`;
}

// ---------- Exportar + compartilhar ----------

export async function exportWorkout(
  workout: Workout,
  format: ExportFormat,
  t: TFn,
  durations: RestDurations,
): Promise<void> {
  const canShare = await Sharing.isAvailableAsync().catch(() => false);

  if (format === 'pdf') {
    const html = buildWorkoutHtml(workout, t, durations);
    const { uri } = await Print.printToFileAsync({ html });
    if (canShare) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: workout.name,
        UTI: 'com.adobe.pdf',
      });
    }
    return;
  }

  const text = buildWorkoutText(workout, t, durations);
  const uri = `${FileSystem.cacheDirectory}${safeFileName(workout.name)}.txt`;
  await FileSystem.writeAsStringAsync(uri, text);
  if (canShare) {
    await Sharing.shareAsync(uri, {
      mimeType: 'text/plain',
      dialogTitle: workout.name,
      UTI: 'public.plain-text',
    });
  }
}
