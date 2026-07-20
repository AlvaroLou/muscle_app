import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Header } from '@/components/Header';
import { Icon, IconName } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { PREMIUM_FEATURES } from '@/premium/PremiumFeatures';
import { usePremium } from '@/store/PremiumStore';
import { fonts, ThemeColors } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Premium'>;

export function PremiumScreen() {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const { colors, gradients } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { isPro, purchasePro, restorePurchase } = usePremium();

  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const freeList = t('premium.freeList', { returnObjects: true }) as unknown as string[];
  const proList = t('premium.proList', { returnObjects: true }) as unknown as string[];

  const buy = async () => {
    setBusy(true);
    setNote(null);
    try {
      await purchasePro();
    } finally {
      setBusy(false);
    }
  };

  const restore = async () => {
    setBusy(true);
    setNote(null);
    try {
      const ok = await restorePurchase();
      if (!ok) setNote(t('premium.nothingToRestore'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen edges={['top', 'left', 'right', 'bottom']}>
      <Header title={t('premium.headerTitle')} onBack={() => navigation.goBack()} bordered={false} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Hero */}
        <LinearGradient
          colors={gradients.accent}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroBadge}>
            <Icon name="star-filled" size={28} color={colors.onAccent} />
          </View>
          <Text style={styles.heroTitle}>{t('premium.title')}</Text>
          <Text style={styles.heroSubtitle}>{t('premium.subtitle')}</Text>
        </LinearGradient>

        {isPro ? (
          <View style={styles.proBox}>
            <Icon name="check" size={20} color={colors.accent} />
            <View style={{ flex: 1 }}>
              <Text style={styles.proBoxTitle}>{t('premium.alreadyPro')}</Text>
              <Text style={styles.proBoxDesc}>{t('premium.alreadyProDesc')}</Text>
            </View>
          </View>
        ) : null}

        {/* Benefícios */}
        <Text style={styles.sectionLabel}>{t('premium.benefits')}</Text>
        <View style={styles.benefits}>
          {PREMIUM_FEATURES.map((f) => (
            <View key={f.key} style={styles.benefitCard}>
              <View style={styles.benefitIcon}>
                <Icon name={f.icon as IconName} size={18} color={colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.benefitTitleRow}>
                  <Text style={styles.benefitTitle}>{t(`premium.feat.${f.key}.title`)}</Text>
                  {!f.available ? (
                    <View style={styles.soonPill}>
                      <Text style={styles.soonText}>{t('premium.soon')}</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.benefitDesc}>{t(`premium.feat.${f.key}.desc`)}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Comparativo Free × Pro */}
        <Text style={styles.sectionLabel}>{t('premium.comparison')}</Text>
        <View style={styles.compare}>
          <View style={styles.compareCol}>
            <Text style={styles.compareHead}>{t('premium.free')}</Text>
            {freeList.map((item, i) => (
              <View key={i} style={styles.compareRow}>
                <Icon name="x" size={14} color={colors.textMuted} />
                <Text style={styles.compareText}>{item}</Text>
              </View>
            ))}
          </View>
          <View style={[styles.compareCol, styles.compareColPro]}>
            <Text style={[styles.compareHead, { color: colors.accent }]}>{t('premium.pro')}</Text>
            {proList.map((item, i) => (
              <View key={i} style={styles.compareRow}>
                <Icon name="check" size={14} color={colors.accent} />
                <Text style={[styles.compareText, { color: colors.text }]}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        {note ? <Text style={styles.note}>{note}</Text> : null}
      </ScrollView>

      {/* CTA fixo */}
      {!isPro ? (
        <View style={styles.cta}>
          <Pressable
            onPress={buy}
            disabled={busy}
            style={({ pressed }) => [styles.buyBtn, pressed && { opacity: 0.9 }]}
          >
            <LinearGradient
              colors={gradients.accent}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buyGradient}
            >
              <Text style={styles.buyText}>
                {busy ? t('premium.processing') : t('premium.upgrade')}
              </Text>
            </LinearGradient>
          </Pressable>
          <Pressable onPress={restore} disabled={busy} hitSlop={8} style={styles.restoreBtn}>
            <Text style={styles.restoreText}>{t('premium.restore')}</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.cta}>
          <Pressable onPress={restore} disabled={busy} hitSlop={8} style={styles.restoreBtn}>
            <Text style={styles.restoreText}>{t('premium.restore')}</Text>
          </Pressable>
        </View>
      )}
    </Screen>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    content: {
      paddingHorizontal: 20,
      paddingBottom: 24,
    },
    hero: {
      borderRadius: 20,
      alignItems: 'center',
      paddingVertical: 28,
      paddingHorizontal: 20,
      gap: 8,
      marginBottom: 24,
    },
    heroBadge: {
      width: 56,
      height: 56,
      borderRadius: 18,
      backgroundColor: 'rgba(255,255,255,0.18)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 4,
    },
    heroTitle: {
      color: colors.onAccent,
      fontFamily: fonts.heading,
      fontSize: 28,
      textAlign: 'center',
    },
    heroSubtitle: {
      color: colors.onAccent,
      fontFamily: fonts.body,
      fontSize: 14,
      textAlign: 'center',
      opacity: 0.9,
    },
    proBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: colors.accentTintSoft,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.accentBorder,
      padding: 14,
      marginBottom: 20,
    },
    proBoxTitle: {
      color: colors.text,
      fontFamily: fonts.bodyBold,
      fontSize: 15,
    },
    proBoxDesc: {
      color: colors.textSecondary,
      fontFamily: fonts.body,
      fontSize: 12,
      marginTop: 2,
    },
    sectionLabel: {
      color: colors.textSecondary,
      fontFamily: fonts.bodyBold,
      fontSize: 12,
      letterSpacing: 2,
      marginBottom: 12,
    },
    benefits: {
      gap: 10,
      marginBottom: 24,
    },
    benefitCard: {
      flexDirection: 'row',
      gap: 12,
      backgroundColor: colors.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
    },
    benefitIcon: {
      width: 38,
      height: 38,
      borderRadius: 10,
      backgroundColor: colors.accentTint,
      alignItems: 'center',
      justifyContent: 'center',
    },
    benefitTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    benefitTitle: {
      color: colors.text,
      fontFamily: fonts.bodyBold,
      fontSize: 14,
      flexShrink: 1,
    },
    soonPill: {
      backgroundColor: colors.white07,
      borderRadius: 6,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    soonText: {
      color: colors.textMuted,
      fontFamily: fonts.mono,
      fontSize: 9,
      letterSpacing: 0.5,
    },
    benefitDesc: {
      color: colors.textSecondary,
      fontFamily: fonts.body,
      fontSize: 12,
      marginTop: 3,
      lineHeight: 17,
    },
    compare: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 20,
    },
    compareCol: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
      gap: 10,
    },
    compareColPro: {
      borderColor: colors.accentBorder,
      backgroundColor: colors.accentTintSofter,
    },
    compareHead: {
      color: colors.textSecondary,
      fontFamily: fonts.bodyBold,
      fontSize: 13,
      letterSpacing: 1,
      marginBottom: 2,
    },
    compareRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
    },
    compareText: {
      flex: 1,
      color: colors.textSecondary,
      fontFamily: fonts.body,
      fontSize: 12,
      lineHeight: 16,
    },
    note: {
      color: colors.textSecondary,
      fontFamily: fonts.body,
      fontSize: 13,
      textAlign: 'center',
      marginTop: 4,
    },
    cta: {
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 8,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      gap: 8,
    },
    buyBtn: {
      borderRadius: 14,
      overflow: 'hidden',
    },
    buyGradient: {
      paddingVertical: 16,
      alignItems: 'center',
    },
    buyText: {
      color: colors.onAccent,
      fontFamily: fonts.bodyBold,
      fontSize: 16,
      letterSpacing: 0.5,
    },
    restoreBtn: {
      alignItems: 'center',
      paddingVertical: 8,
    },
    restoreText: {
      color: colors.textSecondary,
      fontFamily: fonts.bodyBold,
      fontSize: 13,
    },
  });
