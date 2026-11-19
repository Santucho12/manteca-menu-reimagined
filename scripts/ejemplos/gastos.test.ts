import { describe, expect, it } from 'vitest';
import { crearAzar } from './azar';
import { gastosDelPeriodo, PROVEEDORES_DE_EJEMPLO } from './gastos';

// Del 1 de octubre al 30 de noviembre de 2026: dos meses enteros.
const DIAS = Array.from({ length: 61 }, (_, i) =>
  new Date(Date.UTC(2026, 9, 1) + i * 86_400_000).toISOString().slice(0, 10),
);

describe('gastosDelPeriodo', () => {
  const gastos = gastosDelPeriodo(crearAzar(5), DIAS);

  it('cada mes tiene sus fijos una vez: sueldos, alquiler y servicios', () => {
    for (const mes of ['2026-10', '2026-11']) {
      const delMes = gastos.filter((g) => g.fecha.startsWith(mes));
      expect(delMes.filter((g) => g.categoria === 'Sueldos')).toHaveLength(1);
      expect(delMes.filter((g) => g.categoria === 'Alquiler')).toHaveLength(1);
      expect(delMes.filter((g) => g.categoria === 'Servicios').length).toBeGreaterThanOrEqual(2);
    }
  });

  it('la mercadería va con un proveedor de los de ejemplo, y lo fijo sin proveedor', () => {
    const nombres = PROVEEDORES_DE_EJEMPLO.map((p) => p.nombre);
    const mercaderia = gastos.filter((g) => g.categoria === 'Mercadería');
    expect(mercaderia.length).toBeGreaterThan(10);
    for (const gasto of mercaderia) expect(nombres).toContain(gasto.proveedor);
    for (const gasto of gastos.filter((g) => g.categoria !== 'Mercadería')) {
      expect(gasto.proveedor).toBeNull();
    }
  });

  it('todos son de días del período, en pesos enteros y de más de $0', () => {
    for (const gasto of gastos) {
      expect(DIAS).toContain(gasto.fecha);
      expect(gasto.monto_centavos).toBeGreaterThan(0);
      expect(gasto.monto_centavos % 100).toBe(0);
    }
  });

  it('con la misma semilla salen los mismos gastos', () => {
    expect(gastosDelPeriodo(crearAzar(5), DIAS)).toEqual(gastos);
  });
});
