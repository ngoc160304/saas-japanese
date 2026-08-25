import prettierConfig from 'eslint-config-prettier';
import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import importPlugin from 'eslint-plugin-import';
import unusedImports from 'eslint-plugin-unused-imports';
import reactHooks from 'eslint-plugin-react-hooks';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    plugins: {
      import: importPlugin,
      'unused-imports': unusedImports,
      'react-hooks': reactHooks,
    },

    rules: {
      '@typescript-eslint/no-unused-vars': 'off',

      'unused-imports/no-unused-imports': 'error',

      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],

      'import/no-duplicates': 'error',
      'import/first': 'error',

      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      'no-console': 'warn',
      'no-debugger': 'error',

      eqeqeq: ['error', 'always'],

      'prefer-const': 'error',

      'no-var': 'error',

      'no-duplicate-imports': 'error',
    },
  },
  prettierConfig,

  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'coverage/**',
    'node_modules/**',
    'next-env.d.ts',
  ]),
]);

export default eslintConfig;
