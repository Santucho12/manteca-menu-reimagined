import { describe, expect, it } from 'vitest';
import { comprasDeRenglones } from './delInsumo';

const renglon = (compra: string, fecha: string, creado = '2026-11-01T10:00:00Z') => ({
  cantidad: 2,
  precio_unitario_centavos: 3_000_000,
  fecha_creacion: creado,
  formas_de_compra: { como_se_compra: 'Bolsa de 25 kg' },
  compras: { id: compra, fecha, proveedores: { nombre: 'Molino' } },
});

describe('comprasDeRenglones', () => {
  it('las compras que trajeron el insumo, de la mas nueva a la mas vieja', () => {
    expect(comprasDeRenglones([renglon('c1', '2026-11-01'), renglon('c2', '2026-11-10')])).toEqual([
      {
        compraId: 'c2',
        fecha: '2026-11-10',
        proveedor: 'Molino',
        comoSeCompra: 'Bolsa de 25 kg',
        cantidad: 2,
        precioCentavos: 3_000_000,
      },
      expect.objectContaining({ compraId: 'c1' }),
    ]);
  });

  it('el mismo dia gana la cargada despues, y muestra hasta diez', () => {
    const mismoDia = [
      renglon('vieja', '2026-11-10', '2026-11-10T09:00:00Z'),
      renglon('nueva', '2026-11-10', '2026-11-10T18:00:00Z'),
    ];
    expect(comprasDeRenglones(mismoDia)[0]!.compraId).toBe('nueva');
    const muchas = Array.from({ length: 12 }, (_, i) => renglon(`c${i}`, '2026-11-01'));
    expect(comprasDeRenglones(muchas)).toHaveLength(10);
  });
});
