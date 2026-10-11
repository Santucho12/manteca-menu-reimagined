import { defineConfig, devices } from '@playwright/test';

// Puerto propio del proyecto: el 3000 suele estar ocupado por otra aplicacion.
const PUERTO = 3210;
const URL_LOCAL = `http://localhost:${PUERTO}`;
const A_LA_VISTA = process.env.E2E_A_LA_VISTA === '1';

export default defineConfig({
  testDir: 'e2e',
  testMatch: '**/*.spec.ts',
  globalSetup: './e2e/preparacion.ts',
  // De a un navegador. Sin ventana: Santiago no quiere verla abrirse (pedido 32); con
  // E2E_A_LA_VISTA=1 se abre. El slowMo queda igual sin ventana: las pruebas cuentan con que
  // React termine de cargar antes de cada toque.
  workers: 1,
  fullyParallel: false,
  reporter: 'list',
  use: {
    baseURL: URL_LOCAL,
    headless: !A_LA_VISTA,
    launchOptions: { slowMo: 300 },
    screenshot: 'only-on-failure',
  },
  projects: [
    // Abre y guarda una sesion por rol antes de las pruebas.
    { name: 'sesiones', testMatch: /sesiones\.setup\.ts/ },
    { name: 'computadora', use: { ...devices['Desktop Chrome'] }, dependencies: ['sesiones'] },
    { name: 'celular', use: { ...devices['Pixel 7'] }, dependencies: ['sesiones'] },
  ],
  webServer: {
    command: 'npm run dev',
    // Se espera por el puerto y no por una URL: Playwright solo da por listo un
    // servidor que responde 2xx, 3xx o 400 a 403, y una ruta que todavia no
    // existe responde 404.
    port: PUERTO,
    // Nunca uno que ya estaba abierto: pudo arrancar con otras variables y otra base.
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
