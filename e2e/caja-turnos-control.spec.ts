import { expect, test } from '@playwright/test';
import { diaEnArgentina } from '../src/lib/fechas';
import {
  borrarCierres,
  borrarPostergaciones,
  diaSiguiente,
  restaurarHorasDeCierre,
  sembrarCierre,
} from '../tests/cierres-de-prueba';
import { clienteSecretoDePruebas } from '../tests/clientes';
import { idDeCuentaDePrueba } from '../tests/consultas-de-prueba';
import { idDelLocalPrincipal } from '../tests/locales';
import { borrarVentas, sembrarVentaConPago } from '../tests/ventas-de-prueba';
import { SESIONES } from './ayudas';

const HOY = diaEnArgentina(new Date());
// Un día de hace un mes: no traba el mostrador de hoy, y entra en el filtro del control.
const DIA = diaSiguiente(HOY, -20);
const cierres: string[] = [];
const ventas: string[] = [];

test.use({ storageState: SESIONES.admin });

test.afterEach(async () => {
  await restaurarHorasDeCierre();
  await borrarVentas(ventas.splice(0));
  await borrarCierres(cierres.splice(0));
  await borrarPostergaciones([DIA]);
});

async function postergacionSembrada() {
  const secreto = clienteSecretoDePruebas();
  const desde = new Date(`${DIA}T19:00:00Z`);
  await secreto.from('postergaciones_de_cierre').insert({
    local_id: await idDelLocalPrincipal(secreto),
    fecha: DIA,
    turno: 1,
    postergado_por: await idDeCuentaDePrueba('caja'),
    desde: desde.toISOString(),
    hasta: new Date(desde.getTime() + 600_000).toISOString(),
  });
}

const control = `/admin/caja/control?desde=${DIA}&hasta=${DIA}`;

test('el control muestra el turno de cada cierre y el turno pendiente', async ({ page }) => {
  ventas.push(await sembrarVentaConPago({ fecha: DIA, turno: 1, medio: 'qr', centavos: 1000 }));
  ventas.push(await sembrarVentaConPago({ fecha: DIA, turno: 2, medio: 'qr', centavos: 1000 }));
  cierres.push((await sembrarCierre({ fecha: DIA, turno: 2 })).id);
  await page.goto(control);
  await expect(page.getByText('1 turno pendiente')).toBeVisible();
  await page.getByText('1 turno pendiente').click();
  const pendientes = page.getByRole('list', { name: 'Turnos sin cierre' });
  await expect(pendientes.getByRole('link', { name: /Mediodía/ })).toHaveAttribute(
    'href',
    `/admin/caja?fecha=${DIA}&turno=1`,
  );
  await expect(page.getByRole('main').getByText('Noche').first()).toBeVisible();
});

test('el detalle del cierre cuenta las postergaciones', async ({ page }) => {
  const { id } = await sembrarCierre({ fecha: DIA, turno: 1 });
  cierres.push(id);
  await postergacionSembrada();
  await page.goto(`/admin/caja/cierres/${id}`);
  await expect(page.getByText('Se postergó 1 vez (10 min).')).toBeVisible();
});

test('el admin cambia las horas de cierre', async ({ page }) => {
  await page.goto('/admin/caja/control');
  await page.getByRole('button', { name: 'Horas de cierre' }).click();
  const ventana = page.getByRole('dialog', { name: 'Horas de cierre' });
  await ventana.getByLabel('Cierre del mediodía').fill('23:00');
  await ventana.getByLabel('Cierre de la noche').fill('22:00');
  await ventana.getByRole('button', { name: 'Guardar horas' }).click();
  await expect(ventana).toContainText('El cierre del mediodía va antes que el de la noche.');
  await ventana.getByLabel('Cierre del mediodía').fill('15:30');
  await ventana.getByLabel('Cierre de la noche').fill('23:50');
  await ventana.getByRole('button', { name: 'Guardar horas' }).click();
  await expect(ventana).toContainText('Horas guardadas.');
});
