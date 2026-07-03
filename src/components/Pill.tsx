import React from 'react';
import { StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';

import { colors, fonts } from '@/theme';

interface Props {
  label: string;
  color?: string;
  background?: string;
  borderColor?: string;
  mono?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

/** Tag arredondada (chip) reutilizada em vários lugares do app. */
export function Pill({
  label,
  color = colors.textDim,
  background = colors.white07,
  borderColor,
  mono = true,
  style,
  textStyle,
}: Props) {
  return (
    <View
      style={[
        styles.pill,
        { backgroundColor: background },
        borderColor ? { borderWidth: 1, borderColor } : null,
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          { color, fontFamily: mono ? fonts.mono : fonts.bodyMed },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
  },
});
