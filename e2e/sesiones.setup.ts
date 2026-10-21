import { expect, test as preparar } from '@playwright/test';
import { emailDePrueba } from '../tests/cuentas';
import { leerEntornoPruebas } from '../tests/entorno-pruebas';
import { SESIONES, ingresarComo } from './ayudas';

// Una sesion por rol para toda la corrida: cada ingreso cuenta contra el limite de Supabase.
for (const rol of Object.keys(SESIONES) as (keyof typeof SESIONES)[]) {
  preparar(`abre la sesion de ${rol}`, async ({ page }) => {
    await ingresarComo(page, emailDePrueba(rol), leerEntornoPruebas().CONTRASENA_USUARIOS_PRUEBA);
    // La primera vez el servidor compila /admin en frio y la redireccion tarda mas de 5 s.
    await expect(page).toHaveURL(/\/admin$/, { timeout: 30_000 });
    await page.context().storageState({ path: SESIONES[rol] });
  });
}
