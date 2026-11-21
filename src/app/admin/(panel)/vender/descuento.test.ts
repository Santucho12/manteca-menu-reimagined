import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// El botón de descuento, al lado de Pagar con dos medios (Santiago, 2026-11-20, pedido 102).
const leer = (archivo: string) => readFileSync(`src/app/admin/(panel)/vender/${archivo}`, 'utf8');

describe('el descuento en el cobro', () => {
  it('está al lado de Pagar con dos medios', () => {
    const cobro = leer('CobroDelMostrador.tsx');
    expect(cobro.indexOf('{descuento}')).toBeGreaterThan(cobro.indexOf('Pagar con dos medios'));
  });

  it('pide porcentaje o monto, y el motivo', () => {
    const descuento = leer('Descuento.tsx');
    for (const parte of ['Hacer un descuento', 'Porcentaje', 'Monto', 'Motivo del descuento'])
      expect(descuento).toContain(parte);
  });

  it('el total que se cobra ya tiene el descuento', () => {
    expect(leer('Mostrador.tsx')).toContain('descuentoEnCentavos(');
  });
});
