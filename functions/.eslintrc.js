module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  parserOptions: {
    ecmaVersion: 8,
  },
  extends: [
    'eslint:recommended',
    'google',
  ],
  rules: {
    'quotes': ['error', 'single'],
    'object-curly-spacing': 'off',
    'max-len': 'off',
    'no-console': 'off',
  },
};
