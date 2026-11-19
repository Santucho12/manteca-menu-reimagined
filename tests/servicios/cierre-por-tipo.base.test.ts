import { afterAll, afterEach, describe, expect, it } from 'vitest';
import { cierrePorId, listarCierres } from '../../src/lib/caja/consultas';
import { guardarCierre } from '../../src/lib/caja/escritura';
import type { DatosDeCierre } from '../../src/lib/caja/esquemas';
import { filtrosDeControl } from '../../src/lib/caja/pantalla';
import { tiposParaVender } from '../../src/lib/vender/consultas';
import { cambiarControlDeCanal } from '../../src/lib/ventas/escritura';
import { borrarCierres, diaLibre } from '../cierres-de-prueba';
import { clienteComo } from '../sesiones';
import { borrarVentas, idDeCanal, sembrarCanal, sembrarVentaConPago } from '../ventas-de-prueba';

const cierres: string[] = [];
const ventas: string[] = [];
const canales: string[] = [];

afterEach(async () => {
  await borrarVentas(ventas.splice(0));
  await borrarCierres(cierres.splice(0));
});
afterAll(() => borrarVentas([], { canales }));

async function plataformaControlada() {
  const canal = await sembrarCanal();
  canales.push(canal.id);
  const resultado = await cambiarControlDeCanal(await clienteComo('admin'), canal.id, true);
  if (!resultado.ok) throw new Error(resultado.mensaje);
  return canal.id;
}

const datos = (fecha: string, controles: DatosDeCierre['controles']): DatosDeCierre => ({
  fecha,
  turno: '2',
  fondoInicial: '10.000',
  efectivo: '10.000',
  credito: '',
  debito: '',
  qr: '',
  transferencia: '',
  quedaEnCaja: '10.000',
  comentario: '',
  retiros: [],
  gastos: [],
  controles,
});

async function guardar(fecha: string, controles: DatosDeCierre['controles']) {
  const resultado = await guardarCierre(await clienteComo('caja'), datos(fecha, controles));
  if (!resultado.ok) throw new Error(resultado.mensaje);
  cierres.push(resultado.datos.id);
  return resultado.datos.id;
}

async function ventaDelTipo(fecha: string, canal: string, centavos: number) {
  const id = await sembrarVentaConPago({ fecha, turno: 2, medio: 'fuera_de_caja', centavos });
  ventas.push(id);
  const { clienteSecretoDePruebas } = await import('../clientes');
  await clienteSecretoDePruebas().from('ventas').update({ canal_id: canal }).eq('id', id);
}

describe('el cierre por tipo', () => {
  it('facturó $100.000 y hay tres ventas que suman eso: cierra', async () => {
    const fecha = diaLibre();
    const canal = await plataformaControlada();
    for (const centavos of [4000000, 3500000, 2500000]) await ventaDelTipo(fecha, canal, centavos);
    const id = await guardar(fecha, [{ canalId: canal, total: '100.000', cantidad: '3' }]);
    const cierre = await cierrePorId(await clienteComo('admin'), id);
    expect(cierre?.estado).toBe('cierra');
    expect(cierre?.controles).toEqual([
      expect.objectContaining({ anotadoCentavos: 10000000, cargadoCentavos: 10000000 }),
    ]);
  });

  it('si falta cargar una, el cierre queda con diferencia en la lista', async () => {
    const fecha = diaLibre();
    const canal = await plataformaControlada();
    await ventaDelTipo(fecha, canal, 4000000);
    await ventaDelTipo(fecha, canal, 3500000);
    const id = await guardar(fecha, [{ canalId: canal, total: '100.000', cantidad: '' }]);
    const admin = await clienteComo('admin');
    const lista = await listarCierres(
      admin,
      filtrosDeControl({ desde: fecha, hasta: fecha }, fecha),
    );
    const fila = lista.filas.find((f) => f.id === id);
    expect(fila?.estado).toBe('con_diferencia');
    expect(fila?.controles[0]).toMatchObject({ diferenciaCentavos: 2500000, fuera: true });
  });
});

describe('los tipos para vender', () => {
  it('caja los lee, Local primero, con cuáles se controlan', async () => {
    const canal = await plataformaControlada();
    const tipos = await tiposParaVender(await clienteComo('caja'));
    expect(tipos[0]).toMatchObject({ id: await idDeCanal('Local'), deSistema: true });
    expect(tipos).toContainEqual(expect.objectContaining({ id: canal, seControla: true }));
  });

  it('caja no cambia qué se controla', async () => {
    const canal = await sembrarCanal();
    canales.push(canal.id);
    expect((await cambiarControlDeCanal(await clienteComo('caja'), canal.id, true)).ok).toBe(false);
  });
});
