import { afterAll, describe, expect, it } from 'vitest';
import { diaEnArgentina } from '../../src/lib/fechas';
import type { Json } from '../../src/lib/supabase/tipos';
import { clienteSecretoDePruebas } from '../clientes';
import { SiembraDeCompras, unaClave, type RenglonDeCompra } from '../compras-de-prueba';
import { clienteComo } from '../sesiones';

const siembra = new SiembraDeCompras();
afterAll(() => siembra.borrar());

const HOY = diaEnArgentina(new Date());
const PAGADA = { tipo: 'pagada', medio: 'transferencia', fecha: HOY };

async function recibir(datos: Record<string, unknown>) {
  return (await clienteComo('admin')).rpc('compras_recibir', { datos: datos as Json });
}

async function compraDirecta(renglones: RenglonDeCompra[], extra: Record<string, unknown> = {}) {
  const proveedor = extra.proveedor_id as string;
  return recibir({
    proveedor_id: proveedor,
    fecha: HOY,
    renglones,
    pago: PAGADA,
    clave: unaClave(),
    ...extra,
  });
}

async function costoDe(insumoId: string) {
  const { data } = await (await clienteComo('admin')).rpc('costo_de_insumos');
  return (data ?? []).find((fila) => fila.insumo_id === insumoId);
}

const leer = async (tabla: 'compras' | 'gastos' | 'gastos_por_pagar', id: string) =>
  (await clienteSecretoDePruebas().from(tabla).select('*').eq('id', id).single()).data as Record<
    string,
    unknown
  >;

describe('recibir una compra', () => {
  it('suma el total, genera el gasto de Mercaderia y actualiza el costo del insumo', async () => {
    const proveedor = await siembra.proveedor();
    const forma = await siembra.forma(proveedor.id);
    const renglones = [
      { forma_de_compra_id: forma.id, cantidad: 2, precio_unitario_centavos: 3_000_000 },
    ];
    const { data: id, error } = await compraDirecta(renglones, {
      proveedor_id: proveedor.id,
      otros_cargos_centavos: 50_000,
      factura: 'A-1',
    });
    expect(error).toBeNull();
    const compra = await leer('compras', id!);
    expect(compra).toMatchObject({ estado: 'recibida', total_centavos: 6_050_000, fecha: HOY });
    expect(await leer('gastos', compra.gasto_id as string)).toMatchObject({
      monto_centavos: 6_050_000,
      proveedor_id: proveedor.id,
      medio_de_pago: 'transferencia',
      compra_id: id,
    });
    // $30.000 la bolsa de 25 kg: 120 centavos el gramo, de la compra y no de la referencia.
    expect(await costoDe(forma.insumoId)).toMatchObject({
      costo_por_unidad: 120,
      origen: 'compra',
      fecha_origen: HOY,
    });
  });

  it('por pagar genera lo por pagar con su vencimiento', async () => {
    const proveedor = await siembra.proveedor();
    const forma = await siembra.forma(proveedor.id);
    const { data: id } = await compraDirecta(
      [{ forma_de_compra_id: forma.id, cantidad: 1, precio_unitario_centavos: 100_000 }],
      { proveedor_id: proveedor.id, pago: { tipo: 'por_pagar', vencimiento: '2099-01-10' } },
    );
    const compra = await leer('compras', id!);
    expect(compra.gasto_id).toBeNull();
    expect(await leer('gastos_por_pagar', compra.por_pagar_id as string)).toMatchObject({
      vencimiento: '2099-01-10',
      monto_centavos: 100_000,
    });
  });

  it('la misma carga mandada dos veces no se duplica', async () => {
    const proveedor = await siembra.proveedor();
    const forma = await siembra.forma(proveedor.id);
    const datos = { proveedor_id: proveedor.id, clave: unaClave() };
    const renglones = [
      { forma_de_compra_id: forma.id, cantidad: 1, precio_unitario_centavos: 1_000 },
    ];
    const primera = await compraDirecta(renglones, datos);
    const segunda = await compraDirecta(renglones, datos);
    expect(segunda.data).toBe(primera.data);
  });

  it('una bonificacion a $0 no cambia el precio del insumo', async () => {
    const proveedor = await siembra.proveedor();
    const forma = await siembra.forma(proveedor.id);
    await compraDirecta(
      [
        { forma_de_compra_id: forma.id, cantidad: 1, precio_unitario_centavos: 0 },
        {
          forma_de_compra_id: (await siembra.forma(proveedor.id)).id,
          cantidad: 1,
          precio_unitario_centavos: 500,
        },
      ],
      { proveedor_id: proveedor.id },
    );
    expect((await costoDe(forma.insumoId))?.origen).toBe('referencia');
  });

  it.each([
    ['una forma de otro proveedor', 'PU304'],
    ['una fecha futura', 'PU302'],
    ['un total en cero', 'PU305'],
    ['sin renglones', 'PU303'],
  ])('rechaza %s', async (caso, codigo) => {
    const proveedor = await siembra.proveedor();
    const otro = await siembra.proveedor();
    const forma = await siembra.forma(
      caso === 'una forma de otro proveedor' ? otro.id : proveedor.id,
    );
    const precio = caso === 'un total en cero' ? 0 : 1_000;
    const renglones =
      caso === 'sin renglones'
        ? []
        : [{ forma_de_compra_id: forma.id, cantidad: 1, precio_unitario_centavos: precio }];
    const fecha = caso === 'una fecha futura' ? '2099-01-01' : HOY;
    const { error } = await compraDirecta(renglones, { proveedor_id: proveedor.id, fecha });
    expect(error?.code).toBe(codigo);
  });
});

describe('pedir y recibir', () => {
  it('un pedido no genera gasto; al recibirlo, se carga lo que llego', async () => {
    const proveedor = await siembra.proveedor();
    const [harina, azucar] = [await siembra.forma(proveedor.id), await siembra.forma(proveedor.id)];
    const admin = await clienteComo('admin');
    const { data: pedido } = await admin.rpc('compras_pedir', {
      datos: {
        proveedor_id: proveedor.id,
        clave: unaClave(),
        renglones: [
          { forma_de_compra_id: harina.id, cantidad: 2 },
          { forma_de_compra_id: azucar.id, cantidad: 1 },
        ],
      },
    });
    expect(await leer('compras', pedido!)).toMatchObject({
      estado: 'pedida',
      gasto_id: null,
      total_centavos: 0,
    });
    const llego = [{ forma_de_compra_id: harina.id, cantidad: 2, precio_unitario_centavos: 1_000 }];
    const { error } = await compraDirecta(llego, { proveedor_id: proveedor.id, compra_id: pedido });
    expect(error).toBeNull();
    expect(await leer('compras', pedido!)).toMatchObject({
      estado: 'recibida',
      total_centavos: 2_000,
    });
    const segunda = await compraDirecta(llego, { proveedor_id: proveedor.id, compra_id: pedido });
    expect(segunda.error?.code).toBe('PU306');
  });
});

describe('anular', () => {
  it('anula el gasto y el insumo vuelve al precio anterior', async () => {
    const proveedor = await siembra.proveedor();
    const forma = await siembra.forma(proveedor.id);
    const { data: id } = await compraDirecta(
      [{ forma_de_compra_id: forma.id, cantidad: 1, precio_unitario_centavos: 2_500_000 }],
      { proveedor_id: proveedor.id },
    );
    const { error } = await (
      await clienteComo('admin')
    ).rpc('compras_anular', { la_compra: id!, motivo: 'Cargada de mas' });
    expect(error).toBeNull();
    const compra = await leer('compras', id!);
    expect(compra.anulado).toBe(true);
    expect((await leer('gastos', compra.gasto_id as string)).anulado).toBe(true);
    expect((await costoDe(forma.insumoId))?.origen).toBe('referencia');
  });

  it('pide el motivo y no anula dos veces', async () => {
    const proveedor = await siembra.proveedor();
    const forma = await siembra.forma(proveedor.id);
    const { data: id } = await compraDirecta(
      [{ forma_de_compra_id: forma.id, cantidad: 1, precio_unitario_centavos: 1_000 }],
      { proveedor_id: proveedor.id },
    );
    const admin = await clienteComo('admin');
    expect((await admin.rpc('compras_anular', { la_compra: id!, motivo: ' ' })).error?.code).toBe(
      'PU309',
    );
    await admin.rpc('compras_anular', { la_compra: id!, motivo: 'Error' });
    expect(
      (await admin.rpc('compras_anular', { la_compra: id!, motivo: 'Otra vez' })).error?.code,
    ).toBe('PU308');
  });
});

describe('una compra pagada con la caja', () => {
  it('se arma sobre el gasto sin clasificar y al anularla el gasto vuelve a Sin clasificar', async () => {
    const proveedor = await siembra.proveedor();
    const forma = await siembra.forma(proveedor.id);
    const { id: gastoId, sinClasificar } = await siembra.gastoDeCaja(5_000, HOY);
    const gasto = { id: gastoId };
    const admin = await clienteComo('admin');
    const datos = {
      gasto_id: gasto!.id,
      proveedor_id: proveedor.id,
      renglones: [{ forma_de_compra_id: forma.id, cantidad: 1, precio_unitario_centavos: 4_000 }],
    };
    const { data: id, error } = await admin.rpc('compras_desde_gasto', { datos });
    expect(error).toBeNull();
    expect(await leer('compras', id!)).toMatchObject({
      total_centavos: 5_000,
      otros_cargos_centavos: 1_000,
      gasto_id: gasto!.id,
    });
    expect(await leer('gastos', gasto!.id)).toMatchObject({
      proveedor_id: proveedor.id,
      compra_id: id,
    });
    await admin.rpc('compras_anular', { la_compra: id!, motivo: 'No era harina' });
    expect(await leer('gastos', gasto!.id)).toMatchObject({
      categoria_id: sinClasificar,
      anulado: false,
      compra_id: null,
    });
  });

  it('los renglones no pueden pasar el monto del gasto: PU307', async () => {
    const proveedor = await siembra.proveedor();
    const forma = await siembra.forma(proveedor.id);
    const gasto = { id: (await siembra.gastoDeCaja(1_000, HOY)).id };
    const datos = {
      gasto_id: gasto!.id,
      proveedor_id: proveedor.id,
      renglones: [{ forma_de_compra_id: forma.id, cantidad: 1, precio_unitario_centavos: 4_000 }],
    };
    const { error } = await (await clienteComo('admin')).rpc('compras_desde_gasto', { datos });
    expect(error?.code).toBe('PU307');
  });
});
