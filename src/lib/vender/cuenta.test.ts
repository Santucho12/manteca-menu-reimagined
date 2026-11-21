import { describe, expect, it } from 'vitest';
import { armarPaquetes, cuentaDelTicket, type RenglonParaLaCuenta } from './cuenta';

// La docena variada y la venta por peso (Santiago, 2026-11-20, pedido 102). La base hace la misma
// cuenta al guardar: esta es la que ve quien vende antes de cobrar.
const FACTURAS = 'facturas';
const PAQUETES = {
  [FACTURAS]: [12, 6, 1].map((u, i) => ({
    unidades: u,
    precioCentavos: [2000000, 1200000, 300000][i]!,
  })),
};

const factura = (
  producto: string,
  cantidad: number,
  unidades = 1,
  precio = 300000,
): RenglonParaLaCuenta => ({
  clave: `${producto}|${unidades}`,
  categoriaId: FACTURAS,
  cantidad,
  precioCentavos: precio,
  unidades,
  gramos: null,
  compartido: true,
});

describe('la docena variada', () => {
  it('12 facturas sueltas de distintas se cobran como una docena', () => {
    const cuenta = cuentaDelTicket(
      [factura('medialuna', 4), factura('monito', 4), factura('flor', 4)],
      PAQUETES,
    );
    expect(cuenta.totalCentavos).toBe(2000000);
    expect(cuenta.variadas).toMatchObject([
      { categoriaId: FACTURAS, unidades: 12, antesCentavos: 3600000, ahoraCentavos: 2000000 },
    ]);
  });

  it('una docena pedida más 6 sueltas son una docena y una media', () => {
    const docena = factura('medialuna', 1, 12, 2000000);
    const cuenta = cuentaDelTicket([docena, factura('flor', 3), factura('monito', 3)], PAQUETES);
    expect(cuenta.totalCentavos).toBe(3200000);
  });

  it('cada 12 la docena, si sobran 6 o más la media, y el resto por unidad', () => {
    expect(cuentaDelTicket([factura('flor', 20)], PAQUETES).totalCentavos).toBe(
      2000000 + 1200000 + 2 * 300000,
    );
    expect(cuentaDelTicket([factura('flor', 5)], PAQUETES).totalCentavos).toBe(1500000);
    expect(cuentaDelTicket([factura('flor', 5)], PAQUETES).variadas).toEqual([]);
  });

  it('reparte el precio de la docena entre los renglones, y la suma da justo', () => {
    const cuenta = cuentaDelTicket(
      [factura('medialuna', 4), factura('monito', 4), factura('flor', 4)],
      PAQUETES,
    );
    expect(cuenta.renglones.map((r) => r.subtotalCentavos)).toEqual([666666, 666666, 666668]);
  });

  it('un producto con precio propio no entra en la docena variada', () => {
    const propio = { ...factura('especial', 6), compartido: false };
    const cuenta = cuentaDelTicket([propio, factura('flor', 6)], PAQUETES);
    expect(cuenta.totalCentavos).toBe(1800000 + 1200000);
  });
});

describe('por peso', () => {
  const palitos: RenglonParaLaCuenta = {
    clave: 'palitos|cuarto',
    categoriaId: 'clasicos',
    cantidad: 1,
    precioCentavos: 800000,
    unidades: null,
    gramos: 300,
    gramosDeLaForma: 250,
    compartido: false,
  };

  it('cobra en proporción al peso: 300 g de un cuarto de $8.000 son $9.600', () => {
    expect(cuentaDelTicket([palitos], {}).totalCentavos).toBe(960000);
  });

  it('redondea al centavo', () => {
    expect(cuentaDelTicket([{ ...palitos, gramos: 333 }], {}).totalCentavos).toBe(1065600);
  });
});

describe('armarPaquetes', () => {
  it('toma de cada categoría las formas con unidades y precio para todos, de la más grande a la más chica', () => {
    const formas = [
      { categoriaId: 'f', unidades: 1, precioCentavos: 300000, compartido: true },
      { categoriaId: 'f', unidades: 12, precioCentavos: 2000000, compartido: true },
      { categoriaId: 'f', unidades: 12, precioCentavos: 2000000, compartido: true },
      { categoriaId: 'c', unidades: null, precioCentavos: 500000, compartido: true },
      { categoriaId: 'p', unidades: 1, precioCentavos: 500000, compartido: false },
    ];
    expect(armarPaquetes(formas)).toEqual({
      f: [
        { unidades: 12, precioCentavos: 2000000 },
        { unidades: 1, precioCentavos: 300000 },
      ],
    });
  });
});

describe('el desglose de la docena variada', () => {
  it('dice cuántas de cada forma se cobraron', async () => {
    const { desgloseEnPaquetes } = await import('./cuenta');
    const paquetes = [
      { unidades: 12, precioCentavos: 2000000, nombre: 'Docena' },
      { unidades: 6, precioCentavos: 1200000, nombre: 'Media docena' },
      { unidades: 1, precioCentavos: 300000, nombre: 'Unidad' },
    ];
    expect(desgloseEnPaquetes(52, paquetes)).toBe('4 × Docena · 4 × Unidad');
    expect(desgloseEnPaquetes(18, paquetes)).toBe('1 × Docena · 1 × Media docena');
  });

  it('la variada guarda su desglose para mostrarlo', () => {
    const conNombres = {
      [FACTURAS]: PAQUETES[FACTURAS].map((p, i) => ({
        ...p,
        nombre: ['Docena', 'Media docena', 'Unidad'][i]!,
      })),
    };
    const cuenta = cuentaDelTicket([factura('flor', 12)], conNombres);
    expect(cuenta.variadas[0]?.desglose).toBe('1 × Docena');
  });
});

describe('las formas con que se cobra la docena variada', () => {
  it('cada forma con cuántas veces entra y lo que suma', async () => {
    const { paquetesUsados } = await import('./cuenta');
    const paquetes = [
      { unidades: 12, precioCentavos: 2000000, nombre: 'Docena' },
      { unidades: 6, precioCentavos: 1200000, nombre: 'Media docena' },
      { unidades: 1, precioCentavos: 300000, nombre: 'Unidad' },
    ];
    expect(paquetesUsados(37, paquetes)).toEqual([
      { nombre: 'Docena', veces: 3, subtotalCentavos: 6000000 },
      { nombre: 'Unidad', veces: 1, subtotalCentavos: 300000 },
    ]);
  });
});
