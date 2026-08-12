import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { BannerAd } from '@/components/BannerAd';
import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { MUSCLE_GROUP_ORDER } from '@/data/exerciseLibrary';
import { pickExerciseVideo, removeExerciseMedia } from '@/premium/mediaService';
import { REST_TYPES } from '@/services/rest';
import { useExerciseLibrary } from '@/store/ExerciseLibraryStore';
import { Equipment, MuscleGroup, RestType } from '@/types';
import { fonts, ThemeColors } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import {
  exerciseInstructions,
  exerciseName,
  exerciseNotes,
  exerciseTips,
} from '@/utils/exerciseText';
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
  const { getById, addCustom, updateCustom, updateStandard } = useExerciseLibrary();

  const editingId = route.params?.exerciseId;
  const existing = editingId ? getById(editingId) : undefined;
  // Padrão editado = mostra o texto atual (traduzido ou já sobrescrito).
  const isStandard = !!existing && !existing.isCustom;

  const [name, setName] = useState(existing ? exerciseName(existing, t) : '');
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup>(existing?.muscleGroup ?? 'chest');
  const [secondary, setSecondary] = useState<Set<MuscleGroup>>(
    new Set(existing?.secondaryMuscles ?? []),
  );
  const [equipment, setEquipment] = useState<Equipment>(existing?.equipment ?? 'bodyweight');
  const [restType, setRestType] = useState<RestType | undefined>(existing?.restType);
  const [instructions, setInstructions] = useState(
    existing ? exerciseInstructions(existing, t) : '',
  );
  const [tips, setTips] = useState(existing ? exerciseTips(existing, t) : '');
  const [notes, setNotes] = useState(existing ? exerciseNotes(existing, t) : '');
  const [videoUri, setVideoUri] = useState<string | undefined>(existing?.custom?.videoUri);
  const [thumbnailUri, setThumbnailUri] = useState<string | undefined>(
    existing?.custom?.thumbnailUri,
  );
  const [mediaBusy, setMediaBusy] = useState(false);

  const pickVideo = async () => {
    setMediaBusy(true);
    try {
      const picked = await pickExerciseVideo();
      if (picked) {
        if (videoUri) void removeExerciseMedia({ videoUri, thumbnailUri });
        setVideoUri(picked.videoUri);
        setThumbnailUri(picked.thumbnailUri);
      }
    } finally {
      setMediaBusy(false);
    }
  };

  const removeVideo = () => {
    if (videoUri) void removeExerciseMedia({ videoUri, thumbnailUri });
    setVideoUri(undefined);
    setThumbnailUri(undefined);
  };

  const toggleSecondary = (m: MuscleGroup) =>
    setSecondary((prev) => {
      const next = new Set(prev);
      next.has(m) ? next.delete(m) : next.add(m);
      return next;
    });

  const canSave = name.trim().length > 0;

  const save = () => {
    if (!canSave) return;
    const input = {
      name,
      muscleGroup,
      // O grupo principal não pode ser também secundário.
      secondaryMuscles: [...secondary].filter((m) => m !== muscleGroup),
      equipment,
      restType,
      instructions,
      tips,
      notes,
      videoUri,
      thumbnailUri,
    };
    if (editingId && existing) {
      if (existing.isCustom) {
        updateCustom(editingId, input);
      } else {
        updateStandard(editingId, input);
      }
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
          {!editingId
            ? t('library.newCustomTitle')
            : isStandard
              ? t('library.editStandardTitle')
              : t('library.editCustomTitle')}
        </Text>
        <Pressable hitSlop={8} onPress={save} disabled={!canSave}>
          <Text style={[styles.save, !canSave && styles.saveDisabled]}>{t('common.save')}</Text>
        </Pressable>
      </View>

      <BannerAd />

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

          <Text style={styles.label}>{t('library.secondaryMuscles')}</Text>
          <View style={styles.chipWrap}>
            {MUSCLE_GROUP_ORDER.filter((m) => m !== muscleGroup).map((m) => {
              const on = secondary.has(m);
              return (
                <Pressable
                  key={m}
                  onPress={() => toggleSecondary(m)}
                  style={[styles.chip, on && styles.chipActive]}
                >
                  <Text style={[styles.chipText, on && styles.chipTextActive]}>
                    {t(`muscleGroups.${m}`)}
                  </Text>
                </Pressable>
              );
            })}
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

          <Text style={styles.label}>{t('library.restLabel')}</Text>
          <View style={styles.chipWrap}>
            {REST_TYPES.map((rt) => (
              <Pressable
                key={rt}
                onPress={() => setRestType(restType === rt ? undefined : rt)}
                style={[styles.chip, restType === rt && styles.chipActive]}
              >
                <Text style={[styles.chipText, restType === rt && styles.chipTextActive]}>
                  {t(`rest.${rt}`)}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>{t('library.mediaLabel')}</Text>
          {videoUri ? (
            <View style={styles.mediaCard}>
              {thumbnailUri ? (
                <Image source={{ uri: thumbnailUri }} style={styles.thumb} />
              ) : (
                <View style={[styles.thumb, styles.thumbFallback]}>
                  <Icon name="dumbbell" size={22} color={colors.textMuted} />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.mediaTitle}>{t('library.videoAttached')}</Text>
                <View style={styles.mediaActions}>
                  <Pressable onPress={pickVideo} disabled={mediaBusy} hitSlop={6}>
                    <Text style={styles.mediaAction}>{t('library.replaceVideo')}</Text>
                  </Pressable>
                  <Pressable onPress={removeVideo} hitSlop={6}>
                    <Text style={[styles.mediaAction, { color: colors.danger }]}>
                      {t('library.removeVideo')}
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          ) : (
            <Pressable
              onPress={pickVideo}
              disabled={mediaBusy}
              style={({ pressed }) => [styles.mediaAdd, pressed && styles.pressed]}
            >
              <Icon name="plus" size={18} color={colors.accent} />
              <Text style={styles.mediaAddText}>
                {mediaBusy ? t('library.processingVideo') : t('library.addVideo')}
              </Text>
            </Pressable>
          )}

          <Text style={styles.label}>{t('library.instructions')}</Text>
          <TextInput
            value={instructions}
            onChangeText={setInstructions}
            placeholder={t('library.instructionsPlaceholder')}
            placeholderTextColor={colors.textMuted}
            selectionColor={colors.accent}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            style={[styles.input, styles.notesInput]}
          />

          <Text style={styles.label}>{t('library.tips')}</Text>
          <TextInput
            value={tips}
            onChangeText={setTips}
            placeholder={t('library.tipsPlaceholder')}
            placeholderTextColor={colors.textMuted}
            selectionColor={colors.accent}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            style={[styles.input, styles.notesInput]}
          />

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
    pressed: {
      opacity: 0.7,
    },
    mediaCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: colors.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 10,
    },
    thumb: {
      width: 72,
      height: 72,
      borderRadius: 10,
      backgroundColor: colors.inputAlt,
    },
    thumbFallback: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    mediaTitle: {
      color: colors.text,
      fontFamily: fonts.bodyBold,
      fontSize: 14,
    },
    mediaActions: {
      flexDirection: 'row',
      gap: 16,
      marginTop: 8,
    },
    mediaAction: {
      color: colors.accent,
      fontFamily: fonts.bodyBold,
      fontSize: 13,
    },
    mediaAdd: {
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
    mediaAddText: {
      color: colors.accent,
      fontFamily: fonts.bodyBold,
      fontSize: 14,
    },
  });
