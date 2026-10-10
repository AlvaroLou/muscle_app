import * as NavigationBar from 'expo-navigation-bar';
import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';

function hideNavigationBar() {
  NavigationBar.setVisibilityAsync('hidden').catch(() => {});
}

/**
 * Mantém a barra de navegação do Android (voltar/início/recentes) oculta
 * enquanto o app está em uso. Um deslize na borda inferior mostra a barra
 * temporariamente; ela some sozinha de novo. Ao voltar de outro app (galeria,
 * compartilhar, anúncio) o Android pode reexibi-la, então ocultamos de novo.
 */
export function useImmersiveNavigationBar() {
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    hideNavigationBar();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') hideNavigationBar();
    });
    return () => sub.remove();
  }, []);
}
