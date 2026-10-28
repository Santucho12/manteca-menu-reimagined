import { describe, expect, it } from 'vitest';
import { archivoDelFormulario, mensajeDeLaSubida } from './mensajesDeLaSubida';

const resultado = (nuevas: number, actualizadas: number, anuladas: number) => ({
  nuevas,
  actualizadas,
  iguales: 0,
  anuladas,
});

describe('mensajeDeLaSubida', () => {
  it('cuenta las ventas nuevas', () => {
    expect(mensajeDeLaSubida(resultado(11, 0, 0))).toBe('Listo: 11 ventas nuevas.');
    expect(mensajeDeLaSubida(resultado(1, 0, 0))).toBe('Listo: 1 venta nueva.');
  });

  it('dice cuando no habia nada nuevo', () => {
    expect(mensajeDeLaSubida({ nuevas: 0, actualizadas: 0, iguales: 11, anuladas: 0 })).toBe(
      'Listo: no había nada nuevo.',
    );
  });

  it('junta lo nuevo, lo actualizado y lo anulado', () => {
    expect(mensajeDeLaSubida(resultado(3, 2, 1))).toBe(
      'Listo: 3 ventas nuevas, 2 actualizadas y 1 anulada.',
    );
    expect(mensajeDeLaSubida(resultado(0, 1, 2))).toBe('Listo: 1 actualizada y 2 anuladas.');
  });
});

describe('archivoDelFormulario', () => {
  const formulario = (archivo?: File) => {
    const datos = new FormData();
    if (archivo) datos.set('archivo', archivo);
    return datos;
  };

  it('devuelve el contenido del archivo elegido', async () => {
    const lectura = await archivoDelFormulario(formulario(new File(['hola'], 'reporte.xlsx')));
    expect(lectura.ok && lectura.datos.toString()).toBe('hola');
  });

  it('pide elegir el archivo si no hay ninguno', async () => {
    const sin = await archivoDelFormulario(formulario());
    expect(sin).toEqual({ ok: false, mensaje: 'Elegí el archivo del reporte de Fudo.' });
    const vacio = await archivoDelFormulario(formulario(new File([], 'vacio.xlsx')));
    expect(vacio.ok).toBe(false);
  });

  it('rechaza un archivo demasiado grande', async () => {
    const grande = new File([new Uint8Array(3 * 1024 * 1024 + 1)], 'grande.xlsx');
    expect(await archivoDelFormulario(formulario(grande))).toEqual({
      ok: false,
      mensaje: 'El archivo es demasiado grande. El reporte de Fudo pesa menos de 3 MB.',
    });
  });
});
