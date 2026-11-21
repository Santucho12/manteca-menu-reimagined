import { describe, expect, it } from 'vitest';
import { MEDIOS } from '../caja/resultado';
import { tonoDeMedio, tonoEnLista } from './colores';

// Vender con más color, para reconocer de un vistazo (Santiago, 2026-11-20, pedido 102).
describe('los colores de Vender', () => {
  it('cada medio de pago tiene su color, sin repetir', () => {
    const colores = MEDIOS.map((m) => tonoDeMedio(m).solido);
    expect(new Set(colores).size).toBe(MEDIOS.length);
    // Vender conserva sus colores (Santiago, 2026-11-21); la regla de color va en las listas.
    expect(tonoDeMedio('efectivo').solido).toBe('bg-emerald-500');
  });

  it('las categorías y los tipos toman un color por su lugar, y la ronda vuelve a empezar', () => {
    expect(tonoEnLista(0).solido).toBe('bg-emerald-500');
    expect(tonoEnLista(1).solido).not.toBe(tonoEnLista(0).solido);
    expect(tonoEnLista(6)).toEqual(tonoEnLista(0));
  });
});

describe('el color de un tipo de venta', () => {
  it('Otro va en gris; los demás, por su lugar', async () => {
    const { tonoDelTipo } = await import('./colores');
    expect(tonoDelTipo('Otro', 4).solido).toBe('bg-slate-400');
    expect(tonoDelTipo('otro ', 0).solido).toBe('bg-slate-400');
    expect(tonoDelTipo('Cheaf', 2)).toEqual(tonoEnLista(2));
  });
});

describe('débito y crédito', () => {
  it('van en colores bien distintos: azul y violeta', () => {
    expect(tonoDeMedio('debito').solido).toBe('bg-blue-500');
    expect(tonoDeMedio('credito').solido).toBe('bg-violet-500');
  });
});
