import { describe, expect, it } from 'vitest';
import {
  fechaDeExcel,
  leerMediosDePago,
  lotesParaLaBase,
  medioDeFudo,
  repartirEnVentas,
  resumenDeLaSubida,
} from './excelDeFudo';

const TITULOS = ['Fecha', 'Medio de pago', 'Ventas', 'Cantidad de ventas'];

describe('fechaDeExcel', () => {
  it('lee el numero de serie de Excel como el dia', () => {
    expect(fechaDeExcel(46270)).toBe('2026-09-05');
    expect(fechaDeExcel(46300)).toBe('2026-10-05');
  });

  it('lee una fecha de Excel como el dia que muestra', () => {
    expect(fechaDeExcel(new Date(Date.UTC(2026, 8, 5)))).toBe('2026-09-05');
  });

  it.each([undefined, 'ayer', -3, 46270.5, 99999999])('no entiende %s', (valor) => {
    expect(fechaDeExcel(valor)).toBeUndefined();
  });
});

describe('medioDeFudo', () => {
  it.each([
    ['Efectivo', 'efectivo'],
    ['QR', 'qr'],
    ['Tarj. Crédito', 'credito'],
    ['Tarj. Débito', 'debito'],
    ['Transferencia', 'transferencia'],
    ['  efectivo ', 'efectivo'],
  ])('%s es %s', (nombre, medio) => {
    expect(medioDeFudo(nombre)).toBe(medio);
  });

  it('no inventa un medio que no conoce', () => {
    expect(medioDeFudo('Cheque')).toBeUndefined();
  });
});

describe('repartirEnVentas', () => {
  it('reparte en partes iguales y el resto va en la primera', () => {
    expect(repartirEnVentas(1000, 3)).toEqual([334, 333, 333]);
  });

  it('con una sola venta, es el total', () => {
    expect(repartirEnVentas(559100, 1)).toEqual([559100]);
  });

  it('siempre suma el total', () => {
    const partes = repartirEnVentas(55910000, 38);
    expect(partes).toHaveLength(38);
    expect(partes.reduce((a, b) => a + b, 0)).toBe(55910000);
  });
});

describe('leerMediosDePago', () => {
  const fila = (fecha: unknown, medio: string, ventas: number, cantidad: number) => [
    fecha,
    medio,
    ventas,
    cantidad,
  ];

  it('pasa los pesos a centavos y junta lo del mismo dia y medio', () => {
    const lectura = leerMediosDePago([
      TITULOS,
      fila(46270, 'Efectivo', 559100, 38),
      fila(46270, 'Efectivo', 900, 2),
      fila(46271, 'QR', 672300.5, 41),
    ]);
    expect(lectura).toEqual({
      ok: true,
      datos: [
        { fecha: '2026-09-05', medio: 'efectivo', totalCentavos: 56000000, cantidad: 40 },
        { fecha: '2026-09-06', medio: 'qr', totalCentavos: 67230050, cantidad: 41 },
      ],
    });
  });

  it('rechaza una hoja que no tiene los titulos de Fudo', () => {
    const lectura = leerMediosDePago([['Fecha', 'Otra cosa'], fila(46270, 'QR', 1, 1)]);
    expect(lectura).toEqual({
      ok: false,
      mensaje: 'Ese archivo no es el reporte de ventas de Fudo. Subí el "Reporte-Ventas".',
    });
  });

  it('dice en que fila esta el dato que no se entiende', () => {
    const lectura = leerMediosDePago([TITULOS, fila(46270, 'Cheque', 100, 1)]);
    expect(lectura).toEqual({
      ok: false,
      mensaje:
        'Fila 2: no conocemos el medio de pago "Cheque". Los que entran son: efectivo, tarjeta de crédito, tarjeta de débito, QR y transferencia.',
    });
    expect(leerMediosDePago([TITULOS, fila('ayer', 'QR', 100, 1)])).toEqual({
      ok: false,
      mensaje: 'Fila 2: la fecha no se entiende.',
    });
    expect(leerMediosDePago([TITULOS, fila(46270, 'QR', -5, 1)])).toEqual({
      ok: false,
      mensaje: 'Fila 2: el monto o la cantidad de ventas no se entiende.',
    });
  });

  it('un dia con ventas pero cantidad cero se rechaza: no se puede repartir', () => {
    const lectura = leerMediosDePago([TITULOS, fila(46270, 'QR', 100, 0)]);
    expect(lectura.ok).toBe(false);
  });

  it('ignora las filas vacias del final', () => {
    const lectura = leerMediosDePago([TITULOS, fila(46270, 'QR', 100, 1), [], [null, null]]);
    expect(lectura.ok).toBe(true);
  });

  it('un archivo sin ventas se rechaza', () => {
    expect(leerMediosDePago([TITULOS])).toEqual({
      ok: false,
      mensaje: 'El archivo no tiene ventas para cargar.',
    });
  });
});

describe('lotesParaLaBase', () => {
  it('manda a la base una lista de montos por dia y medio, en partes iguales', () => {
    expect(
      lotesParaLaBase([
        { fecha: '2026-09-05', medio: 'efectivo', totalCentavos: 1000, cantidad: 3 },
        { fecha: '2026-09-05', medio: 'qr', totalCentavos: 500, cantidad: 1 },
      ]),
    ).toEqual([
      { fecha: '2026-09-05', medio: 'efectivo', montos: [334, 333, 333] },
      { fecha: '2026-09-05', medio: 'qr', montos: [500] },
    ]);
  });
});

describe('resumenDeLaSubida', () => {
  it('cuenta dias, ventas y total', () => {
    const resumen = resumenDeLaSubida([
      { fecha: '2026-09-05', medio: 'efectivo', totalCentavos: 1000, cantidad: 2 },
      { fecha: '2026-09-05', medio: 'qr', totalCentavos: 500, cantidad: 1 },
      { fecha: '2026-09-06', medio: 'qr', totalCentavos: 250, cantidad: 1 },
    ]);
    expect(resumen).toEqual({
      desde: '2026-09-05',
      hasta: '2026-09-06',
      dias: 2,
      ventas: 4,
      totalCentavos: 1750,
    });
  });
});
