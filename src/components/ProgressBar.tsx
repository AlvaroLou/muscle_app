import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '@/theme/ThemeProvider';

interface Props {
  /** Progresso de 0 a 1. */
  value: number;
  color?: string;
  height?: number;
}

/** Barra de progresso reutilizável com preenchimento animado. */
export function ProgressBar({ value, color, height = 8 }: Props) {
  const { colors } = useTheme();
  const clamped = Math.max(0, Math.min(1, value));
  const w = useSharedValue(clamped);

  useEffect(() => {
    w.value = withTiming(clamped, { duration: 350 });
  }, [clamped, w]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${w.value * 100}%`,
  }));

  return (
    <View
      style={[
        styles.track,
        { height, borderRadius: height / 2, backgroundColor: colors.inputAlt },
      ]}
    >
      <Animated.View
        style={[
          fillStyle,
          {
            height: '100%',
            backgroundColor: color ?? colors.accent,
            borderRadius: height / 2,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
});
