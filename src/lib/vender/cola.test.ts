import { describe, expect, it } from 'vitest';
import { encolar, leerCola, sacarDeLaCola, type Almacen } from './cola';

// Sin conexión, la venta queda en el equipo y se manda sola al volver internet (pedido 102).
function almacenEnMemoria(): Almacen {
  const datos = new Map<string, string>();
  return { getItem: (k) => datos.get(k) ?? null, setItem: (k, v) => void datos.set(k, v) };
}

const venta = (clave: string) => ({ clave, renglones: [], pagos: [], totalCentavos: 1000 });

describe('la cola de ventas sin conexión', () => {
  it('guarda, lee y saca por clave, sin repetir', () => {
    const almacen = almacenEnMemoria();
    encolar(almacen, venta('a'));
    encolar(almacen, venta('b'));
    encolar(almacen, venta('a'));
    expect(leerCola(almacen).map((v) => v.clave)).toEqual(['a', 'b']);
    sacarDeLaCola(almacen, 'a');
    expect(leerCola(almacen).map((v) => v.clave)).toEqual(['b']);
  });

  it('si lo guardado está roto, empieza vacía', () => {
    const almacen = almacenEnMemoria();
    almacen.setItem('ventas-sin-mandar', '{roto');
    expect(leerCola(almacen)).toEqual([]);
  });
});
