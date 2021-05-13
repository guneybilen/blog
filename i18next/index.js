const i18next = require('i18next');
const i18nextMiddleware = require('i18next-express-middleware');

const localeEN = require('@app/i18next/locales/en.json');
const localeTR = require('@app/i18next/locales/tr.json');

i18next.use(i18nextMiddleware.LanguageDetector).init({
  detection: {
    order: ['header'],
    lookupHeader: 'accept-language',
  },
  preload: ['en', 'tr'],
  whitelist: ['en', 'tr'],
  fallbackLng: 'tr',
  resources: {
    en: { translation: localeEN },
    tr: { translation: localeTR },
  },
});

module.exports = { i18next, i18nextMiddleware };
