import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GradientButton } from '@/components/GradientButton';
import { Icon } from '@/components/Icon';
import { ProgressBar } from '@/components/ProgressBar';
import { RestTimer } from '@/components/RestTimer';
import { DEFAULT_REST_SECONDS, useWorkoutSession } from '@/hooks/useWorkoutSession';
import { useWorkouts } from '@/store/WorkoutStore';
import { Workout } from '@/types';
import { colors, fonts } from '@/theme';
import { formatDuration } from '@/utils/time';
import { allExercises } from '@/utils/workout';
import { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'ActiveWorkout'>;

export function ActiveWorkoutScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProp<RootStackParamList, 'ActiveWorkout'>>();
  const { getWorkout } = useWorkouts();
  const workout = getWorkout(route.params.workoutId);

  if (!workout || allExercises(workout).length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.notFound}>Este treino não tem exercícios.</Text>
          <GradientButton label="VOLTAR" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  return <ActiveSession workout={workout} navigation={navigation} />;
}

function ActiveSession({ workout, navigation }: { workout: Workout; navigation: Nav }) {
  const { workouts, logSession } = useWorkouts();
  const session = useWorkoutSession(workout);
  const [restSeconds, setRestSeconds] = useState<number | null>(null);
  const logged = useRef(false);

  const {
    elapsedMs,
    running,
    pause,
    resume,
    progress,
    completedSets,
    totalSets,
    totalExercises,
    nextExerciseName,
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
  } = session;

  // Registra a sessão no histórico assim que o treino é finalizado (uma vez).
  useEffect(() => {
    if (finished && !logged.current) {
      logged.current = true;
      const order = workouts.findIndex((w) => w.id === workout.id);
      logSession({
        workoutId: workout.id,
        workoutName: workout.name,
        order: order < 0 ? 0 : order,
        durationMs: elapsedMs,
        completedSets,
        totalSets,
      });
    }
  }, [finished, workouts, workout, elapsedMs, completedSets, totalSets, logSession]);

  const handleToggleSet = (setIndex: number) => {
    const nowCompleted = toggleSet(currentExercise.id, setIndex);
    if (nowCompleted) setRestSeconds(DEFAULT_REST_SECONDS);
  };

  const confirmQuit = () => {
    Alert.alert('Encerrar treino', 'Sair agora descarta o progresso desta sessão.', [
      { text: 'Continuar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => navigation.goBack() },
    ]);
  };

  // ----- Resumo ao finalizar -----
  if (finished) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.summaryEmoji}>🎉</Text>
          <Text style={styles.summaryTitle}>Treino concluído!</Text>
          <Text style={styles.summarySub}>{workout.name}</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryStat}>
              <Text style={styles.summaryValue}>{formatDuration(elapsedMs)}</Text>
              <Text style={styles.summaryLabel}>Duração total</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryStat}>
              <Text style={styles.summaryValue}>
                {completedSets}/{totalSets}
              </Text>
              <Text style={styles.summaryLabel}>Séries feitas</Text>
            </View>
          </View>
          <View style={{ alignSelf: 'stretch', marginTop: 24 }}>
            <GradientButton label="CONCLUIR" onPress={() => navigation.goBack()} />
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
        <Pressable hitSlop={8} onPress={confirmQuit}>
          <Icon name="x" size={24} color={colors.textSecondary} />
        </Pressable>
        <View style={styles.clockWrap}>
          <Text style={styles.clock}>{formatDuration(elapsedMs)}</Text>
          <Text style={styles.clockLabel}>duração total</Text>
        </View>
        <Pressable hitSlop={8} onPress={running ? pause : resume}>
          <Icon name={running ? 'timer' : 'timer'} size={22} color={colors.accent} />
          <Text style={styles.pauseText}>{running ? 'Pausar' : 'Retomar'}</Text>
        </Pressable>
      </View>

      <View style={styles.progressWrap}>
        <ProgressBar value={progress} />
        <Text style={styles.progressText}>
          {completedSets} de {totalSets} séries
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {currentGroupName ? (
          <Text style={styles.groupName}>{currentGroupName.toUpperCase()}</Text>
        ) : null}
        <Text style={styles.counter}>
          Exercício {currentExerciseIndex + 1} de {totalExercises}
        </Text>
        <Text style={styles.exerciseName}>{currentExercise.name}</Text>
        <Text style={styles.exerciseMeta}>
          {currentExercise.reps} reps
          {currentExercise.weight > 0 ? ` · ${currentExercise.weight} kg` : ' · peso corporal'}
        </Text>

        <View style={styles.setList}>
          {currentExerciseSets.map((set) => {
            const done = set.completed;
            return (
              <Pressable
                key={set.setIndex}
                onPress={() => handleToggleSet(set.setIndex)}
                style={[styles.setRow, done && styles.setRowDone]}
              >
                <View style={[styles.checkbox, done && styles.checkboxDone]}>
                  {done ? <Icon name="check" size={16} color={colors.onAccent} /> : null}
                </View>
                <Text style={[styles.setLabel, done && styles.setLabelDone]}>
                  Série {set.setIndex + 1}
                </Text>
                <Text style={styles.setTarget}>{currentExercise.reps} reps</Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* Navegação entre exercícios */}
      <View style={styles.navBar}>
        <Pressable
          onPress={prevExercise}
          disabled={currentExerciseIndex === 0}
          style={[styles.navBtn, currentExerciseIndex === 0 && styles.navBtnDisabled]}
        >
          <Text style={styles.navBtnText}>Anterior</Text>
        </Pressable>
        {isLastExercise ? (
          <GradientButton label="FINALIZAR" onPress={finish} style={styles.navPrimary} />
        ) : (
          <GradientButton label="PRÓXIMO" onPress={nextExercise} style={styles.navPrimary} />
        )}
      </View>

      <RestTimer
        seconds={restSeconds}
        upNextLabel={nextLabel}
        onDismiss={() => setRestSeconds(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  progressText: {
    color: colors.textSecondary,
    fontFamily: fonts.mono,
    fontSize: 11,
    marginTop: 6,
    textAlign: 'right',
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
    padding: 16,
  },
  setRowDone: {
    backgroundColor: colors.accentTintSoft,
    borderColor: colors.accentBorder,
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
});
