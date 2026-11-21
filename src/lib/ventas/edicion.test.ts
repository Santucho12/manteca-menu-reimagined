import { describe, expect, it } from 'vitest';
import { catalogoDeFilas } from '../vender/catalogo';
import { edicionParaLaBase, esquemaEdicionDeVenta, ticketDeLaVenta } from './edicion';

// Editar una venta (Santiago, 2026-11-20, pedido 102): el mismo Vender, con la venta cargada.
const U = (n: number) => `00000000-0000-4000-8000-00000000000${n}`;

const CATALOGO = catalogoDeFilas([
  {
    categoria_id: 'f',
    categoria: 'Facturas',
    producto_id: U(1),
    producto: 'Medialuna',
    presentacion_id: U(2),
    presentacion: 'Unidad',
    precio_centavos: 300000,
    unidades: 1,
    gramos: null,
    compartido: true,
  },
  {
    categoria_id: 'c',
    categoria: 'Clásicos',
    producto_id: U(3),
    producto: 'Palitos',
    presentacion_id: U(4),
    presentacion: 'Por cuarto',
    precio_centavos: 800000,
    unidades: null,
    gramos: 250,
    compartido: false,
  },
]);

const edicion = {
  id: U(9),
  motivo: 'Se cobró mal el medio',
  renglones: [{ productoId: U(1), presentacionId: U(2), cantidad: 2, precioCentavos: 300000 }],
  pagos: [{ medio: 'debito' as const, montoCentavos: 600000 }],
};

describe('esquemaEdicionDeVenta', () => {
  it('pide la venta, el motivo y lo mismo que el mostrador', () => {
    expect(esquemaEdicionDeVenta.safeParse(edicion).success).toBe(true);
    expect(
      esquemaEdicionDeVenta.safeParse({ ...edicion, motivo: ' a ' }).error?.issues[0]?.message,
    ).toBe('Escribí el motivo del cambio.');
    expect(esquemaEdicionDeVenta.safeParse({ ...edicion, renglones: [] }).success).toBe(false);
  });
});

describe('edicionParaLaBase', () => {
  it('manda la venta, los datos como el mostrador y el motivo', () => {
    expect(edicionParaLaBase(esquemaEdicionDeVenta.parse({ ...edicion, canalId: U(5) }))).toEqual({
      la_venta: U(9),
      el_motivo: 'Se cobró mal el medio',
      datos: {
        canal_id: U(5),
        renglones: [
          { producto_id: U(1), presentacion_id: U(2), cantidad: 2, precio_centavos: 300000 },
        ],
        pagos: [{ medio: 'debito', monto_centavos: 600000 }],
      },
    });
  });
});

describe('ticketDeLaVenta', () => {
  it('arma el ticket con lo que se vendió, a los precios de hoy, y lo pesado en gramos', () => {
    const { ticket, faltan } = ticketDeLaVenta(
      [
        { producto_id: U(1), presentacion_id: U(2), cantidad: 3 },
        { producto_id: U(3), presentacion_id: U(4), cantidad: 1.2 },
      ],
      CATALOGO,
    );
    expect(ticket).toMatchObject([
      { productoId: U(1), cantidad: 3, precioCentavos: 300000 },
      { productoId: U(3), cantidad: 1, gramos: 300 },
    ]);
    expect(faltan).toBe(0);
  });

  it('lo que ya no está en el menú no entra, y lo cuenta', () => {
    const { ticket, faltan } = ticketDeLaVenta(
      [{ producto_id: U(7), presentacion_id: U(8), cantidad: 1 }],
      CATALOGO,
    );
    expect(ticket).toEqual([]);
    expect(faltan).toBe(1);
  });
});

describe('los avisos al editar', () => {
  it('cada rechazo de la base dice qué pasó', async () => {
    const { mensajeDeEdicion } = await import('./edicion');
    expect(mensajeDeEdicion('PV318')).toBe(
      'Pasaron más de 30 minutos desde que se cobró: pedile al admin que la edite.',
    );
    expect(mensajeDeEdicion('PV305')).toBe('Esta venta está anulada y ya no se puede cambiar.');
    expect(mensajeDeEdicion('PV310')).toBe(
      'Cambió un precio del menú. Revisá la venta antes de guardar.',
    );
    expect(mensajeDeEdicion('xx')).toBe('No pudimos guardar los cambios. Probá de nuevo.');
  });
});

describe('eleccionDeLosPagos', () => {
  it('con un pago, ese medio; con dos, los dos y lo del primero escrito', async () => {
    const { eleccionDeLosPagos } = await import('./edicion');
    expect(eleccionDeLosPagos([{ medio: 'qr', monto_centavos: 500000 }])).toMatchObject({
      medio: 'qr',
      dosMedios: false,
    });
    expect(
      eleccionDeLosPagos([
        { medio: 'efectivo', monto_centavos: 500000 },
        { medio: 'debito', monto_centavos: 1300000 },
      ]),
    ).toEqual({
      medio: 'efectivo',
      dosMedios: true,
      segundoMedio: 'debito',
      primeroEscrito: '5.000',
    });
  });

  it('un medio que ya no se ofrece queda sin elegir', async () => {
    const { eleccionDeLosPagos } = await import('./edicion');
    expect(eleccionDeLosPagos([{ medio: 'fuera_de_caja', monto_centavos: 1 }]).medio).toBeNull();
  });
});

describe('puedeEditar', () => {
  const AHORA = new Date('2026-11-20T17:00:00Z');
  const venta = {
    anulado: false,
    origen: 'mostrador' as const,
    cerrada_en: '2026-11-20T16:40:00Z',
  };

  it('el admin edita cualquiera, salvo las anuladas y las de Fudo', async () => {
    const { puedeEditar } = await import('./edicion');
    expect(puedeEditar({ ...venta, cerrada_en: '2026-10-01T10:00:00Z' }, 'admin', AHORA)).toBe(
      true,
    );
    expect(puedeEditar({ ...venta, anulado: true }, 'admin', AHORA)).toBe(false);
    expect(puedeEditar({ ...venta, origen: 'fudo' }, 'admin', AHORA)).toBe(false);
  });

  it('Caja, solo durante los 30 minutos después de cobrarla', async () => {
    const { puedeEditar } = await import('./edicion');
    expect(puedeEditar(venta, 'caja', AHORA)).toBe(true);
    expect(puedeEditar({ ...venta, cerrada_en: '2026-11-20T16:29:00Z' }, 'caja', AHORA)).toBe(
      false,
    );
    expect(puedeEditar(venta, 'invitado', AHORA)).toBe(false);
  });
});

describe('destinoAlCobrar', () => {
  it('va a Ventas; con efectivo, lleva el monto para el vuelto', async () => {
    const { destinoAlCobrar } = await import('./edicion');
    expect(destinoAlCobrar(1500000)).toBe('/admin/ventas?vuelto=1500000');
    expect(destinoAlCobrar(null)).toBe('/admin/ventas');
  });

  it('lee el vuelto de la dirección, solo si es un monto entero', async () => {
    const { vueltoDeLaDireccion } = await import('./edicion');
    expect(vueltoDeLaDireccion('1500000')).toBe(1500000);
    expect(vueltoDeLaDireccion('abc')).toBeNull();
    expect(vueltoDeLaDireccion(undefined)).toBeNull();
  });
});

describe('descuentoDeLaVenta', () => {
  it('lo que se descontó vuelve como monto en pesos, con su motivo', async () => {
    const { descuentoDeLaVenta } = await import('./edicion');
    expect(descuentoDeLaVenta({ descuento_centavos: 150000, motivo_descuento: 'Promo' })).toEqual({
      tipo: 'monto',
      valor: '1.500',
      motivo: 'Promo',
    });
    expect(descuentoDeLaVenta({ descuento_centavos: 0, motivo_descuento: null })).toBeNull();
  });
});

describe('descuentoDeLaVenta con porcentaje', () => {
  it('si fue por porcentaje vuelve como porcentaje', async () => {
    const { descuentoDeLaVenta } = await import('./edicion');
    expect(
      descuentoDeLaVenta({
        descuento_centavos: 200000,
        descuento_porcentaje: 10,
        motivo_descuento: 'Promo',
      }),
    ).toEqual({ tipo: 'porcentaje', valor: '10', motivo: 'Promo' });
  });
});
