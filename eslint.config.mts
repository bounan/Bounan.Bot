import * as eslint from '@eslint/js';
import * as simpleImportSort from 'eslint-plugin-simple-import-sort';
import * as tseslint from 'typescript-eslint';

export default [
  {
    ignores: [
      '**/node_modules',
      '**/cdk.out',
      '**/coverage',
      'third-party',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: { project: './tsconfig.base.json' },
    },

    rules: {
      indent: ['error', 2, { SwitchCase: 1 }],

      quotes: ['error', 'single'],
    },
  },
  {
    plugins: {
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-import-type-side-effects': 'error',
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
    },
  },
  {
    files: ['**/*.spec.ts'],
    rules: {
      '@typescript-eslint/consistent-type-imports': 'off',
    },
  },
  {
    files: ['scripts/**/*.mjs'],
    languageOptions: {
      parserOptions: { project: false },
    },
  },
];
