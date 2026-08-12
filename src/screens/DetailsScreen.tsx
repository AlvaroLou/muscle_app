import {
  CompositeNavigationProp,
  RouteProp,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  NestableDraggableFlatList,
  NestableScrollContainer,
  RenderItemParams,
  ScaleDecorator,
} from 'react-native-draggable-flatlist';

import { BottomSheet } from '@/components/BottomSheet';
import { GradientButton } from '@/components/GradientButton';
import { Icon } from '@/components/Icon';
import { Pill } from '@/components/Pill';
import { Screen } from '@/components/Screen';
import { exportWorkout, ExportFormat } from '@/premium/ExportService';
import { usePreferences } from '@/store/PreferencesStore';
import { useWorkouts } from '@/store/WorkoutStore';
import { Exercise, ExerciseGroup } from '@/types';
import { fonts, ThemeColors } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { allExercises, estimatedDurationMin, workoutLetter } from '@/utils/workout';
import { RootStackParamList, WorkoutsStackParamList } from '@/navigation/types';

type Nav = CompositeNavigationProp<
  NativeStackNavigationProp<WorkoutsStackParamList, 'Details'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export function DetailsScreen() {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const { colors, gradients } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const route = useRoute<RouteProp<WorkoutsStackParamList, 'Details'>>();
  const { workouts, reorderGroups, reorderExercises } = useWorkouts();
  const { restDurations } = usePreferences();
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Sem id (ex.: vindo da Home) cai no primeiro treino.
  const workoutId = route.params?.workoutId ?? workouts[0]?.id;
  const index = workouts.findIndex((w) => w.id === workoutId);
  const workout = index >= 0 ? workouts[index] : undefined;

  if (!workout) {
    return (
      <Screen>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>{t('details.notFound')}</Text>
          <Pressable onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>{t('common.back')}</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  const letter = workoutLetter(index);
  // Treino com seções nomeadas: cada grupo pode ser iniciado isoladamente.
  const grouped =
    workout.groups.length > 1 || workout.groups.some((g) => g.name.trim().length > 0);

  // Grupos minimizados (por id). Vale também para o treino simples (grupo único).
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const toggleCollapse = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  // Exportação (PDF/TXT) — disponível para todos.
  const openExport = () => setExportOpen(true);
  const runExport = async (format: ExportFormat) => {
    setExportOpen(false);
    setExporting(true);
    try {
      await exportWorkout(workout, format, t, restDurations);
    } catch {
      // falha silenciosa — não interrompe o app
    } finally {
      setExporting(false);
    }
  };

  const renderGroup = ({
    item: group,
    drag: dragGroup,
    isActive: groupActive,
  }: RenderItemParams<ExerciseGroup>) => {
    const isCollapsed = collapsed.has(group.id);

    const renderExercise = ({ item: ex, drag, isActive, getIndex }: RenderItemParams<Exercise>) => (
      <ScaleDecorator>
        <View style={[styles.exerciseCard, isActive && styles.cardActive]}>
          <Pressable hitSlop={8} onPressIn={drag} onLongPress={drag} style={styles.dragHandle}>
            <Icon name="grip" size={16} color={colors.textMuted} />
          </Pressable>
          <LinearGradient
            colors={gradients.exercisePlaceholder}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.exerciseImage}
          >
            <Text style={styles.exerciseNum}>{(getIndex() ?? 0) + 1}</Text>
          </LinearGradient>
          <View style={styles.exerciseInfo}>
            <Text style={styles.exerciseName} numberOfLines={1}>
              {ex.name}
            </Text>
            <View style={styles.exerciseTags}>
              <Pill
                label={t('details.setsReps', { sets: ex.sets, reps: ex.reps })}
                color={colors.accent}
                background={colors.accentTint}
                borderColor={colors.accentBorder}
                style={styles.smallPill}
                textStyle={styles.smallPillText}
              />
              <Pill
                label={ex.weight > 0 ? t('details.weightKg', { weight: ex.weight }) : t('details.bodyweight')}
                color={colors.textDim2}
                background={colors.white06}
                style={styles.smallPill}
                textStyle={styles.smallPillText}
              />
            </View>
            {ex.description?.trim() ? (
              <Text style={styles.exerciseDesc}>{ex.description.trim()}</Text>
            ) : null}
          </View>
        </View>
      </ScaleDecorator>
    );

    return (
      <View style={[styles.group, groupActive && styles.groupActive]}>
        <View style={styles.groupHeader}>
          <Pressable hitSlop={8} onPressIn={dragGroup} onLongPress={dragGroup} style={styles.dragHandle}>
            <Icon name="grip" size={18} color={colors.textMuted} />
          </Pressable>
          <Pressable style={styles.groupHeaderMain} onPress={() => toggleCollapse(group.id)}>
            <Icon
              name={isCollapsed ? 'chevron-right' : 'chevron-down'}
              size={18}
              color={colors.textMuted}
            />
            <Text style={styles.groupLabel} numberOfLines={1}>
              {grouped
                ? (group.name.trim() || t('details.group')).toUpperCase()
                : t('details.exercises').toUpperCase()}
            </Text>
            <Text style={styles.groupCount}>{group.exercises.length}</Text>
          </Pressable>
          {grouped ? (
            <Pressable
              hitSlop={8}
              style={({ pressed }) => [styles.groupStart, pressed && styles.groupStartPressed]}
              onPress={() =>
                navigation.navigate('ActiveWorkout', {
                  workoutId: workout.id,
                  groupId: group.id,
                })
              }
            >
              <Icon name="timer" size={13} color={colors.accent} />
              <Text style={styles.groupStartText}>{t('common.start')}</Text>
            </Pressable>
          ) : null}
        </View>
        {isCollapsed ? null : (
          <NestableDraggableFlatList
            data={group.exercises}
            keyExtractor={(ex) => ex.id}
            onDragEnd={({ data }) => reorderExercises(workout.id, group.id, data)}
            renderItem={renderExercise}
          />
        )}
      </View>
    );
  };

  return (
    <Screen edges={['top', 'left', 'right']}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Pressable style={styles.back} hitSlop={8} onPress={() => navigation.goBack()}>
          <Icon name="chevron-left" size={22} color={colors.accent} />
          <Text style={styles.backText}>{t('common.back')}</Text>
        </Pressable>
        <View style={styles.titleWrap}>
          <Text style={styles.tag}>{t('details.workoutTag', { letter })}</Text>
          <Text style={styles.title} numberOfLines={1}>
            {workout.name}
          </Text>
        </View>
        <View style={styles.rightActions}>
          <Pressable hitSlop={8} onPress={openExport} disabled={exporting}>
            <Icon name="share" size={20} color={colors.accent} />
          </Pressable>
          <Pressable hitSlop={8} onPress={() => navigation.navigate('Create', { workoutId: workout.id })}>
            <Text style={styles.edit}>{t('common.edit')}</Text>
          </Pressable>
        </View>
      </View>

      <NestableScrollContainer
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Info pills */}
        <View style={styles.infoRow}>
          <View style={styles.infoPill}>
            <Icon name="timer" size={13} color={colors.accent} />
            <Text style={styles.infoText}>{t('common.minutesShort', { min: estimatedDurationMin(workout) })}</Text>
          </View>
          <View style={styles.infoPill}>
            <Icon name="dumbbell" size={13} color={colors.accent} />
            <Text style={styles.infoText}>
              {t('details.exCount', { count: allExercises(workout).length })}
            </Text>
          </View>
        </View>

        {allExercises(workout).length === 0 ? (
          <Text style={styles.emptyText}>{t('details.empty')}</Text>
        ) : (
          <NestableDraggableFlatList
            data={workout.groups}
            keyExtractor={(g) => g.id}
            onDragEnd={({ data }) => reorderGroups(workout.id, data)}
            renderItem={renderGroup}
          />
        )}
      </NestableScrollContainer>

      {/* Fixed bottom button */}
      <View style={styles.footer}>
        <GradientButton
          label={grouped ? t('details.startFull') : t('details.startWorkout')}
          icon="timer"
          onPress={() => navigation.navigate('ActiveWorkout', { workoutId: workout.id })}
        />
      </View>

      {/* Escolha do formato de exportação (Pro) */}
      <BottomSheet visible={exportOpen} onClose={() => setExportOpen(false)}>
        <Text style={styles.exportTitle}>{t('export.title')}</Text>
        <Text style={styles.exportSubtitle}>{t('export.subtitle')}</Text>

        <Pressable
          style={({ pressed }) => [styles.exportOption, pressed && styles.exportOptionPressed]}
          onPress={() => runExport('pdf')}
        >
          <View style={styles.exportIcon}>
            <Icon name="share" size={20} color={colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.exportOptionTitle}>{t('export.pdf')}</Text>
            <Text style={styles.exportOptionDesc}>{t('export.pdfDesc')}</Text>
          </View>
          <Icon name="chevron-right" size={20} color={colors.textMuted} />
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.exportOption, pressed && styles.exportOptionPressed]}
          onPress={() => runExport('txt')}
        >
          <View style={styles.exportIcon}>
            <Icon name="book" size={20} color={colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.exportOptionTitle}>{t('export.txt')}</Text>
            <Text style={styles.exportOptionDesc}>{t('export.txtDesc')}</Text>
          </View>
          <Icon name="chevron-right" size={20} color={colors.textMuted} />
        </Pressable>
      </BottomSheet>
    </Screen>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
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
  titleWrap: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 8,
  },
  tag: {
    color: colors.textSecondary,
    fontFamily: fonts.mono,
    fontSize: 12,
  },
  title: {
    color: colors.text,
    fontFamily: fonts.heading,
    fontSize: 18,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  edit: {
    color: colors.accent,
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    textAlign: 'right',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 4,
  },
  infoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: colors.accentTintSoft,
    borderWidth: 1,
    borderColor: colors.accentBorder,
  },
  infoText: {
    color: colors.accent,
    fontFamily: fonts.mono,
    fontSize: 12,
  },
  group: {
    gap: 12,
    marginTop: 4,
    marginBottom: 12,
  },
  groupActive: {
    opacity: 0.9,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  groupHeaderMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dragHandle: {
    paddingHorizontal: 2,
  },
  cardActive: {
    borderColor: colors.accentBorder,
    opacity: 0.95,
  },
  groupLabel: {
    flex: 1,
    color: colors.accent,
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    letterSpacing: 2,
  },
  groupCount: {
    color: colors.textMuted,
    fontFamily: fonts.mono,
    fontSize: 12,
  },
  groupStart: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: colors.accentTint,
    borderWidth: 1,
    borderColor: colors.accentBorder,
  },
  groupStartPressed: {
    opacity: 0.7,
  },
  groupStartText: {
    color: colors.accent,
    fontFamily: fonts.bodyBold,
    fontSize: 12,
  },
  emptyText: {
    color: colors.textMuted,
    fontFamily: fonts.body,
    fontSize: 14,
    paddingVertical: 12,
  },
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    marginBottom: 10,
  },
  exerciseImage: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  exerciseNum: {
    fontFamily: fonts.heading,
    fontSize: 20,
    color: colors.white15,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    color: colors.text,
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    marginBottom: 6,
  },
  exerciseTags: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  exerciseDesc: {
    color: colors.textSecondary,
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 6,
  },
  smallPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },

  smallPillText: {
    fontSize: 10,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  exportTitle: {
    color: colors.text,
    fontFamily: fonts.heading,
    fontSize: 22,
  },
  exportSubtitle: {
    color: colors.textSecondary,
    fontFamily: fonts.body,
    fontSize: 14,
    marginTop: 2,
    marginBottom: 16,
  },
  exportOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.bg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    padding: 14,
    marginBottom: 12,
  },
  exportOptionPressed: {
    opacity: 0.7,
  },
  exportIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.accentTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportOptionTitle: {
    color: colors.text,
    fontFamily: fonts.bodyBold,
    fontSize: 15,
  },
  exportOptionDesc: {
    color: colors.textSecondary,
    fontFamily: fonts.body,
    fontSize: 12,
    marginTop: 2,
  },
});
