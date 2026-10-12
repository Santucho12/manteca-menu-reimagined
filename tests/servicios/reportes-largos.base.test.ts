import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { gastosPorDia } from '../../src/lib/reportes/consultas';
import { sumarDias } from '../../src/lib/reportes/periodos';
import { clienteSecretoDePruebas } from '../clientes';
import { borrarCategoriasConSusGastos, sembrarCategoriaDeGasto } from '../gastos-de-prueba';
import { idDelLocalPrincipal } from '../locales';
import { clienteComo } from '../sesiones';

// Supabase corta cada respuesta en 1000 filas: un reporte de un año largo tiene mas.
const DIAS = 1001;
const DESDE = '2009-01-01';
let categoria: { id: string };

async function sembrarUnGastoPorDia() {
  const secreto = clienteSecretoDePruebas();
  const local = await idDelLocalPrincipal(secreto);
  const filas = Array.from({ length: DIAS }, (_, i) => ({
    local_id: local,
    fecha: sumarDias(DESDE, i),
    categoria_id: categoria.id,
    monto_centavos: 100,
    medio_de_pago: 'transferencia' as const,
  }));
  const { error } = await secreto.from('gastos').insert(filas);
  if (error) throw new Error(`No pude sembrar los gastos: ${error.message}`);
}

beforeAll(async () => {
  categoria = await sembrarCategoriaDeGasto();
  await sembrarUnGastoPorDia();
}, 60_000);

// Mil ids no entran en una sola consulta: se borra por la categoria, no gasto por gasto.
async function borrarLoSembrado() {
  const secreto = clienteSecretoDePruebas();
  await secreto
    .from('auditoria')
    .delete()
    .eq('tabla', 'gastos')
    .eq('despues->>categoria_id', categoria.id);
  await secreto.from('gastos').delete().eq('categoria_id', categoria.id);
  await borrarCategoriasConSusGastos([categoria.id]);
}

afterAll(borrarLoSembrado, 60_000);

describe('reportes de periodos largos', () => {
  it('trae todas las filas aunque pasen de 1000', async () => {
    const periodo = { desde: DESDE, hasta: sumarDias(DESDE, DIAS - 1) };
    const filas = await gastosPorDia(await clienteComo('admin'), periodo);
    const deLaCategoria = filas.filter((f) => f.categoria_id === categoria.id);
    expect(deLaCategoria).toHaveLength(DIAS);
  });
});
