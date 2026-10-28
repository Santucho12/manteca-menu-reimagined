import { randomUUID } from 'node:crypto';
import { afterAll, describe, expect, it } from 'vitest';
import { diaEnArgentina } from '../../src/lib/fechas';
import {
  listarGastos,
  pagosDelRecurrente,
  paraClasificar,
  recurrentePorId,
} from '../../src/lib/gastos/consultas';
import {
  cargarGasto,
  clasificarGasto,
  editarRecurrente,
  MENSAJES_DE_GASTOS,
} from '../../src/lib/gastos/escritura';
import { datosDeFijoParaEditar, type DatosDeCarga } from '../../src/lib/gastos/esquemas';
import { generarAtrasados } from '../../src/lib/gastos/generacion';
import { sumarMeses } from '../../src/lib/gastos/vencimientos';
import {
  borrarCierres,
  diaLibre,
  gastosDelCierre,
  sembrarCierreConSalidas,
} from '../cierres-de-prueba';
import { clienteSecretoDePruebas } from '../clientes';
import {
  borrarGastos,
  gastoDe,
  idDeCategoria,
  pagarComoAdmin,
  sembrarCategoriaDeGasto,
  sembrarGasto,
  sembrarRecurrente,
} from '../gastos-de-prueba';
import { borrarProveedores, sembrarProveedor } from '../proveedores-de-prueba';
import { clienteComo } from '../sesiones';

const gastos: string[] = [];
const recurrentes: string[] = [];
const categorias: string[] = [];
const proveedores: string[] = [];
const cierres: string[] = [];
afterAll(async () => {
  await borrarCierres(cierres);
  await borrarGastos({ gastos, recurrentes, categorias });
  await borrarProveedores(proveedores);
});

const admin = () => clienteComo('admin');
const hoy = () => diaEnArgentina(new Date());

async function categoriaPropia() {
  const categoria = await sembrarCategoriaDeGasto();
  categorias.push(categoria.id);
  return categoria;
}

async function recurrente(primerVencimiento: string, categoria?: string) {
  const { id } = await sembrarRecurrente({ primerVencimiento, categoria });
  recurrentes.push(id);
  return id;
}

const carga = (cambios: Partial<DatosDeCarga>): DatosDeCarga => ({
  fecha: '2031-05-10',
  categoriaId: '',
  monto: '1.500',
  descripcion: '',
  proveedorId: '',
  medioDePago: 'transferencia',
  comprobante: '',
  seRepite: 'no',
  ...cambios,
});

describe('cargar un gasto', () => {
  it('sin repeticion crea un gasto', async () => {
    const { id: categoriaId } = await categoriaPropia();
    const resultado = await cargarGasto(await admin(), carga({ categoriaId }));
    if (!resultado.ok) throw new Error(resultado.mensaje);
    gastos.push(resultado.datos.id);
    expect(resultado.datos.fijo).toBe(false);
    expect((await gastoDe(resultado.datos.id)).monto_centavos).toBe(150000);
  });

  it('con repeticion crea un fijo con su primer pago, y la misma clave no crea dos', async () => {
    const { id: categoriaId } = await categoriaPropia();
    const datos = carga({ categoriaId, seRepite: 'bimestral', fecha: '2099-02-10' });
    const conClave = { ...datos, clave: randomUUID() };
    const cliente = await admin();
    const primera = await cargarGasto(cliente, conClave);
    if (!primera.ok) throw new Error(primera.mensaje);
    recurrentes.push(primera.datos.id);
    expect(primera.datos.fijo).toBe(true);
    expect(await recurrentePorId(cliente, primera.datos.id)).toMatchObject({
      frecuencia: 'bimestral',
      primer_vencimiento: '2099-02-10',
    });
    expect(await cargarGasto(cliente, conClave)).toEqual(primera);
  });
});

describe('editar un fijo', () => {
  it('con el mismo proximo pago no toca su serie', async () => {
    const id = await recurrente('2026-01-31');
    const cliente = await admin();
    const datos = { ...datosDeFijoParaEditar((await recurrentePorId(cliente, id))!, hoy()) };
    expect((await editarRecurrente(cliente, id, { ...datos, monto: '700' }, hoy())).ok).toBe(true);
    expect(await recurrentePorId(cliente, id)).toMatchObject({
      primer_vencimiento: '2026-01-31',
      monto_centavos: 70000,
    });
  });

  it('con otro proximo pago cuenta desde ahi', async () => {
    const id = await recurrente('2026-01-31');
    const cliente = await admin();
    const proximoPago = sumarMeses(hoy(), 2);
    const datos = datosDeFijoParaEditar((await recurrentePorId(cliente, id))!, hoy());
    expect((await editarRecurrente(cliente, id, { ...datos, proximoPago }, hoy())).ok).toBe(true);
    expect(await recurrentePorId(cliente, id)).toMatchObject({
      primer_vencimiento: proximoPago,
      generar_desde: proximoPago,
    });
  });
});

describe('clasificar', () => {
  it('un gasto de la caja toma su categoria y su proveedor y sale de para clasificar', async () => {
    const cierre = await sembrarCierreConSalidas(diaLibre());
    cierres.push(cierre);
    const [hielo] = await gastosDelCierre(cierre);
    const cliente = await admin();
    expect((await paraClasificar(cliente)).gastos.map((g) => g.id)).toContain(hielo!.id);
    const proveedorId = (await sembrarProveedor()).id;
    proveedores.push(proveedorId);
    const categoriaId = await idDeCategoria('Mercadería');
    const resultado = await clasificarGasto(cliente, { id: hielo!.id, categoriaId, proveedorId });
    expect(resultado.ok).toBe(true);
    expect(await gastoDe(hielo!.id)).toMatchObject({
      categoria_id: categoriaId,
      proveedor_id: proveedorId,
    });
    expect((await paraClasificar(cliente)).gastos.map((g) => g.id)).not.toContain(hielo!.id);
  });

  it('caja no clasifica', async () => {
    const { id } = await sembrarGasto({ fecha: '2031-05-03' });
    gastos.push(id);
    const datos = { id, categoriaId: await idDeCategoria('Otros'), proveedorId: '' };
    expect(await clasificarGasto(await clienteComo('caja'), datos)).toEqual({
      ok: false,
      mensaje: MENSAJES_DE_GASTOS.noDisponible,
    });
  });
});

// Desde el pedido 65 lo que vence de un fijo queda por pagar: se paga cada uno en su día.
async function pagarLoQueVencio(fijo: string) {
  const { data } = await clienteSecretoDePruebas()
    .from('gastos_por_pagar')
    .select('id, vencimiento')
    .eq('recurrente_id', fijo);
  for (const { id, vencimiento } of data ?? []) {
    const pago = await pagarComoAdmin(id, { fecha: vencimiento, montoCentavos: 50000000 });
    expect(pago.error).toBeNull();
  }
}

describe('listas', () => {
  it('por tipo, con la frecuencia del fijo, y el total respeta el tipo', async () => {
    const categoria = await categoriaPropia();
    const fijo = await recurrente('2031-04-10', categoria.nombre);
    await generarAtrasados(clienteSecretoDePruebas(), '2031-04-10');
    await pagarLoQueVencio(fijo);
    const suelto = await sembrarGasto({ categoriaId: categoria.id, fecha: '2031-04-12' });
    gastos.push(suelto.id);
    const consulta = { desde: '2031-04-01', hasta: '2031-04-30', categoriaId: categoria.id };
    const fijos = await listarGastos(await admin(), { ...consulta, tipo: 'fijos', pagina: 1 });
    expect(fijos.filas.map((f) => [f.fecha, f.frecuencia])).toEqual([['2031-04-10', 'mensual']]);
    expect(fijos.totalCentavos).toBe(50000000);
    expect((await listarGastos(await admin(), { ...consulta, pagina: 1 })).total).toBe(2);
  });

  it('los pagos de un fijo, los ultimos seis', async () => {
    const id = await recurrente('2031-01-05');
    await generarAtrasados(clienteSecretoDePruebas(), '2031-08-05');
    await pagarLoQueVencio(id);
    const pagos = await pagosDelRecurrente(await admin(), id);
    expect(pagos.map((p) => p.fecha)).toEqual([
      '2031-08-05',
      '2031-07-05',
      '2031-06-05',
      '2031-05-05',
      '2031-04-05',
      '2031-03-05',
    ]);
  });
});
