import { describe, expect, it } from 'vitest';
import { problemaDeFoto, rutaDeFoto, urlDeFoto } from './fotos';

const SUPABASE = 'https://abc.supabase.co';

describe('urlDeFoto', () => {
  it('una foto de la carga inicial se sirve desde la aplicacion', () => {
    expect(urlDeFoto('/menu/facturas.jpg', SUPABASE)).toBe('/menu/facturas.jpg');
  });

  it('una foto subida se sirve desde el bucket publico', () => {
    expect(urlDeFoto('local/foto.jpg', SUPABASE)).toBe(
      'https://abc.supabase.co/storage/v1/object/public/fotos-del-menu/local/foto.jpg',
    );
  });

  it('sin foto no hay url', () => {
    expect(urlDeFoto(null, SUPABASE)).toBeNull();
  });
});

describe('problemaDeFoto', () => {
  it('acepta JPG, PNG y WebP de hasta 10 MB', () => {
    expect(problemaDeFoto('image/jpeg', 10 * 1024 * 1024)).toBeNull();
    expect(problemaDeFoto('image/webp', 1000)).toBeNull();
  });

  it('explica por que no acepta un archivo', () => {
    expect(problemaDeFoto('application/pdf', 1000)).toBe('Subí una foto JPG, PNG o WebP.');
    expect(problemaDeFoto('image/png', 10 * 1024 * 1024 + 1)).toBe(
      'La foto pesa más de 10 MB. Probá con una más chica.',
    );
  });
});

describe('rutaDeFoto', () => {
  it('va en la carpeta del local con la extension del tipo', () => {
    expect(rutaDeFoto('local-1', 'image/png', 'id-1')).toBe('local-1/id-1.png');
  });
});
