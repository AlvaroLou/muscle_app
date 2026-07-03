import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { GradientButton } from '@/components/GradientButton';
import { Icon } from '@/components/Icon';
import { Pill } from '@/components/Pill';
import { Screen } from '@/components/Screen';
import { useWorkouts } from '@/store/WorkoutStore';
import { colors, fonts, gradients } from '@/theme';
import { currentWeek, dayKey, headerDate, relativeDay } from '@/utils/date';
import {
  allExercises,
  estimatedDurationMin,
  nextWorkoutIndex,
  workoutLetter,
} from '@/utils/workout';
import { formatDuration } from '@/utils/time';
import { RootStackParamList, TabsParamList } from '@/navigation/types';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<TabsParamList, 'Home'>,
  NativeStackNavigationProp<RootStackParamList>
>;

/** Volume total planejado (Σ séries×reps×carga) formatado, ou "—" se 0. */
function formatVolume(kg: number): string {
  if (kg <= 0) return '—';
  if (kg >= 1000) return `${(kg / 1000).toFixed(1).replace('.0', '')}k`;
  return String(Math.round(kg));
}

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { workouts, sessions } = useWorkouts();

  // Próximo treino da rotação (A→B→C→A) a partir do último concluído.
  const todayIndex = nextWorkoutIndex(workouts, sessions);
  const today = todayIndex >= 0 ? workouts[todayIndex] : undefined;

  // Dias da semana com sessão concluída (marca o calendário).
  const trainedKeys = new Set(sessions.map((s) => dayKey(s.completedAt)));
  const week = currentWeek(trainedKeys);

  // Sessões recentes (as 3 últimas) para a lista de "Recentes".
  const recents = sessions.slice(0, 3);

  // Estatísticas reais derivadas do store (nada fictício).
  const totalExercises = workouts.reduce((s, w) => s + allExercises(w).length, 0);
  const totalVolume = workouts.reduce(
    (s, w) => s + allExercises(w).reduce((a, e) => a + e.sets * e.reps * e.weight, 0),
    0,
  );
  const stats = [
    { label: 'Treinos', value: String(workouts.length), unit: 'criados' },
    { label: 'Exercícios', value: String(totalExercises), unit: 'no total' },
    { label: 'Volume', value: formatVolume(totalVolume), unit: 'kg' },
  ];

  const startWorkout = () => {
    if (today) {
      navigation.navigate('ActiveWorkout', { workoutId: today.id });
    } else {
      navigation.navigate('Workouts', { screen: 'WorkoutsList' });
    }
  };

  const openToday = () => {
    if (today) {
      navigation.navigate('Workouts', {
        screen: 'Details',
        params: { workoutId: today.id },
      });
    } else {
      navigation.navigate('Workouts', { screen: 'WorkoutsList' });
    }
  };

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <View style={{ flex: 1 }}>
            <Text style={styles.date}>{headerDate()}</Text>
            <Text style={styles.hello}>
              Olá, Campeão! 👊{'\n'}
              <Text style={{ color: colors.accent }}>Pronto pra hoje?</Text>
            </Text>
          </View>
          <LinearGradient
            colors={gradients.accentAvatar}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>CJ</Text>
          </LinearGradient>
        </View>

        {/* Weekly tracker */}
        <View style={styles.section}>
          <View style={styles.trackerCard}>
            <View style={styles.trackerHeader}>
              <Icon name="calendar" size={14} color={colors.textSecondary} />
              <Text style={styles.trackerLabel}>SEMANA ATUAL</Text>
            </View>
            <View style={styles.daysRow}>
              {week.map((d, i) => (
                <View key={i} style={styles.dayCol}>
                  <Text
                    style={[
                      styles.dayLetter,
                      { color: d.isToday ? colors.accent : colors.textMuted },
                    ]}
                  >
                    {d.letter}
                  </Text>
                  <View
                    style={[
                      styles.dayCell,
                      {
                        backgroundColor: d.trained
                          ? colors.accent
                          : d.isToday
                            ? colors.accentTint12
                            : colors.white04,
                        borderColor: d.isToday ? colors.accent : 'transparent',
                      },
                    ]}
                  >
                    {d.trained ? (
                      <Icon name="check" size={16} color={colors.onAccent} />
                    ) : (
                      <Text
                        style={[
                          styles.dayNum,
                          { color: d.isToday ? colors.accent : colors.textMuted },
                        ]}
                      >
                        {d.dayOfMonth}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Stats row */}
        <View style={[styles.section, styles.statsRow]}>
          {stats.map(({ label, value, unit }) => (
            <View key={label} style={styles.statCard}>
              <Text style={styles.statValue}>{value}</Text>
              <Text style={styles.statLabel}>
                {label}
                {'\n'}
                <Text style={{ color: colors.textFaint }}>{unit}</Text>
              </Text>
            </View>
          ))}
        </View>

        {/* Today's Workout */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>TREINO DE HOJE</Text>
          <View style={styles.todayCard}>
            <LinearGradient
              colors={gradients.accent}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.stripe}
            />
            <View style={styles.todayInner}>
              {today ? (
                <>
                  <Pressable onPress={openToday}>
                    <View style={styles.todayHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.todayTag}>TREINO {workoutLetter(todayIndex)}</Text>
                        <Text style={styles.todayTitle} numberOfLines={1}>
                          {today.name}
                        </Text>
                      </View>
                      <View style={styles.todayIcon}>
                        <Icon name="dumbbell" size={22} color={colors.accent} />
                      </View>
                    </View>
                    <View style={styles.pillRow}>
                      <Pill
                        label={`${estimatedDurationMin(today)} min`}
                        color={colors.textDim}
                        background={colors.white07}
                      />
                      <Pill
                        label={`${allExercises(today).length} exercícios`}
                        color={colors.textDim}
                        background={colors.white07}
                      />
                    </View>
                  </Pressable>
                  <GradientButton label="INICIAR TREINO" onPress={startWorkout} />
                </>
              ) : (
                <>
                  <Text style={styles.todayTitle}>Sem treinos ainda</Text>
                  <View style={{ height: 12 }} />
                  <GradientButton label="CRIAR TREINO" onPress={startWorkout} />
                </>
              )}
            </View>
          </View>
        </View>

        {/* Recent */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>RECENTES</Text>
          {recents.length === 0 ? (
            <View style={styles.recentEmpty}>
              <Icon name="history" size={20} color={colors.textMuted} />
              <Text style={styles.recentEmptyText}>
                Nenhuma sessão registrada ainda.{'\n'}Suas sessões concluídas aparecerão aqui.
              </Text>
            </View>
          ) : (
            <View style={styles.recentList}>
              {recents.map((s) => (
                <View key={s.id} style={styles.recentRow}>
                  <View style={styles.recentBadge}>
                    <Text style={styles.recentBadgeText}>{workoutLetter(s.order)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.recentName} numberOfLines={1}>
                      {s.workoutName}
                    </Text>
                    <Text style={styles.recentMeta}>
                      {relativeDay(s.completedAt)} · {s.completedSets}/{s.totalSets} séries
                    </Text>
                  </View>
                  <Text style={styles.recentDuration}>{formatDuration(s.durationMs)}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 24 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  date: {
    color: colors.textSecondary,
    fontFamily: fonts.bodyMed,
    fontSize: 12,
    marginBottom: 2,
  },
  hello: {
    color: colors.text,
    fontFamily: fonts.heading,
    fontSize: 26,
    lineHeight: 30,
    letterSpacing: 0.5,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  avatarText: {
    color: colors.onAccent,
    fontFamily: fonts.bodyBold,
    fontSize: 16,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  // Weekly tracker
  trackerCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  trackerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  trackerLabel: {
    color: colors.textSecondary,
    fontFamily: fonts.bodyMed,
    fontSize: 12,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayCol: {
    alignItems: 'center',
    gap: 8,
  },
  dayLetter: {
    fontFamily: fonts.monoMed,
    fontSize: 12,
  },
  dayCell: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  dayNum: {
    fontFamily: fonts.monoMed,
    fontSize: 13,
  },
  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: {
    fontFamily: fonts.heading,
    fontSize: 26,
    color: colors.accent,
    marginBottom: 4,
  },
  statLabel: {
    color: colors.textMuted,
    fontFamily: fonts.body,
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 13,
  },
  // Section label
  sectionLabel: {
    color: colors.textSecondary,
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    letterSpacing: 2,
    marginBottom: 12,
  },
  // Today card
  todayCard: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.cardAlt,
    borderWidth: 1,
    borderColor: colors.accentBorder,
  },
  stripe: {
    height: 4,
    width: '100%',
  },
  todayInner: {
    padding: 20,
  },
  todayHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  todayTag: {
    color: colors.accent,
    fontFamily: fonts.mono,
    fontSize: 12,
    marginBottom: 4,
  },
  todayTitle: {
    color: colors.text,
    fontFamily: fonts.heading,
    fontSize: 26,
    letterSpacing: 0.3,
  },
  todayIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.accentTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  // Recent (estado vazio)
  recentEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  recentEmptyText: {
    flex: 1,
    color: colors.textMuted,
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 19,
  },
  recentList: {
    gap: 10,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
  },
  recentBadge: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.accentTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentBadgeText: {
    color: colors.accent,
    fontFamily: fonts.heading,
    fontSize: 16,
  },
  recentName: {
    color: colors.text,
    fontFamily: fonts.bodyBold,
    fontSize: 14,
  },
  recentMeta: {
    color: colors.textSecondary,
    fontFamily: fonts.body,
    fontSize: 12,
    marginTop: 2,
  },
  recentDuration: {
    color: colors.accent,
    fontFamily: fonts.mono,
    fontSize: 13,
  },
});
