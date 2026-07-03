import {
  CompositeNavigationProp,
  RouteProp,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
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
import { allExercises, estimatedDurationMin, workoutLetter } from '@/utils/workout';
import { RootStackParamList, WorkoutsStackParamList } from '@/navigation/types';

type Nav = CompositeNavigationProp<
  NativeStackNavigationProp<WorkoutsStackParamList, 'Details'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export function DetailsScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProp<WorkoutsStackParamList, 'Details'>>();
  const { workouts } = useWorkouts();

  // Sem id (ex.: vindo da Home) cai no primeiro treino.
  const workoutId = route.params?.workoutId ?? workouts[0]?.id;
  const index = workouts.findIndex((w) => w.id === workoutId);
  const workout = index >= 0 ? workouts[index] : undefined;

  if (!workout) {
    return (
      <Screen>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Treino não encontrado.</Text>
          <Pressable onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>Voltar</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  const letter = workoutLetter(index);

  return (
    <Screen edges={['top', 'left', 'right']}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Pressable style={styles.back} hitSlop={8} onPress={() => navigation.goBack()}>
          <Icon name="chevron-left" size={22} color={colors.accent} />
          <Text style={styles.backText}>Voltar</Text>
        </Pressable>
        <View style={styles.titleWrap}>
          <Text style={styles.tag}>TREINO {letter}</Text>
          <Text style={styles.title} numberOfLines={1}>
            {workout.name}
          </Text>
        </View>
        <Pressable hitSlop={8} onPress={() => navigation.navigate('Create', { workoutId: workout.id })}>
          <Text style={styles.edit}>Editar</Text>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Info pills */}
        <View style={styles.infoRow}>
          <View style={styles.infoPill}>
            <Icon name="timer" size={13} color={colors.accent} />
            <Text style={styles.infoText}>{estimatedDurationMin(workout)} min</Text>
          </View>
          <View style={styles.infoPill}>
            <Icon name="dumbbell" size={13} color={colors.accent} />
            <Text style={styles.infoText}>
              {allExercises(workout).length}{' '}
              {allExercises(workout).length === 1 ? 'exercício' : 'exercícios'}
            </Text>
          </View>
        </View>

        {allExercises(workout).length === 0 ? (
          <Text style={styles.emptyText}>
            Nenhum exercício. Toque em Editar para adicionar.
          </Text>
        ) : (
          workout.groups.map((group) => (
            <View key={group.id} style={styles.group}>
              {group.name.trim() ? (
                <Text style={styles.groupLabel}>{group.name.toUpperCase()}</Text>
              ) : null}
              {group.exercises.map((ex, i) => (
                <View key={ex.id} style={styles.exerciseCard}>
                  <LinearGradient
                    colors={gradients.exercisePlaceholder}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.exerciseImage}
                  >
                    <Text style={styles.exerciseNum}>{i + 1}</Text>
                  </LinearGradient>
                  <View style={styles.exerciseInfo}>
                    <Text style={styles.exerciseName} numberOfLines={1}>
                      {ex.name}
                    </Text>
                    <View style={styles.exerciseTags}>
                      <Pill
                        label={`${ex.sets} Séries × ${ex.reps} Reps`}
                        color={colors.accent}
                        background={colors.accentTint}
                        borderColor={colors.accentBorder}
                        style={styles.smallPill}
                        textStyle={styles.smallPillText}
                      />
                      <Pill
                        label={ex.weight > 0 ? `${ex.weight} kg` : 'Peso corporal'}
                        color={colors.textDim2}
                        background={colors.white06}
                        style={styles.smallPill}
                        textStyle={styles.smallPillText}
                      />
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ))
        )}
      </ScrollView>

      {/* Fixed bottom button */}
      <View style={styles.footer}>
        <GradientButton
          label="INICIAR TREINO"
          icon="timer"
          onPress={() => navigation.navigate('ActiveWorkout', { workoutId: workout.id })}
        />
      </View>
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
  edit: {
    color: colors.accent,
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    width: 70,
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
  },
  groupLabel: {
    color: colors.accent,
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    letterSpacing: 2,
  },
  emptyText: {
    color: colors.textMuted,
    fontFamily: fonts.body,
    fontSize: 14,
    paddingVertical: 12,
  },
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.borderSoft,
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
});
