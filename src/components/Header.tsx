import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { fonts, spacing, ThemeColors } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { Icon } from './Icon';

interface Props {
  title?: string;
  onBack?: () => void;
  /** Elemento à direita (ex.: botão de favoritar, salvar). */
  right?: React.ReactNode;
  /** Desenha uma borda inferior (padrão: true). */
  bordered?: boolean;
}

/**
 * Cabeçalho reutilizável para telas modais: voltar à esquerda, título ao centro
 * e um slot livre à direita. Padroniza as top bars antes hand-rolled.
 */
export function Header({ title, onBack, right, bordered = true }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={[styles.bar, bordered && styles.bordered]}>
      <View style={styles.side}>
        {onBack ? (
          <Pressable style={styles.back} hitSlop={8} onPress={onBack}>
            <Icon name="chevron-left" size={22} color={colors.accent} />
            <Text style={styles.backText}>{t('common.back')}</Text>
          </Pressable>
        ) : null}
      </View>
      {title ? (
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      ) : (
        <View style={{ flex: 1 }} />
      )}
      <View style={[styles.side, styles.sideRight]}>{right}</View>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    bar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.sm,
      paddingBottom: spacing.lg,
    },
    bordered: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    side: {
      width: 80,
      justifyContent: 'center',
    },
    sideRight: {
      alignItems: 'flex-end',
    },
    back: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
    },
    backText: {
      color: colors.accent,
      fontFamily: fonts.bodyMed,
      fontSize: 14,
    },
    title: {
      flex: 1,
      textAlign: 'center',
      color: colors.text,
      fontFamily: fonts.heading,
      fontSize: 18,
    },
  });
