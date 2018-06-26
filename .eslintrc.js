module.exports = {
  'extends': 'eslint:recommended',
  "parserOptions": {
    "ecmaVersion": 8,
    "sourceType": "module",
    "ecmaFeatures": {
      "jsx": true
    }
  },
  'rules': {
    'camelcase': 1,
  },
  'env': {
    'jquery': 1,
    'node': 1,
    'browser': 1,
    'es6': 1
  }
}