import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';

/**
 * Wrapper de ícones. O protótipo usava `lucide-react` (web); no React Native
 * mapeamos cada ícone para o equivalente em @expo/vector-icons (que já vem com
 * o Expo e funciona no Expo Go, sem dependência nativa extra).
 */
export type IconName =
  | 'home'
  | 'dumbbell'
  | 'history'
  | 'user'
  | 'more'
  | 'plus'
  | 'chevron-left'
  | 'chevron-right'
  | 'edit'
  | 'trash'
  | 'grip'
  | 'timer'
  | 'x'
  | 'check'
  | 'flame'
  | 'calendar';

interface Props {
  name: IconName;
  size?: number;
  color?: string;
}

const FEATHER: Partial<Record<IconName, keyof typeof Feather.glyphMap>> = {
  home: 'home',
  user: 'user',
  more: 'more-vertical',
  plus: 'plus',
  'chevron-left': 'chevron-left',
  'chevron-right': 'chevron-right',
  edit: 'edit-2',
  trash: 'trash-2',
  x: 'x',
  check: 'check',
  calendar: 'calendar',
};

const MCI: Partial<Record<IconName, keyof typeof MaterialCommunityIcons.glyphMap>> = {
  dumbbell: 'dumbbell',
  history: 'history',
  grip: 'drag-vertical',
  timer: 'timer-outline',
  flame: 'fire',
};

export function Icon({ name, size = 22, color = '#ffffff' }: Props) {
  const feather = FEATHER[name];
  if (feather) {
    return <Feather name={feather} size={size} color={color} />;
  }
  const mci = MCI[name];
  if (mci) {
    return <MaterialCommunityIcons name={mci} size={size} color={color} />;
  }
  return null;
}
