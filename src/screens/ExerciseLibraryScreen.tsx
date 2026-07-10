import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
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
import { LibraryExercise, MuscleGroup } from '@/types';
import { fonts, ThemeColors } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { exerciseName } from '@/utils/exerciseText';
import { RootStackParamList, TabsParamList } from '@/navigation/types';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<TabsParamList, 'Library'>,
  NativeStackNavigationProp<RootStackParamList>
>;

type Filter = 'all' | 'favorites' | MuscleGroup;

export function ExerciseLibraryScreen() {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { exercises, isFavorite, toggleFavorite } = useExerciseLibrary();

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const toggleCollapse = (g: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(g) ? next.delete(g) : next.add(g);
      return next;
    });

  // Filtra por busca (nome) e pelo filtro ativo, depois agrupa por músculo.
  const sections = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matched = exercises.filter((ex) => {
      if (filter === 'favorites' && !isFavorite(ex.id)) return false;
      if (filter !== 'all' && filter !== 'favorites' && ex.muscleGroup !== filter) return false;
      if (q && !exerciseName(ex, t).toLowerCase().includes(q)) return false;
      return true;
    });
    return MUSCLE_GROUP_ORDER.map((group) => ({
      group,
      items: matched.filter((ex) => ex.muscleGroup === group),
    })).filter((s) => s.items.length > 0);
  }, [exercises, filter, query, isFavorite, t]);

  const chips: Filter[] = ['all', 'favorites', ...MUSCLE_GROUP_ORDER];
  const chipLabel = (f: Filter) =>
    f === 'all' ? t('library.all') : f === 'favorites' ? t('library.favorites') : t(`muscleGroups.${f}`);

  const renderItem = (ex: LibraryExercise) => (
    <Pressable
      key={ex.id}
      onPress={() => navigation.navigate('ExerciseDetail', { exerciseId: ex.id })}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <View style={styles.rowIcon}>
        <Icon name="dumbbell" size={18} color={colors.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.rowNameLine}>
          <Text style={styles.rowName} numberOfLines={1}>
            {exerciseName(ex, t)}
          </Text>
          {ex.isCustom ? (
            <View style={styles.customBadge}>
              <Text style={styles.customBadgeText}>{t('library.customBadge')}</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.rowMeta}>
          {t(`equipment.${ex.equipment}`)} · {t(`levels.${ex.level}`)}
        </Text>
      </View>
      <Pressable hitSlop={8} onPress={() => toggleFavorite(ex.id)}>
        <Icon
          name={isFavorite(ex.id) ? 'star-filled' : 'star'}
          size={20}
          color={isFavorite(ex.id) ? colors.accent : colors.textMuted}
        />
      </Pressable>
    </Pressable>
  );

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>{t('library.title')}</Text>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Icon name="search" size={18} color={colors.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('library.searchPlaceholder')}
          placeholderTextColor={colors.textMuted}
          selectionColor={colors.accent}
          style={styles.searchInput}
        />
        {query.length > 0 ? (
          <Pressable hitSlop={8} onPress={() => setQuery('')}>
            <Icon name="x" size={16} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      {/* Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipsScroll}
        contentContainerStyle={styles.chips}
      >
        {chips.map((f) => {
          const active = filter === f;
          return (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              style={[styles.chip, active && styles.chipActive]}
            >
              {f === 'favorites' ? (
                <Icon
                  name="star-filled"
                  size={12}
                  color={active ? colors.onAccent : colors.textDim2}
                />
              ) : null}
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {chipLabel(f)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView
        style={styles.contentScroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {sections.length === 0 ? (
          <Text style={styles.empty}>{t('library.noResults')}</Text>
        ) : (
          sections.map(({ group, items }) => {
            const isCollapsed = collapsed.has(group);
            return (
              <View key={group} style={styles.section}>
                <Pressable style={styles.sectionHeader} onPress={() => toggleCollapse(group)}>
                  <Icon
                    name={isCollapsed ? 'chevron-right' : 'chevron-down'}
                    size={18}
                    color={colors.textMuted}
                  />
                  <Text style={styles.sectionTitle}>{t(`muscleGroups.${group}`)}</Text>
                  <Text style={styles.sectionCount}>{items.length}</Text>
                </Pressable>
                {isCollapsed ? null : <View style={styles.list}>{items.map(renderItem)}</View>}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Add custom FAB */}
      <Pressable
        onPress={() => navigation.navigate('CustomExerciseEditor')}
        style={({ pressed }) => [styles.fab, pressed && { opacity: 0.85 }]}
      >
        <Icon name="plus" size={26} color={colors.onAccent} />
      </Pressable>
    </Screen>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    header: {
      paddingHorizontal: 20,
      paddingTop: 24,
      paddingBottom: 12,
    },
    title: {
      color: colors.text,
      fontFamily: fonts.heading,
      fontSize: 32,
      letterSpacing: 0.5,
    },
    searchWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginHorizontal: 20,
      paddingHorizontal: 14,
      height: 44,
      borderRadius: 12,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    searchInput: {
      flex: 1,
      color: colors.text,
      fontFamily: fonts.body,
      fontSize: 15,
      padding: 0,
    },
    chipsScroll: {
      flexGrow: 0,
      flexShrink: 0,
    },
    chips: {
      paddingHorizontal: 20,
      paddingVertical: 14,
      gap: 8,
      alignItems: 'center',
    },
    contentScroll: {
      flex: 1,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
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
    content: {
      paddingHorizontal: 20,
      paddingBottom: 100,
    },
    empty: {
      color: colors.textMuted,
      fontFamily: fonts.body,
      fontSize: 14,
      textAlign: 'center',
      paddingTop: 40,
    },
    section: {
      marginBottom: 8,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 12,
    },
    sectionTitle: {
      flex: 1,
      color: colors.text,
      fontFamily: fonts.headingSemi,
      fontSize: 16,
      letterSpacing: 0.5,
    },
    sectionCount: {
      color: colors.textMuted,
      fontFamily: fonts.mono,
      fontSize: 12,
    },
    list: {
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
    rowIcon: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: colors.accentTint,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowNameLine: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    rowName: {
      color: colors.text,
      fontFamily: fonts.bodyBold,
      fontSize: 14,
      flexShrink: 1,
    },
    rowMeta: {
      color: colors.textSecondary,
      fontFamily: fonts.body,
      fontSize: 12,
      marginTop: 2,
    },
    customBadge: {
      backgroundColor: colors.accentTint,
      borderRadius: 6,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    customBadgeText: {
      color: colors.accent,
      fontFamily: fonts.mono,
      fontSize: 9,
      letterSpacing: 0.5,
    },
    fab: {
      position: 'absolute',
      bottom: 20,
      right: 20,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.accent,
      shadowOpacity: 0.4,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 8,
    },
  });
