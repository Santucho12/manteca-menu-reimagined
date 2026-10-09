import type { Json } from '../src/lib/supabase/tipos';
import { clienteSecretoDePruebas } from './clientes';
import { idDeCuentaDePrueba } from './consultas-de-prueba';
import type { RolDePrueba } from './cuentas';
import { asegurarLocalB, idDelLocalPrincipal } from './locales';

/**
 * Un dia viejo al azar: hay un cierre por dia y por local, y los tests corren en paralelo.
 * Los dias reales (hoy y los recientes) quedan para la prueba en vivo.
 */
export function diaLibre(): string {
  const desde = Date.UTC(2001, 0, 1);
  const hasta = Date.UTC(2019, 11, 31);
  const dia = new Date(desde + Math.floor(Math.random() * (hasta - desde)));
  return dia.toISOString().slice(0, 10);
}

/** Lo que manda la pantalla al guardar, con montos chicos y un retiro y un gasto. */
export function datosDeCierre(fecha: string, cambios: Record<string, Json> = {}): Json {
  return {
    fecha,
    fondo_inicial_centavos: 1000000,
    efectivo_centavos: 2500050,
    credito_centavos: 300000,
    debito_centavos: 200000,
    qr_centavos: 0,
    transferencia_centavos: 150000,
    queda_en_caja_centavos: 1000000,
    comentario: null,
    retiros: [{ monto_centavos: 500000, quien: 'Dueño' }],
    gastos: [{ monto_centavos: 120000, descripcion: 'Hielo' }],
    ...cambios,
  };
}

type SemillaDeCierre = {
  fecha?: string;
  otroLocal?: boolean;
  cargadoPor?: RolDePrueba;
  quedaEnCajaCentavos?: number;
};

/** Un cierre escrito sin la funcion de guardar, sin retiros ni gastos. */
export async function sembrarCierre(
  semilla: SemillaDeCierre = {},
): Promise<{ id: string; fecha: string }> {
  const secreto = clienteSecretoDePruebas();
  const fecha = semilla.fecha ?? diaLibre();
  const local = semilla.otroLocal ? asegurarLocalB : idDelLocalPrincipal;
  const { data, error } = await secreto
    .from('cierres_de_caja')
    .insert({
      local_id: await local(secreto),
      fecha,
      cargado_por: await idDeCuentaDePrueba(semilla.cargadoPor ?? 'caja'),
      fondo_inicial_centavos: 1000000,
      efectivo_centavos: 2000000,
      queda_en_caja_centavos: semilla.quedaEnCajaCentavos ?? 1000000,
    })
    .select('id')
    .single();
  if (error) throw new Error(`No pude sembrar el cierre: ${error.message}`);
  return { id: data.id, fecha };
}

export async function cierreDe(id: string) {
  const { data, error } = await clienteSecretoDePruebas()
    .from('cierres_de_caja')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw new Error(`No pude leer el cierre ${id}: ${error.message}`);
  return data as Record<string, unknown>;
}

export async function gastosDelCierre(id: string) {
  const { data } = await clienteSecretoDePruebas()
    .from('gastos')
    .select(
      'id, monto_centavos, descripcion, medio_de_pago, anulado, fecha, creado_por, categoria_id',
    )
    .eq('cierre_id', id);
  return data ?? [];
}

/** Borra cierres de prueba con sus retiros, sus gastos y su auditoria. */
export async function borrarCierres(ids: string[]) {
  const secreto = clienteSecretoDePruebas();
  const gastos = (await secreto.from('gastos').select('id').in('cierre_id', ids)).data ?? [];
  const retiros =
    (await secreto.from('retiros_de_caja').select('id').in('cierre_id', ids)).data ?? [];
  await secreto.from('gastos').delete().in('cierre_id', ids);
  await secreto.from('retiros_de_caja').delete().in('cierre_id', ids);
  await secreto.from('cierres_de_caja').delete().in('id', ids);
  const todos = [...ids, ...gastos.map((g) => g.id), ...retiros.map((r) => r.id)];
  await secreto.from('auditoria').delete().in('registro_id', todos);
}
