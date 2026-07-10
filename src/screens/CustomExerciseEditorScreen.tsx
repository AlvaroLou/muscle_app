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

import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { MUSCLE_GROUP_ORDER } from '@/data/exerciseLibrary';
import { useExerciseLibrary } from '@/store/ExerciseLibraryStore';
import { Equipment, MuscleGroup } from '@/types';
import { fonts, ThemeColors } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'CustomExerciseEditor'>;

const EQUIPMENT_OPTIONS: Equipment[] = [
  'bodyweight',
  'dumbbell',
  'barbell',
  'machine',
  'cable',
  'kettlebell',
  'band',
  'other',
];

export function CustomExerciseEditorScreen() {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const route = useRoute<RouteProp<RootStackParamList, 'CustomExerciseEditor'>>();
  const { getById, addCustom, updateCustom } = useExerciseLibrary();

  const editingId = route.params?.exerciseId;
  const existing = editingId ? getById(editingId) : undefined;

  const [name, setName] = useState(existing?.custom?.name ?? '');
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup>(existing?.muscleGroup ?? 'chest');
  const [equipment, setEquipment] = useState<Equipment>(existing?.equipment ?? 'bodyweight');
  const [notes, setNotes] = useState(existing?.custom?.notes ?? '');

  const canSave = name.trim().length > 0;

  const save = () => {
    if (!canSave) return;
    const input = { name, muscleGroup, equipment, notes };
    if (editingId && existing) {
      updateCustom(editingId, input);
    } else {
      addCustom(input);
    }
    navigation.goBack();
  };

  return (
    <Screen edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.topBar}>
        <Pressable hitSlop={8} onPress={() => navigation.goBack()}>
          <Text style={styles.cancel}>{t('common.cancel')}</Text>
        </Pressable>
        <Text style={styles.title}>
          {editingId ? t('library.editCustomTitle') : t('library.newCustomTitle')}
        </Text>
        <Pressable hitSlop={8} onPress={save} disabled={!canSave}>
          <Text style={[styles.save, !canSave && styles.saveDisabled]}>{t('common.save')}</Text>
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
          <Text style={styles.label}>{t('library.customName')}</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={t('library.customNamePlaceholder')}
            placeholderTextColor={colors.textMuted}
            selectionColor={colors.accent}
            style={styles.input}
          />

          <Text style={styles.label}>{t('library.primaryMuscle')}</Text>
          <View style={styles.chipWrap}>
            {MUSCLE_GROUP_ORDER.map((m) => (
              <Pressable
                key={m}
                onPress={() => setMuscleGroup(m)}
                style={[styles.chip, muscleGroup === m && styles.chipActive]}
              >
                <Text style={[styles.chipText, muscleGroup === m && styles.chipTextActive]}>
                  {t(`muscleGroups.${m}`)}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>{t('library.equipmentLabel')}</Text>
          <View style={styles.chipWrap}>
            {EQUIPMENT_OPTIONS.map((e) => (
              <Pressable
                key={e}
                onPress={() => setEquipment(e)}
                style={[styles.chip, equipment === e && styles.chipActive]}
              >
                <Text style={[styles.chipText, equipment === e && styles.chipTextActive]}>
                  {t(`equipment.${e}`)}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>{t('library.customNotes')}</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder={t('library.customNotesPlaceholder')}
            placeholderTextColor={colors.textMuted}
            selectionColor={colors.accent}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            style={[styles.input, styles.notesInput]}
          />
        </ScrollView>
      </KeyboardAvoidingView>
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
    saveDisabled: {
      color: colors.textMuted,
    },
    content: {
      paddingHorizontal: 20,
      paddingVertical: 20,
    },
    label: {
      color: colors.textSecondary,
      fontFamily: fonts.bodyBold,
      fontSize: 12,
      letterSpacing: 2,
      marginBottom: 8,
      marginTop: 16,
    },
    input: {
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.borderInput,
      paddingHorizontal: 16,
      paddingVertical: 14,
      color: colors.text,
      fontFamily: fonts.body,
      fontSize: 15,
    },
    notesInput: {
      minHeight: 90,
      textAlignVertical: 'top',
    },
    chipWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    chipActive: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    chipText: {
      color: colors.textDim2,
      fontFamily: fonts.bodyMed,
      fontSize: 13,
    },
    chipTextActive: {
      color: colors.onAccent,
      fontFamily: fonts.bodyBold,
    },
  });
