import { describe, expect, it } from 'vitest';
import type { ProximoPago } from './fijos';
import { itemsPorPagar, tomadosDe, type Pendiente } from './porPagar';

const pendiente = (id: string, extra: Partial<Pendiente> = {}): Pendiente => ({
  id,
  vencimiento: '2026-10-20',
  descripcion: null,
  monto_centavos: 1000,
  medio_de_pago: null,
  recurrente_id: null,
  categoria: 'Mercadería',
  proveedor: 'Granja El Nido',
  frecuencia: null,
  ...extra,
});

const proximo: ProximoPago = {
  id: 'fijo-a',
  nombre: 'Alquiler del local',
  frecuencia: 'mensual',
  fecha: '2026-11-05',
  montoCentavos: 118000000,
  medio: 'transferencia',
};

describe('itemsPorPagar', () => {
  it('junta lo cargado y los próximos pagos de los fijos, por fecha', () => {
    const items = itemsPorPagar(
      [
        pendiente('luz', {
          vencimiento: '2026-10-30',
          descripcion: 'Luz',
          categoria: 'Servicios',
          proveedor: null,
        }),
        pendiente('huevos', { medio_de_pago: 'tarjeta' }),
      ],
      [proximo],
    );
    expect(items.map((item) => [item.clave, item.fecha])).toEqual([
      ['huevos', '2026-10-20'],
      ['luz', '2026-10-30'],
      ['fijo-a|2026-11-05', '2026-11-05'],
    ]);
    expect(items[0]).toMatchObject({
      porPagarId: 'huevos',
      fijoId: null,
      nombre: 'Mercadería',
      detalle: 'Mercadería · Granja El Nido',
      montoCentavos: 1000,
      medio: 'tarjeta',
    });
    expect(items[1]!.detalle).toBe('Servicios');
  });

  it('lo de un fijo dice cada cuánto y lleva a su fijo; el próximo, sin cargar todavía', () => {
    const delFijo = pendiente('alq-oct', {
      descripcion: 'Alquiler del local',
      recurrente_id: 'fijo-a',
      frecuencia: 'mensual',
      categoria: 'Alquiler',
      proveedor: null,
    });
    const [vencido, siguiente] = itemsPorPagar([delFijo], [proximo]);
    expect(vencido).toMatchObject({
      porPagarId: 'alq-oct',
      fijoId: 'fijo-a',
      detalle: 'Todos los meses',
    });
    expect(siguiente).toMatchObject({ porPagarId: null, fijoId: 'fijo-a', medio: 'transferencia' });
  });
});

describe('tomadosDe', () => {
  it('cada fijo con la fecha que ya tiene cargada', () => {
    const tomados = tomadosDe([{ recurrente_id: 'fijo-a', vencimiento: '2026-11-05' }]);
    expect(tomados.has('fijo-a|2026-11-05')).toBe(true);
    expect(tomados.has('fijo-a|2026-12-05')).toBe(false);
  });
});
