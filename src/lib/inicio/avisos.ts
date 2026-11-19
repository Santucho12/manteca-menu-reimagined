import { textoDeAyerSinCierre } from '../caja/turnos';
import { textoDePendientes } from '../usuarios/presentacion';
import type { PagosParaAvisar } from './pagos';

export type ConFecha = { cantidad: number; desde: string | null };
export type DatosDeAvisos = {
  conDiferencia: ConFecha;
  /** Los turnos de ayer con ventas y sin cierre; nulo si no falta ninguno. */
  ayerSinCierre: { fecha: string; turnos: number[] } | null;
  pendientes: number;
  sinClasificar: ConFecha & { categoriaId: string | null };
  /** Los productos con alguna presentacion debajo del margen minimo (Costos). */
  debajoDelMinimo?: number;
  /** Sale de Próximos pagos de Gastos, que Inicio lee aparte de los avisos. */
  pagos?: PagosParaAvisar;
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

function deAyer(ayer: DatosDeAvisos['ayerSinCierre']): Aviso[] {
  const texto = ayer ? textoDeAyerSinCierre(ayer.turnos) : null;
  if (!ayer || !texto) return [];
  return [{ texto, enlace: `/admin/caja/control?desde=${ayer.fecha}&hasta=${ayer.fecha}` }];
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

// Un solo aviso con lo vencido y lo de la semana: la tarjeta de avisos tiene alto fijo.
function textoDePagos({ vencidos, estaSemana }: PagosParaAvisar): string {
  const semana = `Esta semana ${enPlural(estaSemana, 'vence 1 pago', `vencen ${estaSemana} pagos`)}.`;
  if (vencidos === 0) return semana;
  const vencido = `${vencidos} ${enPlural(vencidos, 'pago vencido', 'pagos vencidos')}`;
  if (estaSemana === 0) return `Tenés ${vencido}.`;
  return `Tenés ${vencido} y ${estaSemana} que ${enPlural(estaSemana, 'vence', 'vencen')} esta semana.`;
}

// Si en total es uno solo, Gastos abre su ventana de "Marcar como pago".
function dePagos(pagos?: PagosParaAvisar): Aviso[] {
  if (!pagos || pagos.vencidos + pagos.estaSemana === 0) return [];
  const pagar = pagos.unico ? `?pagar=${encodeURIComponent(pagos.unico)}` : '';
  return [{ texto: textoDePagos(pagos), enlace: `/admin/gastos${pagar}` }];
}

function deCostos(cantidad = 0): Aviso[] {
  if (cantidad === 0) return [];
  const texto = enPlural(cantidad, '1 producto está', `${cantidad} productos están`);
  return [{ texto: `${texto} debajo del margen mínimo.`, enlace: '/admin/costos?filtro=debajo' }];
}

/** Lo que requiere accion, en orden; cada aviso lleva a donde se resuelve. */
export function avisosDeInicio(datos: DatosDeAvisos): Aviso[] {
  return [
    ...deCierres(datos.conDiferencia),
    ...deAyer(datos.ayerSinCierre),
    ...dePendientes(datos.pendientes),
    ...deGastos(datos.sinClasificar),
    ...dePagos(datos.pagos),
    ...deCostos(datos.debajoDelMinimo),
  ];
}
