import { expect, test } from '@playwright/test';
import { clienteSecretoDePruebas } from '../tests/clientes';
import { SESIONES } from './ayudas';

test.use({ storageState: SESIONES.admin });

// La fecha sale de la base en el momento: cambia cada vez que se sube un Excel.
async function textoEsperado(): Promise<string> {
  const { data } = await clienteSecretoDePruebas()
    .from('ventas')
    .select('fecha')
    .eq('origen', 'fudo')
    .eq('anulado', false)
    .order('fecha', { ascending: false })
    .limit(1)
    .single();
  const [, mes, dia] = data!.fecha.split('-');
  return `Ventas de Fudo cargadas hasta el ${dia}/${mes}`;
}

for (const [pantalla, ruta] of [
  ['Inicio', '/admin'],
  ['un reporte', '/admin/reportes/resultado'],
  ['Ventas', '/admin/ventas'],
] as const) {
  test(`${pantalla} dice hasta que dia hay ventas de Fudo`, async ({ page }) => {
    const texto = await textoEsperado();
    await page.goto(ruta);
    await expect(page.getByText(texto).first()).toBeVisible();
  });
}
