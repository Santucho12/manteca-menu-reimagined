import { randomUUID } from 'node:crypto';
import { afterAll, describe, expect, it } from 'vitest';
import { diaEnArgentina } from '../../src/lib/fechas';
import { cargarGasto, MENSAJES_DE_GASTOS } from '../../src/lib/gastos/escritura';
import type { DatosDeCarga, DatosDePago } from '../../src/lib/gastos/esquemas';
import {
  anularPorPagar,
  pagar,
  pagosPendientes,
  vencimientosTomados,
} from '../../src/lib/gastos/pagos';
import { sumarDias } from '../../src/lib/reportes/periodos';
import { clienteSecretoDePruebas } from '../clientes';
import {
  borrarGastos,
  gastoDe,
  idDeCategoria,
  sembrarPorPagar,
  sembrarRecurrente,
} from '../gastos-de-prueba';
import { clienteComo } from '../sesiones';

const porPagar: string[] = [];
const recurrentes: string[] = [];
afterAll(() => borrarGastos({ porPagar, recurrentes }));

const admin = () => clienteComo('admin');
const hoy = () => diaEnArgentina(new Date());

async function pendiente(vencimiento = '2099-04-01') {
  const { id } = await sembrarPorPagar({ vencimiento });
  porPagar.push(id);
  return id;
}

const pago = (cambios: Partial<DatosDePago>): DatosDePago => ({
  fecha: hoy(),
  monto: '1.234,50',
  medioDePago: 'tarjeta',
  clave: randomUUID(),
  ...cambios,
});

async function carga(cambios: Partial<DatosDeCarga>): Promise<DatosDeCarga> {
  return {
    fecha: '2099-03-01',
    categoriaId: await idDeCategoria('Alquiler'),
    monto: '45.000',
    descripcion: 'Factura de la luz',
    proveedorId: '',
    medioDePago: '',
    comprobante: '',
    seRepite: 'no',
    yaPagado: 'no',
    clave: randomUUID(),
    ...cambios,
  };
}

async function porPagarDe(id: string) {
  const { data } = await clienteSecretoDePruebas()
    .from('gastos_por_pagar')
    .select('vencimiento, medio_de_pago, monto_centavos')
    .eq('id', id)
    .maybeSingle();
  return data;
}

describe('cargar algo por pagar', () => {
  it('con Todavía no queda por pagar, con su vencimiento, y no es un gasto', async () => {
    const resultado = await cargarGasto(await admin(), await carga({}));
    expect(resultado.ok && resultado.datos.tipo).toBe('porPagar');
    if (!resultado.ok) return;
    porPagar.push(resultado.datos.id);
    expect(await porPagarDe(resultado.datos.id)).toEqual({
      vencimiento: '2099-03-01',
      medio_de_pago: null,
      monto_centavos: 4500000,
    });
    const gasto = await clienteSecretoDePruebas()
      .from('gastos')
      .select('id')
      .eq('id', resultado.datos.id);
    expect(gasto.data).toEqual([]);
  });

  it('la misma carga mandada dos veces da lo mismo', async () => {
    const datos = await carga({});
    const primera = await cargarGasto(await admin(), datos);
    const segunda = await cargarGasto(await admin(), datos);
    expect(primera.ok && segunda.ok).toBe(true);
    if (!primera.ok || !segunda.ok) return;
    porPagar.push(primera.datos.id);
    expect(segunda.datos.id).toBe(primera.datos.id);
  });
});

describe('pagar', () => {
  it('carga el gasto con la fecha del pago y lo saca de lo pendiente', async () => {
    const id = await pendiente();
    const resultado = await pagar(await admin(), pago({ porPagarId: id }));
    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;
    expect(await gastoDe(resultado.datos.id)).toMatchObject({
      fecha: hoy(),
      monto_centavos: 123450,
      medio_de_pago: 'tarjeta',
      por_pagar_id: id,
    });
    expect((await pagosPendientes(await admin())).map((p) => p.id)).not.toContain(id);
  });

  it('con la misma clave es el mismo pago; con otra, ya estaba anotado', async () => {
    const id = await pendiente();
    const datos = pago({ porPagarId: id });
    const primero = await pagar(await admin(), datos);
    const repetido = await pagar(await admin(), datos);
    expect(primero.ok && repetido.ok && repetido.datos.id === primero.datos.id).toBe(true);
    expect(await pagar(await admin(), pago({ porPagarId: id }))).toEqual({
      ok: false,
      mensaje: MENSAJES_DE_GASTOS.yaPagado,
    });
  });

  it('lo anulado ya no se paga', async () => {
    const id = await pendiente();
    expect((await anularPorPagar(await admin(), id, 'No corresponde')).ok).toBe(true);
    expect(await pagar(await admin(), pago({ porPagarId: id }))).toEqual({
      ok: false,
      mensaje: MENSAJES_DE_GASTOS.yaNoPorPagar,
    });
  });

  it('caja no paga ni ve lo por pagar', async () => {
    const id = await pendiente();
    const caja = await clienteComo('caja');
    expect((await pagar(caja, pago({ porPagarId: id }))).ok).toBe(false);
    expect(await pagosPendientes(caja)).toEqual([]);
  });
});

describe('pagar un fijo antes de que venza', () => {
  async function fijo() {
    const primero = sumarDias(hoy(), 5);
    const { id } = await sembrarRecurrente({ primerVencimiento: primero });
    recurrentes.push(id);
    return { id, primero };
  }

  it('queda pagado y el próximo pago lo saltea', async () => {
    const { id, primero } = await fijo();
    const resultado = await pagar(await admin(), pago({ fijoId: id, vencimiento: primero }));
    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;
    expect((await gastoDe(resultado.datos.id)).recurrente_id).toBe(id);
    expect((await vencimientosTomados(await admin(), hoy())).has(`${id}|${primero}`)).toBe(true);
  });

  it('una fecha que no es un vencimiento del fijo se explica', async () => {
    const { id, primero } = await fijo();
    const otraFecha = pago({ fijoId: id, vencimiento: sumarDias(primero, 1) });
    expect(await pagar(await admin(), otraFecha)).toEqual({
      ok: false,
      mensaje: MENSAJES_DE_GASTOS.noEsDelFijo,
    });
  });
});

describe('anular lo por pagar', () => {
  it('lo pendiente deja de figurar; lo pagado se anula desde el pago', async () => {
    const libre = await pendiente();
    expect((await anularPorPagar(await admin(), libre, 'Ya no va')).ok).toBe(true);
    expect((await pagosPendientes(await admin())).map((p) => p.id)).not.toContain(libre);
    const pagado = await pendiente();
    await pagar(await admin(), pago({ porPagarId: pagado }));
    expect(await anularPorPagar(await admin(), pagado, 'Ya no va')).toEqual({
      ok: false,
      mensaje: MENSAJES_DE_GASTOS.yaEstaPagado,
    });
  });
});
