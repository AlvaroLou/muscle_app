import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BannerAd } from '@/components/BannerAd';
import { ConfirmSheet } from '@/components/ConfirmSheet';
import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { useWorkouts } from '@/store/WorkoutStore';
import { fonts, ThemeColors } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
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
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { sessions, clearSessions } = useWorkouts();
  const [clearOpen, setClearOpen] = useState(false);

  return (
    <Screen>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{t('history.title')}</Text>
          <Text style={styles.subtitle}>
            {t('history.count', { count: sessions.length })}
          </Text>
        </View>
        {sessions.length > 0 ? (
          <Pressable hitSlop={8} onPress={() => setClearOpen(true)}>
            <Text style={styles.clearText}>{t('common.clear')}</Text>
          </Pressable>
        ) : null}
      </View>

      <BannerAd />

      {sessions.length === 0 ? (
        <View style={styles.empty}>
          <Icon name="history" size={22} color={colors.textMuted} />
          <Text style={styles.emptyText}>{t('history.empty')}</Text>
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
                  {relativeDay(s.completedAt)} ·{' '}
                  {t('common.setsProgress', { done: s.completedSets, total: s.totalSets })}
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
        title={t('history.clearTitle')}
        message={t('history.clearMessage')}
        onClose={() => setClearOpen(false)}
        actions={[{ label: t('history.clearTitle'), variant: 'danger', onPress: clearSessions }]}
      />
    </Screen>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
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
