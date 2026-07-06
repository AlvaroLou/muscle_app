import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { useWorkouts } from '@/store/WorkoutStore';
import { colors, fonts } from '@/theme';
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
  const route = useRoute<RouteProp<RootStackParamList, 'SessionSummary'>>();
  const { sessions } = useWorkouts();

  const session = sessions.find((s) => s.id === route.params.sessionId);

  if (!session) {
    return (
      <Screen>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Sessão não encontrada.</Text>
          <Pressable onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>Voltar</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  const pct = session.totalSets > 0 ? Math.round((session.completedSets / session.totalSets) * 100) : 0;

  return (
    <Screen edges={['top', 'left', 'right']}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Pressable style={styles.back} hitSlop={8} onPress={() => navigation.goBack()}>
          <Icon name="chevron-left" size={22} color={colors.accent} />
          <Text style={styles.backText}>Voltar</Text>
        </Pressable>
        <Text style={styles.topTitle}>Resumo</Text>
        <View style={{ width: 70 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{workoutLetter(session.order)}</Text>
          </View>
          <Text style={styles.name} numberOfLines={2}>
            {session.workoutName}
          </Text>
          <Text style={styles.when}>
            {relativeDay(session.completedAt)} · {clockOf(session.completedAt)}
          </Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{formatDuration(session.durationMs)}</Text>
            <Text style={styles.statLabel}>Duração</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {session.completedSets}/{session.totalSets}
            </Text>
            <Text style={styles.statLabel}>Séries feitas</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{pct}%</Text>
            <Text style={styles.statLabel}>Concluído</Text>
          </View>
        </View>

        <Text style={styles.note}>
          O histórico guarda o resumo da sessão. Detalhes por exercício não são
          registrados por sessão.
        </Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  notFoundText: {
    color: colors.textSecondary,
    fontFamily: fonts.body,
    fontSize: 14,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    width: 70,
  },
  backText: {
    color: colors.accent,
    fontFamily: fonts.bodyMed,
    fontSize: 14,
  },
  topTitle: {
    color: colors.text,
    fontFamily: fonts.heading,
    fontSize: 18,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 24,
    gap: 24,
  },
  hero: {
    alignItems: 'center',
    gap: 8,
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
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 18,
    alignItems: 'center',
    gap: 6,
  },
  statValue: {
    color: colors.accent,
    fontFamily: fonts.heading,
    fontSize: 22,
  },
  statLabel: {
    color: colors.textMuted,
    fontFamily: fonts.body,
    fontSize: 11,
    textAlign: 'center',
  },
  note: {
    color: colors.textFaint,
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
});
