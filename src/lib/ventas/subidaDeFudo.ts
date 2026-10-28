import { exito, fallo, type Resultado } from '../resultado';
import type { Cliente } from '../supabase/cliente';
import { lotesParaLaBase, resumenDeLaSubida } from './excelDeFudo';
import { leerExcelDeFudo } from './leerExcelDeFudo';

export const MENSAJES_DE_LA_SUBIDA = {
  sinPermiso: 'No tenés permiso para hacer esto.',
  diaFuturo: 'El archivo tiene un día que todavía no llegó. Revisá que sea el reporte correcto.',
  generico: 'No pudimos guardar las ventas. Probá de nuevo.',
} as const;

const POR_CODIGO: Record<string, string> = {
  '42501': MENSAJES_DE_LA_SUBIDA.sinPermiso,
  PV301: MENSAJES_DE_LA_SUBIDA.diaFuturo,
};

export type ResultadoDeLaSubida = {
  nuevas: number;
  actualizadas: number;
  iguales: number;
  anuladas: number;
};

/** Lo que va a pasar al subir el archivo, sin guardar nada. */
export async function vistaDeLaSubida(archivo: Buffer) {
  const lectura = await leerExcelDeFudo(archivo);
  return lectura.ok ? exito(resumenDeLaSubida(lectura.datos)) : lectura;
}

/** Guarda las ventas del archivo: la base crea, actualiza y anula lo que haga falta. */
export async function guardarSubida(
  cliente: Cliente,
  archivo: Buffer,
): Promise<Resultado<ResultadoDeLaSubida>> {
  const lectura = await leerExcelDeFudo(archivo);
  if (!lectura.ok) return lectura;
  const { data, error } = await cliente.rpc('ventas_importar_excel', {
    lotes: lotesParaLaBase(lectura.datos),
  });
  if (error) return fallo(POR_CODIGO[error.code] ?? MENSAJES_DE_LA_SUBIDA.generico);
  return exito(data as ResultadoDeLaSubida);
}
