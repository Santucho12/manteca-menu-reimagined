import { describe, expect, it } from 'vitest';
import type { ProductoDelReporte } from '../reportes/ventas';
import { masVendidos, mesEnCurso, textoDePresentaciones, ultimosDoceMeses } from './meses';

const producto = (clave: string, montoCentavos: number): ProductoDelReporte => ({
  clave,
  nombre: clave,
  montoCentavos,
  presentaciones: [],
});

describe('meses del inicio', () => {
  it('el mes en curso va del 1 a hoy', () => {
    expect(mesEnCurso('2026-10-12')).toEqual({ desde: '2026-10-01', hasta: '2026-10-12' });
  });

  it('los ultimos 12 meses arrancan el 1 del mes de hace 11, cruzando el año', () => {
    expect(ultimosDoceMeses('2026-01-15')).toEqual({ desde: '2025-02-01', hasta: '2026-01-15' });
    expect(ultimosDoceMeses('2026-10-31')).toEqual({ desde: '2025-11-01', hasta: '2026-10-31' });
  });

  it('los mas vendidos son 5, sin lo no vinculado', () => {
    const lista = ['a', 'b', 'c', 'd', 'e', 'f'].map((c, i) => producto(c, 600 - i * 100));
    const elegidos = masVendidos([...lista, producto('sin-vincular', 9999)]);
    expect(elegidos.map((p) => p.clave)).toEqual(['a', 'b', 'c', 'd', 'e']);
    expect(masVendidos([producto('a', 1)])).toHaveLength(1);
  });

  it('muestra la cantidad de cada presentacion', () => {
    const medialuna: ProductoDelReporte = {
      clave: 'm',
      nombre: 'Medialuna',
      montoCentavos: 1,
      presentaciones: [
        { nombre: 'Unidad', cantidad: 3, montoCentavos: 1 },
        { nombre: 'Docena', cantidad: 1.5, montoCentavos: 1 },
      ],
    };
    expect(textoDePresentaciones(medialuna)).toBe('3 Unidad · 1,5 Docena');
  });
});
