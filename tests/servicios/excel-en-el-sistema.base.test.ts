import {
  ventasPorCategoria,
  ventasPorDia,
  ventasPorProducto,
  ventasSinDetalle,
} from '../../src/lib/reportes/consultas';
import {
  categoriasDelReporte,
  productosDelReporte,
  totalesDeVentas,
} from '../../src/lib/reportes/ventas';
import { afterAll, afterEach, describe, expect, it } from 'vitest';
import { clienteSecretoDePruebas } from '../clientes';
import { borrarCierres, sembrarCierre } from '../cierres-de-prueba';
import { sembrarVentaConRenglones } from '../reportes-de-prueba';
import { idDelLocalPrincipal } from '../locales';
import { clienteComo } from '../sesiones';
import { borrarVentas, sembrarVenta, sembrarVentaConPago } from '../ventas-de-prueba';

// Lo que este archivo siembra en el futuro lejano mueve "hasta donde hay ventas de Fudo": por
// eso sus casos corren uno tras otro y se limpia cada uno.
const LEJANO = '2099-03-10';
const ventas: string[] = [];
const cierres: string[] = [];
const IMPORTACION = 'excel:2018-06-15:2018-06-15';

async function limpiarLejano() {
  await borrarVentas(ventas.splice(0));
  await borrarCierres(cierres.splice(0));
}

afterEach(limpiarLejano, 60_000);

afterAll(async () => {
  const secreto = clienteSecretoDePruebas();
  const { data } = await secreto.from('ventas').select('id').like('fudo_id', 'excel:2018-06-1%');
  await borrarVentas((data ?? []).map((v) => v.id));
  await secreto.from('auditoria').delete().like('registro_id', 'excel:2018-06-1%');
}, 60_000);

async function cargadasDelCierre(fecha: string): Promise<boolean | undefined> {
  const admin = await clienteComo('admin');
  const { data, error } = await admin.rpc('cierres_con_resultado', { desde: fecha, hasta: fecha });
  if (error) throw new Error(error.message);
  return (data as { ventas_cargadas?: boolean }[])[0]?.ventas_cargadas;
}

async function cierreEn(fecha: string) {
  const cierre = await sembrarCierre({ fecha });
  cierres.push(cierre.id);
}

async function ventaDeFudoEn(fecha: string) {
  ventas.push((await sembrarVenta({ origen: 'fudo', fecha })).id);
}

describe('si el dia del cierre ya tiene ventas de Fudo cargadas', () => {
  it('un cierre posterior al ultimo dia con ventas de Fudo no las tiene', async () => {
    await cierreEn(LEJANO);
    expect(await cargadasDelCierre(LEJANO)).toBe(false);
  });

  it('un cierre del mismo dia o anterior si, aunque ese dia no tenga ventas', async () => {
    await cierreEn(LEJANO);
    await cierreEn('2099-03-09');
    await ventaDeFudoEn(LEJANO);
    expect(await cargadasDelCierre(LEJANO)).toBe(true);
    expect(await cargadasDelCierre('2099-03-09')).toBe(true);
  });

  it('las ventas a mano posteriores no cuentan', async () => {
    await cierreEn(LEJANO);
    ventas.push((await sembrarVenta({ origen: 'manual', fecha: LEJANO })).id);
    expect(await cargadasDelCierre(LEJANO)).toBe(false);
  });
});

async function cargadasHasta(): Promise<string | null> {
  const { data, error } = await (await clienteComo('admin')).rpc('ventas_fudo_cargadas_hasta');
  if (error) throw new Error(error.message);
  return data as string | null;
}

describe('hasta que dia hay ventas de Fudo', () => {
  it('es el ultimo dia con una venta de Fudo', async () => {
    await ventaDeFudoEn(LEJANO);
    expect(await cargadasHasta()).toBe(LEJANO);
  });

  it('una venta de Fudo anulada no cuenta, ni para el cierre', async () => {
    await cierreEn(LEJANO);
    // Solo la resubida anula una venta de Fudo (PV307): se siembra ya anulada.
    const secreto = clienteSecretoDePruebas();
    const { data } = await secreto
      .from('ventas')
      .insert({
        local_id: await idDelLocalPrincipal(secreto),
        origen: 'fudo',
        fudo_id: `prueba-anulada-${Date.now()}`,
        fecha: LEJANO,
        total_centavos: 100,
        anulado: true,
        motivo_anulacion: 'Prueba',
      })
      .select('id')
      .single();
    ventas.push(data!.id);
    expect(await cargadasHasta()).not.toBe(LEJANO);
    expect(await cargadasDelCierre(LEJANO)).toBe(false);
  });
});

describe('las ventas sin detalle de productos', () => {
  it('cuenta solo las cerradas y sin anular que no tienen renglones', async () => {
    const dia = '2018-07-01';
    ventas.push(
      await sembrarVentaConPago({ fecha: dia, medio: 'qr', centavos: 150000 }),
      await sembrarVentaConPago({ fecha: dia, medio: 'qr', centavos: 9, estado: 'cancelada' }),
      await sembrarVentaConPago({ fecha: dia, medio: 'qr', centavos: 7, anulada: true }),
      await sembrarVentaConRenglones({
        fecha: dia,
        renglones: [{ producto: null, cantidad: 1, precioCentavos: 5000, descripcion: 'Agua' }],
      }),
    );
    const admin = await clienteComo('admin');
    const { data, error } = await admin.rpc('reporte_ventas_sin_detalle', {
      desde: dia,
      hasta: dia,
    });
    expect(error).toBeNull();
    expect(data).toEqual([{ ventas: 1, monto_centavos: 150000 }]);
  });
});

async function registrosDeLaImportacion() {
  const { data } = await clienteSecretoDePruebas()
    .from('auditoria')
    .select('accion, usuario_id, despues')
    .eq('registro_id', IMPORTACION);
  return data ?? [];
}

async function auditoriaDeVentasDel(fecha: string): Promise<number> {
  const secreto = clienteSecretoDePruebas();
  const { data } = await secreto.from('ventas').select('id').eq('fecha', fecha);
  const ids = (data ?? []).map((v) => v.id);
  const { count } = await secreto
    .from('auditoria')
    .select('id', { count: 'exact', head: true })
    .in('registro_id', ids);
  return count ?? 0;
}

describe('la auditoria de una subida del Excel', () => {
  it('deja un solo registro con el resumen y ninguno por venta', async () => {
    const admin = await clienteComo('admin');
    const lotes = [{ fecha: '2018-06-15', medio: 'qr', montos: [1000, 2000] }];
    const { error } = await admin.rpc('ventas_importar_excel', { lotes });
    expect(error).toBeNull();
    const registros = await registrosDeLaImportacion();
    expect(registros).toHaveLength(1);
    expect(registros[0]).toMatchObject({
      accion: 'importacion',
      despues: {
        desde: '2018-06-15',
        hasta: '2018-06-15',
        dias: 1,
        nuevas: 2,
        actualizadas: 0,
        iguales: 0,
        anuladas: 0,
        total_centavos: 3000,
      },
    });
    expect(registros[0]!.usuario_id).not.toBeNull();
    expect(await auditoriaDeVentasDel('2018-06-15')).toBe(0);
  });

  it('una subida que falla no deja registro', async () => {
    const admin = await clienteComo('admin');
    const lotes = [
      { fecha: '2018-06-16', medio: 'qr', montos: [1000] },
      { fecha: '2018-06-16', medio: 'cripto', montos: [1000] },
    ];
    const { error } = await admin.rpc('ventas_importar_excel', { lotes });
    expect(error?.code).toBe('PV308');
    const { count } = await clienteSecretoDePruebas()
      .from('auditoria')
      .select('id', { count: 'exact', head: true })
      .like('registro_id', 'excel:2018-06-16%');
    expect(count).toBe(0);
  });

  it('una venta a mano se sigue auditando como alta', async () => {
    const id = await sembrarVentaConPago({ fecha: '2018-07-02', medio: 'qr', centavos: 100 });
    ventas.push(id);
    const { data } = await clienteSecretoDePruebas()
      .from('auditoria')
      .select('accion')
      .eq('registro_id', id);
    expect(data).toEqual([{ accion: 'alta' }]);
  });
});

describe('quien puede leer lo nuevo', () => {
  for (const rol of ['caja', 'invitado'] as const) {
    it(`${rol} no lee hasta donde hay ventas ni las ventas sin detalle`, async () => {
      const cliente = await clienteComo(rol);
      const hasta = await cliente.rpc('ventas_fudo_cargadas_hasta');
      expect(hasta.error?.code).toBe('42501');
      const sinDetalle = await cliente.rpc('reporte_ventas_sin_detalle', {
        desde: '2018-07-01',
        hasta: '2018-07-01',
      });
      expect(sinDetalle.error?.code).toBe('42501');
    });
  }
});

describe('los reportes por producto y por categoria cierran con el total', () => {
  it('con ventas del Excel y a mano suman lo mismo que por periodo', async () => {
    const dia = '2018-07-03';
    const p = { desde: dia, hasta: dia };
    ventas.push(
      await sembrarVentaConPago({ fecha: dia, medio: 'qr', centavos: 150000 }),
      await sembrarVentaConRenglones({
        fecha: dia,
        renglones: [{ producto: null, cantidad: 2, precioCentavos: 2500, descripcion: 'Agua' }],
      }),
    );
    const admin = await clienteComo('admin');
    const [porDia, renglones, categorias, sinDetalle] = await Promise.all([
      ventasPorDia(admin, p),
      ventasPorProducto(admin, p),
      ventasPorCategoria(admin, p),
      ventasSinDetalle(admin, p),
    ]);
    const total = totalesDeVentas(porDia).montoCentavos;
    const sumar = (filas: { montoCentavos: number }[]) =>
      filas.reduce((s, f) => s + f.montoCentavos, 0);
    expect(total).toBe(155000);
    expect(sumar(productosDelReporte(renglones, sinDetalle))).toBe(total);
    expect(sumar(categoriasDelReporte(categorias, sinDetalle))).toBe(total);
  });
});
