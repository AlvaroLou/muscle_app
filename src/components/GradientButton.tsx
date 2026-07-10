import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { fonts, ThemeColors } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { Icon, IconName } from './Icon';

interface Props {
  label: string;
  onPress?: () => void;
  icon?: IconName;
  style?: ViewStyle;
  /** `primary` (gradiente neon) ou `outline` (bordado, transparente). */
  variant?: 'primary' | 'outline';
}

/**
 * Botão de ação. `primary` = gradiente neon (CTA principal); `outline` = versão
 * secundária bordada. Encapsula o estado de pressão.
 */
export function GradientButton({ label, onPress, icon, style, variant = 'primary' }: Props) {
  const { colors, gradients } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const inner = (
    <View style={styles.content}>
      {icon ? (
        <Icon name={icon} size={20} color={variant === 'outline' ? colors.accent : colors.onAccent} />
      ) : null}
      <Text style={[styles.label, variant === 'outline' && styles.labelOutline]}>{label}</Text>
    </View>
  );

  if (variant === 'outline') {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.outline, pressed && styles.pressed, style]}
        accessibilityRole="button"
      >
        {inner}
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [pressed && styles.pressed, style]}
      accessibilityRole="button"
    >
      <LinearGradient
        colors={gradients.accent}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {inner}
      </LinearGradient>
    </Pressable>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    gradient: {
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
      justifyContent: 'center',
      // sombra neon (Android usa elevation; iOS usa shadow*)
      shadowColor: colors.accent,
      shadowOpacity: 0.35,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 4 },
      elevation: 8,
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    outline: {
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderColor: colors.accentBorderStrong,
      backgroundColor: colors.accentTintSofter,
    },
    label: {
      color: colors.onAccent,
      fontFamily: fonts.heading,
      fontSize: 18,
      letterSpacing: 1,
    },
    labelOutline: {
      color: colors.accent,
    },
    pressed: {
      opacity: 0.9,
      transform: [{ scale: 0.985 }],
    },
  });
