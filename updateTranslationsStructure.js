/**
 * updates translations structure of all translations from defaultLocale translation
 * usage: node updateTranslationsStructure [params]
 * params: [defaultLocale]
 * example: node generateTranslations --defaultLocale=en-IN
 * defaultLocale (not required, default 'ru-RU'): locale, keys of which are used
 *  for generation of new translations
 */
const fs = require('fs');
const path = require('path');
const {
  parseConsoleArguments, writeJsonToFile, dynamicRequire, traverseTranslations,
} = require('./common');

const { lstatSync, readdirSync } = fs;

function isDirectory(source) {
  return lstatSync(source).isDirectory();
}

function getDirectories(source) {
  return readdirSync(source).filter(name => isDirectory(path.join(source, name)));
}

const params = {
  defaultLocale: 'ru-RU',
  languagesDir: undefined,
};

parseConsoleArguments(params);

const languagesDirPath = path.resolve(__dirname, `${params.languagesDir}/languages`);
const defaultTranslationsPath = path.resolve(__dirname, `${params.languagesDir}/${params.defaultLocale}/translation.json`);

const languages = getDirectories(languagesDirPath);
const originalTranslations = dynamicRequire(defaultTranslationsPath);

function findTranslationValue(translations, keyToFind) {
  let translationValue = null;

  traverseTranslations(translations, (namespace, key) => {
    if (key === keyToFind) {
      translationValue = translations[namespace][key];
    }
  });

  return translationValue;
}

languages.forEach((language) => {
  const languageTranslationFileName = path.resolve(__dirname, `../languages/${language}/translation.json`);
  const languageTranslations = dynamicRequire(languageTranslationFileName);
  let successfullyUpdatedPhrasesNumber = 0;

  traverseTranslations(originalTranslations, (namespace, key) => {
    const languageTranslationValue = languageTranslations[namespace][key];
    const originalTranslationValue = originalTranslations[namespace][key];
    const translationIsMissing = !languageTranslationValue;

    if (translationIsMissing) {
      const translationValue = findTranslationValue(languageTranslations, key);
      languageTranslations[namespace][key] = translationValue || originalTranslationValue;
      successfullyUpdatedPhrasesNumber++;
    }
  });

  traverseTranslations(languageTranslations, (namespace, key) => {
    const languageTranslationValue = languageTranslations[namespace][key];
    const originalTranslationValue = originalTranslations[namespace][key];
    const translationNotActual = languageTranslationValue && !originalTranslationValue;

    if (translationNotActual) {
      delete languageTranslations[namespace][key];
      successfullyUpdatedPhrasesNumber++;
    }
  });

  const successText = `\n${language}: Successfully updated new ${successfullyUpdatedPhrasesNumber} phrases`;
  writeJsonToFile(languageTranslationFileName, languageTranslations, successText);
});
