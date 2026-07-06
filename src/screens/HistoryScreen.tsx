import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ConfirmSheet } from '@/components/ConfirmSheet';
import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { useWorkouts } from '@/store/WorkoutStore';
import { colors, fonts } from '@/theme';
import { relativeDay } from '@/utils/date';
import { formatDuration } from '@/utils/time';
import { workoutLetter } from '@/utils/workout';
import { RootStackParamList, TabsParamList } from '@/navigation/types';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<TabsParamList, 'History'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export function HistoryScreen() {
  const navigation = useNavigation<Nav>();
  const { sessions, clearSessions } = useWorkouts();
  const [clearOpen, setClearOpen] = useState(false);

  return (
    <Screen>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Histórico</Text>
          <Text style={styles.subtitle}>
            {sessions.length} {sessions.length === 1 ? 'sessão concluída' : 'sessões concluídas'}
          </Text>
        </View>
        {sessions.length > 0 ? (
          <Pressable hitSlop={8} onPress={() => setClearOpen(true)}>
            <Text style={styles.clearText}>Limpar</Text>
          </Pressable>
        ) : null}
      </View>

      {sessions.length === 0 ? (
        <View style={styles.empty}>
          <Icon name="history" size={22} color={colors.textMuted} />
          <Text style={styles.emptyText}>
            Nenhuma sessão ainda.{'\n'}Finalize um treino para começar seu histórico.
          </Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
          {sessions.map((s) => (
            <Pressable
              key={s.id}
              onPress={() => navigation.navigate('SessionSummary', { sessionId: s.id })}
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            >
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{workoutLetter(s.order)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name} numberOfLines={1}>
                  {s.workoutName}
                </Text>
                <Text style={styles.meta}>
                  {relativeDay(s.completedAt)} · {s.completedSets}/{s.totalSets} séries
                </Text>
              </View>
              <Text style={styles.duration}>{formatDuration(s.durationMs)}</Text>
              <Icon name="chevron-right" size={18} color={colors.textMuted} />
            </Pressable>
          ))}
        </ScrollView>
      )}

      <ConfirmSheet
        visible={clearOpen}
        title="Limpar histórico"
        message="Remover todas as sessões? Isso não afeta seus treinos."
        onClose={() => setClearOpen(false)}
        actions={[{ label: 'Limpar histórico', variant: 'danger', onPress: clearSessions }]}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  title: {
    color: colors.text,
    fontFamily: fonts.heading,
    fontSize: 32,
    letterSpacing: 0.5,
  },
  subtitle: {
    color: colors.textSecondary,
    fontFamily: fonts.body,
    fontSize: 14,
    marginTop: 4,
  },
  clearText: {
    color: colors.textSecondary,
    fontFamily: fonts.bodyBold,
    fontSize: 13,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  emptyText: {
    color: colors.textMuted,
    fontFamily: fonts.body,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
  },
  rowPressed: {
    opacity: 0.85,
  },
  badge: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.accentTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: colors.accent,
    fontFamily: fonts.heading,
    fontSize: 17,
  },
  name: {
    color: colors.text,
    fontFamily: fonts.bodyBold,
    fontSize: 14,
  },
  meta: {
    color: colors.textSecondary,
    fontFamily: fonts.body,
    fontSize: 12,
    marginTop: 2,
  },
  duration: {
    color: colors.accent,
    fontFamily: fonts.mono,
    fontSize: 13,
  },
});
