import { afterAll, describe, expect, it } from 'vitest';
import {
  borrarCierres,
  cierreDe,
  datosDeCierre,
  diaLibre,
  gastosDelCierre,
} from '../cierres-de-prueba';
import { clienteSecretoDePruebas } from '../clientes';
import type { RolDePrueba } from '../cuentas';
import { clienteComo } from '../sesiones';
import { borrarVentas, sembrarVentaConPago } from '../ventas-de-prueba';

const cierres: string[] = [];
const ventas: string[] = [];
afterAll(async () => {
  await borrarCierres(cierres);
  await borrarVentas(ventas);
});

async function guardar(rol: RolDePrueba, fecha: string) {
  const { data, error } = await (
    await clienteComo(rol)
  ).rpc('cierres_guardar', {
    datos: datosDeCierre(fecha),
  });
  expect(error).toBeNull();
  cierres.push(data!);
  return data!;
}

async function resultado(rol: RolDePrueba, fecha: string) {
  const respuesta = await (
    await clienteComo(rol)
  ).rpc('cierres_con_resultado', {
    desde: fecha,
    hasta: fecha,
  });
  return respuesta;
}

describe('cierres_con_resultado', () => {
  it('suma solo las ventas del dia, del local, cerradas y sin anular', async () => {
    const fecha = diaLibre();
    const id = await guardar('caja', fecha);
    const venta = async (s: Parameters<typeof sembrarVentaConPago>[0]) =>
      ventas.push(await sembrarVentaConPago(s));
    await venta({ fecha, medio: 'efectivo', centavos: 2120000 });
    await venta({ fecha, medio: 'qr', centavos: 100000, estado: 'cancelada' });
    await venta({ fecha, medio: 'qr', centavos: 50000, anulada: true });
    await venta({ fecha, medio: 'credito', centavos: 200000, otroLocal: true });
    await venta({ fecha: '2001-01-01', medio: 'credito', centavos: 300000 });
    const { data, error } = await resultado('caja', fecha);
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data![0]).toMatchObject({
      id,
      ventas_efectivo_centavos: 2120000,
      ventas_credito_centavos: 0,
      ventas_qr_centavos: 0,
      retiros_centavos: 500000,
      gastos_centavos: 120000,
      fondo_inicial_centavos: 1000000,
      tolerancia_centavos: 50000,
    });
  });

  it('caja ve solo los suyos y el admin ve todos', async () => {
    const fecha = diaLibre();
    await guardar('admin', fecha);
    expect((await resultado('caja', fecha)).data).toHaveLength(0);
    expect((await resultado('admin', fecha)).data).toHaveLength(1);
  });

  it.each(['invitado', 'encargado', 'desactivado'] as const)('%s es rechazado', async (rol) => {
    const { data, error } = await resultado(rol, '2001-01-01');
    expect(error?.code ?? (data as unknown[]).length).toSatisfy(
      (valor: unknown) => valor === '42501' || valor === 0,
    );
  });
});

describe('cierres_editar', () => {
  it('el admin cambia lo declarado y reemplaza retiros y gastos sin duplicar', async () => {
    const fecha = diaLibre();
    const id = await guardar('caja', fecha);
    const nuevos = datosDeCierre(fecha, {
      efectivo_centavos: 3000000,
      retiros: [{ monto_centavos: 100000, quien: 'Ana' }],
      gastos: [{ monto_centavos: 50000, descripcion: 'Servilletas' }],
    });
    const admin = await clienteComo('admin');
    for (let vez = 0; vez < 2; vez++) {
      const { error } = await admin.rpc('cierres_editar', { el_id: id, datos: nuevos });
      expect(error).toBeNull();
    }
    const fila = (await resultado('caja', fecha)).data![0]!;
    expect(fila).toMatchObject({ retiros_centavos: 100000, gastos_centavos: 50000 });
    const activos = (await gastosDelCierre(id)).filter((g) => !g.anulado);
    expect(activos).toHaveLength(1);
    expect(activos[0]).toMatchObject({ descripcion: 'Servilletas' });
  });

  it('deja la auditoria con el valor anterior y el nuevo', async () => {
    const fecha = diaLibre();
    const id = await guardar('caja', fecha);
    await (
      await clienteComo('admin')
    ).rpc('cierres_editar', {
      el_id: id,
      datos: datosDeCierre(fecha, { efectivo_centavos: 999 }),
    });
    const { data } = await clienteSecretoDePruebas()
      .from('auditoria')
      .select('*')
      .eq('registro_id', id)
      .eq('accion', 'cambio');
    expect(JSON.stringify(data)).toContain('999');
  });

  // Caja ya no corrige lo que cargo: podria acomodar el numero despues de ver la diferencia.
  it.each(['caja', 'adminOtroLocal'] as const)('%s no edita un cierre de caja', async (rol) => {
    const fecha = diaLibre();
    const id = await guardar('caja', fecha);
    const { error } = await (
      await clienteComo(rol)
    ).rpc('cierres_editar', {
      el_id: id,
      datos: datosDeCierre(fecha, { efectivo_centavos: 999 }),
    });
    expect(error?.code).toBe('42501');
    expect((await cierreDe(id)).efectivo_centavos).toBe(2500050);
  });

  it('un cierre anulado no se edita', async () => {
    const fecha = diaLibre();
    const id = await guardar('caja', fecha);
    await (
      await clienteComo('admin')
    )
      .from('cierres_de_caja')
      .update({ anulado: true, motivo_anulacion: 'Prueba' })
      .eq('id', id);
    const { error } = await (
      await clienteComo('admin')
    ).rpc('cierres_editar', {
      el_id: id,
      datos: datosDeCierre(fecha),
    });
    expect(error?.code).toBe('PC303');
  });
});
