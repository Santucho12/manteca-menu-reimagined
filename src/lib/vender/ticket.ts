/** Un producto en una forma de venta, con el precio del menú que ve quien vende. */
export type ItemDelCatalogo = {
  productoId: string;
  presentacionId: string;
  nombre: string;
  presentacion: string;
  precioCentavos: number;
};

export type RenglonDelTicket = ItemDelCatalogo & { cantidad: number };

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

export const subtotalDe = (renglon: RenglonDelTicket) => renglon.precioCentavos * renglon.cantidad;

export const totalDelTicket = (ticket: RenglonDelTicket[]) =>
  ticket.reduce((suma, r) => suma + subtotalDe(r), 0);
