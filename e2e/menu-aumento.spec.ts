import { expect, test, type Page } from '@playwright/test';
import { clienteSecretoDePruebas } from '../tests/clientes';
import { borrarMenuDePrueba, sembrarCategoria, sembrarProducto } from '../tests/menu-de-prueba';
import { SESIONES, aviso } from './ayudas';

test.use({ storageState: SESIONES.admin });

let categorias: string[] = [];
test.afterEach(async () => {
  await borrarMenuDePrueba(categorias);
  categorias = [];
});

async function prepararAumento(page: Page, categoria: string, porcentaje: string) {
  await page.goto('/admin/menu/aumento');
  await page.getByLabel('Alcance').selectOption({ label: categoria });
  await page.getByLabel('Porcentaje').fill(porcentaje);
  await page.getByRole('button', { name: 'Ver cambios' }).click();
}

test('muestra los cambios, ocultos incluidos, y los aplica', async ({ page }) => {
  const categoria = await sembrarCategoria({ compartidos: [300000] });
  categorias.push(categoria.id);
  const oculto = await sembrarProducto(categoria, { visible: false, precios: [500000] });
  await prepararAumento(page, categoria.nombre, '10');
  const tabla = page.getByRole('table', { name: 'Cambios de precio' });
  await expect(tabla.getByRole('row').filter({ hasText: 'Precio compartido' })).toContainText(
    '$3.000$3.300',
  );
  await expect(tabla.getByRole('row').filter({ hasText: oculto.nombre })).toContainText('Oculto');
  // En el celular la tabla no puede esconder el precio nuevo detras de un desplazamiento.
  await expect(tabla.getByRole('cell', { name: '$3.300' })).toBeInViewport();
  await page.getByRole('button', { name: 'Aplicar aumento' }).click();
  await expect(page.getByText('Listo: se actualizaron 2 precios.')).toBeVisible();
  await page.goto('/admin/menu');
  await expect(page.getByRole('listitem').filter({ hasText: oculto.nombre })).toContainText(
    '$5.500',
  );
});

test('si un precio cambia despues de ver los cambios, no aplica nada', async ({ page }) => {
  const categoria = await sembrarCategoria({ compartidos: [300000] });
  categorias.push(categoria.id);
  await prepararAumento(page, categoria.nombre, '10');
  await expect(page.getByRole('table', { name: 'Cambios de precio' })).toBeVisible();
  await clienteSecretoDePruebas()
    .from('precios')
    .update({ monto_centavos: 310000 })
    .eq('presentacion_id', categoria.presentaciones[0]!.id);
  await page.getByRole('button', { name: 'Aplicar aumento' }).click();
  await expect(aviso(page)).toHaveText(
    'Los precios cambiaron mientras mirabas. Revisá los cambios de nuevo.',
  );
});

test('explica un porcentaje fuera de los limites', async ({ page }) => {
  const categoria = await sembrarCategoria();
  categorias.push(categoria.id);
  await prepararAumento(page, categoria.nombre, '300');
  await expect(page.getByLabel('Porcentaje')).toHaveAccessibleDescription(
    'El porcentaje va de -50 a 200, y no puede ser 0.',
  );
});

test('cambiar el porcentaje descarta la vista previa', async ({ page }) => {
  const categoria = await sembrarCategoria({ compartidos: [300000] });
  categorias.push(categoria.id);
  await prepararAumento(page, categoria.nombre, '10');
  await expect(page.getByRole('button', { name: 'Aplicar aumento' })).toBeVisible();
  await page.getByLabel('Porcentaje').fill('20');
  await expect(page.getByRole('button', { name: 'Aplicar aumento' })).toHaveCount(0);
});

test('guarda una captura del aumento', async ({ page }, info) => {
  const categoria = await sembrarCategoria({ compartidos: [300000] });
  categorias.push(categoria.id);
  await sembrarProducto(categoria, { precios: [450000] });
  await prepararAumento(page, categoria.nombre, '10');
  await expect(page.getByRole('table', { name: 'Cambios de precio' })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: `e2e/capturas/menu-aumento-${info.project.name}.png`,
    fullPage: true,
  });
});
