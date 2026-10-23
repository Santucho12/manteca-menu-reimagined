import { expect, test as preparar } from '@playwright/test';
import { emailDePrueba } from '../tests/cuentas';
import { leerEntornoPruebas } from '../tests/entorno-pruebas';
import { SESIONES, ingresarComo } from './ayudas';
import { PANTALLAS_PARA_CALENTAR } from './pantallas';

// Una sesion por rol para toda la corrida: cada ingreso cuenta contra el limite de Supabase.
for (const rol of Object.keys(SESIONES) as (keyof typeof SESIONES)[]) {
  preparar(`abre la sesion de ${rol}`, async ({ page }) => {
    await ingresarComo(page, emailDePrueba(rol), leerEntornoPruebas().CONTRASENA_USUARIOS_PRUEBA);
    // La primera vez el servidor compila /admin en frio y la redireccion tarda mas de 5 s.
    await expect(page).toHaveURL(/\/admin$/, { timeout: 30_000 });
    await page.context().storageState({ path: SESIONES[rol] });
  });
}

// El servidor de desarrollo compila cada pantalla la primera vez que alguien la abre, y eso
// tarda mas que la espera comun de una prueba. Se abren todas una vez, antes de las pruebas.
preparar('compila las pantallas del panel', async ({ browser }) => {
  preparar.setTimeout(300_000);
  const contexto = await browser.newContext({ storageState: SESIONES.admin });
  const pagina = await contexto.newPage();
  for (const ruta of PANTALLAS_PARA_CALENTAR) {
    await pagina.goto(ruta, { timeout: 60_000 }).catch(() => undefined);
  }
  await contexto.close();
});
