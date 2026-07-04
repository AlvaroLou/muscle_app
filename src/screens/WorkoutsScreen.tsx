import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BottomSheet } from '@/components/BottomSheet';
import { Icon } from '@/components/Icon';
import { Pill } from '@/components/Pill';
import { Screen } from '@/components/Screen';
import { useWorkouts } from '@/store/WorkoutStore';
import { Workout } from '@/types';
import { colors, fonts, gradients } from '@/theme';
import {
  allExercises,
  badgeFor,
  estimatedDurationMin,
  groupTags,
  startParamsFor,
  workoutLetter,
} from '@/utils/workout';
import { RootStackParamList, WorkoutsStackParamList } from '@/navigation/types';

type Nav = CompositeNavigationProp<
  NativeStackNavigationProp<WorkoutsStackParamList, 'WorkoutsList'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export function WorkoutsScreen() {
  const navigation = useNavigation<Nav>();
  const { workouts, sessions, deleteWorkout } = useWorkouts();

  const [typeSheet, setTypeSheet] = useState(false);

  // Treino cujo menu (⋮) está aberto; null = fechado.
  const [menuWorkout, setMenuWorkout] = useState<Workout | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const pickType = (mode: 'simple' | 'grouped') => {
    setTypeSheet(false);
    navigation.navigate('Create', { mode });
  };

  const openMenu = (workout: Workout) => {
    setConfirmDelete(false);
    setMenuWorkout(workout);
  };

  const closeMenu = () => {
    setMenuWorkout(null);
    // reseta a confirmação depois que o sheet some.
    setTimeout(() => setConfirmDelete(false), 200);
  };

  const startFromMenu = () => {
    const workout = menuWorkout;
    closeMenu();
    if (workout) navigation.navigate('ActiveWorkout', startParamsFor(workout, sessions));
  };

  const editFromMenu = () => {
    const id = menuWorkout?.id;
    closeMenu();
    if (id) navigation.navigate('Create', { workoutId: id });
  };

  const removeFromMenu = () => {
    const id = menuWorkout?.id;
    closeMenu();
    if (id) deleteWorkout(id);
  };

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Minha Rotina</Text>
          <Text style={styles.subtitle}>
            {workouts.length} {workouts.length === 1 ? 'treino configurado' : 'treinos configurados'}
          </Text>
        </View>

        {workouts.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              Nenhum treino ainda.{'\n'}Toque no + para criar o primeiro.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {workouts.map((w, i) => {
              const badge = badgeFor(i);
              return (
                <Pressable
                  key={w.id}
                  style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
                  onPress={() => navigation.navigate('Details', { workoutId: w.id })}
                >
                  <View style={styles.cardRow}>
                    <View style={styles.cardLeft}>
                      <View style={[styles.badge, { backgroundColor: badge.tint }]}>
                        <Text style={[styles.badgeText, { color: badge.color }]}>
                          {workoutLetter(i)}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.workoutName}>Treino {workoutLetter(i)}</Text>
                        <Text style={styles.workoutLabel} numberOfLines={1}>
                          {w.name}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.cardRight}>
                      <View style={styles.metaCol}>
                        <Text style={styles.metaEx}>{allExercises(w).length} ex</Text>
                        <Text style={styles.metaMin}>{estimatedDurationMin(w)} min</Text>
                      </View>
                      <Pressable hitSlop={8} onPress={() => openMenu(w)}>
                        <Icon name="more" size={18} color={colors.textMuted} />
                      </Pressable>
                    </View>
                  </View>

                  <View style={styles.tags}>
                    {groupTags(w).map((groupName) => (
                      <Pill
                        key={groupName}
                        label={groupName}
                        color={colors.textDim2}
                        background={colors.white05}
                        style={styles.tag}
                        textStyle={styles.tagText}
                      />
                    ))}
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      <Pressable
        onPress={() => setTypeSheet(true)}
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
      >
        <LinearGradient
          colors={gradients.accent}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabGradient}
        >
          <Icon name="plus" size={26} color={colors.onAccent} />
        </LinearGradient>
      </Pressable>

      {/* Seletor animado de tipo de treino */}
      <BottomSheet visible={typeSheet} onClose={() => setTypeSheet(false)}>
        <Text style={styles.sheetTitle}>Criar treino</Text>
        <Text style={styles.sheetSubtitle}>Como você quer montar?</Text>

        <Pressable
          style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
          onPress={() => pickType('simple')}
        >
          <View style={styles.optionIcon}>
            <Icon name="dumbbell" size={22} color={colors.accent} />
          </View>
          <View style={styles.optionInfo}>
            <Text style={styles.optionTitle}>Treino simples</Text>
            <Text style={styles.optionDesc}>Só uma lista de exercícios</Text>
          </View>
          <Icon name="chevron-right" size={20} color={colors.textMuted} />
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
          onPress={() => pickType('grouped')}
        >
          <View style={styles.optionIcon}>
            <Icon name="grip" size={22} color={colors.accent} />
          </View>
          <View style={styles.optionInfo}>
            <Text style={styles.optionTitle}>Treino com grupos</Text>
            <Text style={styles.optionDesc}>Dividido em seções (Perna, Costas…)</Text>
          </View>
          <Icon name="chevron-right" size={20} color={colors.textMuted} />
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.cancel, pressed && styles.optionPressed]}
          onPress={() => setTypeSheet(false)}
        >
          <Text style={styles.cancelText}>Cancelar</Text>
        </Pressable>
      </BottomSheet>

      {/* Menu do treino (⋮) */}
      <BottomSheet visible={menuWorkout !== null} onClose={closeMenu}>
        <Text style={styles.sheetTitle} numberOfLines={1}>
          {menuWorkout?.name}
        </Text>
        <Text style={styles.sheetSubtitle}>
          {confirmDelete ? 'Tem certeza que deseja excluir?' : 'O que deseja fazer?'}
        </Text>

        {confirmDelete ? (
          <>
            <Pressable
              style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
              onPress={removeFromMenu}
            >
              <View style={[styles.optionIcon, styles.dangerIcon]}>
                <Icon name="trash" size={22} color={colors.danger} />
              </View>
              <View style={styles.optionInfo}>
                <Text style={[styles.optionTitle, { color: colors.danger }]}>
                  Sim, excluir
                </Text>
                <Text style={styles.optionDesc}>Essa ação não pode ser desfeita</Text>
              </View>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.cancel, pressed && styles.optionPressed]}
              onPress={() => setConfirmDelete(false)}
            >
              <Text style={styles.cancelText}>Voltar</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Pressable
              style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
              onPress={startFromMenu}
            >
              <View style={styles.optionIcon}>
                <Icon name="timer" size={22} color={colors.accent} />
              </View>
              <View style={styles.optionInfo}>
                <Text style={styles.optionTitle}>Iniciar treino</Text>
                <Text style={styles.optionDesc}>Segue a rotação da semana</Text>
              </View>
              <Icon name="chevron-right" size={20} color={colors.textMuted} />
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
              onPress={editFromMenu}
            >
              <View style={styles.optionIcon}>
                <Icon name="edit" size={22} color={colors.accent} />
              </View>
              <View style={styles.optionInfo}>
                <Text style={styles.optionTitle}>Editar</Text>
                <Text style={styles.optionDesc}>Alterar nome e exercícios</Text>
              </View>
              <Icon name="chevron-right" size={20} color={colors.textMuted} />
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
              onPress={() => setConfirmDelete(true)}
            >
              <View style={[styles.optionIcon, styles.dangerIcon]}>
                <Icon name="trash" size={22} color={colors.danger} />
              </View>
              <View style={styles.optionInfo}>
                <Text style={[styles.optionTitle, { color: colors.danger }]}>Excluir</Text>
                <Text style={styles.optionDesc}>Remover este treino</Text>
              </View>
              <Icon name="chevron-right" size={20} color={colors.textMuted} />
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.cancel, pressed && styles.optionPressed]}
              onPress={closeMenu}
            >
              <Text style={styles.cancelText}>Cancelar</Text>
            </Pressable>
          </>
        )}
      </BottomSheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  // Bottom sheet
  sheetTitle: {
    color: colors.text,
    fontFamily: fonts.heading,
    fontSize: 24,
    letterSpacing: 0.3,
  },
  sheetSubtitle: {
    color: colors.textSecondary,
    fontFamily: fonts.body,
    fontSize: 14,
    marginTop: 2,
    marginBottom: 16,
  },
  option: {
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
  optionPressed: {
    opacity: 0.7,
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.accentTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerIcon: {
    backgroundColor: 'rgba(255, 59, 48, 0.12)',
  },
  optionInfo: {
    flex: 1,
  },
  optionTitle: {
    color: colors.text,
    fontFamily: fonts.bodyBold,
    fontSize: 15,
  },
  optionDesc: {
    color: colors.textSecondary,
    fontFamily: fonts.body,
    fontSize: 12,
    marginTop: 2,
  },
  cancel: {
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 4,
  },
  cancelText: {
    color: colors.textSecondary,
    fontFamily: fonts.bodyBold,
    fontSize: 14,
  },
  content: { paddingBottom: 100 },
  header: {
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
  empty: {
    paddingHorizontal: 20,
    paddingTop: 40,
    alignItems: 'center',
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
    gap: 12,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  badge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontFamily: fonts.heading,
    fontSize: 16,
  },
  workoutName: {
    color: colors.text,
    fontFamily: fonts.bodyBold,
    fontSize: 14,
  },
  workoutLabel: {
    color: colors.textSecondary,
    fontFamily: fonts.body,
    fontSize: 12,
    marginTop: 2,
  },
  cardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaCol: {
    alignItems: 'flex-end',
    marginRight: 4,
  },
  metaEx: {
    color: colors.accent,
    fontFamily: fonts.mono,
    fontSize: 12,
  },
  metaMin: {
    color: colors.textMuted,
    fontFamily: fonts.mono,
    fontSize: 12,
  },
  tags: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: {
    fontSize: 10,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
  fabPressed: {
    transform: [{ scale: 0.95 }],
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accent,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
});
