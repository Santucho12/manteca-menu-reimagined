/** Lo mínimo del almacén del navegador (localStorage) que usa la cola. */
export type Almacen = Pick<Storage, 'getItem' | 'setItem'>;

/** Una venta cobrada sin conexión: lo que se manda a la base, con su clave y el total. */
export type VentaEnCola = { clave: string; totalCentavos: number } & Record<string, unknown>;

const CLAVE = 'ventas-sin-mandar';

export function leerCola(almacen: Almacen): VentaEnCola[] {
  try {
    const leido: unknown = JSON.parse(almacen.getItem(CLAVE) ?? '[]');
    return Array.isArray(leido) ? (leido as VentaEnCola[]) : [];
  } catch {
    return [];
  }
}

const guardar = (almacen: Almacen, cola: VentaEnCola[]) =>
  almacen.setItem(CLAVE, JSON.stringify(cola));

/** La clave hace que la base no la duplique si se manda dos veces: acá tampoco se repite. */
export function encolar(almacen: Almacen, venta: VentaEnCola) {
  const cola = leerCola(almacen);
  const ya = cola.some((v) => v.clave === venta.clave);
  guardar(almacen, ya ? cola.map((v) => (v.clave === venta.clave ? venta : v)) : [...cola, venta]);
}

export const sacarDeLaCola = (almacen: Almacen, clave: string) =>
  guardar(
    almacen,
    leerCola(almacen).filter((v) => v.clave !== clave),
  );
