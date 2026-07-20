import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { GradientButton } from '@/components/GradientButton';
import { Header } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { usePremium } from '@/store/PremiumStore';
import { useWorkouts } from '@/store/WorkoutStore';
import { fonts, ThemeColors } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { formatDuration } from '@/utils/time';
import { buildAdvancedStats } from '@/utils/premiumStats';
import { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'PremiumStats'>;

export function PremiumStatsScreen() {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { isPro } = usePremium();
  const { sessions } = useWorkouts();

  const stats = useMemo(() => buildAdvancedStats(sessions), [sessions]);

  // ----- Estado bloqueado (Free) -----
  if (!isPro) {
    return (
      <Screen edges={['top', 'left', 'right', 'bottom']}>
        <Header title={t('stats.title')} onBack={() => navigation.goBack()} />
        <View style={styles.locked}>
          <View style={styles.lockIcon}>
            <Icon name="star-filled" size={32} color={colors.accent} />
          </View>
          <Text style={styles.lockedTitle}>{t('stats.lockedTitle')}</Text>
          <Text style={styles.lockedDesc}>{t('stats.lockedDesc')}</Text>
          <View style={{ alignSelf: 'stretch', marginTop: 20 }}>
            <GradientButton
              label={t('premium.upgrade')}
              onPress={() => navigation.navigate('Premium')}
            />
          </View>
        </View>
      </Screen>
    );
  }

  // ----- Sem histórico -----
  if (sessions.length === 0) {
    return (
      <Screen edges={['top', 'left', 'right', 'bottom']}>
        <Header title={t('stats.title')} onBack={() => navigation.goBack()} />
        <View style={styles.locked}>
          <Icon name="history" size={28} color={colors.textMuted} />
          <Text style={styles.lockedDesc}>{t('stats.empty')}</Text>
        </View>
      </Screen>
    );
  }

  const tiles: { label: string; value: string }[] = [
    { label: t('stats.totalWorkouts'), value: String(stats.totalWorkouts) },
    { label: t('stats.totalHours'), value: t('stats.hoursValue', { value: stats.totalHours.toFixed(1) }) },
    { label: t('stats.totalVolume'), value: t('summary.volumeKg', { value: Math.round(stats.totalVolume) }) },
    { label: t('stats.avgDuration'), value: formatDuration(stats.avgDurationMs) },
    { label: t('stats.thisWeek'), value: String(stats.sessionsThisWeek) },
    { label: t('stats.thisMonth'), value: String(stats.sessionsThisMonth) },
    { label: t('stats.activeDays'), value: String(stats.activeDaysThisMonth) },
    { label: t('stats.currentStreak'), value: t('stats.daysValue', { count: stats.currentStreak }) },
    { label: t('stats.longestStreak'), value: t('stats.daysValue', { count: stats.longestStreak }) },
  ];

  const maxVolume = Math.max(1, ...stats.weeklyVolume.map((w) => w.volume));

  return (
    <Screen edges={['top', 'left', 'right', 'bottom']}>
      <Header title={t('stats.title')} onBack={() => navigation.goBack()} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Grade de métricas */}
        <View style={styles.grid}>
          {tiles.map((tile) => (
            <View key={tile.label} style={styles.tile}>
              <Text style={styles.tileValue} numberOfLines={1}>
                {tile.value}
              </Text>
              <Text style={styles.tileLabel}>{tile.label}</Text>
            </View>
          ))}
        </View>

        {/* Destaques */}
        {stats.mostPerformedExercise ? (
          <View style={styles.highlight}>
            <View style={styles.highlightIcon}>
              <Icon name="dumbbell" size={18} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.highlightLabel}>{t('stats.mostPerformed')}</Text>
              <Text style={styles.highlightValue} numberOfLines={1}>
                {stats.mostPerformedExercise.name}
              </Text>
            </View>
            <Text style={styles.highlightMeta}>
              {t('stats.timesValue', { count: stats.mostPerformedExercise.count })}
            </Text>
          </View>
        ) : null}

        {stats.topMuscleGroup ? (
          <View style={styles.highlight}>
            <View style={styles.highlightIcon}>
              <Icon name="star" size={18} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.highlightLabel}>{t('stats.topMuscle')}</Text>
              <Text style={styles.highlightValue} numberOfLines={1}>
                {t(`muscleGroups.${stats.topMuscleGroup.group}`)}
              </Text>
            </View>
            <Text style={styles.highlightMeta}>
              {t('stats.setsValue', { count: stats.topMuscleGroup.sets })}
            </Text>
          </View>
        ) : null}

        {/* Evolução do volume semanal */}
        <Text style={styles.sectionLabel}>{t('stats.weeklyVolume')}</Text>
        <View style={styles.chartCard}>
          <View style={styles.chart}>
            {stats.weeklyVolume.map((w, i) => {
              const isCurrent = i === stats.weeklyVolume.length - 1;
              const h = Math.round((w.volume / maxVolume) * 90);
              return (
                <View key={w.weekStart} style={styles.barCol}>
                  <View
                    style={[
                      styles.bar,
                      { height: Math.max(3, h) },
                      isCurrent && styles.barCurrent,
                    ]}
                  />
                </View>
              );
            })}
          </View>
          <Text style={styles.chartCaption}>{t('stats.weeklyVolumeCaption')}</Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    locked: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 28,
      gap: 10,
    },
    lockIcon: {
      width: 72,
      height: 72,
      borderRadius: 22,
      backgroundColor: colors.accentTint,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 6,
    },
    lockedTitle: {
      color: colors.text,
      fontFamily: fonts.heading,
      fontSize: 22,
      textAlign: 'center',
    },
    lockedDesc: {
      color: colors.textSecondary,
      fontFamily: fonts.body,
      fontSize: 14,
      textAlign: 'center',
      lineHeight: 20,
    },
    content: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 32,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    tile: {
      width: '31.5%',
      flexGrow: 1,
      backgroundColor: colors.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 16,
      paddingHorizontal: 8,
      alignItems: 'center',
      gap: 6,
    },
    tileValue: {
      color: colors.accent,
      fontFamily: fonts.heading,
      fontSize: 20,
    },
    tileLabel: {
      color: colors.textMuted,
      fontFamily: fonts.body,
      fontSize: 11,
      textAlign: 'center',
    },
    highlight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: colors.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
      marginTop: 12,
    },
    highlightIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: colors.accentTint,
      alignItems: 'center',
      justifyContent: 'center',
    },
    highlightLabel: {
      color: colors.textMuted,
      fontFamily: fonts.mono,
      fontSize: 10,
      letterSpacing: 1,
    },
    highlightValue: {
      color: colors.text,
      fontFamily: fonts.bodyBold,
      fontSize: 15,
      marginTop: 2,
    },
    highlightMeta: {
      color: colors.accent,
      fontFamily: fonts.mono,
      fontSize: 13,
    },
    sectionLabel: {
      color: colors.textSecondary,
      fontFamily: fonts.bodyBold,
      fontSize: 12,
      letterSpacing: 2,
      marginTop: 24,
      marginBottom: 12,
    },
    chartCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
    },
    chart: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      height: 100,
      gap: 6,
    },
    barCol: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'flex-end',
    },
    bar: {
      width: '70%',
      borderRadius: 6,
      backgroundColor: colors.accentBorder,
    },
    barCurrent: {
      backgroundColor: colors.accent,
    },
    chartCaption: {
      color: colors.textMuted,
      fontFamily: fonts.body,
      fontSize: 11,
      textAlign: 'center',
      marginTop: 12,
    },
  });
