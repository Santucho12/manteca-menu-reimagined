import { afterAll, describe, expect, it } from 'vitest';
import {
  borrarCierres,
  sembrarCierre,
  sembrarCierreConSalidas,
  diaLibre,
} from '../cierres-de-prueba';
import { clienteSecretoDePruebas } from '../clientes';
import { borrarGastos, idDeCategoria, sembrarGasto, sembrarRecurrente } from '../gastos-de-prueba';
import { clienteComo } from '../sesiones';

const gastos: string[] = [];
const recurrentes: string[] = [];
const cierres: string[] = [];

afterAll(async () => {
  await borrarGastos({ gastos, recurrentes });
  await borrarCierres(cierres);
}, 30_000);

async function gastoNuevo(medio: string) {
  const fila = {
    fecha: '2031-05-10',
    categoria_id: await idDeCategoria('Alquiler'),
    monto_centavos: 100000,
    medio_de_pago: medio,
  };
  const respuesta = await (
    await clienteComo('admin')
  )
    .from('gastos')
    .insert(fila as never)
    .select('id')
    .single();
  if (respuesta.data) gastos.push(respuesta.data.id);
  return respuesta;
}

describe('el efectivo de la caja sale por el cierre', () => {
  it('un gasto a mano no se carga con el efectivo de la caja', async () => {
    expect((await gastoNuevo('efectivo_caja')).error?.code).toBe('PG207');
  });

  it('a un gasto a mano no se le cambia el medio a efectivo de la caja', async () => {
    const { data } = await gastoNuevo('transferencia');
    const { error } = await (
      await clienteComo('admin')
    )
      .from('gastos')
      .update({ medio_de_pago: 'efectivo_caja' })
      .eq('id', data!.id);
    expect(error?.code).toBe('PG207');
  });

  it('el gasto de un cierre sigue entrando, y uno viejo se edita sin cambiar el medio', async () => {
    const cierre = await sembrarCierreConSalidas(diaLibre());
    cierres.push(cierre);
    const secreto = clienteSecretoDePruebas();
    const { data: delCierre } = await secreto.from('gastos').select('id').eq('cierre_id', cierre);
    expect(delCierre).toHaveLength(1);
    // Como quedaria un gasto a mano cargado antes de la regla: con el medio y sin cierre.
    const viejo = delCierre![0]!.id;
    // Sin el cierre, borrarCierres ya no lo encuentra: se borra como gasto.
    gastos.push(viejo);
    await secreto.from('gastos').update({ cierre_id: null }).eq('id', viejo);
    const admin = await clienteComo('admin');
    const editado = await admin
      .from('gastos')
      .update({ descripcion: 'Hielo para el local' })
      .eq('id', viejo);
    expect(editado.error).toBeNull();
    const anulado = await admin
      .from('gastos')
      .update({ anulado: true, motivo_anulacion: 'Prueba' })
      .eq('id', viejo);
    expect(anulado.error).toBeNull();
  });

  it('a un gasto de un recurrente no se le cambia el medio a efectivo de la caja', async () => {
    const plantilla = await sembrarRecurrente({ primerVencimiento: '2031-07-01' });
    recurrentes.push(plantilla.id);
    const secreto = clienteSecretoDePruebas();
    const { data: generado } = await secreto
      .from('gastos')
      .insert({
        local_id: (
          await secreto
            .from('gastos_recurrentes')
            .select('local_id')
            .eq('id', plantilla.id)
            .single()
        ).data!.local_id,
        fecha: '2031-07-01',
        vencimiento: '2031-07-01',
        recurrente_id: plantilla.id,
        categoria_id: await idDeCategoria('Alquiler'),
        monto_centavos: 100000,
        medio_de_pago: 'transferencia',
      })
      .select('id')
      .single();
    gastos.push(generado!.id);
    const { error } = await (
      await clienteComo('admin')
    )
      .from('gastos')
      .update({ medio_de_pago: 'efectivo_caja' })
      .eq('id', generado!.id);
    expect(error?.code).toBe('PG207');
  });

  it('a una plantilla no se le cambia el medio a efectivo de la caja', async () => {
    const plantilla = await sembrarRecurrente({ primerVencimiento: '2031-08-01' });
    recurrentes.push(plantilla.id);
    const { error } = await (
      await clienteComo('admin')
    )
      .from('gastos_recurrentes')
      .update({ medio_de_pago: 'efectivo_caja' })
      .eq('id', plantilla.id);
    expect(error?.code).toBe('PG207');
  });

  it('una plantilla recurrente no se crea con el efectivo de la caja', async () => {
    const fila = {
      categoria_id: await idDeCategoria('Alquiler'),
      monto_centavos: 100000,
      medio_de_pago: 'efectivo_caja',
      frecuencia: 'mensual',
      primer_vencimiento: '2031-05-10',
    };
    const { data, error } = await (
      await clienteComo('admin')
    )
      .from('gastos_recurrentes')
      .insert(fila as never)
      .select('id')
      .single();
    if (data) recurrentes.push(data.id);
    expect(error?.code).toBe('PG207');
  });

  it('un gasto sembrado sigue pudiendo anularse', async () => {
    const { id } = await sembrarGasto({ fecha: '2031-05-11' });
    gastos.push(id);
    const { error } = await (
      await clienteComo('admin')
    )
      .from('gastos')
      .update({ anulado: true, motivo_anulacion: 'Prueba' })
      .eq('id', id);
    expect(error).toBeNull();
  });
});

describe('lo que quedo en el cierre anterior', () => {
  it('trae lo que quedo en el ultimo cierre sin anular de antes', async () => {
    const primero = await sembrarCierre({ fecha: '1999-03-01', quedaEnCajaCentavos: 700000 });
    const anulado = await sembrarCierre({ fecha: '1999-03-02', quedaEnCajaCentavos: 900000 });
    const tercero = await sembrarCierre({ fecha: '1999-03-03' });
    cierres.push(primero.id, anulado.id, tercero.id);
    await clienteSecretoDePruebas()
      .from('cierres_de_caja')
      .update({ anulado: true, motivo_anulacion: 'Prueba' })
      .eq('id', anulado.id);
    const { data, error } = await (
      await clienteComo('admin')
    ).rpc('cierres_fondos_anteriores' as never, { ids: [primero.id, tercero.id] } as never);
    expect(error).toBeNull();
    expect(data).toEqual(
      expect.arrayContaining([
        { id: primero.id, fondo_anterior_centavos: null },
        { id: tercero.id, fondo_anterior_centavos: 700000 },
      ]),
    );
  });

  it('caja no puede leerlo', async () => {
    const { error } = await (
      await clienteComo('caja')
    ).rpc('cierres_fondos_anteriores' as never, { ids: [] } as never);
    expect(error?.code).toBe('42501');
  });
});
