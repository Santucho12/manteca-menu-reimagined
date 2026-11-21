import { expect, type Browser, type Locator, type Page } from '@playwright/test';

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

/**
 * Lo que no existe o no le corresponde a quien entra. No se mira el codigo HTTP: con loading.tsx
 * la respuesta sale antes de que la pagina decida, y arranca siempre en 200.
 */
export async function esperarNoEncontrado(page: Page): Promise<void> {
  await expect(
    page.getByRole('heading', { level: 1, name: 'No encontramos esta página' }),
  ).toBeVisible();
}

/**
 * Espera a que React tome el control del elemento. Lo que se elige antes se pierde al hidratar la
 * página, y la prueba toca más rápido que una persona.
 */
export async function esperarHidratacion(elemento: Locator): Promise<void> {
  await expect
    .poll(() => elemento.evaluate((n) => Object.keys(n).some((k) => k.startsWith('__reactFiber'))))
    .toBe(true);
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

// En el celular el numero de pendientes va antes del nombre ("3Gastos").
const deSeccion = (nombre: string) => ({ name: new RegExp(`^(\\d+ ?)?${nombre}`) });

/**
 * El enlace de una seccion del panel. En el celular abajo van solo cuatro: si no esta, abre
 * "Mas" y lo busca ahi.
 */
export async function enlaceDeSeccion(page: Page, nombre: string): Promise<Locator> {
  const enlace = page
    .getByRole('navigation', { name: 'Panel' })
    .getByRole('link', deSeccion(nombre));
  if (await enlace.isVisible()) return enlace;
  await page.getByRole('button', { name: 'Más' }).click();
  return page
    .getByRole('navigation', { name: 'Más secciones' })
    .getByRole('link', deSeccion(nombre));
}

export async function abrirSeccion(page: Page, nombre: string): Promise<void> {
  await (await enlaceDeSeccion(page, nombre)).click();
}

type FinDelCierre = { facturado?: Record<string, string>; comentario?: string };

/**
 * Del formulario de la caja al guardado, por la ventana del cierre: cada tipo de venta sin
 * monto pedido va en cero. Termina con el clic en guardar (pedido 100).
 */
export async function terminarCierre(page: Page, fin: FinDelCierre = {}): Promise<void> {
  await page.getByRole('button', { name: 'Siguiente', exact: true }).click();
  const paso = page.getByRole('dialog');
  // Todos los tipos de venta van en la misma ventana (Santiago, 2026-11-20).
  for (const etiqueta of await paso
    .locator('label', { hasText: /^Facturado en / })
    .allInnerTexts()) {
    const nombre = etiqueta.trim().replace(/^Facturado en /i, '');
    await paso.getByLabel(etiqueta.trim()).fill(fin.facturado?.[nombre] ?? '0');
  }
  if (fin.comentario) await paso.getByLabel('Comentario (opcional)').fill(fin.comentario);
  await paso.getByRole('button', { name: /^Guardar (cierre|cambios)$/ }).click();
}

/** Vender va en tres pasos (pedido 102): de los productos al cobro, dejando el tipo que esté. */
export async function irAlCobro(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Siguiente' }).click();
  await page.getByRole('button', { name: 'Siguiente' }).click();
}

/** Vuelve al paso de los productos desde la barra de pasos. */
export async function volverALosProductos(page: Page): Promise<void> {
  await page
    .getByRole('list', { name: 'Pasos de la venta' })
    .getByRole('button', { name: /Productos/ })
    .click();
}
