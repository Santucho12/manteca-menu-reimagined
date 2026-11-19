import { afterAll, describe, expect, it } from 'vitest';
import { diaEnArgentina } from '../../src/lib/fechas';
import { clienteSecretoDePruebas } from '../../tests/clientes';
import { leerEntornoPruebas } from '../../tests/entorno-pruebas';
import { idDelLocalPrincipal } from '../../tests/locales';
import { borrarLocalDeEjemplo, sembrarEjemplos, type OpcionesDeEjemplo } from './sembrar';

// Un local de ejemplo aparte, chico, para no pisar el que arma el comando.
const opciones = (): OpcionesDeEjemplo => ({
  hoy: diaEnArgentina(new Date()),
  dias: 6,
  semilla: 7,
  local: 'Local de ejemplo (prueba)',
  prefijo: 'ejemplo.prueba',
  contrasena: leerEntornoPruebas().CONTRASENA_USUARIOS_PRUEBA,
});

afterAll(() => borrarLocalDeEjemplo(clienteSecretoDePruebas(), opciones()));

async function cuantas(tabla: 'ventas' | 'cierres_de_caja' | 'gastos', local: string) {
  const { count } = await clienteSecretoDePruebas()
    .from(tabla)
    .select('id', { count: 'exact', head: true })
    .eq('local_id', local);
  return count ?? 0;
}

describe('sembrarEjemplos', () => {
  it('arma el local con el menú copiado, sus cuentas, ventas del mostrador, cierres y gastos', async () => {
    const secreto = clienteSecretoDePruebas();
    const resumen = await sembrarEjemplos(secreto, opciones());
    expect(await cuantas('ventas', resumen.localId)).toBe(resumen.ventas);
    expect(await cuantas('cierres_de_caja', resumen.localId)).toBe(resumen.cierres);
    expect(resumen.ventas).toBeGreaterThan(0);
    expect(resumen.cierres).toBe(6 - 2 - 1);
    const { data: categorias } = await secreto
      .from('categorias')
      .select('id')
      .eq('local_id', resumen.localId);
    expect(categorias?.length).toBeGreaterThan(0);
    const { data: caja } = await secreto
      .from('perfiles')
      .select('rol, activo, local_id')
      .eq('nombre', 'Ejemplo Caja (prueba)')
      .single();
    expect(caja).toEqual({ rol: 'caja', activo: true, local_id: resumen.localId });
  });

  it('le deja la tolerancia de caja de arranque, que el control de cierres necesita', async () => {
    const secreto = clienteSecretoDePruebas();
    const resumen = await sembrarEjemplos(secreto, opciones());
    const { data } = await secreto
      .from('configuracion_de_caja')
      .select('tolerancia_centavos')
      .eq('local_id', resumen.localId);
    expect(data).toEqual([{ tolerancia_centavos: 50000 }]);
  });

  it('volver a armarlo deja lo mismo, sin duplicar', async () => {
    const secreto = clienteSecretoDePruebas();
    const primera = await sembrarEjemplos(secreto, opciones());
    const segunda = await sembrarEjemplos(secreto, opciones());
    expect(segunda).toEqual(primera);
    expect(await cuantas('gastos', segunda.localId)).toBe(segunda.gastos);
  });

  it('no toca el local principal', async () => {
    const secreto = clienteSecretoDePruebas();
    const principal = await idDelLocalPrincipal(secreto);
    const antes = await cuantas('ventas', principal);
    await sembrarEjemplos(secreto, opciones());
    expect(await cuantas('ventas', principal)).toBe(antes);
  });
});
