import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from '@/locales/en.json';
import ptBR from '@/locales/pt-BR.json';
import { LanguageCode } from '@/repositories/preferencesRepository';

/**
 * Configuração do i18next. Inglês é o idioma padrão (fallback). O idioma inicial
 * segue o dispositivo; depois o PreferencesProvider aplica a escolha salva do
 * usuário via `i18n.changeLanguage`.
 */
export const SUPPORTED_LANGUAGES: LanguageCode[] = ['en', 'pt-BR'];

/** Resolve o idioma do dispositivo para um dos suportados (senão inglês). */
function deviceLanguage(): LanguageCode {
  const code = Localization.getLocales()[0]?.languageCode ?? 'en';
  return code === 'pt' ? 'pt-BR' : 'en';
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    'pt-BR': { translation: ptBR },
  },
  lng: deviceLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnNull: false,
});

export default i18n;
