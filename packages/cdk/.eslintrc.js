const baseConfig = require('../../tools/@aws-cdk/cdk-build-tools/config/eslintrc');
baseConfig.parserOptions.project = __dirname + '/tsconfig.json';
module.exports = baseConfig;
