import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text } from 'react-native';

import { fonts, ThemeColors } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { BottomSheet } from './BottomSheet';

export interface ConfirmAction {
  label: string;
  onPress: () => void;
  variant?: 'default' | 'danger' | 'primary';
}

interface Props {
  visible: boolean;
  title: string;
  message?: string;
  actions: ConfirmAction[];
  /** Rótulo do botão de fechar sem ação. Passe null para ocultar. */
  cancelLabel?: string | null;
  onClose: () => void;
}

/**
 * Diálogo de confirmação no estilo do app (bottom sheet animado), no lugar do
 * `Alert` nativo — que aparece no meio da tela e destoa do visual.
 */
export function ConfirmSheet({
  visible,
  title,
  message,
  actions,
  cancelLabel,
  onClose,
}: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  // `null` esconde o botão; `undefined` cai no rótulo padrão traduzido.
  const resolvedCancel = cancelLabel === null ? null : (cancelLabel ?? t('common.cancel'));
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}

      {actions.map((action) => (
        <Pressable
          key={action.label}
          style={({ pressed }) => [
            styles.btn,
            action.variant === 'primary' && styles.btnPrimary,
            action.variant === 'danger' && styles.btnDanger,
            pressed && styles.btnPressed,
          ]}
          onPress={() => {
            onClose();
            action.onPress();
          }}
        >
          <Text
            style={[
              styles.btnText,
              action.variant === 'primary' && styles.btnTextPrimary,
              action.variant === 'danger' && styles.btnTextDanger,
            ]}
          >
            {action.label}
          </Text>
        </Pressable>
      ))}

      {resolvedCancel ? (
        <Pressable
          style={({ pressed }) => [styles.cancel, pressed && styles.btnPressed]}
          onPress={onClose}
        >
          <Text style={styles.cancelText}>{resolvedCancel}</Text>
        </Pressable>
      ) : null}
    </BottomSheet>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  title: {
    color: colors.text,
    fontFamily: fonts.heading,
    fontSize: 22,
    letterSpacing: 0.3,
  },
  message: {
    color: colors.textSecondary,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
    marginBottom: 16,
  },
  btn: {
    alignItems: 'center',
    paddingVertical: 15,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.bg,
    marginTop: 10,
  },
  btnPrimary: {
    backgroundColor: colors.accentTint,
    borderColor: colors.accentBorder,
  },
  btnDanger: {
    backgroundColor: 'rgba(255, 59, 48, 0.12)',
    borderColor: 'rgba(255, 59, 48, 0.3)',
  },
  btnPressed: {
    opacity: 0.7,
  },
  btnText: {
    color: colors.text,
    fontFamily: fonts.bodyBold,
    fontSize: 15,
  },
  btnTextPrimary: {
    color: colors.accent,
  },
  btnTextDanger: {
    color: colors.danger,
  },
  cancel: {
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 8,
  },
  cancelText: {
    color: colors.textSecondary,
    fontFamily: fonts.bodyBold,
    fontSize: 14,
  },
  });
