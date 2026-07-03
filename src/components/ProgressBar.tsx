import React from 'react';
import { StyleSheet, View } from 'react-native';

import { colors } from '@/theme';

interface Props {
  /** Progresso de 0 a 1. */
  value: number;
  color?: string;
  height?: number;
}

/** Barra de progresso simples e reutilizável. */
export function ProgressBar({ value, color = colors.accent, height = 8 }: Props) {
  const clamped = Math.max(0, Math.min(1, value));
  return (
    <View style={[styles.track, { height, borderRadius: height / 2 }]}>
      <View
        style={{
          width: `${clamped * 100}%`,
          height: '100%',
          backgroundColor: color,
          borderRadius: height / 2,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    backgroundColor: colors.inputAlt,
    overflow: 'hidden',
  },
});
