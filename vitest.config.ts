import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { alias: { '@': path.resolve(import.meta.dirname, 'src') } },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'puros',
          include: ['src/**/*.test.ts', 'tests/**/*.test.ts', 'scripts/**/*.test.ts'],
          exclude: ['**/*.base.test.ts', 'node_modules/**'],
        },
      },
      {
        extends: true,
        test: {
          name: 'base',
          include: ['src/**/*.base.test.ts', 'tests/**/*.base.test.ts'],
          exclude: ['node_modules/**'],
          // Carga .env.local y comprueba la base. Los tests heredan esas mismas
          // variables: ningun otro archivo de entorno se carga despues.
          globalSetup: ['tests/preparacion-base.ts'],
          // Los tests comparten la base de pruebas: de a un archivo por vez.
          fileParallelism: false,
        },
      },
    ],
  },
});
