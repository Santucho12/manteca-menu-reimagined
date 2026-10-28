import { afterAll, describe, expect, it } from 'vitest';
import { diaEnArgentina } from '../../src/lib/fechas';
import { sumarMeses } from '../../src/lib/gastos/vencimientos';
import { sumarDias } from '../../src/lib/reportes/periodos';
import { clienteSecretoDePruebas } from '../clientes';
import {
  borrarGastos,
  gastoDe,
  idDeCategoria,
  pagarComoAdmin,
  sembrarCategoriaDeGasto,
  sembrarPorPagar,
  sembrarRecurrente,
  type SemillaDePorPagar,
} from '../gastos-de-prueba';
import { borrarProveedores, sembrarProveedor } from '../proveedores-de-prueba';
import { clienteComo } from '../sesiones';

const porPagar: string[] = [];
const recurrentes: string[] = [];
const categorias: string[] = [];
const proveedores: string[] = [];
afterAll(async () => {
  await borrarGastos({ porPagar, recurrentes, categorias });
  await borrarProveedores(proveedores);
});

const hoy = () => diaEnArgentina(new Date());

async function pendiente(semilla: SemillaDePorPagar = {}) {
  const { id } = await sembrarPorPagar(semilla);
  porPagar.push(id);
  return id;
}

async function pagado(semilla: SemillaDePorPagar = {}) {
  const id = await pendiente(semilla);
  const pago = await pagarComoAdmin(id);
  expect(pago.error).toBeNull();
  return { id, gastoId: pago.data!.id };
}

async function anularComoAdmin(tabla: 'gastos' | 'gastos_por_pagar', id: string, motivo = 'No va') {
  return (await clienteComo('admin'))
    .from(tabla)
    .update({ anulado: true, motivo_anulacion: motivo })
    .eq('id', id);
}

async function anotarComoAdmin(fila: Record<string, unknown>) {
  const base = { categoria_id: await idDeCategoria('Otros'), monto_centavos: 1 };
  return (await clienteComo('admin'))
    .from('gastos_por_pagar')
    .insert({ ...base, ...fila } as never)
    .select('id, monto_centavos, categoria_id')
    .single();
}

describe('pagar lo por pagar', () => {
  it('el pago copia la categoria, el proveedor y la descripcion, aunque mande otra', async () => {
    const proveedor = await sembrarProveedor();
    proveedores.push(proveedor.id);
    const mercaderia = await idDeCategoria('Mercadería');
    const id = await pendiente({
      categoriaId: mercaderia,
      proveedorId: proveedor.id,
      descripcion: 'Harina',
    });
    const pago = await pagarComoAdmin(id, { fecha: '2026-10-21', montoCentavos: 912300 });
    expect(pago.error).toBeNull();
    expect(await gastoDe(pago.data!.id)).toMatchObject({
      categoria_id: mercaderia,
      proveedor_id: proveedor.id,
      descripcion: 'Harina',
      fecha: '2026-10-21',
      monto_centavos: 912300,
      por_pagar_id: id,
      recurrente_id: null,
    });
  });

  it('pagar dos veces lo mismo da 23505', async () => {
    const { id } = await pagado();
    expect((await pagarComoAdmin(id)).error?.code).toBe('23505');
  });

  it('anular el pago deja pagarlo de nuevo', async () => {
    const { id, gastoId } = await pagado();
    expect((await anularComoAdmin('gastos', gastoId)).error).toBeNull();
    expect((await pagarComoAdmin(id)).error).toBeNull();
  });

  it('lo anulado no se paga', async () => {
    const id = await pendiente();
    expect((await anularComoAdmin('gastos_por_pagar', id)).error).toBeNull();
    expect((await pagarComoAdmin(id)).error?.code).toBe('PG209');
  });

  it('se paga aunque su categoria se haya desactivado', async () => {
    const categoria = await sembrarCategoriaDeGasto();
    categorias.push(categoria.id);
    const id = await pendiente({ categoriaId: categoria.id });
    await clienteSecretoDePruebas()
      .from('categorias_de_gasto')
      .update({ activo: false })
      .eq('id', categoria.id);
    expect((await pagarComoAdmin(id)).error).toBeNull();
  });

  it('el pago no sale del efectivo de la caja', async () => {
    const id = await pendiente();
    expect((await pagarComoAdmin(id, { medio: 'efectivo_caja' })).error?.code).toBe('PG207');
  });
});

describe('anotar y anular lo por pagar', () => {
  it('lo pagado no se anula: se anula el pago', async () => {
    const { id } = await pagado();
    expect((await anularComoAdmin('gastos_por_pagar', id)).error?.code).toBe('PG210');
  });

  it('anular pide motivo y lo anulado no cambia', async () => {
    const id = await pendiente();
    expect((await anularComoAdmin('gastos_por_pagar', id, ' ')).error?.code).toBe('PG205');
    expect((await anularComoAdmin('gastos_por_pagar', id)).error).toBeNull();
    expect((await anularComoAdmin('gastos_por_pagar', id, 'Otro')).error?.code).toBe('PG204');
  });

  it('no lleva el efectivo de la caja', async () => {
    const { error } = await anotarComoAdmin({ vencimiento: '2099-07-01', medio_de_pago: 'efectivo_caja' });
    expect(error?.code).toBe('PG207');
  });

  it('si la categoria pide proveedor, lo exige', async () => {
    const { error } = await anotarComoAdmin({
      vencimiento: '2099-07-01',
      categoria_id: await idDeCategoria('Mercadería'),
    });
    expect(error?.code).toBe('PG202');
  });
});

describe('adelantar el pago de un fijo', () => {
  async function fijo(primerVencimiento: string) {
    const { id } = await sembrarRecurrente({ primerVencimiento });
    recurrentes.push(id);
    return id;
  }

  it('el proximo vencimiento se anota con los datos del fijo', async () => {
    const primero = sumarDias(hoy(), 3);
    const id = await fijo(primero);
    const { data, error } = await anotarComoAdmin({ recurrente_id: id, vencimiento: primero });
    expect(error).toBeNull();
    expect(data!.monto_centavos).toBe(50000000);
    expect(data!.categoria_id).toBe(await idDeCategoria('Alquiler'));
  });

  it('una fecha que no es un vencimiento del fijo se rechaza', async () => {
    const primero = sumarDias(hoy(), 3);
    const id = await fijo(primero);
    const { error } = await anotarComoAdmin({ recurrente_id: id, vencimiento: sumarDias(primero, 1) });
    expect(error?.code).toBe('PG211');
  });

  it('hoy o antes no se adelanta: lo vencido lo crea el proceso', async () => {
    const id = await fijo(sumarMeses(hoy(), -1));
    const { error } = await anotarComoAdmin({ recurrente_id: id, vencimiento: hoy() });
    expect(error?.code).toBe('PG211');
  });
});

describe('pagos_pendientes', () => {
  it('trae solo lo vigente sin pago, con el nombre de la categoria', async () => {
    const vigente = await pendiente({ vencimiento: '2099-08-01' });
    const { id: yaPagado } = await pagado({ vencimiento: '2099-08-02' });
    const anulado = await pendiente({ vencimiento: '2099-08-03' });
    await anularComoAdmin('gastos_por_pagar', anulado);
    const { data, error } = await (await clienteComo('admin')).rpc('pagos_pendientes');
    expect(error).toBeNull();
    const ids = (data ?? []).map((fila) => fila.id);
    expect(ids).toContain(vigente);
    expect(ids).not.toContain(yaPagado);
    expect(ids).not.toContain(anulado);
    expect(data!.find((fila) => fila.id === vigente)).toMatchObject({
      categoria: 'Alquiler',
      vencimiento: '2099-08-01',
      monto_centavos: 800000,
    });
  });
});
