const {
  parseConsoleArguments, getTranslationFilePath, dynamicRequire, error, success, traverseTranslations,
} = require('./common');

const params = {
  defaultLocale: 'ru-RU',
  localeToCheck: undefined,
  languagesDir: undefined,
};

parseConsoleArguments(params);

const translationToCheckPath = getTranslationFilePath(params.languagesDir, params.localeToCheck);
const translationToCheck = dynamicRequire(translationToCheckPath);

const defaultTranslationsPath = getTranslationFilePath(params.languagesDir, params.defaultLocale);
const defaultTranslation = dynamicRequire(defaultTranslationsPath);

const missingTranslations = [];

traverseTranslations(defaultTranslation, (namespace, key) => {
  const translationToCheckValue = translationToCheck[namespace][key];
  const defaultTranslationValue = defaultTranslation[namespace][key];

  if (translationToCheckValue === defaultTranslationValue || !translationToCheckValue) {
    missingTranslations.push(defaultTranslationValue);
  }
});

if (missingTranslations.length === 0) {
  success('All translations are up to date');
} else {
  error(`Translations are missing in ${params.localeToCheck}`);
  missingTranslations.forEach(t => error(t));
}
