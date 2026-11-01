import { readFile } from 'node:fs/promises';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { clienteSecretoDePruebas } from '../clientes';
import { clienteComo } from '../sesiones';
import { borrarVentas } from '../ventas-de-prueba';
import { listarVentas } from '../../src/lib/ventas/consultas';
import {
  guardarSubida,
  MENSAJES_DE_LA_SUBIDA,
  vistaDeLaSubida,
} from '../../src/lib/ventas/subidaDeFudo';

const EXCEL = 'e2e/archivos/reporte-ventas-fudo.xlsx';

async function borrarLoSubido() {
  const { data } = await clienteSecretoDePruebas()
    .from('ventas')
    .select('id')
    .like('fudo_id', 'excel:2020-03-%');
  await borrarVentas((data ?? []).map((v) => v.id));
}

// Una corrida cortada puede haber dejado lo subido: se limpia antes y después. Borrar las ventas
// con sus renglones y su auditoría puede llevar más que los 10 s que Vitest da por defecto.
beforeAll(borrarLoSubido, 60_000);
afterAll(borrarLoSubido, 60_000);

describe('la vista previa de la subida', () => {
  it('cuenta los dias, las ventas y el total, sin guardar nada', async () => {
    const vista = await vistaDeLaSubida(await readFile(EXCEL));
    expect(vista).toEqual({
      ok: true,
      datos: {
        desde: '2020-03-02',
        hasta: '2020-03-04',
        dias: 3,
        ventas: 11,
        totalCentavos: 6350100,
      },
    });
    const { count } = await clienteSecretoDePruebas()
      .from('ventas')
      .select('id', { count: 'exact', head: true })
      .like('fudo_id', 'excel:2020-03-%');
    expect(count).toBe(0);
  });

  it('dice por que no se pudo leer el archivo', async () => {
    const vista = await vistaDeLaSubida(Buffer.from('nada'));
    expect(vista.ok).toBe(false);
  });
});

describe('guardar la subida', () => {
  it('guarda las ventas, y subir el mismo archivo otra vez no las duplica', async () => {
    const admin = await clienteComo('admin');
    const primera = await guardarSubida(admin, await readFile(EXCEL));
    expect(primera).toEqual({
      ok: true,
      datos: { nuevas: 11, actualizadas: 0, iguales: 0, anuladas: 0 },
    });
    const segunda = await guardarSubida(admin, await readFile(EXCEL));
    expect(segunda).toEqual({
      ok: true,
      datos: { nuevas: 0, actualizadas: 0, iguales: 11, anuladas: 0 },
    });
  });

  it('las ventas subidas se ven en la lista de Ventas como de Fudo', async () => {
    const lista = await listarVentas(await clienteComo('admin'), {
      desde: '2020-03-02',
      hasta: '2020-03-02',
      origen: 'fudo',
      medio: null,
      estado: null,
      pagina: 1,
    });
    expect(lista.total).toBe(5);
    expect(lista.totales.cobradoCentavos).toBe(4000100);
  });

  it('no inventa una hora: las del Excel no traen cuando se cerro cada venta', async () => {
    const lista = await listarVentas(await clienteComo('admin'), {
      desde: '2020-03-02',
      hasta: '2020-03-04',
      origen: 'fudo',
      medio: null,
      estado: null,
      pagina: 1,
    });
    expect(lista.filas.length).toBeGreaterThan(0);
    expect(lista.filas.map((fila) => fila.cerrada_en)).toEqual(lista.filas.map(() => null));
  });

  it('caja no sube nada', async () => {
    const respuesta = await guardarSubida(await clienteComo('caja'), await readFile(EXCEL));
    expect(respuesta).toEqual({ ok: false, mensaje: MENSAJES_DE_LA_SUBIDA.sinPermiso });
  });
});
