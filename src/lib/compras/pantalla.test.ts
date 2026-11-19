import { describe, expect, it } from 'vitest';
import type { FormaParaComprar } from './formas';
import {
  cantidadDelRenglon,
  enlaceDeCompras,
  enlaceDelPedido,
  formasDelProveedor,
  inicialDeLaCompra,
  opcionesDeFormas,
  precioAlElegir,
  precioPropuesto,
  estadoDeCompra,
  filtrosDeCompras,
  pagoDeCompra,
  textoDelPedido,
  totalDeLaCompra,
} from './pantalla';

describe('textoDelPedido', () => {
  it('arma el mensaje del pedido y el enlace de WhatsApp del proveedor', () => {
    const texto = textoDelPedido([
      { insumo: 'Harina 000', comoSeCompra: 'Bolsa de 25 kg', cantidad: 2 },
      { insumo: 'Azúcar', comoSeCompra: 'Bolsa de 50 kg', cantidad: 1.5 },
    ]);
    expect(texto).toBe(
      'Hola, te hago un pedido para Manteca:\n- 2 × Harina 000 (Bolsa de 25 kg)\n- 1,5 × Azúcar (Bolsa de 50 kg)\nGracias.',
    );
    expect(enlaceDelPedido('5491123456789', 'Hola')).toBe('https://wa.me/5491123456789?text=Hola');
    expect(enlaceDelPedido(null, 'Hola')).toBeNull();
  });
});

describe('totalDeLaCompra', () => {
  it('suma los renglones y los otros cargos, redondeando cada renglon', () => {
    expect(
      totalDeLaCompra(
        [
          { cantidad: 2, precioCentavos: 3_000_000 },
          { cantidad: 1.5, precioCentavos: 333 },
        ],
        50_000,
      ),
    ).toBe(6_050_500);
  });
});

describe('estado y pago', () => {
  it('se nombran como en la lista', () => {
    expect(estadoDeCompra({ estado: 'pedida', anulado: false })).toBe('Pedida');
    expect(estadoDeCompra({ estado: 'recibida', anulado: true })).toBe('Anulada');
    expect(pagoDeCompra({ gasto: true, vencimiento: null })).toBe('Pagada');
    expect(pagoDeCompra({ gasto: false, vencimiento: '2026-12-01' })).toBe(
      'Por pagar, vence el 01/12/2026',
    );
    expect(pagoDeCompra({ gasto: false, vencimiento: null })).toBe('—');
  });
});

const PROVEEDOR = '0b8f3c2e-5d1a-4c7e-9f2b-1a2b3c4d5e6f';

describe('filtrosDeCompras', () => {
  it('por defecto, todas las del mes de hoy, de cualquier proveedor', () => {
    expect(filtrosDeCompras({}, '2026-11-19')).toEqual({
      estado: 'todas',
      proveedor: null,
      desde: '2026-11-01',
      hasta: '2026-11-30',
    });
  });

  it('lee el estado, el proveedor y las fechas de la URL, y descarta lo que no entiende', () => {
    const leidos = {
      estado: 'pedida',
      proveedor: PROVEEDOR,
      desde: '2026-10-01',
      hasta: '2026-10-15',
    };
    expect(filtrosDeCompras(leidos, '2026-11-19')).toEqual({
      estado: 'pedida',
      proveedor: PROVEEDOR,
      desde: '2026-10-01',
      hasta: '2026-10-15',
    });
    const malos = { estado: 'otra', proveedor: 'p1', desde: '2026-02-31' };
    expect(filtrosDeCompras(malos, '2026-11-19')).toMatchObject({
      estado: 'todas',
      proveedor: null,
      desde: '2026-11-01',
    });
  });
});

describe('enlaceDeCompras', () => {
  it('lleva el estado, el proveedor y el periodo', () => {
    const filtros = {
      estado: 'recibida' as const,
      proveedor: PROVEEDOR,
      desde: '2026-10-01',
      hasta: '2026-10-31',
    };
    expect(enlaceDeCompras(filtros)).toBe(
      `/admin/compras?estado=recibida&proveedor=${PROVEEDOR}&desde=2026-10-01&hasta=2026-10-31`,
    );
  });
});

describe('cantidadDelRenglon', () => {
  const renglon = { cantidadPedida: 2, cantidad: 0 };

  it('en un pedido, lo pedido', () => {
    expect(cantidadDelRenglon(renglon, 'pedida')).toBe('2');
  });

  it('recibida, lo que llego, o que no llego si se habia pedido', () => {
    expect(cantidadDelRenglon({ cantidadPedida: 2, cantidad: 1.5 }, 'recibida')).toBe('1,5');
    expect(cantidadDelRenglon(renglon, 'recibida')).toBe('No llegó');
  });
});

const forma = (cambios: Partial<FormaParaComprar>): FormaParaComprar => ({
  id: 'f1',
  proveedorId: 'p1',
  insumo: 'Harina 000',
  unidad: 'g',
  comoSeCompra: 'Bolsa de 25 kg',
  contenido: 25000,
  ultimoPrecioCentavos: null,
  referenciaCentavos: 3_200_000,
  ...cambios,
});

describe('las formas de compra en el formulario', () => {
  it('ofrece las del proveedor y las que no tienen proveedor', () => {
    const formas = [
      forma({}),
      forma({ id: 'f2', proveedorId: 'otro' }),
      forma({ id: 'f3', proveedorId: null }),
    ];
    expect(formasDelProveedor(formas, 'p1').map((f) => f.id)).toEqual(['f1', 'f3']);
    expect(formasDelProveedor(formas, '')).toEqual([]);
  });

  it('cada opcion dice el insumo, como se compra y el ultimo precio o la referencia', () => {
    expect(
      opcionesDeFormas([forma({}), forma({ id: 'f2', ultimoPrecioCentavos: 3_000_000 })]),
    ).toEqual([
      { valor: '', texto: 'Elegí qué' },
      { valor: 'f1', texto: 'Harina 000 · Bolsa de 25 kg · referencia $32.000,00' },
      { valor: 'f2', texto: 'Harina 000 · Bolsa de 25 kg · última $30.000,00' },
    ]);
  });

  it('el precio que propone es el ultimo pagado o, si no, la referencia', () => {
    expect(precioPropuesto(forma({ ultimoPrecioCentavos: 3_000_000 }))).toBe('30.000');
    expect(precioPropuesto(forma({}))).toBe('32.000');
    expect(precioPropuesto(forma({ referenciaCentavos: null }))).toBe('');
  });
});

describe('inicialDeLaCompra', () => {
  it('vacia, con la fecha de hoy y pagada por transferencia', () => {
    expect(inicialDeLaCompra('2026-11-19', null, [])).toMatchObject({
      compraId: '',
      proveedorId: '',
      fecha: '2026-11-19',
      fechaDePago: '2026-11-19',
      pago: 'pagada',
      medio: 'transferencia',
      renglones: [],
    });
  });

  it('al recibir un pedido, trae sus renglones con lo pedido y el precio propuesto', () => {
    const pedido = {
      id: 'c1',
      proveedorId: 'p1',
      renglonesDeLaCompra: [{ formaId: 'f1', cantidadPedida: 2 }],
    };
    expect(
      inicialDeLaCompra('2026-11-19', pedido, [forma({ ultimoPrecioCentavos: 3_000_000 })]),
    ).toMatchObject({
      compraId: 'c1',
      proveedorId: 'p1',
      renglones: [{ formaId: 'f1', cantidad: '2', precio: '30.000' }],
    });
  });
});

describe('precioAlElegir', () => {
  const formas = [forma({ ultimoPrecioCentavos: 3_000_000 })];

  it('al elegir que llego propone su precio si el renglon no tenia', () => {
    expect(precioAlElegir(formas, 'f1', '')).toBe('30.000');
  });

  it('no pisa un precio ya escrito ni inventa uno para lo que no conoce', () => {
    expect(precioAlElegir(formas, 'f1', '29.000')).toBeNull();
    expect(precioAlElegir(formas, 'otra', '')).toBeNull();
  });
});
