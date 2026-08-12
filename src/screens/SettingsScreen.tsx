import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BannerAd } from '@/components/BannerAd';
import { ColorPicker } from '@/components/ColorPicker';
import { Header } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { LanguageCode, ThemeId, ThemeMode } from '@/repositories/preferencesRepository';
import { REST_TYPES } from '@/services/rest';
import { usePreferences } from '@/store/PreferencesStore';
import { CUSTOM_ACCENTS, fonts, THEME_DEFS, ThemeColors } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Settings'>;

export function SettingsScreen() {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const {
    language,
    themeId,
    themeMode,
    customAccent,
    restDurations,
    setLanguage,
    setThemeId,
    setThemeMode,
    setCustomAccent,
    setRestDuration,
  } = usePreferences();

  const activeAccent = (customAccent ?? THEME_DEFS[themeId].accent).toLowerCase();
  const themeModes: ThemeMode[] = ['light', 'dark', 'auto'];

  // Trava o scroll enquanto o usuário arrasta na área de cor (senão o gesto
  // vertical rola a página em vez de mover a seleção de cor).
  const [scrollEnabled, setScrollEnabled] = useState(true);

  // TODO: trocar pelo e-mail de suporte real antes de publicar.
  const SUPPORT_EMAIL = 'support@muscleapp.app';

  const contactSupport = () => {
    void Linking.openURL(
      `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Muscle App')}`,
    );
  };

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

      <ScrollView
        scrollEnabled={scrollEnabled}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
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

        {/* Personalização: modo (claro/escuro/auto) + cor de destaque livre */}
        <Text style={styles.sectionLabel}>{t('settings.customization')}</Text>
        <View style={styles.card}>
          <View style={styles.rowHeader}>
            <Icon name="settings" size={16} color={colors.accent} />
            <Text style={styles.rowHeaderText}>{t('settings.themeMode')}</Text>
          </View>
          <View style={styles.modeRow}>
            {themeModes.map((m) => {
              const active = themeMode === m;
              return (
                <Pressable
                  key={m}
                  onPress={() => setThemeMode(m)}
                  style={[styles.modeChip, active && styles.modeChipActive]}
                >
                  <Text style={[styles.modeChipText, active && styles.modeChipTextActive]}>
                    {t(`settings.mode.${m}`)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.rowHeader}>
            <Icon name="star-filled" size={16} color={colors.accent} />
            <Text style={styles.rowHeaderText}>{t('settings.accentColor')}</Text>
          </View>
          <View style={styles.swatchGrid}>
            {CUSTOM_ACCENTS.map((hex) => {
              const active = activeAccent === hex.toLowerCase();
              return (
                <Pressable
                  key={hex}
                  onPress={() => setCustomAccent(hex)}
                  style={[
                    styles.pickerSwatch,
                    { backgroundColor: hex },
                    active && styles.swatchActive,
                  ]}
                >
                  {active ? <Icon name="check" size={16} color="#ffffff" /> : null}
                </Pressable>
              );
            })}
          </View>
          <ColorPicker
            value={activeAccent}
            onChange={setCustomAccent}
            onInteractStart={() => setScrollEnabled(false)}
            onInteractEnd={() => setScrollEnabled(true)}
          />
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

        {/* Suporte */}
        <Text style={styles.sectionLabel}>{t('settings.supportTitle')}</Text>
        <View style={styles.card}>
          <Pressable
            onPress={contactSupport}
            style={({ pressed }) => [styles.option, pressed && styles.pressed]}
          >
            <Icon name="globe" size={16} color={colors.accent} />
            <Text style={[styles.optionLabel, styles.optionLabelFlex]}>
              {t('settings.support')}
            </Text>
            <Icon name="chevron-right" size={20} color={colors.textMuted} />
          </Pressable>
        </View>
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
    modeRow: {
      flexDirection: 'row',
      gap: 8,
      paddingVertical: 12,
    },
    modeChip: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: colors.inputAlt,
      borderWidth: 1,
      borderColor: colors.borderStrong,
    },
    modeChipActive: {
      backgroundColor: colors.accentTint,
      borderColor: colors.accentBorder,
    },
    modeChipText: {
      color: colors.textDim2,
      fontFamily: fonts.bodyMed,
      fontSize: 13,
    },
    modeChipTextActive: {
      color: colors.accent,
      fontFamily: fonts.bodyBold,
    },
    swatchGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      paddingVertical: 14,
    },
    pickerSwatch: {
      width: 44,
      height: 44,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    swatchActive: {
      borderWidth: 3,
      borderColor: colors.text,
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
