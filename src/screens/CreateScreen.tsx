import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  NestableDraggableFlatList,
  NestableScrollContainer,
  RenderItemParams,
  ScaleDecorator,
} from 'react-native-draggable-flatlist';

import { BottomSheet } from '@/components/BottomSheet';
import { ConfirmSheet } from '@/components/ConfirmSheet';
import { FocusInput } from '@/components/FocusInput';
import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { useExerciseLibrary } from '@/store/ExerciseLibraryStore';
import { useWorkouts } from '@/store/WorkoutStore';
import { EditExercise, EditGroup, LibraryExercise } from '@/types';
import { fonts, ThemeColors } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { exerciseName } from '@/utils/exerciseText';
import { createId } from '@/utils/id';
import { fromEditGroups, toEditGroups } from '@/utils/workout';
import { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Create'>;

// Rascunhos com chave estável — necessária para o arrastar-e-soltar.
type DraftExercise = EditExercise & { key: string };
type DraftGroup = { key: string; name: string; exercises: DraftExercise[] };

const NUMERIC_FIELDS: {
  labelKey: string;
  field: keyof EditExercise;
  placeholder?: string;
  placeholderKey?: string;
}[] = [
  { labelKey: 'create.fieldSets', field: 'sets' },
  { labelKey: 'create.fieldReps', field: 'reps' },
  { labelKey: 'create.fieldWeight', field: 'weight' },
  { labelKey: 'create.fieldRest', field: 'rest', placeholder: '90' },
  { labelKey: 'create.fieldDescription', field: 'description', placeholderKey: 'create.descPlaceholder' },
];
const firstRow = NUMERIC_FIELDS.slice(0, 4);
const secondRow = NUMERIC_FIELDS.slice(4);

const emptyExercise = (): DraftExercise => ({
  key: createId('ek_'),
  name: '',
  sets: '3',
  reps: '10',
  weight: '',
  rest: '90',
  description: '',
});
const emptyGroup = (): DraftGroup => ({
  key: createId('gk_'),
  name: '',
  exercises: [emptyExercise()],
});

/** Adiciona chaves a um EditGroup vindo do domínio. */
function withKeys(groups: EditGroup[]): DraftGroup[] {
  return groups.map((g) => ({
    key: createId('gk_'),
    name: g.name,
    exercises: g.exercises.map((e) => ({ ...e, key: createId('ek_') })),
  }));
}

/** Remove as chaves antes de salvar. */
function stripKeys(groups: DraftGroup[]): EditGroup[] {
  return groups.map((g) => ({
    name: g.name,
    exercises: g.exercises.map(({ key, ...e }) => e),
  }));
}

export function CreateScreen() {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const route = useRoute<RouteProp<RootStackParamList, 'Create'>>();
  const { getWorkout, createWorkout, updateWorkout } = useWorkouts();
  const { exercises: libraryExercises } = useExerciseLibrary();

  const workoutId = route.params?.workoutId;
  const existing = useMemo(
    () => (workoutId ? getWorkout(workoutId) : undefined),
    [workoutId, getWorkout],
  );
  const isEditing = Boolean(existing);

  // Modo: "simple" = lista plana de exercícios; "grouped" = seções (Perna...).
  const grouped = existing
    ? existing.groups.length > 1 || existing.groups.some((g) => g.name.trim().length > 0)
    : route.params?.mode !== 'simple';

  const [workoutName, setWorkoutName] = useState(existing?.name ?? '');
  const [groups, setGroups] = useState<DraftGroup[]>(
    existing ? withKeys(toEditGroups(existing)) : [emptyGroup()],
  );
  const [warning, setWarning] = useState<{ title: string; message: string } | null>(null);

  // Picker da Biblioteca: chave do grupo que está adicionando (null = fechado).
  const [pickerGroupKey, setPickerGroupKey] = useState<string | null>(null);
  const [pickerQuery, setPickerQuery] = useState('');

  // Grupos recolhidos (por chave) — só UI, fora do modelo salvo.
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const toggleCollapse = (key: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  // ---- operações de grupo (por chave) ----
  const addGroup = () => setGroups((prev) => [...prev, emptyGroup()]);
  const removeGroup = (key: string) => setGroups((prev) => prev.filter((g) => g.key !== key));
  const updateGroupName = (key: string, name: string) =>
    setGroups((prev) => prev.map((g) => (g.key === key ? { ...g, name } : g)));
  const reorderGroupsLocal = (ordered: DraftGroup[]) => setGroups(ordered);

  // ---- operações de exercício (por chave) ----
  const addExercise = (gKey: string) =>
    setGroups((prev) =>
      prev.map((g) => (g.key === gKey ? { ...g, exercises: [...g.exercises, emptyExercise()] } : g)),
    );
  const removeExercise = (gKey: string, eKey: string) =>
    setGroups((prev) =>
      prev.map((g) =>
        g.key === gKey ? { ...g, exercises: g.exercises.filter((e) => e.key !== eKey) } : g,
      ),
    );
  const updateExercise = (
    gKey: string,
    eKey: string,
    field: keyof EditExercise,
    val: string,
  ) =>
    setGroups((prev) =>
      prev.map((g) =>
        g.key === gKey
          ? {
              ...g,
              exercises: g.exercises.map((ex) => (ex.key === eKey ? { ...ex, [field]: val } : ex)),
            }
          : g,
      ),
    );
  const reorderExercisesLocal = (gKey: string, ordered: DraftExercise[]) =>
    setGroups((prev) => prev.map((g) => (g.key === gKey ? { ...g, exercises: ordered } : g)));

  // Adiciona um exercício da Biblioteca ao grupo (pré-preenche nome + vínculo).
  const addFromLibrary = (gKey: string, lib: LibraryExercise) => {
    const draft: DraftExercise = {
      ...emptyExercise(),
      name: exerciseName(lib, t),
      libraryId: lib.id,
      muscleGroup: lib.muscleGroup,
    };
    setGroups((prev) =>
      prev.map((g) => (g.key === gKey ? { ...g, exercises: [...g.exercises, draft] } : g)),
    );
    setPickerGroupKey(null);
    setPickerQuery('');
  };

  // Lista filtrada para o picker.
  const pickerResults = useMemo(() => {
    const q = pickerQuery.trim().toLowerCase();
    return libraryExercises.filter(
      (ex) => !q || exerciseName(ex, t).toLowerCase().includes(q),
    );
  }, [libraryExercises, pickerQuery, t]);

  const renderAddExercise = (gKey: string) => (
    <View style={styles.addRow}>
      <Pressable
        onPress={() => {
          setPickerQuery('');
          setPickerGroupKey(gKey);
        }}
        style={({ pressed }) => [styles.addExerciseBtn, styles.addFromLib, pressed && styles.pressed]}
      >
        <Icon name="book" size={16} color={colors.accent} />
        <Text style={styles.addExerciseText}>{t('library.addToWorkout')}</Text>
      </Pressable>
      <Pressable
        onPress={() => addExercise(gKey)}
        style={({ pressed }) => [styles.addExerciseBtn, pressed && styles.pressed]}
      >
        <Icon name="plus" size={16} color={colors.accent} />
        <Text style={styles.addExerciseText}>{t('create.addExercise')}</Text>
      </Pressable>
    </View>
  );

  const renderExerciseItem =
    (gKey: string) =>
    ({ item: ex, drag, isActive }: RenderItemParams<DraftExercise>) => (
      <ScaleDecorator>
        <View style={[styles.exerciseCard, isActive && styles.cardActive]}>
          <View style={styles.exerciseHeader}>
            <Pressable hitSlop={8} onPressIn={drag} onLongPress={drag} style={styles.dragHandle}>
              <Icon name="grip" size={16} color={colors.textMuted} />
            </Pressable>
            <TextInput
              value={ex.name}
              onChangeText={(text) => updateExercise(gKey, ex.key, 'name', text)}
              placeholder={t('create.exerciseNamePlaceholder')}
              placeholderTextColor={colors.textMuted}
              selectionColor={colors.accent}
              style={styles.exerciseNameInput}
            />
            <Pressable hitSlop={8} onPress={() => removeExercise(gKey, ex.key)}>
              <Icon name="x" size={16} color={colors.textMuted} />
            </Pressable>
          </View>
          <View style={styles.numericRow}>
            {firstRow.map(({ labelKey, field, placeholder, placeholderKey }) => (
              <View key={field} style={styles.numericCol}>
                <Text style={styles.numericLabel}>{t(labelKey).toUpperCase()}</Text>
                <FocusInput
                  value={ex[field]}
                  onChangeText={(text) => updateExercise(gKey, ex.key, field, text)}
                  placeholder={placeholderKey ? t(placeholderKey) : (placeholder ?? '—')}
                  keyboardType="numeric"
                  focusBorderColor={colors.accentBorderStrong}
                  baseBorderColor={colors.borderStrong}
                  inputStyle={styles.numericInput}
                />
              </View>
            ))}
          </View>
          <View style={styles.numericRow}>
            {secondRow.map(({ labelKey, field, placeholder, placeholderKey }) => (
              <View key={field} style={styles.numericCol}>
                <Text style={styles.numericLabel}>{t(labelKey).toUpperCase()}</Text>
                <FocusInput
                  value={ex[field]}
                  onChangeText={(text) => updateExercise(gKey, ex.key, field, text)}
                  placeholder={placeholderKey ? t(placeholderKey) : (placeholder ?? '—')}
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                  keyboardType="ascii-capable"
                  focusBorderColor={colors.accentBorderStrong}
                  baseBorderColor={colors.borderStrong}
                  inputStyle={styles.descriptionInput}
                />
              </View>
            ))}
          </View>
        </View>
      </ScaleDecorator>
    );

  const renderGroupCard = ({
    item: group,
    drag,
    isActive,
    getIndex,
  }: RenderItemParams<DraftGroup>) => {
    const isCollapsed = collapsed.has(group.key);
    return (
      <ScaleDecorator>
        <View style={[styles.groupCard, isActive && styles.cardActive]}>
          <View style={styles.groupHeader}>
            <Pressable hitSlop={8} onPressIn={drag} onLongPress={drag} style={styles.dragHandle}>
              <Icon name="grip" size={18} color={colors.textMuted} />
            </Pressable>
            <View style={styles.groupBadge}>
              <Text style={styles.groupBadgeText}>{(getIndex() ?? 0) + 1}</Text>
            </View>
            <TextInput
              value={group.name}
              onChangeText={(text) => updateGroupName(group.key, text)}
              placeholder={t('create.groupNamePlaceholder')}
              placeholderTextColor={colors.textMuted}
              selectionColor={colors.accent}
              style={styles.groupNameInput}
            />
            <Pressable
              hitSlop={8}
              onPress={() => toggleCollapse(group.key)}
              style={styles.groupToggle}
            >
              <Icon
                name={isCollapsed ? 'chevron-right' : 'chevron-down'}
                size={20}
                color={colors.textMuted}
              />
            </Pressable>
            <Pressable hitSlop={8} onPress={() => removeGroup(group.key)}>
              <Icon name="trash" size={18} color={colors.danger} />
            </Pressable>
          </View>

          {isCollapsed ? (
            <Pressable onPress={() => toggleCollapse(group.key)}>
              <Text style={styles.collapsedSummary}>
                {t('common.exercisesCount', { count: group.exercises.length })}
              </Text>
            </Pressable>
          ) : (
            <NestableDraggableFlatList
              data={group.exercises}
              keyExtractor={(e) => e.key}
              onDragEnd={({ data }) => reorderExercisesLocal(group.key, data)}
              renderItem={renderExerciseItem(group.key)}
              ListFooterComponent={renderAddExercise(group.key)}
            />
          )}
        </View>
      </ScaleDecorator>
    );
  };

  const save = () => {
    const name = workoutName.trim();
    if (name.length === 0) {
      setWarning({
        title: t('create.nameRequiredTitle'),
        message: t('create.nameRequiredMessage'),
      });
      return;
    }
    if (grouped) {
      const semNome = groups.some(
        (g) => g.name.trim().length === 0 && g.exercises.some((e) => e.name.trim().length > 0),
      );
      if (semNome) {
        setWarning({
          title: t('create.groupNameRequiredTitle'),
          message: t('create.groupNameRequiredMessage'),
        });
        return;
      }
    }
    const input = { name, groups: fromEditGroups(stripKeys(groups)) };
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
          <Text style={styles.cancel}>{t('common.cancel')}</Text>
        </Pressable>
        <Text style={styles.title}>{isEditing ? t('create.editTitle') : t('create.newTitle')}</Text>
        <Pressable hitSlop={8} onPress={save}>
          <Text style={styles.save}>{t('common.save')}</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <NestableScrollContainer
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
        >
          {/* Workout name */}
          <View style={styles.block}>
            <Text style={styles.fieldLabel}>{t('create.workoutNameLabel')}</Text>
            <FocusInput
              value={workoutName}
              onChangeText={setWorkoutName}
              placeholder={t('create.workoutNamePlaceholder')}
              inputStyle={styles.nameInput}
            />
          </View>

          {grouped ? (
            <>
              <NestableDraggableFlatList
                data={groups}
                keyExtractor={(g) => g.key}
                onDragEnd={({ data }) => reorderGroupsLocal(data)}
                renderItem={renderGroupCard}
              />
              <Pressable
                onPress={addGroup}
                style={({ pressed }) => [styles.addGroupBtn, pressed && styles.pressed]}
              >
                <Icon name="plus" size={18} color={colors.accent} />
                <Text style={styles.addGroupText}>{t('create.addGroup')}</Text>
              </Pressable>
            </>
          ) : (
            <View style={styles.block}>
              <Text style={styles.fieldLabel}>{t('details.exercises').toUpperCase()}</Text>
              <NestableDraggableFlatList
                data={groups[0]?.exercises ?? []}
                keyExtractor={(e) => e.key}
                onDragEnd={({ data }) =>
                  groups[0] && reorderExercisesLocal(groups[0].key, data)
                }
                renderItem={renderExerciseItem(groups[0]?.key ?? '')}
                ListFooterComponent={groups[0] ? renderAddExercise(groups[0].key) : null}
              />
            </View>
          )}
        </NestableScrollContainer>
      </KeyboardAvoidingView>

      <ConfirmSheet
        visible={warning !== null}
        title={warning?.title ?? ''}
        message={warning?.message}
        actions={[]}
        cancelLabel={t('common.gotIt')}
        onClose={() => setWarning(null)}
      />

      {/* Picker da Biblioteca de Exercícios */}
      <BottomSheet visible={pickerGroupKey !== null} onClose={() => setPickerGroupKey(null)}>
        <Text style={styles.pickerTitle}>{t('library.title')}</Text>
        <View style={styles.pickerSearch}>
          <Icon name="search" size={16} color={colors.textMuted} />
          <TextInput
            value={pickerQuery}
            onChangeText={setPickerQuery}
            placeholder={t('library.searchPlaceholder')}
            placeholderTextColor={colors.textMuted}
            selectionColor={colors.accent}
            style={styles.pickerSearchInput}
          />
        </View>
        <ScrollView style={styles.pickerList} keyboardShouldPersistTaps="handled">
          {pickerResults.length === 0 ? (
            <Text style={styles.pickerEmpty}>{t('library.noResults')}</Text>
          ) : (
            pickerResults.map((ex) => (
              <Pressable
                key={ex.id}
                onPress={() => pickerGroupKey && addFromLibrary(pickerGroupKey, ex)}
                style={({ pressed }) => [styles.pickerRow, pressed && styles.pressed]}
              >
                <Text style={styles.pickerRowName} numberOfLines={1}>
                  {exerciseName(ex, t)}
                </Text>
                <Text style={styles.pickerRowMeta}>{t(`muscleGroups.${ex.muscleGroup}`)}</Text>
              </Pressable>
            ))
          )}
        </ScrollView>
      </BottomSheet>
    </Screen>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
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
    gap: 16,
  },
  block: {
    gap: 0,
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
  dragHandle: {
    paddingHorizontal: 2,
  },
  cardActive: {
    opacity: 0.95,
    borderColor: colors.accentBorder,
  },
  // Grupo
  groupCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 10,
    marginBottom: 12,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  groupToggle: {
    paddingHorizontal: 2,
  },
  collapsedSummary: {
    color: colors.textSecondary,
    fontFamily: fonts.body,
    fontSize: 13,
    paddingVertical: 6,
    paddingLeft: 4,
  },
  // Exercício
  exerciseCard: {
    backgroundColor: colors.bg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    padding: 12,
    marginBottom: 10,
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
    fontSize: 8,
    marginBottom: 2,
    marginTop: 6,
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
  descriptionInput: {
    backgroundColor: colors.inputAlt,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: fonts.mono,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  addRow: {
    flexDirection: 'row',
    gap: 8,
  },
  addExerciseBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.accentTintSofter,
  },
  addFromLib: {
    borderWidth: 1,
    borderColor: colors.accentBorder,
  },
  addExerciseText: {
    color: colors.accent,
    fontFamily: fonts.bodyMed,
    fontSize: 13,
  },
  pickerTitle: {
    color: colors.text,
    fontFamily: fonts.heading,
    fontSize: 22,
    marginBottom: 12,
  },
  pickerSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    marginBottom: 12,
  },
  pickerSearchInput: {
    flex: 1,
    color: colors.text,
    fontFamily: fonts.body,
    fontSize: 15,
    padding: 0,
  },
  pickerList: {
    maxHeight: 360,
  },
  pickerEmpty: {
    color: colors.textMuted,
    fontFamily: fonts.body,
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 24,
  },
  pickerRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  pickerRowName: {
    color: colors.text,
    fontFamily: fonts.bodyBold,
    fontSize: 15,
  },
  pickerRowMeta: {
    color: colors.textSecondary,
    fontFamily: fonts.body,
    fontSize: 12,
    marginTop: 2,
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
