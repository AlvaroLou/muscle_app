import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BannerAd } from '@/components/BannerAd';
import { Header } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { LanguageCode, ThemeId } from '@/repositories/preferencesRepository';
import { REST_TYPES } from '@/services/rest';
import { usePreferences } from '@/store/PreferencesStore';
import { usePremium } from '@/store/PremiumStore';
import { fonts, THEME_DEFS, ThemeColors } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Settings'>;

export function SettingsScreen() {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { language, themeId, restDurations, setLanguage, setThemeId, setRestDuration } =
    usePreferences();
  const { isPro, setDevPro } = usePremium();

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
      <BannerAd />

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

        {/* Workout preferences: rest durations */}
        <Text style={styles.sectionLabel}>{t('settings.workoutPrefs')}</Text>
        <View style={styles.card}>
          <View style={styles.rowHeader}>
            <Icon name="timer" size={16} color={colors.accent} />
            <Text style={styles.rowHeaderText}>{t('settings.restDurations')}</Text>
          </View>
          {REST_TYPES.map((rt, i) => {
            const seconds = restDurations[rt];
            return (
              <View key={rt} style={[styles.option, i > 0 && styles.optionBorder]}>
                <Text style={[styles.optionLabel, styles.optionLabelFlex]}>{t(`rest.${rt}`)}</Text>
                <View style={styles.stepper}>
                  <Pressable
                    hitSlop={6}
                    onPress={() => setRestDuration(rt, Math.max(5, seconds - 15))}
                    style={({ pressed }) => [styles.stepBtn, pressed && styles.pressed]}
                  >
                    <Text style={styles.stepBtnText}>−</Text>
                  </Pressable>
                  <Text style={styles.stepValue}>{t('rest.seconds', { count: seconds })}</Text>
                  <Pressable
                    hitSlop={6}
                    onPress={() => setRestDuration(rt, Math.min(600, seconds + 15))}
                    style={({ pressed }) => [styles.stepBtn, pressed && styles.pressed]}
                  >
                    <Text style={styles.stepBtnText}>+</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>
        <Text style={styles.hint}>{t('settings.restDurationsHint')}</Text>

        {/* Premium (toggle de desenvolvimento — enquanto não há billing) */}
        <Text style={styles.sectionLabel}>{t('settings.premium')}</Text>
        <View style={styles.card}>
          <Pressable
            onPress={() => setDevPro(!isPro)}
            style={({ pressed }) => [styles.option, pressed && styles.pressed]}
          >
            <Icon name="star" size={16} color={colors.accent} />
            <View style={styles.optionLabelFlex}>
              <Text style={styles.optionLabel}>{t('settings.proMode')}</Text>
              <Text style={styles.proStatus}>
                {isPro ? t('settings.proOn') : t('settings.proOff')}
              </Text>
            </View>
            <View style={[styles.toggle, isPro && styles.toggleOn]}>
              <View style={[styles.toggleKnob, isPro && styles.toggleKnobOn]} />
            </View>
          </Pressable>
        </View>
        <Text style={styles.hint}>{t('settings.premiumDevHint')}</Text>

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
    proStatus: {
      color: colors.textSecondary,
      fontFamily: fonts.body,
      fontSize: 12,
      marginTop: 2,
    },
    toggle: {
      width: 46,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.inputAlt,
      borderWidth: 1,
      borderColor: colors.borderStrong,
      padding: 2,
      justifyContent: 'center',
    },
    toggleOn: {
      backgroundColor: colors.accentTint,
      borderColor: colors.accentBorder,
    },
    toggleKnob: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: colors.textMuted,
    },
    toggleKnobOn: {
      backgroundColor: colors.accent,
      alignSelf: 'flex-end',
    },
    swatch: {
      width: 20,
      height: 20,
      borderRadius: 6,
    },
    stepper: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    stepBtn: {
      width: 32,
      height: 32,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.accentTint,
      borderWidth: 1,
      borderColor: colors.accentBorder,
    },
    stepBtnText: {
      color: colors.accent,
      fontFamily: fonts.bodyBold,
      fontSize: 18,
      lineHeight: 20,
    },
    stepValue: {
      color: colors.text,
      fontFamily: fonts.mono,
      fontSize: 14,
      minWidth: 44,
      textAlign: 'center',
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
