import { exito, fallo, type Resultado } from '../resultado';

// El reporte de un mes de Fudo pesa 20 KB: 3 MB sobra y protege al servidor.
const MAXIMO_DE_BYTES = 3 * 1024 * 1024;

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;

/** Lo que paso con la subida, dicho para quien la hizo. */
export function mensajeDeLaSubida(r: {
  nuevas: number;
  actualizadas: number;
  iguales: number;
  anuladas: number;
}) {
  const partes = [
    r.nuevas > 0 ? plural(r.nuevas, 'venta nueva', 'ventas nuevas') : null,
    r.actualizadas > 0 ? plural(r.actualizadas, 'actualizada', 'actualizadas') : null,
    r.anuladas > 0 ? plural(r.anuladas, 'anulada', 'anuladas') : null,
  ].filter((parte) => parte !== null);
  if (partes.length === 0) return 'Listo: no había nada nuevo.';
  const ultima = partes.pop()!;
  return `Listo: ${partes.length > 0 ? `${partes.join(', ')} y ` : ''}${ultima}.`;
}

/** El archivo que mando el formulario, o por que no sirve. */
export async function archivoDelFormulario(datos: FormData): Promise<Resultado<Buffer>> {
  const archivo = datos.get('archivo');
  if (!(archivo instanceof File) || archivo.size === 0) {
    return fallo('Elegí el archivo del reporte de Fudo.');
  }
  if (archivo.size > MAXIMO_DE_BYTES) {
    return fallo('El archivo es demasiado grande. El reporte de Fudo pesa menos de 3 MB.');
  }
  return exito(Buffer.from(await archivo.arrayBuffer()));
}
