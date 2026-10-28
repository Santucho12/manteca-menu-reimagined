import type { DatosDePago, MedioDePago } from './esquemas';
import { nombreDelGasto } from './filas';
import type { ProximoPago } from './fijos';
import { sumarDias } from '../reportes/periodos';
import { nombreDeFrecuencia } from './pantalla';
import { montoParaEditar } from './plata';
import type { Frecuencia } from './vencimientos';

/** Una fila de pagos_pendientes(): lo por pagar vigente y sin pago. */
export type Pendiente = {
  id: string;
  vencimiento: string;
  descripcion: string | null;
  monto_centavos: number;
  medio_de_pago: MedioDePago | null;
  recurrente_id: string | null;
  categoria: string;
  proveedor: string | null;
  frecuencia: Frecuencia | null;
};

/** Una fila de Próximos pagos: lo ya cargado por pagar, o el próximo pago de un fijo. */
export type ItemPorPagar = {
  clave: string;
  /** Null: es el próximo pago de un fijo, que todavía no tiene su por pagar. */
  porPagarId: string | null;
  fijoId: string | null;
  /** El vencimiento de un fijo, para pagarlo antes de que venza. */
  vencimiento: string;
  nombre: string;
  detalle: string;
  /** Cada cuanto se repite, si es de un fijo. */
  frecuencia: Frecuencia | null;
  fecha: string;
  montoCentavos: number;
  medio: MedioDePago | null;
};

const detalleDe = (pendiente: Pendiente) =>
  pendiente.frecuencia
    ? nombreDeFrecuencia(pendiente.frecuencia)
    : [pendiente.categoria, pendiente.proveedor].filter(Boolean).join(' · ');

function deLoCargado(pendiente: Pendiente): ItemPorPagar {
  return {
    clave: pendiente.id,
    porPagarId: pendiente.id,
    fijoId: pendiente.recurrente_id,
    vencimiento: pendiente.vencimiento,
    nombre: nombreDelGasto(pendiente),
    detalle: detalleDe(pendiente),
    frecuencia: pendiente.frecuencia,
    fecha: pendiente.vencimiento,
    montoCentavos: pendiente.monto_centavos,
    medio: pendiente.medio_de_pago,
  };
}

function deUnFijo(proximo: ProximoPago): ItemPorPagar {
  return {
    clave: `${proximo.id}|${proximo.fecha}`,
    porPagarId: null,
    fijoId: proximo.id,
    vencimiento: proximo.fecha,
    nombre: proximo.nombre,
    detalle: nombreDeFrecuencia(proximo.frecuencia),
    frecuencia: proximo.frecuencia,
    fecha: proximo.fecha,
    montoCentavos: proximo.montoCentavos,
    medio: proximo.medio,
  };
}

/** Lo por pagar y los próximos pagos de los fijos, juntos: lo vencido primero. */
export function itemsPorPagar(pendientes: Pendiente[], proximos: ProximoPago[]): ItemPorPagar[] {
  return [...pendientes.map(deLoCargado), ...proximos.map(deUnFijo)].sort(
    (a, b) => a.fecha.localeCompare(b.fecha) || a.nombre.localeCompare(b.nombre, 'es'),
  );
}

/** Los vencimientos de fijos que ya tienen su por pagar: el próximo pago los saltea. */
export function tomadosDe(filas: { recurrente_id: string; vencimiento: string }[]): Set<string> {
  return new Set(filas.map((fila) => `${fila.recurrente_id}|${fila.vencimiento}`));
}

/**
 * Lo que la ventana de Pagado trae ya completo: hoy, el monto y el medio anotados. Sin medio,
 * queda vacío para que lo elija quien paga: el esquema lo pide al guardar.
 */
export function pagoInicial(item: ItemPorPagar, hoy: string, clave: string): DatosDePago {
  const cual = item.porPagarId
    ? { porPagarId: item.porPagarId }
    : { fijoId: item.fijoId!, vencimiento: item.vencimiento };
  return {
    ...cual,
    fecha: hoy,
    monto: montoParaEditar(item.montoCentavos),
    medioDePago: (item.medio ?? '') as DatosDePago['medioDePago'],
    clave,
  };
}

/** El pago que pidio un enlace ("fijo|vencimiento", como lo manda el aviso de Inicio). */
export function esElPagoPedido(item: ItemPorPagar, pagar: string | undefined): boolean {
  return pagar !== undefined && pagar === `${item.fijoId}|${item.vencimiento}`;
}

/** Cuantos dias hacia adelante muestra Proximos pagos: 15, 30 (lo de siempre), un año o todos (null). */
export const OPCIONES_DE_ADELANTO = [
  { valor: '15', texto: '15 días', dias: 15 },
  { valor: '30', texto: '30 días', dias: 30 },
  { valor: '365', texto: '1 año', dias: 365 },
  { valor: 'todos', texto: 'Todos', dias: null },
] as const;
const DIAS_DE_ADELANTO = 30;

export function diasDeAdelanto(valor: string | undefined): number | null {
  const opcion = OPCIONES_DE_ADELANTO.find((o) => o.valor === valor);
  return opcion ? opcion.dias : DIAS_DE_ADELANTO;
}

/** Lo vencido y lo que vence de hoy a tantos dias; con null, todo lo que viene. */
export function dentroDeLosProximos<T extends { fecha: string }>(
  items: T[],
  hoy: string,
  dias: number | null = DIAS_DE_ADELANTO,
): T[] {
  if (dias === null) return items;
  const hasta = sumarDias(hoy, dias);
  return items.filter((item) => item.fecha <= hasta);
}
