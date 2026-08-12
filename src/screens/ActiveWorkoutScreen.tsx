import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAds } from '@/ads/AdsProvider';
import { ConfirmSheet } from '@/components/ConfirmSheet';
import { GradientButton } from '@/components/GradientButton';
import { Icon } from '@/components/Icon';
import { ProgressBar } from '@/components/ProgressBar';
import { RestTimer } from '@/components/RestTimer';
import { useWorkoutSession } from '@/hooks/useWorkoutSession';
import { activeSessionRepository } from '@/repositories/activeSessionRepository';
import { restSeconds } from '@/services/rest';
import { usePreferences } from '@/store/PreferencesStore';
import { useWorkouts } from '@/store/WorkoutStore';
import { buildSessionStats } from '@/utils/sessionSummary';
import { ActiveSession, Workout } from '@/types';
import { fonts, ThemeColors } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { formatDuration } from '@/utils/time';
import { allExercises } from '@/utils/workout';
import { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'ActiveWorkout'>;

export function ActiveWorkoutScreen() {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const route = useRoute<RouteProp<RootStackParamList, 'ActiveWorkout'>>();
  const { getWorkout, activeSession } = useWorkouts();
  const { workoutId, groupId } = route.params;
  const raw = getWorkout(workoutId);

  // Se veio um groupId, treina só aquele grupo — não o treino inteiro.
  const workout = useMemo(() => {
    if (!raw) return undefined;
    if (!groupId) return raw;
    const group = raw.groups.find((g) => g.id === groupId);
    if (!group) return raw;
    return { ...raw, name: `${raw.name} · ${group.name}`, groups: [group] };
  }, [raw, groupId]);

  // Retoma a sessão em andamento só se for exatamente deste treino/grupo.
  // Capturado uma vez (a persistência não deve reinicializar o estado).
  const initialRef = useRef<ActiveSession | undefined>(
    activeSession &&
      activeSession.workoutId === workoutId &&
      activeSession.groupId === groupId
      ? activeSession
      : undefined,
  );

  if (!workout || allExercises(workout).length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.notFound}>{t('active.noExercises')}</Text>
          <GradientButton label={t('active.goBack')} onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <RunningSession
      workout={workout}
      groupId={groupId}
      initial={initialRef.current}
      navigation={navigation}
    />
  );
}

function RunningSession({
  workout,
  groupId,
  initial,
  navigation,
}: {
  workout: Workout;
  groupId?: string;
  initial?: ActiveSession;
  navigation: Nav;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { restDurations } = usePreferences();
  const ads = useAds();
  const { workouts, logSession, saveActiveSession, clearActiveSession } = useWorkouts();
  const session = useWorkoutSession(workout, initial);
  // `seconds` = duração do descanso; `nonce` incrementa a cada série concluída
  // para reabrir o contador mesmo com tempos iguais.
  const [rest, setRest] = useState<{ seconds: number; nonce: number } | null>(null);
  const [quitOpen, setQuitOpen] = useState(false);
  const [rewardMsg, setRewardMsg] = useState<string | null>(null);
  const logged = useRef(false);
  // true quando o treino foi finalizado ou descartado: não regravar em 2º plano.
  const endedRef = useRef(false);
  // true quando o descanso aberto foi da última série do exercício: ao encerrar
  // o descanso (pular ou tempo acabar), avança automaticamente para o próximo.
  const advanceRef = useRef(false);
  // true quando o descanso aberto foi da última série do último exercício: ao
  // encerrar o descanso, finaliza o treino automaticamente.
  const finishRef = useRef(false);

  const {
    elapsedMs,
    running,
    pause,
    resume,
    progress,
    completedSets,
    completedSetKeys,
    setWeights,
    setSetWeight,
    totalSets,
    totalExercises,
    nextExerciseName,
    currentExercise,
    currentGroupName,
    currentExerciseIndex,
    currentExerciseSets,
    isLastExercise,
    exerciseStatus,
    toggleSet,
    nextExercise,
    prevExercise,
    goToExercise,
    finish,
    finished,
  } = session;

  const pct = Math.round(progress * 100);

  const order = useMemo(() => {
    const o = workouts.findIndex((w) => w.id === workout.id);
    return o < 0 ? 0 : o;
  }, [workouts, workout.id]);

  // Monta o retrato atual do treino em andamento (para persistir/retomar).
  const buildActive = (): ActiveSession => ({
    workoutId: workout.id,
    groupId,
    workoutName: workout.name,
    order,
    currentExerciseIndex,
    completedSetKeys,
    setWeights,
    accumulatedMs: elapsedMs,
    lastResumeAt: running ? Date.now() : null,
    running,
    updatedAt: Date.now(),
  });

  // Retrato sempre atualizado, para salvar ao sair da tela.
  const snapshotRef = useRef<ActiveSession | null>(null);
  snapshotRef.current = buildActive();

  // Persiste a cada mudança relevante (séries, exercício atual, pausa/retomada).
  useEffect(() => {
    if (!finished) saveActiveSession(buildActive());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completedSetKeys, currentExerciseIndex, running]);

  // Ao sair da tela sem finalizar/descartar, mantém o treino em segundo plano.
  useEffect(
    () => () => {
      if (!endedRef.current && snapshotRef.current) {
        void activeSessionRepository.save(snapshotRef.current);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Registra a sessão no histórico assim que o treino é finalizado (uma vez).
  useEffect(() => {
    if (finished && !logged.current) {
      logged.current = true;
      endedRef.current = true;
      const stats = buildSessionStats(workout, completedSetKeys, restDurations, setWeights);
      logSession({
        workoutId: workout.id,
        workoutName: workout.name,
        groupId,
        order,
        durationMs: elapsedMs,
        startedAt: Date.now() - elapsedMs,
        completedSets: stats.completedSets,
        totalSets: stats.totalSets,
        completedExercises: stats.completedExercises,
        totalExercises: stats.totalExercises,
        totalReps: stats.totalReps,
        totalVolume: stats.totalVolume,
        totalRestMs: stats.totalRestMs,
        restCount: stats.restCount,
        skippedExercises: stats.skippedExercises,
        exercises: stats.exercises,
      });
      clearActiveSession();
    }
  }, [
    finished,
    workout,
    groupId,
    order,
    elapsedMs,
    completedSetKeys,
    setWeights,
    restDurations,
    logSession,
    clearActiveSession,
  ]);

  // Rascunho de texto por série durante a digitação (preserva "40." e vírgula);
  // o valor numérico já é gravado na sessão a cada tecla.
  const [weightDrafts, setWeightDrafts] = useState<Record<string, string>>({});
  const parseWeight = (txt: string) => {
    const n = parseFloat(txt.replace(',', '.'));
    return Number.isNaN(n) || n < 0 ? 0 : n;
  };
  const weightValueOf = (setIndex: number, weight: number) => {
    const key = `${currentExercise.id}:${setIndex}`;
    if (key in weightDrafts) return weightDrafts[key];
    return weight > 0 ? String(weight) : '';
  };
  const handleWeightChange = (setIndex: number, txt: string) => {
    const key = `${currentExercise.id}:${setIndex}`;
    setWeightDrafts((prev) => ({ ...prev, [key]: txt }));
    setSetWeight(currentExercise.id, setIndex, parseWeight(txt));
  };
  const clearWeightDraft = (setIndex: number) => {
    const key = `${currentExercise.id}:${setIndex}`;
    setWeightDrafts((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleToggleSet = (set: { setIndex: number; completed: boolean }) => {
    toggleSet(currentExercise.id, set.setIndex);
    // Se a série estava incompleta, agora está sendo concluída → abre o descanso.
    // (Usamos o estado atual do render; o retorno do setState não é síncrono.)
    if (!set.completed) {
      const isLastSet = set.setIndex === currentExerciseSets.length - 1;
      // Última série do exercício: avança para o próximo ao fim do descanso; se
      // for também o último exercício, finaliza o treino automaticamente.
      advanceRef.current = isLastSet && !isLastExercise;
      finishRef.current = isLastSet && isLastExercise;
      setRest((prev) => ({
        seconds: restSeconds(currentExercise, restDurations),
        nonce: (prev?.nonce ?? 0) + 1,
      }));
    }
  };

  // Encerra o descanso (pular ou tempo acabar). Avança para o próximo exercício
  // ou finaliza o treino automaticamente, conforme a série concluída.
  const handleRestDismiss = () => {
    setRest(null);
    if (finishRef.current) {
      finishRef.current = false;
      advanceRef.current = false;
      finish();
      return;
    }
    if (advanceRef.current) {
      advanceRef.current = false;
      // Exercício concluído → intersticial (se a frequência permitir) ANTES de
      // abrir o próximo. Se não houver anúncio, segue imediatamente.
      ads.notifyExerciseCompleted();
      void ads.maybeShowInterstitial().finally(() => nextExercise());
    }
  };

  const discardWorkout = () => {
    endedRef.current = true; // evita gravar snapshot no unmount
    clearActiveSession();
    navigation.goBack();
  };

  // Recompensado opt-in ao concluir o treino: assistir libera 30 min sem
  // intersticiais. Recusar mantém tudo funcionando normalmente.
  const watchRewarded = async () => {
    const earned = await ads.showRewarded();
    setRewardMsg(earned ? t('active.adThanks') : t('active.adUnavailable'));
  };

  // ----- Resumo ao finalizar -----
  if (finished) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.summaryEmoji}>🎉</Text>
          <Text style={styles.summaryTitle}>{t('active.completeTitle')}</Text>
          <Text style={styles.summarySub} numberOfLines={2}>
            {workout.name}
          </Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryStat}>
              <Text style={styles.summaryValue}>{formatDuration(elapsedMs)}</Text>
              <Text style={styles.summaryLabel}>{t('active.totalDuration')}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryStat}>
              <Text style={styles.summaryValue}>
                {completedSets}/{totalSets}
              </Text>
              <Text style={styles.summaryLabel}>{t('summary.setsDone')}</Text>
            </View>
          </View>
          {ads.rewardedReady ? (
            rewardMsg ? (
              <Text style={styles.rewardMsg}>{rewardMsg}</Text>
            ) : (
              <Pressable
                onPress={watchRewarded}
                style={({ pressed }) => [styles.rewardBtn, pressed && { opacity: 0.7 }]}
              >
                <Icon name="star" size={16} color={colors.accent} />
                <Text style={styles.rewardBtnText}>{t('active.watchAd')}</Text>
              </Pressable>
            )
          ) : null}
          <View style={{ alignSelf: 'stretch', marginTop: 24 }}>
            <GradientButton label={t('active.done')} onPress={() => navigation.goBack()} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const nextLabel = isLastExercise ? undefined : nextExerciseName;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      {/* Topo: duração total + controles */}
      <View style={styles.topBar}>
        <Pressable hitSlop={8} onPress={() => setQuitOpen(true)}>
          <Icon name="x" size={24} color={colors.textSecondary} />
        </Pressable>
        <View style={styles.clockWrap}>
          <Text style={styles.clock}>{formatDuration(elapsedMs)}</Text>
          <Text style={styles.clockLabel}>{t('active.totalDurationShort')}</Text>
        </View>
        <Pressable hitSlop={8} onPress={running ? pause : resume}>
          <Icon name={running ? 'timer' : 'timer'} size={22} color={colors.accent} />
          <Text style={styles.pauseText}>{running ? t('active.pause') : t('active.resume')}</Text>
        </Pressable>
      </View>

      <View style={styles.progressWrap}>
        <ProgressBar value={progress} />
        <View style={styles.progressMeta}>
          <Text style={styles.progressPct}>{pct}%</Text>
          <Text style={styles.progressText}>
            {t('active.setsOfTotal', { done: completedSets, total: totalSets })}
          </Text>
        </View>
      </View>

      {/* Visão geral dos exercícios: destaca concluídos e o atual */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.stepperScroll}
        contentContainerStyle={styles.stepper}
      >
        {exerciseStatus.map((ex) => {
          const isCurrent = ex.index === currentExerciseIndex;
          return (
            <Pressable
              key={ex.id}
              onPress={() => goToExercise(ex.index)}
              style={[
                styles.step,
                ex.completed && styles.stepDone,
                isCurrent && styles.stepCurrent,
              ]}
            >
              {ex.completed ? (
                <Icon name="check" size={14} color={colors.onAccent} />
              ) : (
                <Text style={[styles.stepText, isCurrent && styles.stepTextCurrent]}>
                  {ex.index + 1}
                </Text>
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView
        style={styles.bodyScroll}
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
      >
       <Animated.View key={currentExerciseIndex} entering={FadeIn.duration(250)}>
        {currentGroupName ? (
          <Text style={styles.groupName}>{currentGroupName.toUpperCase()}</Text>
        ) : null}
        <Text style={styles.counter}>
          {t('active.exerciseCounter', {
            current: currentExerciseIndex + 1,
            total: totalExercises,
          })}
        </Text>
        <Text style={styles.exerciseName} numberOfLines={2}>
          {currentExercise.name}
        </Text>
        <Text style={styles.exerciseMeta}>
          {t('active.reps', { reps: currentExercise.reps })}
          {currentExercise.weight > 0
            ? ` · ${t('details.weightKg', { weight: currentExercise.weight })}`
            : ` · ${t('details.bodyweight')}`}
        </Text>
        {currentExercise.instructions?.trim() ? (
          <Text style={styles.exerciseDesc}>{currentExercise.instructions.trim()}</Text>
        ) : null}
        {currentExercise.description?.trim() ? (
          <Text style={styles.exerciseDesc}>{currentExercise.description.trim()}</Text>
        ) : null}

        <View style={styles.setList}>
          {currentExerciseSets.map((set) => {
            const done = set.completed;
            return (
              <View
                key={set.setIndex}
                style={[styles.setRow, done && styles.setRowDone]}
              >
                <Pressable
                  onPress={() => handleToggleSet(set)}
                  style={styles.setToggle}
                  hitSlop={6}
                >
                  <View style={[styles.checkbox, done && styles.checkboxDone]}>
                    {done ? <Icon name="check" size={16} color={colors.onAccent} /> : null}
                  </View>
                  <Text style={[styles.setLabel, done && styles.setLabelDone]}>
                    {t('active.setLabel', { n: set.setIndex + 1 })}
                  </Text>
                </Pressable>
                <View style={styles.weightField}>
                  <TextInput
                    value={weightValueOf(set.setIndex, set.weight)}
                    onChangeText={(txt) => handleWeightChange(set.setIndex, txt)}
                    onBlur={() => clearWeightDraft(set.setIndex)}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                    selectionColor={colors.accent}
                    style={styles.weightInput}
                  />
                  <Text style={styles.weightUnit}>{t('active.kg')}</Text>
                </View>
                <Text style={styles.setTarget}>
                  {t('active.reps', { reps: currentExercise.reps })}
                </Text>
              </View>
            );
          })}
        </View>
       </Animated.View>
      </ScrollView>

      {/* Navegação entre exercícios */}
      <View style={styles.navBar}>
        <Pressable
          onPress={prevExercise}
          disabled={currentExerciseIndex === 0}
          style={[styles.navBtn, currentExerciseIndex === 0 && styles.navBtnDisabled]}
        >
          <Text style={styles.navBtnText}>{t('active.previous')}</Text>
        </Pressable>
        {isLastExercise ? (
          <GradientButton label={t('active.finish')} onPress={finish} style={styles.navPrimary} />
        ) : (
          <GradientButton label={t('active.next')} onPress={nextExercise} style={styles.navPrimary} />
        )}
      </View>

      <RestTimer
        seconds={rest?.seconds ?? null}
        trigger={rest?.nonce ?? 0}
        upNextLabel={nextLabel}
        onDismiss={handleRestDismiss}
      />

      <ConfirmSheet
        visible={quitOpen}
        title={t('active.quitTitle')}
        message={t('active.quitMessage')}
        onClose={() => setQuitOpen(false)}
        actions={[
          { label: t('active.quitLeave'), variant: 'primary', onPress: () => navigation.goBack() },
          { label: t('active.quitDiscard'), variant: 'danger', onPress: discardWorkout },
        ]}
      />
    </SafeAreaView>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 8,
  },
  notFound: {
    color: colors.textSecondary,
    fontFamily: fonts.body,
    fontSize: 14,
    marginBottom: 12,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  clockWrap: {
    alignItems: 'center',
  },
  clock: {
    color: colors.text,
    fontFamily: fonts.heading,
    fontSize: 34,
  },
  clockLabel: {
    color: colors.textMuted,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1,
  },
  pauseText: {
    color: colors.accent,
    fontFamily: fonts.bodyMed,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 2,
  },
  progressWrap: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  progressMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  progressPct: {
    color: colors.accent,
    fontFamily: fonts.bodyBold,
    fontSize: 12,
  },
  progressText: {
    color: colors.textSecondary,
    fontFamily: fonts.mono,
    fontSize: 11,
    textAlign: 'right',
  },
  stepperScroll: {
    flexGrow: 0,
    flexShrink: 0,
  },
  stepper: {
    paddingHorizontal: 20,
    paddingTop: 14,
    gap: 8,
    alignItems: 'center',
  },
  step: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepDone: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  stepCurrent: {
    borderColor: colors.accent,
    borderWidth: 2,
  },
  stepText: {
    color: colors.textMuted,
    fontFamily: fonts.mono,
    fontSize: 13,
  },
  stepTextCurrent: {
    color: colors.accent,
  },
  bodyScroll: {
    flex: 1,
  },
  body: {
    padding: 20,
  },
  groupName: {
    color: colors.textMuted,
    fontFamily: fonts.mono,
    fontSize: 12,
    letterSpacing: 2,
    marginTop: 8,
  },
  counter: {
    color: colors.accent,
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    marginTop: 2,
  },
  exerciseName: {
    color: colors.text,
    fontFamily: fonts.heading,
    fontSize: 30,
    marginTop: 4,
  },
  exerciseMeta: {
    color: colors.textSecondary,
    fontFamily: fonts.body,
    fontSize: 14,
    marginTop: 4,
  },
  exerciseDesc: {
    color: colors.textMuted,
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 8,
  },
  setList: {
    marginTop: 24,
    gap: 10,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  setRowDone: {
    backgroundColor: colors.accentTintSoft,
    borderColor: colors.accentBorder,
  },
  setToggle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  checkboxDone: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  setLabel: {
    flex: 1,
    color: colors.text,
    fontFamily: fonts.bodyMed,
    fontSize: 16,
  },
  setLabelDone: {
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  weightField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.inputAlt,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 10,
  },
  weightInput: {
    minWidth: 40,
    color: colors.text,
    fontFamily: fonts.mono,
    fontSize: 15,
    textAlign: 'right',
    padding: 0,
  },
  weightUnit: {
    color: colors.textMuted,
    fontFamily: fonts.mono,
    fontSize: 12,
  },
  setTarget: {
    color: colors.textMuted,
    fontFamily: fonts.mono,
    fontSize: 13,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  navBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: colors.inputAlt,
    alignItems: 'center',
  },
  navBtnDisabled: {
    opacity: 0.4,
  },
  navBtnText: {
    color: colors.text,
    fontFamily: fonts.bodyBold,
    fontSize: 14,
  },
  navPrimary: {
    flex: 1,
  },
  summaryEmoji: {
    fontSize: 56,
    marginBottom: 8,
  },
  summaryTitle: {
    color: colors.text,
    fontFamily: fonts.heading,
    fontSize: 28,
  },
  summarySub: {
    color: colors.textSecondary,
    fontFamily: fonts.body,
    fontSize: 15,
    marginTop: 2,
  },
  summaryCard: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    marginTop: 24,
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
  },
  summaryStat: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    color: colors.text,
    fontFamily: fonts.heading,
    fontSize: 26,
  },
  summaryLabel: {
    color: colors.textMuted,
    fontFamily: fonts.body,
    fontSize: 12,
    marginTop: 4,
  },
  summaryDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: colors.border,
    marginHorizontal: 12,
  },
  rewardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    alignSelf: 'stretch',
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    backgroundColor: colors.accentTintSofter,
  },
  rewardBtnText: {
    color: colors.accent,
    fontFamily: fonts.bodyBold,
    fontSize: 14,
  },
  rewardMsg: {
    color: colors.textSecondary,
    fontFamily: fonts.body,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 20,
  },
});
