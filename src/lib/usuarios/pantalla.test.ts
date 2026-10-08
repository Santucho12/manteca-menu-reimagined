import { describe, expect, it } from 'vitest';
import { exito, fallo } from '../resultado';
import {
  filtrosDeLaUrl,
  panelAlElegir,
  preguntaDe,
  siguientePanel,
  textoDeTemporal,
} from './pantalla';

describe('filtrosDeLaUrl', () => {
  it('lee la busqueda, el estado y la pagina', () => {
    expect(filtrosDeLaUrl({ q: ' ana ', estado: 'pendientes', pagina: '2' })).toEqual({
      busqueda: 'ana',
      estado: 'pendientes',
      pagina: 2,
    });
  });

  it('sin parametros, o con valores que no sirven, usa los de siempre', () => {
    expect(filtrosDeLaUrl({ estado: 'otro', pagina: 'x' })).toEqual({
      busqueda: null,
      estado: 'todos',
      pagina: 1,
    });
  });

  it('de un parametro repetido toma el primero, y limpia la busqueda', () => {
    expect(filtrosDeLaUrl({ q: ['ana,(%)', 'otra'] }).busqueda).toBe('ana');
  });
});

describe('textos de la lista', () => {
  it('la pregunta de confirmacion nombra a la persona', () => {
    expect(preguntaDe('desactivar', 'Ana')).toBe(
      '¿Desactivar a Ana? Pierde el acceso en el momento.',
    );
  });

  it('el aviso de la contraseña temporal es el de la definicion', () => {
    expect(textoDeTemporal('Ana')).toBe(
      'Pasale esta contraseña a Ana. Se la vamos a pedir cambiar apenas entre. No la vas a poder ver de nuevo.',
    );
  });
});

describe('paneles de una cuenta', () => {
  it.each([
    ['corregir', { tipo: 'corregir' }],
    ['rechazar', { tipo: 'confirmar', accion: 'rechazar' }],
    ['desactivar', { tipo: 'confirmar', accion: 'desactivar' }],
    ['resetear', { tipo: 'confirmar', accion: 'resetear' }],
    ['darCaja', { tipo: 'botones' }],
    ['reactivar', { tipo: 'botones' }],
  ] as const)('al elegir %s se ve %o', (accion, panel) => {
    expect(panelAlElegir(accion)).toEqual(panel);
  });

  it('un reseteo que salio bien muestra la contraseña temporal', () => {
    expect(siguientePanel(exito({ temporal: 'ABCDEFGHJKLM' }))).toEqual({
      tipo: 'temporal',
      contrasena: 'ABCDEFGHJKLM',
    });
  });

  it('lo demas, salga bien o mal, vuelve a los botones', () => {
    expect(siguientePanel(exito(undefined))).toEqual({ tipo: 'botones' });
    expect(siguientePanel(fallo('No se pudo.'))).toEqual({ tipo: 'botones' });
  });
});
