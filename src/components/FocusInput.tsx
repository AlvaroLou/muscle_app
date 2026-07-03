import React, { useState } from 'react';
import { StyleSheet, TextInput, TextInputProps, TextStyle } from 'react-native';

import { colors } from '@/theme';

interface Props extends TextInputProps {
  /** Cor da borda quando focado (padrão: neon). */
  focusBorderColor?: string;
  baseBorderColor?: string;
  inputStyle?: TextStyle;
}

/**
 * TextInput que troca a cor da borda ao focar — reproduz o comportamento
 * onFocus/onBlur do protótipo. Cursor/seleção em verde-neon.
 */
export function FocusInput({
  focusBorderColor = 'rgba(57,255,20,0.5)',
  baseBorderColor = colors.borderInput,
  inputStyle,
  style,
  ...rest
}: Props) {
  const [focused, setFocused] = useState(false);
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
        styles.base,
        { borderColor: focused ? focusBorderColor : baseBorderColor },
        inputStyle,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    color: colors.text,
  },
});
