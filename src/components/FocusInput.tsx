import React, { useState } from 'react';
import { StyleSheet, TextInput, TextInputProps, TextStyle } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

interface Props extends TextInputProps {
  /** Cor da borda quando focado (padrão: accent do tema). */
  focusBorderColor?: string;
  baseBorderColor?: string;
  inputStyle?: TextStyle;
}

/**
 * TextInput que troca a cor da borda ao focar — reproduz o comportamento
 * onFocus/onBlur do protótipo. Cursor/seleção usam o accent do tema.
 */
export function FocusInput({
  focusBorderColor,
  baseBorderColor,
  inputStyle,
  style,
  ...rest
}: Props) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const focusColor = focusBorderColor ?? colors.accentBorderStrong;
  const baseColor = baseBorderColor ?? colors.borderInput;
  return (
    <TextInput
      selectionColor={colors.accent}
      placeholderTextColor={colors.textMuted}
      onFocus={(e) => {
        setFocused(true);
        rest.onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        rest.onBlur?.(e);
      }}
      style={[
        { borderWidth: 1, color: colors.text },
        { borderColor: focused ? focusColor : baseColor },
        inputStyle,
        style,
      ]}
      {...rest}
    />
  );
}
