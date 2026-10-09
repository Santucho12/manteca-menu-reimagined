import { afterAll, describe, expect, it } from 'vitest';
import { diaEnArgentina } from '../../src/lib/fechas';
import { sumarMeses } from '../../src/lib/gastos/vencimientos';
import { clienteSecretoDePruebas } from '../clientes';
import { borrarGastos, sembrarRecurrente, type SemillaDeRecurrente } from '../gastos-de-prueba';
import { clienteComo } from '../sesiones';

const recurrentes: string[] = [];
afterAll(() => borrarGastos({ recurrentes }));

async function recurrente(semilla: SemillaDeRecurrente) {
  const { id } = await sembrarRecurrente(semilla);
  recurrentes.push(id);
  return id;
}

async function generar(hasta: string) {
  const { error } = await clienteSecretoDePruebas().rpc('generar_gastos_recurrentes', { hasta });
  expect(error).toBeNull();
}

async function generados(recurrenteId: string) {
  const { data, error } = await clienteSecretoDePruebas()
    .from('gastos')
    .select('id, fecha, vencimiento, monto_centavos, creado_por, anulado')
    .eq('recurrente_id', recurrenteId)
    .order('vencimiento');
  expect(error).toBeNull();
  return data ?? [];
}

const vencimientos = async (id: string) => (await generados(id)).map((g) => g.vencimiento);

describe('generacion de gastos recurrentes', () => {
  it('genera los atrasados hasta la fecha, con el ultimo dia en los meses cortos', async () => {
    const id = await recurrente({ primerVencimiento: '2026-01-31' });
    await generar('2026-03-31');
    expect(await vencimientos(id)).toEqual(['2026-01-31', '2026-02-28', '2026-03-31']);
    const [primero] = await generados(id);
    expect(primero).toMatchObject({ fecha: '2026-01-31', monto_centavos: 50000000 });
    expect(primero!.creado_por).toBeNull();
  });

  it('bimestral cada dos meses y anual del 29 de febrero', async () => {
    const bimestral = await recurrente({
      primerVencimiento: '2026-01-15',
      frecuencia: 'bimestral',
    });
    const anual = await recurrente({ primerVencimiento: '2028-02-29', frecuencia: 'anual' });
    await generar('2030-03-01');
    expect((await vencimientos(bimestral)).slice(0, 3)).toEqual([
      '2026-01-15',
      '2026-03-15',
      '2026-05-15',
    ]);
    expect(await vencimientos(anual)).toEqual(['2028-02-29', '2029-02-28', '2030-02-28']);
  });

  it('no genera lo que vence despues de la fecha', async () => {
    const id = await recurrente({ primerVencimiento: '2026-10-20' });
    await generar('2026-10-19');
    expect(await vencimientos(id)).toEqual([]);
  });

  it('correr dos veces no duplica y un anulado no vuelve', async () => {
    const id = await recurrente({ primerVencimiento: '2026-08-10' });
    await generar('2026-09-10');
    const [agosto] = await generados(id);
    await clienteSecretoDePruebas()
      .from('gastos')
      .update({ anulado: true, motivo_anulacion: 'No se pago' })
      .eq('id', agosto!.id);
    await generar('2026-09-10');
    const filas = await generados(id);
    expect(filas.map((g) => [g.vencimiento, g.anulado])).toEqual([
      ['2026-08-10', true],
      ['2026-09-10', false],
    ]);
  });

  it('un recurrente desactivado no genera', async () => {
    const id = await recurrente({ primerVencimiento: '2026-06-01', activo: false });
    await generar('2026-09-01');
    expect(await vencimientos(id)).toEqual([]);
  });

  it('reactivar no genera lo que vencio mientras estaba desactivado', async () => {
    const id = await recurrente({ primerVencimiento: '2025-01-10', activo: false });
    await clienteSecretoDePruebas()
      .from('gastos_recurrentes')
      .update({ activo: true })
      .eq('id', id);
    const hoy = diaEnArgentina(new Date());
    await generar(sumarMeses(hoy, 2));
    const generadas = await vencimientos(id);
    expect(generadas.length).toBeGreaterThanOrEqual(1);
    expect(generadas.every((vencimiento) => vencimiento! >= hoy)).toBe(true);
  });

  it('cambiar la plantilla no toca lo ya generado', async () => {
    const id = await recurrente({ primerVencimiento: '2026-07-05' });
    await generar('2026-07-05');
    await clienteSecretoDePruebas()
      .from('gastos_recurrentes')
      .update({ monto_centavos: 99 })
      .eq('id', id);
    await generar('2026-08-05');
    expect((await generados(id)).map((g) => g.monto_centavos)).toEqual([50000000, 99]);
  });

  it('solo el proceso del sistema la ejecuta', async () => {
    const { error } = await (
      await clienteComo('admin')
    ).rpc('generar_gastos_recurrentes', { hasta: '2026-10-01' });
    expect(error?.code).toBe('42501');
  });
});
