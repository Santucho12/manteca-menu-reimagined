import { describe, expect, it } from 'vitest';
import { MENSAJES_DEL_MENU, mensajeDelMenu, nombresDelDetalle } from './errores';

describe('errores del menu', () => {
  it('lee la lista de nombres que manda la base', () => {
    expect(nombresDelDetalle({ code: 'PM101', details: '["Flor", "Moñito"]' })).toEqual([
      'Flor',
      'Moñito',
    ]);
    expect(nombresDelDetalle({ code: 'PM101', details: 'no es json' })).toEqual([]);
  });

  it('dice que productos frenan desactivar una categoria', () => {
    expect(mensajeDelMenu({ code: 'PM103', details: '["Flor"]' })).toBe(
      'Primero mové o desactivá estos productos: Flor.',
    );
  });

  it.each([
    ['PM100', MENSAJES_DEL_MENU.sinPermiso],
    ['PM102', MENSAJES_DEL_MENU.sinPrecio],
    ['PM104', MENSAJES_DEL_MENU.categoriaDesactivada],
    ['PM105', MENSAJES_DEL_MENU.preciosCambiaron],
    ['PM106', MENSAJES_DEL_MENU.datosAjenos],
    ['42501', MENSAJES_DEL_MENU.sinPermiso],
    ['XX000', MENSAJES_DEL_MENU.generico],
  ])('%s se explica asi', (code, mensaje) => {
    expect(mensajeDelMenu({ code, details: null })).toBe(mensaje);
  });
});
