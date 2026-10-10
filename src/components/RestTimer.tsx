import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { useCountdown } from '@/hooks/useCountdown';
import { fonts, ThemeColors } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { formatClock } from '@/utils/time';
import { ProgressBar } from './ProgressBar';

interface Props {
  /** Segundos de descanso. > 0 abre o overlay; null/0 = fechado. */
  seconds: number | null;
  /**
   * Contador que muda a cada série concluída. Garante que o descanso reabra
   * mesmo quando duas séries seguidas têm o mesmo tempo (ex.: 90s → 90s).
   */
  trigger?: number;
  upNextLabel?: string;
  onDismiss: () => void;
}

/**
 * Overlay de descanso entre séries. Aparece ao concluir uma série, mostra a
 * contagem regressiva, permite ajustar (±15s) e pular. Toda a lógica de tempo
 * fica no useCountdown — aqui só desenha.
 */
export function RestTimer({ seconds, trigger, upNextLabel, onDismiss }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const countdown = useCountdown(onDismiss);
  // A visibilidade segue o próprio countdown: aparece enquanto está contando.
  const visible = countdown.running;

  useEffect(() => {
    if (seconds != null && seconds > 0) countdown.start(seconds);
    // dispara a cada série concluída (o trigger muda mesmo com tempos iguais)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);

  const skip = () => {
    countdown.stop();
    onDismiss();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={skip}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.label}>{t('rest.title')}</Text>
          <Text style={styles.time}>{formatClock(countdown.remaining)}</Text>

          <View style={styles.progress}>
            <ProgressBar value={countdown.progress} height={6} />
          </View>

          {upNextLabel ? (
            <Text style={styles.upNext}>
              {t('rest.upNext')} <Text style={styles.upNextStrong}>{upNextLabel}</Text>
            </Text>
          ) : null}

          <View style={styles.row}>
            <Pressable style={styles.adjustBtn} onPress={() => countdown.adjust(-15)}>
              <Text style={styles.adjustText}>−15s</Text>
            </Pressable>
            <Pressable style={styles.adjustBtn} onPress={() => countdown.adjust(15)}>
              <Text style={styles.adjustText}>+15s</Text>
            </Pressable>
          </View>

          <Pressable onPress={skip} hitSlop={8}>
            <Text style={styles.skip}>{t('rest.skip')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  sheet: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 28,
    alignItems: 'center',
  },
  label: {
    color: colors.accent,
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    letterSpacing: 3,
  },
  time: {
    color: colors.text,
    fontFamily: fonts.heading,
    fontSize: 72,
    marginVertical: 8,
  },
  progress: {
    alignSelf: 'stretch',
    marginBottom: 20,
  },
  upNext: {
    color: colors.textSecondary,
    fontFamily: fonts.body,
    fontSize: 13,
    marginBottom: 20,
    textAlign: 'center',
  },
  upNextStrong: {
    color: colors.text,
    fontFamily: fonts.bodyBold,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    alignSelf: 'stretch',
    marginBottom: 16,
  },
  adjustBtn: {
    flex: 1,
    backgroundColor: colors.inputAlt,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  adjustText: {
    color: colors.text,
    fontFamily: fonts.bodyBold,
    fontSize: 15,
  },
  skip: {
    color: colors.textSecondary,
    fontFamily: fonts.bodyMed,
    fontSize: 14,
    paddingVertical: 4,
  },
  });
