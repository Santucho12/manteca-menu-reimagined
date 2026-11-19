import { describe, expect, it } from 'vitest';
import {
  compraParaLaBase,
  esquemaAnularCompra,
  esquemaCompra,
  esquemaPedido,
  pedidoParaLaBase,
} from './esquemas';

const PROVEEDOR = '0b8f3c2e-5d1a-4c7e-9f2b-1a2b3c4d5e6f';
const FORMA = '1c9a4d3f-6e2b-4d8f-8a3c-2b3c4d5e6f70';
const CLAVE = '2d0b5e4a-7f3c-4e9a-9b4d-3c4d5e6f7081';

const compra = {
  compraId: '',
  proveedorId: PROVEEDOR,
  fecha: '2026-11-19',
  renglones: [{ formaId: FORMA, cantidad: '2', precio: '30.000' }],
  otrosCargos: '',
  factura: ' A-123 ',
  pago: 'pagada' as const,
  medio: 'transferencia' as const,
  fechaDePago: '2026-11-19',
  vencimiento: '',
};

describe('esquemaCompra', () => {
  it('pasa a la base con centavos, la clave y el pago pagado', () => {
    expect(compraParaLaBase(esquemaCompra.parse(compra), CLAVE)).toEqual({
      compra_id: null,
      proveedor_id: PROVEEDOR,
      fecha: '2026-11-19',
      renglones: [{ forma_de_compra_id: FORMA, cantidad: 2, precio_unitario_centavos: 3_000_000 }],
      otros_cargos_centavos: 0,
      factura: 'A-123',
      pago: { tipo: 'pagada', medio: 'transferencia', fecha: '2026-11-19' },
      clave: CLAVE,
    });
  });

  it('por pagar pide el vencimiento y no el medio', () => {
    const datos = esquemaCompra.parse({ ...compra, pago: 'por_pagar', vencimiento: '2026-12-01' });
    expect(compraParaLaBase(datos, CLAVE).pago).toEqual({
      tipo: 'por_pagar',
      vencimiento: '2026-12-01',
    });
    const sinVencimiento = esquemaCompra.safeParse({ ...compra, pago: 'por_pagar' });
    expect(sinVencimiento.error!.issues.map((e) => e.path[0])).toContain('vencimiento');
  });

  it('un precio vacio es una bonificacion a $0', () => {
    const datos = esquemaCompra.parse({
      ...compra,
      renglones: [{ formaId: FORMA, cantidad: '1', precio: '' }],
    });
    expect(compraParaLaBase(datos, CLAVE).renglones[0]!.precio_unitario_centavos).toBe(0);
  });

  it('rechaza una cantidad en cero, otros cargos mal escritos y sin renglones', () => {
    const malos = esquemaCompra.safeParse({
      ...compra,
      otrosCargos: '1.5',
      renglones: [{ formaId: FORMA, cantidad: '0', precio: '1' }],
    });
    const campos = malos.error!.issues.map((e) => e.path.join('.'));
    expect(campos).toEqual(expect.arrayContaining(['otrosCargos', 'renglones.0.cantidad']));
    expect(esquemaCompra.safeParse({ ...compra, renglones: [] }).success).toBe(false);
  });
});

describe('esquemaPedido', () => {
  it('lleva el proveedor y las cantidades', () => {
    const datos = esquemaPedido.parse({
      proveedorId: PROVEEDOR,
      renglones: [{ formaId: FORMA, cantidad: '3' }],
    });
    expect(pedidoParaLaBase(datos, CLAVE)).toEqual({
      proveedor_id: PROVEEDOR,
      renglones: [{ forma_de_compra_id: FORMA, cantidad: 3 }],
      clave: CLAVE,
    });
  });
});

describe('esquemaAnularCompra', () => {
  it('pide el motivo', () => {
    expect(esquemaAnularCompra.safeParse({ id: CLAVE, motivo: ' ' }).success).toBe(false);
    expect(esquemaAnularCompra.safeParse({ id: CLAVE, motivo: 'Vino mal' }).success).toBe(true);
  });
});
