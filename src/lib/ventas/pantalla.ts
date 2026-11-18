import { MEDIOS, type Medio } from '../caja/resultado';
import { mesDe } from '../gastos/pantalla';
import { diaEnArgentina } from '../fechas';
import { esFechaValida } from '../gastos/vencimientos';
import { formatearPesos } from '../plata';
import { numeroDePagina, unValor } from '../usuarios/presentacion';

// Lo que se filtra. Fudo quedó como origen de las ventas viejas, sin filtro (pedido 89).
export const ORIGENES = ['mostrador', 'manual'] as const;
export const ESTADOS_DE_LISTA = ['cerrada', 'anulada'] as const;
export type Origen = (typeof ORIGENES)[number] | 'fudo';
export type EstadoDeLista = (typeof ESTADOS_DE_LISTA)[number];

export type FiltrosDeVentas = {
  desde: string;
  hasta: string;
  origen: (typeof ORIGENES)[number] | null;
  medio: Medio | null;
  estado: EstadoDeLista | null;
  pagina: number;
};
export type ParametrosDeVentas = Record<string, string | string[] | undefined>;

const NOMBRES_DE_ORIGEN: Record<Origen, string> = {
  mostrador: 'Mostrador',
  manual: 'A mano',
  fudo: 'Fudo',
};
const NOMBRES_DE_ESTADO: Record<string, string> = {
  cerrada: 'Cerrada',
  cancelada: 'Cancelada',
  en_curso: 'En curso',
};

export const nombreDeOrigen = (origen: Origen) => NOMBRES_DE_ORIGEN[origen];

/** Como se ve el estado: lo anulado manda sobre lo que dijera la venta. */
export function estadoDeVenta(venta: { estado: string; anulado: boolean }): string {
  return venta.anulado ? 'Anulada' : (NOMBRES_DE_ESTADO[venta.estado] ?? venta.estado);
}

/** El color de la insignia: verde si la venta cuenta, ambar si no se cobro, gris si se anulo. */
export function tonoDeEstado(venta: { estado: string; anulado: boolean }) {
  if (venta.anulado) return 'pizarra';
  return venta.estado === 'cerrada' ? 'esmeralda' : 'ambar';
}

function unoDe<T extends string>(lista: readonly T[], texto: string | undefined): T | null {
  return lista.find((valor) => valor === texto) ?? null;
}
const fechaDe = (texto: string | undefined) => (texto && esFechaValida(texto) ? texto : null);

/** Los filtros de la lista, leidos de la URL; sin fechas, el mes de hoy en Argentina. */
export function filtrosDeVentas(parametros: ParametrosDeVentas, hoy: string): FiltrosDeVentas {
  const mes = mesDe(hoy);
  const desde = fechaDe(unValor(parametros.desde)) ?? mes.desde;
  const hasta = fechaDe(unValor(parametros.hasta)) ?? mes.hasta;
  return {
    desde: desde <= hasta ? desde : hasta,
    hasta: desde <= hasta ? hasta : desde,
    origen: unoDe(ORIGENES, unValor(parametros.origen)),
    medio: unoDe(MEDIOS, unValor(parametros.medio)),
    estado: unoDe(ESTADOS_DE_LISTA, unValor(parametros.estado)),
    pagina: numeroDePagina(unValor(parametros.pagina)),
  };
}

export function enlaceDeVentas(filtros: FiltrosDeVentas, hoy: string): string {
  const mes = mesDe(hoy);
  const parametros = new URLSearchParams();
  if (filtros.desde !== mes.desde) parametros.set('desde', filtros.desde);
  if (filtros.hasta !== mes.hasta) parametros.set('hasta', filtros.hasta);
  if (filtros.origen) parametros.set('origen', filtros.origen);
  if (filtros.medio) parametros.set('medio', filtros.medio);
  if (filtros.estado) parametros.set('estado', filtros.estado);
  if (filtros.pagina > 1) parametros.set('pagina', String(filtros.pagina));
  const texto = parametros.toString();
  return texto ? `/admin/ventas?${texto}` : '/admin/ventas';
}

const ventas = (cantidad: number) => `${cantidad} ${cantidad === 1 ? 'venta' : 'ventas'}`;

type Totales = {
  cobradoCentavos: number;
  cobradas: number;
  canceladoCentavos: number;
  canceladas: number;
  anuladoCentavos: number;
  anuladas: number;
};

export type TarjetaDelResumen = {
  etiqueta: string;
  valor: string;
  detalle: string;
  /** Una linea que explica que es, para las que se pueden confundir. */
  ayuda?: string;
};

const tarjeta = (etiqueta: string, centavos: number, cantidad: number, ayuda?: string) => ({
  etiqueta,
  valor: formatearPesos(centavos),
  detalle: ventas(cantidad),
  ...(ayuda ? { ayuda } : {}),
});

function tarjetaDeTicket({ cobradoCentavos, cobradas }: Totales): TarjetaDelResumen {
  if (cobradas === 0) {
    return { etiqueta: 'Ticket promedio', valor: '—', detalle: 'sin ventas cobradas' };
  }
  const valor = formatearPesos(Math.round(cobradoCentavos / cobradas));
  return { etiqueta: 'Ticket promedio', valor, detalle: 'por venta cobrada' };
}

/** Las tarjetas de arriba de la lista: lo cobrado, el ticket promedio y lo anulado. */
export function tarjetasDelResumen(totales: Totales): TarjetaDelResumen[] {
  return [
    tarjeta('Cobrado', totales.cobradoCentavos, totales.cobradas),
    tarjetaDeTicket(totales),
    tarjeta(
      'Anuladas',
      totales.anuladoCentavos,
      totales.anuladas,
      'Cargadas por error y anuladas acá, con motivo.',
    ),
  ];
}

/**
 * La hora (en Argentina) a la que se cerro la venta, o null si no se sabe. Una venta cargada
 * despues, un dia distinto al suyo, guarda la hora de la carga: esa no es la de la venta.
 */
export function horaDeVenta(fecha: string, cerradaEn: string | null): string | null {
  if (!cerradaEn) return null;
  const instante = new Date(cerradaEn);
  if (diaEnArgentina(instante) !== fecha) return null;
  return HORA_EN_ARGENTINA.format(instante);
}

const HORA_EN_ARGENTINA = new Intl.DateTimeFormat('es-AR', {
  timeZone: 'America/Argentina/Buenos_Aires',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});
