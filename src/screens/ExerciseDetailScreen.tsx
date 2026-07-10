import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ConfirmSheet } from '@/components/ConfirmSheet';
import { Header } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { Pill } from '@/components/Pill';
import { Screen } from '@/components/Screen';
import { useExerciseLibrary } from '@/store/ExerciseLibraryStore';
import { fonts, ThemeColors } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import {
  exerciseInstructions,
  exerciseName,
  exerciseNotes,
  exerciseTips,
} from '@/utils/exerciseText';
import { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'ExerciseDetail'>;

export function ExerciseDetailScreen() {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const { colors, gradients } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const route = useRoute<RouteProp<RootStackParamList, 'ExerciseDetail'>>();
  const { getById, isFavorite, toggleFavorite, deleteCustom, duplicateCustom } =
    useExerciseLibrary();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const exercise = getById(route.params.exerciseId);

  if (!exercise) {
    return (
      <Screen edges={['top', 'left', 'right']}>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>{t('library.noResults')}</Text>
          <Pressable onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>{t('common.back')}</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  const instructions = exerciseInstructions(exercise, t);
  const tips = exerciseTips(exercise, t);
  const notes = exerciseNotes(exercise, t);
  const fav = isFavorite(exercise.id);

  return (
    <Screen edges={['top', 'left', 'right', 'bottom']}>
      <Header
        onBack={() => navigation.goBack()}
        bordered={false}
        right={
          <Pressable hitSlop={8} onPress={() => toggleFavorite(exercise.id)}>
            <Icon
              name={fav ? 'star-filled' : 'star'}
              size={24}
              color={fav ? colors.accent : colors.textMuted}
            />
          </Pressable>
        }
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Media placeholder (future GIF/video) */}
        <LinearGradient
          colors={gradients.exercisePlaceholder}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.media}
        >
          <Icon name="dumbbell" size={40} color={colors.textFaint} />
          <Text style={styles.mediaText}>{t('library.mediaComingSoon')}</Text>
        </LinearGradient>

        <View style={styles.nameLine}>
          <Text style={styles.name}>{exerciseName(exercise, t)}</Text>
          {exercise.isCustom ? (
            <View style={styles.customBadge}>
              <Text style={styles.customBadgeText}>{t('library.customBadge')}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.pillRow}>
          <Pill label={t(`muscleGroups.${exercise.muscleGroup}`)} color={colors.accent} background={colors.accentTint} />
          <Pill label={t(`equipment.${exercise.equipment}`)} />
          <Pill label={t(`levels.${exercise.level}`)} />
        </View>

        {exercise.secondaryMuscles.length > 0 ? (
          <View style={styles.block}>
            <Text style={styles.blockLabel}>{t('library.secondaryMuscles')}</Text>
            <Text style={styles.blockText}>
              {exercise.secondaryMuscles.map((m) => t(`muscleGroups.${m}`)).join(', ')}
            </Text>
          </View>
        ) : null}

        {instructions ? (
          <View style={styles.block}>
            <Text style={styles.blockLabel}>{t('library.instructions')}</Text>
            <Text style={styles.blockText}>{instructions}</Text>
          </View>
        ) : null}

        {tips ? (
          <View style={styles.block}>
            <Text style={styles.blockLabel}>{t('library.tips')}</Text>
            <Text style={styles.blockText}>{tips}</Text>
          </View>
        ) : null}

        {notes ? (
          <View style={styles.block}>
            <Text style={styles.blockLabel}>{t('library.notes')}</Text>
            <Text style={styles.blockText}>{notes}</Text>
          </View>
        ) : null}

        {/* Custom actions */}
        {exercise.isCustom ? (
          <View style={styles.actions}>
            <Pressable
              style={({ pressed }) => [styles.actionBtn, pressed && styles.pressed]}
              onPress={() =>
                navigation.navigate('CustomExerciseEditor', { exerciseId: exercise.id })
              }
            >
              <Icon name="edit" size={18} color={colors.accent} />
              <Text style={styles.actionText}>{t('common.edit')}</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.actionBtn, pressed && styles.pressed]}
              onPress={() => {
                duplicateCustom(exercise.id);
                navigation.goBack();
              }}
            >
              <Icon name="copy" size={18} color={colors.accent} />
              <Text style={styles.actionText}>{t('library.duplicate')}</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.actionBtn, pressed && styles.pressed]}
              onPress={() => setConfirmDelete(true)}
            >
              <Icon name="trash" size={18} color={colors.danger} />
              <Text style={[styles.actionText, { color: colors.danger }]}>
                {t('common.delete')}
              </Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>

      <ConfirmSheet
        visible={confirmDelete}
        title={t('library.deleteCustomTitle')}
        message={t('library.deleteCustomMessage')}
        onClose={() => setConfirmDelete(false)}
        actions={[
          {
            label: t('common.delete'),
            variant: 'danger',
            onPress: () => {
              deleteCustom(exercise.id);
              navigation.goBack();
            },
          },
        ]}
      />
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
      paddingBottom: 12,
    },
    back: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
    },
    backText: {
      color: colors.accent,
      fontFamily: fonts.bodyMed,
      fontSize: 14,
    },
    content: {
      paddingHorizontal: 20,
      paddingBottom: 32,
    },
    media: {
      height: 180,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      borderWidth: 1,
      borderColor: colors.borderStrong,
      marginBottom: 20,
    },
    mediaText: {
      color: colors.textMuted,
      fontFamily: fonts.mono,
      fontSize: 11,
      letterSpacing: 1,
    },
    nameLine: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 12,
    },
    name: {
      color: colors.text,
      fontFamily: fonts.heading,
      fontSize: 28,
      flexShrink: 1,
    },
    customBadge: {
      backgroundColor: colors.accentTint,
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    customBadgeText: {
      color: colors.accent,
      fontFamily: fonts.mono,
      fontSize: 10,
      letterSpacing: 0.5,
    },
    pillRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 20,
    },
    block: {
      marginBottom: 20,
    },
    blockLabel: {
      color: colors.textSecondary,
      fontFamily: fonts.bodyBold,
      fontSize: 12,
      letterSpacing: 2,
      marginBottom: 6,
    },
    blockText: {
      color: colors.textDim,
      fontFamily: fonts.body,
      fontSize: 15,
      lineHeight: 22,
    },
    actions: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 4,
    },
    actionBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 14,
      borderRadius: 12,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    actionText: {
      color: colors.accent,
      fontFamily: fonts.bodyBold,
      fontSize: 13,
    },
    pressed: {
      opacity: 0.7,
    },
  });
