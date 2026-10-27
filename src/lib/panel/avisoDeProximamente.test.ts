import { afterEach, describe, expect, it } from 'vitest';
import { cerrarProximamente, leerProximamente, mostrarProximamente } from './avisoDeProximamente';

afterEach(cerrarProximamente);

describe('aviso de Próximamente', () => {
  it('empieza sin ningún aviso', () => {
    expect(leerProximamente()).toBeNull();
  });

  it('mostrar deja la sección que todavía no está lista', () => {
    mostrarProximamente('Costos');
    expect(leerProximamente()?.seccion).toBe('Costos');
  });

  it('un aviso nuevo reemplaza al anterior y se reconoce como otro', () => {
    mostrarProximamente('Costos');
    const primero = leerProximamente();
    mostrarProximamente('Reportes');
    const segundo = leerProximamente();
    expect(segundo?.seccion).toBe('Reportes');
    expect(segundo?.id).not.toBe(primero?.id);
  });

  it('cerrar lo saca', () => {
    mostrarProximamente('Costos');
    cerrarProximamente();
    expect(leerProximamente()).toBeNull();
  });
});
