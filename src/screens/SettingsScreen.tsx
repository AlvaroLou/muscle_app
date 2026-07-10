import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Header } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { LanguageCode, ThemeId } from '@/repositories/preferencesRepository';
import { usePreferences } from '@/store/PreferencesStore';
import { fonts, THEME_DEFS, ThemeColors } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Settings'>;

export function SettingsScreen() {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { language, themeId, setLanguage, setThemeId } = usePreferences();

  const languages: { id: LanguageCode; label: string }[] = [
    { id: 'en', label: t('settings.languageEnglish') },
    { id: 'pt-BR', label: t('settings.languagePortuguese') },
  ];

  const themeOptions: { id: ThemeId; label: string }[] = [
    { id: 'dark', label: t('settings.themeDark') },
    { id: 'blue', label: t('settings.themeBlue') },
    { id: 'green', label: t('settings.themeGreen') },
  ];

  return (
    <Screen edges={['top', 'left', 'right', 'bottom']}>
      <Header title={t('settings.title')} onBack={() => navigation.goBack()} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Language */}
        <Text style={styles.sectionLabel}>{t('settings.general')}</Text>
        <View style={styles.card}>
          <View style={styles.rowHeader}>
            <Icon name="globe" size={16} color={colors.accent} />
            <Text style={styles.rowHeaderText}>{t('settings.language')}</Text>
          </View>
          {languages.map((lng, i) => (
            <Pressable
              key={lng.id}
              onPress={() => setLanguage(lng.id)}
              style={({ pressed }) => [
                styles.option,
                i > 0 && styles.optionBorder,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.optionLabel}>{lng.label}</Text>
              {language === lng.id ? (
                <Icon name="check" size={18} color={colors.accent} />
              ) : null}
            </Pressable>
          ))}
        </View>

        {/* Theme */}
        <Text style={styles.sectionLabel}>{t('settings.appearance')}</Text>
        <View style={styles.card}>
          <View style={styles.rowHeader}>
            <Icon name="settings" size={16} color={colors.accent} />
            <Text style={styles.rowHeaderText}>{t('settings.theme')}</Text>
          </View>
          {themeOptions.map((opt, i) => (
            <Pressable
              key={opt.id}
              onPress={() => setThemeId(opt.id)}
              style={({ pressed }) => [
                styles.option,
                i > 0 && styles.optionBorder,
                pressed && styles.pressed,
              ]}
            >
              <View style={[styles.swatch, { backgroundColor: THEME_DEFS[opt.id].accent }]} />
              <Text style={[styles.optionLabel, styles.optionLabelFlex]}>{opt.label}</Text>
              {themeId === opt.id ? (
                <Icon name="check" size={18} color={colors.accent} />
              ) : null}
            </Pressable>
          ))}
        </View>

        <Text style={styles.hint}>{t('settings.proHint')}</Text>
      </ScrollView>
    </Screen>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    content: {
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 24,
    },
    sectionLabel: {
      color: colors.textSecondary,
      fontFamily: fonts.bodyBold,
      fontSize: 12,
      letterSpacing: 2,
      marginBottom: 10,
      marginTop: 8,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 16,
      marginBottom: 16,
    },
    rowHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingTop: 14,
      paddingBottom: 10,
    },
    rowHeaderText: {
      color: colors.textDim,
      fontFamily: fonts.bodyBold,
      fontSize: 13,
    },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 14,
    },
    optionBorder: {
      borderTopWidth: 1,
      borderTopColor: colors.divider,
    },
    optionLabel: {
      color: colors.text,
      fontFamily: fonts.body,
      fontSize: 15,
    },
    optionLabelFlex: {
      flex: 1,
    },
    swatch: {
      width: 20,
      height: 20,
      borderRadius: 6,
    },
    pressed: {
      opacity: 0.6,
    },
    hint: {
      color: colors.textFaint,
      fontFamily: fonts.body,
      fontSize: 12,
      lineHeight: 18,
      textAlign: 'center',
      marginTop: 4,
    },
  });
