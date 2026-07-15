import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { BannerAd } from '@/components/BannerAd';
import { Header } from '@/components/Header';
import { Screen } from '@/components/Screen';
import { useWorkouts } from '@/store/WorkoutStore';
import { fonts, ThemeColors } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { relativeDay } from '@/utils/date';
import { formatDuration } from '@/utils/time';
import { workoutLetter } from '@/utils/workout';
import { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'SessionSummary'>;

/** Hora "HH:MM" de um timestamp. */
function clockOf(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function SessionSummaryScreen() {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const route = useRoute<RouteProp<RootStackParamList, 'SessionSummary'>>();
  const { sessions } = useWorkouts();

  const session = sessions.find((s) => s.id === route.params.sessionId);

  if (!session) {
    return (
      <Screen edges={['top', 'left', 'right']}>
        <Header title={t('summary.title')} onBack={() => navigation.goBack()} />
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>{t('summary.notFound')}</Text>
        </View>
      </Screen>
    );
  }

  const pct =
    session.totalSets > 0 ? Math.round((session.completedSets / session.totalSets) * 100) : 0;
  const startedAt = session.startedAt ?? session.completedAt - session.durationMs;
  const hasRich = session.totalReps !== undefined;
  const avgRestMs =
    session.restCount && session.restCount > 0
      ? (session.totalRestMs ?? 0) / session.restCount
      : 0;

  // Grade de estatísticas — só mostra as ricas quando a sessão as tem.
  const stats: { label: string; value: string }[] = [
    { label: t('summary.duration'), value: formatDuration(session.durationMs) },
    { label: t('summary.completed'), value: `${pct}%` },
    { label: t('summary.setsDone'), value: `${session.completedSets}/${session.totalSets}` },
  ];
  if (hasRich) {
    stats.push(
      {
        label: t('summary.exercisesStat'),
        value: `${session.completedExercises ?? 0}/${session.totalExercises ?? 0}`,
      },
      { label: t('summary.repsStat'), value: String(session.totalReps ?? 0) },
      {
        label: t('summary.volumeStat'),
        value: t('summary.volumeKg', { value: Math.round(session.totalVolume ?? 0) }),
      },
      { label: t('summary.totalRestStat'), value: formatDuration(session.totalRestMs ?? 0) },
      { label: t('summary.avgRestStat'), value: formatDuration(avgRestMs) },
      { label: t('summary.skippedStat'), value: String(session.skippedExercises ?? 0) },
    );
  }

  return (
    <Screen edges={['top', 'left', 'right', 'bottom']}>
      <Header title={t('summary.title')} onBack={() => navigation.goBack()} />
      <BannerAd />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{workoutLetter(session.order)}</Text>
          </View>
          <Text style={styles.name} numberOfLines={2}>
            {session.workoutName}
          </Text>
          <Text style={styles.when}>
            {relativeDay(session.completedAt)} ·{' '}
            {t('summary.startEnd', { start: clockOf(startedAt), end: clockOf(session.completedAt) })}
          </Text>
        </View>

        <View style={styles.grid}>
          {stats.map((s) => (
            <View key={s.label} style={styles.statCard}>
              <Text style={styles.statValue} numberOfLines={1}>
                {s.value}
              </Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Resumo por exercício */}
        {session.exercises && session.exercises.length > 0 ? (
          <>
            <Text style={styles.sectionLabel}>{t('summary.byExercise')}</Text>
            <View style={styles.exList}>
              {session.exercises.map((ex, i) => (
                <View key={`${ex.name}-${i}`} style={styles.exCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.exName} numberOfLines={1}>
                      {ex.name}
                    </Text>
                    <Text style={styles.exMeta}>
                      {t('summary.exerciseSets', { done: ex.setsDone, planned: ex.setsPlanned })}
                      {' · '}
                      {ex.reps} reps
                      {ex.weight > 0
                        ? ` · ${t('details.weightKg', { weight: ex.weight })}`
                        : ` · ${t('details.bodyweight')}`}
                    </Text>
                  </View>
                  <Text style={styles.exVolume}>
                    {t('summary.volumeKg', { value: Math.round(ex.volume) })}
                  </Text>
                </View>
              ))}
            </View>
          </>
        ) : null}

        <Text style={styles.note}>{t('summary.note')}</Text>
      </ScrollView>
    </Screen>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    notFound: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    notFoundText: {
      color: colors.textSecondary,
      fontFamily: fonts.body,
      fontSize: 14,
    },
    content: {
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 32,
    },
    hero: {
      alignItems: 'center',
      gap: 8,
      marginBottom: 24,
    },
    badge: {
      width: 64,
      height: 64,
      borderRadius: 18,
      backgroundColor: colors.accentTint,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badgeText: {
      color: colors.accent,
      fontFamily: fonts.heading,
      fontSize: 28,
    },
    name: {
      color: colors.text,
      fontFamily: fonts.heading,
      fontSize: 24,
      textAlign: 'center',
    },
    when: {
      color: colors.textSecondary,
      fontFamily: fonts.mono,
      fontSize: 13,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    statCard: {
      width: '31.5%',
      flexGrow: 1,
      backgroundColor: colors.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 16,
      alignItems: 'center',
      gap: 6,
    },
    statValue: {
      color: colors.accent,
      fontFamily: fonts.heading,
      fontSize: 20,
    },
    statLabel: {
      color: colors.textMuted,
      fontFamily: fonts.body,
      fontSize: 11,
      textAlign: 'center',
    },
    sectionLabel: {
      color: colors.textSecondary,
      fontFamily: fonts.bodyBold,
      fontSize: 12,
      letterSpacing: 2,
      marginTop: 24,
      marginBottom: 12,
    },
    exList: {
      gap: 10,
    },
    exCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: colors.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
    },
    exName: {
      color: colors.text,
      fontFamily: fonts.bodyBold,
      fontSize: 14,
    },
    exMeta: {
      color: colors.textSecondary,
      fontFamily: fonts.body,
      fontSize: 12,
      marginTop: 3,
    },
    exVolume: {
      color: colors.accent,
      fontFamily: fonts.mono,
      fontSize: 13,
    },
    note: {
      color: colors.textFaint,
      fontFamily: fonts.body,
      fontSize: 12,
      lineHeight: 18,
      textAlign: 'center',
      marginTop: 24,
    },
  });
