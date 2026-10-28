import { textoDePendientes } from '../usuarios/presentacion';

export type ConFecha = { cantidad: number; desde: string | null };
export type DatosDeAvisos = {
  conDiferencia: ConFecha;
  ayerSinCierre: string | null;
  pendientes: number;
  sinClasificar: ConFecha & { categoriaId: string | null };
  // Sale de los recurrentes, que Inicio lee aparte de los avisos.
  vencenEstaSemana?: number;
  /** El pago, si es uno solo: el aviso lleva a pagarlo. */
  unVencimiento?: { id: string; fecha: string };
};
export type Aviso = { texto: string; enlace: string };

const enPlural = (n: number, uno: string, varios: string) => (n === 1 ? uno : varios);

// Los enlaces llevan la fecha mas vieja: las listas muestran por defecto solo el mes en curso.
function deCierres({ cantidad, desde }: ConFecha): Aviso[] {
  if (cantidad === 0) return [];
  const que = enPlural(cantidad, 'cierre', 'cierres');
  return [
    {
      texto: `Hay ${cantidad} ${que} con diferencia sin revisar.`,
      enlace: `/admin/caja/control?estado=con_diferencia&desde=${desde}`,
    },
  ];
}

function deAyer(ayer: string | null): Aviso[] {
  if (!ayer) return [];
  return [
    {
      texto: 'Ayer no se cargó el cierre de caja.',
      enlace: `/admin/caja/control?desde=${ayer}&hasta=${ayer}`,
    },
  ];
}

const dePendientes = (n: number): Aviso[] =>
  n === 0 ? [] : [{ texto: textoDePendientes(n), enlace: '/admin/usuarios?estado=pendientes' }];

// Gastos muestra arriba de todo los que esperan categoría, de cualquier mes, y al lado los
// próximos pagos de los fijos: los dos avisos llevan a la pantalla, sin filtros.
function deGastos({ cantidad }: DatosDeAvisos['sinClasificar']): Aviso[] {
  if (cantidad === 0) return [];
  const que = enPlural(cantidad, 'gasto', 'gastos');
  return [{ texto: `Hay ${cantidad} ${que} sin clasificar.`, enlace: '/admin/gastos' }];
}

// Si vence uno solo, Gastos abre su ventana de "Pagado" (pagar = el fijo y su vencimiento).
function deVencimientos(n = 0, uno?: DatosDeAvisos['unVencimiento']): Aviso[] {
  if (n === 0) return [];
  const texto = n === 1 ? 'Esta semana vence 1 pago.' : `Esta semana vencen ${n} pagos.`;
  const pagar = n === 1 && uno ? `?pagar=${encodeURIComponent(`${uno.id}|${uno.fecha}`)}` : '';
  return [{ texto, enlace: `/admin/gastos${pagar}` }];
}

/** Lo que requiere accion, en orden; cada aviso lleva a donde se resuelve. */
export function avisosDeInicio(datos: DatosDeAvisos): Aviso[] {
  return [
    ...deCierres(datos.conDiferencia),
    ...deAyer(datos.ayerSinCierre),
    ...dePendientes(datos.pendientes),
    ...deGastos(datos.sinClasificar),
    ...deVencimientos(datos.vencenEstaSemana, datos.unVencimiento),
  ];
}
