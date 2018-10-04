const fs = require('fs');

function error(string) {
  global.console.log('\x1b[31m%s\x1b[0m', string);
}

function success(string) {
  global.console.log('\x1b[32m%s\x1b[0m', string);
}

function writeJsonToFile(fileToWrite, translations, successText) {
  fs.writeFile(fileToWrite, JSON.stringify(translations, null, 2), null, (err) => {
    if (err) {
      error(`Error writing file ${fileToWrite} ${err}`);
      return;
    }
    success(successText);
  });
}

function parseConsoleArguments(params) {
  process.argv.forEach((argument) => {
    Object.keys(params)
      .forEach((paramKey) => {
        if (argument.indexOf(`--${paramKey}`) !== -1) {
          params[paramKey] = argument.split('=')[1];
        }
      });
  });
}

function dynamicRequire(path) {
  return require.call(this, path);
}

function traverseTranslations(translations, callback) {
  Object.keys(translations).forEach((namespace) => {
    Object.keys(translations[namespace]).forEach((key) => {
      callback(namespace, key);
    });
  });
}

module.exports = {
  writeJsonToFile,
  parseConsoleArguments,
  error,
  dynamicRequire,
  traverseTranslations,
};
