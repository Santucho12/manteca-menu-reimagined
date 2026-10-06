import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const sinBlancosNiComentarios = { skipBlankLines: true, skipComments: true };

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ['**/*.ts', '**/*.mjs'],
    rules: {
      'max-lines-per-function': ['error', { max: 20, ...sinBlancosNiComentarios }],
      'max-lines': ['error', { max: 300, ...sinBlancosNiComentarios }],
    },
  },
  {
    files: ['**/*.tsx'],
    rules: {
      'max-lines-per-function': ['error', { max: 80, ...sinBlancosNiComentarios }],
      'max-lines': ['error', { max: 300, ...sinBlancosNiComentarios }],
    },
  },
  {
    // Un describe es una funcion: en los tests vale el limite de archivo.
    files: ['**/*.test.ts', 'e2e/**/*.ts'],
    rules: { 'max-lines-per-function': 'off' },
  },
  globalIgnores([
    '.next/**',
    'next-env.d.ts',
    'src/components/ui/**',
    'src/lib/supabase/tipos.ts',
    'test-results/**',
    'playwright-report/**',
  ]),
]);
