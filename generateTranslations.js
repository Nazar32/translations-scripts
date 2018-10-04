/* eslint-disable no-use-before-define */

/**
 * generate new translations for {locale} from {sourcePath} based on keys from defaultLocale
 * usage: node generateTranslations [params]
 * params: [locale, fileSourcePath]
 * example: node generateTranslations --locale=en-IN --sourcePath=./enTrans.js
 *  --checkForFirstLetterCase=false
 *
 * arguments:
 *  locale (required): translation language
 *  sourcePath (required): path to file with new translations (file must export string in which
 *    each line contain phrase key and value separated by separator)
 *
 *    file content example (order numbers will be ignored):
 *      1) Основная информация —  basic information
 *      2) Дополнительные параметры — advanced settings
 *
 *  separator (not required, default '—'): symbol which separates key and value in each phrase of
 *    sourcePath file string
 *
 *  checkForFirstLetterCase (not required, default false): if true will look for first letter case
 *    in key and make the same key for value
 *
 *  defaultLocale (not required, default 'ru-RU'): locale, keys of which are used for generation
 *    of new translations
 */

const path = require('path');
const {
  parseConsoleArguments, writeJsonToFile, error, dynamicRequire, traverseTranslations,
} = require('./common');

const params = {
  defaultLocale: 'ru-RU',
  separator: '—',
  locale: undefined,
  sourcePath: undefined,
  checkForFirstLetterCase: false,
  languagesDir: undefined,
};

parseConsoleArguments(params);
validateArguments(params);

const newSource = parseSource();
const fileToWrite = path.resolve(__dirname, `${params.languagesDir}/${params.locale}/translation.json`);
const originalSource = path.resolve(__dirname, `${params.languagesDir}/${params.defaultLocale}/translation.json`);
const originalTranslations = dynamicRequire(originalSource);
let targetTranslations = null;

try {
  targetTranslations = dynamicRequire(fileToWrite);
} catch (e) {
  targetTranslations = null;
}

const updateResult = getUpdatedTranslationFromSource(
  targetTranslations,
  originalTranslations,
  newSource
);

checkNotTranslatedKeys(updateResult.notTranslatedKeys);
writeJsonToFile(
  fileToWrite,
  updateResult.updatedTranslations,
  `\nSuccessfully updated new ${updateResult.successfullyWrittenPhrasesNumber} phrases`
);

function validateArguments(args) {
  Object.keys(args)
    .forEach((key) => {
      if (args[key] === undefined) {
        error(`${key} argument is not present, please transfer ${key} via --${key} argument`);
        process.exit();
      }
    });
}

function checkForFirstLetterUpperCase(str) {
  return str.substr(0, 1) === str.substr(0, 1).toUpperCase();
}

function replaceFirstLetterCase(str, isUpper = false) {
  let firstLetter = str[0];
  firstLetter = isUpper
    ? firstLetter.toUpperCase()
    : firstLetter.toLowerCase();

  return `${firstLetter}${str.slice(1)}`;
}

function parseSource() {
  const source = dynamicRequire(params.sourcePath);
  const result = {};
  source
    .replace(/^[0-9]+./gm, '')
    .split('\n')
    .map(i => i.trim())
    .forEach((i) => {
      let [key, value] = i.split(params.separator);
      if (!key || !value) {
        return;
      }
      key = key.trim();
      value = value.trim();
      if (params.checkForFirstLetterCase === 'true') {
        const isFirstLetterUpper = checkForFirstLetterUpperCase(key);
        value = replaceFirstLetterCase(value, isFirstLetterUpper);
      }
      result[key] = value;
    });
  return result;
}

function getUpdatedTranslationFromSource() {
  const notTranslatedKeys = [];
  let successfullyWrittenPhrasesNumber = 0;
  const updatedTranslations = targetTranslations || originalTranslations;

  traverseTranslations(originalTranslations, (namespace, key) => {
    const targetTranslationValue = targetTranslations[namespace][key];
    const originalTranslationValue = originalTranslations[namespace][key];
    const needToUpdateFromNewSource = newSource.hasOwnProperty(key);

    if (needToUpdateFromNewSource) {
      updatedTranslations[namespace][key] = newSource[key];
      successfullyWrittenPhrasesNumber++;
    } else if (targetTranslations && targetTranslationValue === originalTranslationValue) {
      notTranslatedKeys.push(key);
    } else {
      updatedTranslations[namespace][key] = originalTranslationValue;
      successfullyWrittenPhrasesNumber++;
    }
  });

  return {
    updatedTranslations,
    notTranslatedKeys,
    successfullyWrittenPhrasesNumber,
  };
}

function checkNotTranslatedKeys(notTranslatedKeys) {
  if (notTranslatedKeys.length > 0) {
    error(`${notTranslatedKeys.length} keys were not translated in ${fileToWrite}:`);
    global.console.log(notTranslatedKeys);
  }
}
