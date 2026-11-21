import { cuentaDelTicket, type Cuenta, type Paquetes } from './cuenta';

/** Un producto en una forma de venta, con el precio del menú que ve quien vende. */
export type ItemDelCatalogo = {
  productoId: string;
  presentacionId: string;
  nombre: string;
  presentacion: string;
  precioCentavos: number;
  /** Para la docena variada y el peso (pedido 102): la categoría y cuánto es la forma. */
  categoriaId?: string;
  unidades?: number | null;
  /** Los gramos de la forma en el menú (Por cuarto = 250): si tiene, se vende por peso. */
  gramosDeLaForma?: number | null;
  compartido?: boolean;
  /** Una cantidad de la categoría sin elegir cuáles: se arma después de cobrar (pedido 102). */
  surtida?: boolean;
};

/** Un renglón del ticket; lo que va por peso lleva lo que se pesó, en gramos. */
/** precioEspecial: el precio escrito a mano para este renglón (promo, Pedidos Ya), pedido 102. */
export type RenglonDelTicket = ItemDelCatalogo & {
  cantidad: number;
  gramos?: number;
  precioEspecial?: number;
};

/** Un renglón por producto y forma de venta: la docena y la unidad van separadas. */
export const claveDe = (item: Pick<ItemDelCatalogo, 'productoId' | 'presentacionId'>) =>
  `${item.productoId}|${item.presentacionId}`;

export function sumarAlTicket(
  ticket: RenglonDelTicket[],
  item: ItemDelCatalogo,
): RenglonDelTicket[] {
  const clave = claveDe(item);
  if (!ticket.some((r) => claveDe(r) === clave)) return [...ticket, { ...item, cantidad: 1 }];
  return cambiarCantidad(ticket, clave, 1);
}

/** Suma o resta uno; si queda en cero, el renglón sale del ticket. */
export function cambiarCantidad(
  ticket: RenglonDelTicket[],
  clave: string,
  cambio: 1 | -1,
): RenglonDelTicket[] {
  return ticket
    .map((r) => (claveDe(r) === clave ? { ...r, cantidad: r.cantidad + cambio } : r))
    .filter((r) => r.cantidad > 0);
}

export function sacarDelTicket(ticket: RenglonDelTicket[], clave: string): RenglonDelTicket[] {
  return ticket.filter((r) => claveDe(r) !== clave);
}

/** Lo pesado entra con sus gramos; si ya estaba, se cambia el peso. */
export function pesarEnElTicket(
  ticket: RenglonDelTicket[],
  item: ItemDelCatalogo,
  gramos: number,
): RenglonDelTicket[] {
  const clave = claveDe(item);
  if (!ticket.some((r) => claveDe(r) === clave))
    return [...ticket, { ...item, cantidad: 1, gramos }];
  return ticket.map((r) => (claveDe(r) === clave ? { ...r, gramos } : r));
}

/** La cuenta del ticket, con la docena variada y lo pesado a su precio. */
export const cuentaDeTicket = (ticket: RenglonDelTicket[], paquetes: Paquetes): Cuenta =>
  cuentaDelTicket(
    ticket.map((r) => ({
      clave: claveDe(r),
      categoriaId: r.categoriaId ?? '',
      cantidad: r.cantidad,
      precioCentavos: r.precioEspecial ?? r.precioCentavos,
      unidades: r.unidades ?? null,
      gramos: r.gramos ?? null,
      gramosDeLaForma: r.gramosDeLaForma ?? null,
      compartido: (r.compartido ?? false) && r.precioEspecial === undefined,
    })),
    paquetes,
  );

/** El precio a mano de un renglón, en centavos; sin precio, vuelve al del menú (pedido 102). */
export function cambiarPrecio(
  ticket: RenglonDelTicket[],
  clave: string,
  centavos: number | undefined,
): RenglonDelTicket[] {
  return ticket.map((r) => {
    if (claveDe(r) !== clave) return r;
    const sinPrecio = { ...r };
    delete sinPrecio.precioEspecial;
    return centavos ? { ...sinPrecio, precioEspecial: centavos } : sinPrecio;
  });
}
