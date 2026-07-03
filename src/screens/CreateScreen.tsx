import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { FocusInput } from '@/components/FocusInput';
import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { useWorkouts } from '@/store/WorkoutStore';
import { EditExercise, EditGroup } from '@/types';
import { colors, fonts } from '@/theme';
import { fromEditGroups, toEditGroups } from '@/utils/workout';
import { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Create'>;

const NUMERIC_FIELDS: { label: string; field: keyof EditExercise }[] = [
  { label: 'Séries', field: 'sets' },
  { label: 'Reps', field: 'reps' },
  { label: 'Peso (kg)', field: 'weight' },
];

const emptyExercise = (): EditExercise => ({ name: '', sets: '3', reps: '10', weight: '' });
const emptyGroup = (): EditGroup => ({ name: '', exercises: [emptyExercise()] });

export function CreateScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProp<RootStackParamList, 'Create'>>();
  const { getWorkout, createWorkout, updateWorkout } = useWorkouts();

  const workoutId = route.params?.workoutId;
  const existing = useMemo(
    () => (workoutId ? getWorkout(workoutId) : undefined),
    [workoutId, getWorkout],
  );
  const isEditing = Boolean(existing);

  // Modo: "simple" = lista plana de exercícios; "grouped" = seções (Perna...).
  // Ao editar, é inferido do treino; ao criar, vem do seletor (param `mode`).
  const grouped = existing
    ? existing.groups.length > 1 || existing.groups.some((g) => g.name.trim().length > 0)
    : route.params?.mode !== 'simple';

  const [workoutName, setWorkoutName] = useState(existing?.name ?? '');
  const [groups, setGroups] = useState<EditGroup[]>(
    existing ? toEditGroups(existing) : [emptyGroup()],
  );

  // ---- operações de grupo ----
  const addGroup = () => setGroups((prev) => [...prev, emptyGroup()]);
  const removeGroup = (gi: number) =>
    setGroups((prev) => prev.filter((_, i) => i !== gi));
  const updateGroupName = (gi: number, name: string) =>
    setGroups((prev) => prev.map((g, i) => (i === gi ? { ...g, name } : g)));

  // ---- operações de exercício (dentro de um grupo) ----
  const addExercise = (gi: number) =>
    setGroups((prev) =>
      prev.map((g, i) => (i === gi ? { ...g, exercises: [...g.exercises, emptyExercise()] } : g)),
    );
  const removeExercise = (gi: number, ei: number) =>
    setGroups((prev) =>
      prev.map((g, i) =>
        i === gi ? { ...g, exercises: g.exercises.filter((_, j) => j !== ei) } : g,
      ),
    );
  const updateExercise = (gi: number, ei: number, field: keyof EditExercise, val: string) =>
    setGroups((prev) =>
      prev.map((g, i) =>
        i === gi
          ? {
              ...g,
              exercises: g.exercises.map((ex, j) => (j === ei ? { ...ex, [field]: val } : ex)),
            }
          : g,
      ),
    );

  const renderExerciseCard = (gi: number, ei: number, ex: EditExercise) => (
    <View key={ei} style={styles.exerciseCard}>
      <View style={styles.exerciseHeader}>
        <TextInput
          value={ex.name}
          onChangeText={(t) => updateExercise(gi, ei, 'name', t)}
          placeholder="Nome do exercício"
          placeholderTextColor={colors.textMuted}
          selectionColor={colors.accent}
          style={styles.exerciseNameInput}
        />
        <Pressable hitSlop={8} onPress={() => removeExercise(gi, ei)}>
          <Icon name="x" size={16} color={colors.textMuted} />
        </Pressable>
      </View>
      <View style={styles.numericRow}>
        {NUMERIC_FIELDS.map(({ label, field }) => (
          <View key={field} style={styles.numericCol}>
            <Text style={styles.numericLabel}>{label.toUpperCase()}</Text>
            <FocusInput
              value={ex[field]}
              onChangeText={(t) => updateExercise(gi, ei, field, t)}
              placeholder="—"
              keyboardType="numeric"
              focusBorderColor="rgba(255, 20, 235, 0.4)"
              baseBorderColor={colors.borderStrong}
              inputStyle={styles.numericInput}
            />
          </View>
        ))}
      </View>
    </View>
  );

  const renderAddExercise = (gi: number) => (
    <Pressable
      onPress={() => addExercise(gi)}
      style={({ pressed }) => [styles.addExerciseBtn, pressed && styles.pressed]}
    >
      <Icon name="plus" size={16} color={colors.accent} />
      <Text style={styles.addExerciseText}>Adicionar exercício</Text>
    </Pressable>
  );

  const save = () => {
    const name = workoutName.trim();
    if (name.length === 0) {
      Alert.alert('Nome obrigatório', 'Dê um nome ao treino antes de salvar.');
      return;
    }
    const input = { name, groups: fromEditGroups(groups) };
    if (isEditing && workoutId) {
      updateWorkout(workoutId, input);
    } else {
      createWorkout(input);
    }
    navigation.goBack();
  };

  const close = () => navigation.goBack();

  return (
    <Screen edges={['top', 'left', 'right', 'bottom']}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Pressable hitSlop={8} onPress={close}>
          <Text style={styles.cancel}>Cancelar</Text>
        </Pressable>
        <Text style={styles.title}>{isEditing ? 'Editar Treino' : 'Novo Treino'}</Text>
        <Pressable hitSlop={8} onPress={save}>
          <Text style={styles.save}>Salvar</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
        >
          {/* Workout name */}
          <View>
            <Text style={styles.fieldLabel}>NOME DO TREINO</Text>
            <FocusInput
              value={workoutName}
              onChangeText={setWorkoutName}
              placeholder="ex.: Treino A"
              inputStyle={styles.nameInput}
            />
          </View>

          {grouped ? (
            <>
              {/* Modo com grupos (seções) */}
              {groups.map((group, gi) => (
                <View key={gi} style={styles.groupCard}>
                  <View style={styles.groupHeader}>
                    <View style={styles.groupBadge}>
                      <Text style={styles.groupBadgeText}>{gi + 1}</Text>
                    </View>
                    <TextInput
                      value={group.name}
                      onChangeText={(t) => updateGroupName(gi, t)}
                      placeholder="Nome do grupo (ex.: Perna)"
                      placeholderTextColor={colors.textMuted}
                      selectionColor={colors.accent}
                      style={styles.groupNameInput}
                    />
                    <Pressable hitSlop={8} onPress={() => removeGroup(gi)}>
                      <Icon name="trash" size={18} color={colors.danger} />
                    </Pressable>
                  </View>

                  {group.exercises.map((ex, ei) => renderExerciseCard(gi, ei, ex))}
                  {renderAddExercise(gi)}
                </View>
              ))}

              {/* Add group */}
              <Pressable
                onPress={addGroup}
                style={({ pressed }) => [styles.addGroupBtn, pressed && styles.pressed]}
              >
                <Icon name="plus" size={18} color={colors.accent} />
                <Text style={styles.addGroupText}>Adicionar grupo</Text>
              </Pressable>
            </>
          ) : (
            <>
              {/* Modo simples (lista plana de exercícios) */}
              <Text style={styles.fieldLabel}>EXERCÍCIOS</Text>
              {groups[0]?.exercises.map((ex, ei) => renderExerciseCard(0, ei, ex))}
              {renderAddExercise(0)}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
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
  cancel: {
    color: colors.textSecondary,
    fontFamily: fonts.bodyMed,
    fontSize: 14,
  },
  title: {
    color: colors.text,
    fontFamily: fonts.heading,
    fontSize: 18,
    letterSpacing: 0.5,
  },
  save: {
    color: colors.accent,
    fontFamily: fonts.bodyBold,
    fontSize: 14,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 20,
  },
  fieldLabel: {
    color: colors.textSecondary,
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    letterSpacing: 2,
    marginBottom: 8,
  },
  nameInput: {
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    fontFamily: fonts.body,
  },
  pressed: {
    opacity: 0.85,
  },
  // Grupo
  groupCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 10,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  groupBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.accentTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupBadgeText: {
    color: colors.accent,
    fontFamily: fonts.heading,
    fontSize: 15,
  },
  groupNameInput: {
    flex: 1,
    color: colors.text,
    fontFamily: fonts.heading,
    fontSize: 18,
    paddingVertical: 2,
  },
  // Exercício
  exerciseCard: {
    backgroundColor: colors.bg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    padding: 12,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  exerciseNameInput: {
    flex: 1,
    color: colors.text,
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    paddingVertical: 2,
  },
  numericRow: {
    flexDirection: 'row',
    gap: 8,
  },
  numericCol: {
    flex: 1,
  },
  numericLabel: {
    color: colors.textMuted,
    fontFamily: fonts.mono,
    fontSize: 9,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  numericInput: {
    backgroundColor: colors.inputAlt,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    textAlign: 'center',
    fontFamily: fonts.mono,
  },
  addExerciseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.accentTintSofter,
  },
  addExerciseText: {
    color: colors.accent,
    fontFamily: fonts.bodyMed,
    fontSize: 13,
  },
  addGroupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.accentBorderStrong,
    backgroundColor: colors.accentTintSofter,
  },
  addGroupText: {
    color: colors.accent,
    fontFamily: fonts.bodyBold,
    fontSize: 14,
  },
});
