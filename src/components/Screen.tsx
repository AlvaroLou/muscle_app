import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/theme';

interface Props {
  children: React.ReactNode;
  edges?: readonly Edge[];
  style?: ViewStyle;
}

/** Casca de tela: fundo do tema + área segura. */
export function Screen({ children, edges = ['top', 'left', 'right'], style }: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={edges}>
      <View style={[styles.inner, style]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  inner: {
    flex: 1,
  },
});
