import i18next from 'i18next';
import de from './locales/de.json';
import en from './locales/en.json';

i18next.init({
  lng: 'de',
  fallbackLng: 'en',
  resources: {
    de: { translation: de },
    en: { translation: en }
  },
  interpolation: {
    escapeValue: false
  }
});

export default i18next;
