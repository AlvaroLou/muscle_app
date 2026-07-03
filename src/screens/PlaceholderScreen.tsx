import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Icon, IconName } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { colors, fonts } from '@/theme';

interface Props {
  title: string;
  icon: IconName;
  message: string;
}

/** Tela genérica "em breve" — usada para History e Profile. */
export function PlaceholderScreen({ title, icon, message }: Props) {
  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
      </View>
      <View style={styles.center}>
        <View style={styles.iconCircle}>
          <Icon name={icon} size={32} color={colors.accent} />
        </View>
        <Text style={styles.soon}>Coming soon</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
    </Screen>
  );
}

export const HistoryScreen = () => (
  <PlaceholderScreen
    title="History"
    icon="history"
    message="Your completed sessions and volume history will appear here."
  />
);

export const ProfileScreen = () => (
  <PlaceholderScreen
    title="Profile"
    icon="user"
    message="Manage your goals, units and preferences here."
  />
);

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  title: {
    color: colors.text,
    fontFamily: fonts.heading,
    fontSize: 32,
    letterSpacing: 0.5,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.accentTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  soon: {
    color: colors.text,
    fontFamily: fonts.heading,
    fontSize: 22,
    letterSpacing: 0.5,
  },
  message: {
    color: colors.textSecondary,
    fontFamily: fonts.body,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    maxWidth: 260,
  },
});
