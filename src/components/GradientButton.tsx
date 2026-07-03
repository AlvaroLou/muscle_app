import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { colors, fonts, gradients } from '@/theme';
import { Icon, IconName } from './Icon';

interface Props {
  label: string;
  onPress?: () => void;
  icon?: IconName;
  style?: ViewStyle;
}

/**
 * Botão primário com gradiente neon (usado no "START WORKOUT" e "BEGIN
 * WORKOUT"). Encapsula o LinearGradient + estado de pressão.
 */
export function GradientButton({ label, onPress, icon, style }: Props) {
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
        <View style={styles.content}>
          {icon ? <Icon name={icon} size={20} color={colors.onAccent} /> : null}
          <Text style={styles.label}>{label}</Text>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
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
  label: {
    color: colors.onAccent,
    fontFamily: fonts.heading,
    fontSize: 18,
    letterSpacing: 1,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
});
