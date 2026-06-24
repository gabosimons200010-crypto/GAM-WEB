module.exports = {
  root: true,
  ...require('@gamarra/config/eslint-preset.cjs'),
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 2022,
    tsconfigRootDir: __dirname,
  },
};
