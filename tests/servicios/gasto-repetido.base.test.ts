import { randomUUID } from 'node:crypto';
import { afterAll, describe, expect, it } from 'vitest';
import { cargarGasto, MENSAJES_DE_GASTOS } from '../../src/lib/gastos/escritura';
import type { DatosDeCarga } from '../../src/lib/gastos/esquemas';
import { borrarGastos, idDeCategoria } from '../gastos-de-prueba';
import { borrarProveedores, sembrarProveedor } from '../proveedores-de-prueba';
import { clienteComo } from '../sesiones';

const gastos: string[] = [];
const proveedores: string[] = [];
afterAll(async () => {
  await borrarGastos({ gastos });
  await borrarProveedores(proveedores);
});

const admin = () => clienteComo('admin');

async function carga(proveedorId: string, cambios: Partial<DatosDeCarga> = {}) {
  return {
    fecha: '2026-03-02',
    categoriaId: await idDeCategoria('Alquiler'),
    monto: '12.000',
    descripcion: '',
    proveedorId,
    medioDePago: 'transferencia',
    comprobante: '',
    seRepite: 'no',
    yaPagado: 'si',
    clave: randomUUID(),
    ...cambios,
  } as DatosDeCarga;
}

async function cargar(datos: DatosDeCarga) {
  const resultado = await cargarGasto(await admin(), datos);
  if (resultado.ok) gastos.push(resultado.datos.id);
  return resultado;
}

async function proveedor() {
  const { id } = await sembrarProveedor();
  proveedores.push(id);
  return id;
}

describe('gasto posiblemente repetido', () => {
  it('mismo proveedor, monto y día: avisa y no lo carga', async () => {
    const id = await proveedor();
    expect((await cargar(await carga(id))).ok).toBe(true);
    expect(await cargar(await carga(id))).toEqual({
      ok: false,
      mensaje: MENSAJES_DE_GASTOS.posibleRepetido,
    });
  });

  it('con Cargar igual lo carga', async () => {
    const id = await proveedor();
    await cargar(await carga(id));
    expect((await cargar(await carga(id, { cargarIgual: true }))).ok).toBe(true);
  });

  it('el mismo formulario mandado dos veces no es un repetido: devuelve el mismo gasto', async () => {
    const id = await proveedor();
    const datos = await carga(id);
    const primero = await cargar(datos);
    const segundo = await cargar(datos);
    expect(segundo.ok && primero.ok && segundo.datos.id).toBe(primero.ok && primero.datos.id);
  });

  it('otro monto u otro día no avisa', async () => {
    const id = await proveedor();
    await cargar(await carga(id));
    expect((await cargar(await carga(id, { monto: '12.001' }))).ok).toBe(true);
    expect((await cargar(await carga(id, { fecha: '2026-03-03' }))).ok).toBe(true);
  });
});
