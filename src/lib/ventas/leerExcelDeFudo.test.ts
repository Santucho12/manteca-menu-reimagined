import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { leerExcelDeFudo } from './leerExcelDeFudo';

const EXCEL = 'e2e/archivos/reporte-ventas-fudo.xlsx';

describe('leerExcelDeFudo', () => {
  it('lee la hoja de medios de pago de un reporte de Fudo', async () => {
    const lectura = await leerExcelDeFudo(await readFile(EXCEL));
    expect(lectura).toEqual({
      ok: true,
      datos: [
        { fecha: '2020-03-02', medio: 'efectivo', totalCentavos: 3000000, cantidad: 3 },
        { fecha: '2020-03-02', medio: 'qr', totalCentavos: 1000100, cantidad: 2 },
        { fecha: '2020-03-03', medio: 'efectivo', totalCentavos: 450000, cantidad: 1 },
        { fecha: '2020-03-03', medio: 'credito', totalCentavos: 1200000, cantidad: 4 },
        { fecha: '2020-03-04', medio: 'transferencia', totalCentavos: 700000, cantidad: 1 },
      ],
    });
  });

  it('rechaza un archivo que no es un Excel', async () => {
    const lectura = await leerExcelDeFudo(Buffer.from('no soy un excel'));
    expect(lectura).toEqual({
      ok: false,
      mensaje: 'No pudimos abrir el archivo. Subí el .xlsx que baja Fudo, sin modificarlo.',
    });
  });

  it('rechaza un Excel que no trae la hoja de medios de pago', async () => {
    const lectura = await leerExcelDeFudo(await readFile('e2e/archivos/foto-de-prueba.jpg'));
    expect(lectura.ok).toBe(false);
  });
});
