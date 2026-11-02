import { describe, expect, it } from 'vitest';
import { disposicionDePrecios } from './disposicion';

describe('disposicionDePrecios', () => {
  it('con un solo precio, siempre al costado del nombre', () => {
    const { fila } = disposicionDePrecios(1);
    expect(fila).toContain('flex-row');
    expect(fila).not.toContain('@min');
  });

  it('con varios, al costado solo si la tarjeta tiene lugar: más precios piden más ancho', () => {
    expect(disposicionDePrecios(2).fila).toContain('@min-[19rem]:flex-row');
    expect(disposicionDePrecios(3).fila).toContain('@min-[26rem]:flex-row');
    expect(disposicionDePrecios(5).fila).toContain('@min-[32rem]:flex-row');
  });

  it('si no hay lugar van debajo del nombre, en columnas parejas', () => {
    const { fila, precios } = disposicionDePrecios(3);
    expect(fila).toMatch(/^flex-col /);
    expect(precios).toMatch(/^grid /);
  });
});
