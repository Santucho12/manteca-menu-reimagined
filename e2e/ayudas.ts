import type { Browser, Locator, Page } from '@playwright/test';

/** Sesiones que guarda e2e/sesiones.setup.ts, una por rol. Git no las sigue: tienen tokens. */
export const SESIONES = {
  admin: 'e2e/.sesiones/admin.json',
  caja: 'e2e/.sesiones/caja.json',
  invitado: 'e2e/.sesiones/invitado.json',
} as const;

/** El color de fondo calculado de un elemento, tal como lo pinta el navegador. */
export function colorDeFondo(elemento: Locator): Promise<string> {
  return elemento.evaluate((nodo) => getComputedStyle(nodo).backgroundColor);
}

/** El aviso de la pantalla. Dentro de main: Next.js suma afuera un anunciador con el mismo rol. */
export function aviso(page: Page): Locator {
  return page.getByRole('main').getByRole('alert');
}

/**
 * Otra persona, en otra ventana y sin sesion. La sesion vacia va a mano: un contexto nuevo
 * hereda la de `test.use`, y la persona entraria ya como el rol de la prueba.
 */
export async function abrirSinSesion(browser: Browser): Promise<Page> {
  const contexto = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  return contexto.newPage();
}

export async function ingresarComo(page: Page, email: string, contrasena: string): Promise<void> {
  await page.goto('/admin/ingresar');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Contraseña', { exact: true }).fill(contrasena);
  await page.getByRole('button', { name: 'Ingresar' }).click();
}
