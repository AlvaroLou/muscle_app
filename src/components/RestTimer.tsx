import React, { useEffect } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { useCountdown } from '@/hooks/useCountdown';
import { colors, fonts } from '@/theme';
import { formatClock } from '@/utils/time';
import { ProgressBar } from './ProgressBar';

interface Props {
  /** Segundos de descanso. > 0 abre o overlay; null/0 = fechado. */
  seconds: number | null;
  upNextLabel?: string;
  onDismiss: () => void;
}

/**
 * Overlay de descanso entre séries. Aparece ao concluir uma série, mostra a
 * contagem regressiva, permite ajustar (±15s) e pular. Toda a lógica de tempo
 * fica no useCountdown — aqui só desenha.
 */
export function RestTimer({ seconds, upNextLabel, onDismiss }: Props) {
  const countdown = useCountdown(onDismiss);
  const visible = seconds != null && seconds > 0;

  useEffect(() => {
    if (visible) countdown.start(seconds as number);
    // reage só à mudança do valor solicitado
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds]);

  const skip = () => {
    countdown.stop();
    onDismiss();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={skip}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.label}>DESCANSO</Text>
          <Text style={styles.time}>{formatClock(countdown.remaining)}</Text>

          <View style={styles.progress}>
            <ProgressBar value={countdown.progress} height={6} />
          </View>

          {upNextLabel ? (
            <Text style={styles.upNext}>
              A seguir: <Text style={styles.upNextStrong}>{upNextLabel}</Text>
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
            <Text style={styles.skip}>Pular descanso</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
