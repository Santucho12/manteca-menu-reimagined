import { defineConfig, devices } from '@playwright/test';

// Puerto propio del proyecto: el 3000 suele estar ocupado por otra aplicacion,
// y Playwright reutiliza lo que encuentre escuchando en la URL.
const PUERTO = 3210;
const URL_LOCAL = `http://localhost:${PUERTO}`;

export default defineConfig({
  testDir: 'e2e',
  testMatch: '**/*.spec.ts',
  globalSetup: './e2e/preparacion.ts',
  // Se prueba a la vista y de a un navegador, para que Santiago pueda mirarlo.
  workers: 1,
  fullyParallel: false,
  reporter: 'list',
  use: {
    baseURL: URL_LOCAL,
    headless: false,
    launchOptions: { slowMo: 300 },
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'computadora', use: { ...devices['Desktop Chrome'] } },
    { name: 'celular', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'npm run dev',
    // Se espera por el puerto y no por una URL: Playwright solo da por listo un
    // servidor que responde 2xx, 3xx o 400 a 403, y una ruta que todavia no
    // existe responde 404.
    port: PUERTO,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
