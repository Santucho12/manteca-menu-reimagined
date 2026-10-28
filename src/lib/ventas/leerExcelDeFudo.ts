import { readSheet } from 'read-excel-file/node';
import { fallo, type Resultado } from '../resultado';
import { HOJA_DE_MEDIOS, leerMediosDePago, type VentasPorMedio } from './excelDeFudo';

const NO_SE_ABRE = 'No pudimos abrir el archivo. Subí el .xlsx que baja Fudo, sin modificarlo.';

/** Abre el reporte de ventas de Fudo y lee su hoja "Medios de pago". */
export async function leerExcelDeFudo(archivo: Buffer): Promise<Resultado<VentasPorMedio[]>> {
  try {
    return leerMediosDePago(await readSheet(archivo, HOJA_DE_MEDIOS));
  } catch {
    return fallo(NO_SE_ABRE);
  }
}
