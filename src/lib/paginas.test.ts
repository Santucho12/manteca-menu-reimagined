import { describe, expect, it } from 'vitest';
import { direccionDePagina, paginaElegida, plantillaDePagina } from './paginas';

const enlaceA = (p: number) => (p === 1 ? '/lista' : `/lista?pagina=${p}`);

describe('paginaElegida', () => {
  it.each([
    ['7', 45, 7],
    ['0', 45, 1],
    ['-3', 45, 1],
    ['99', 45, 45],
    [' 12 ', 45, 12],
  ])('%s de %i llega a %i', (texto, ultima, esperada) => {
    expect(paginaElegida(texto, ultima)).toBe(esperada);
  });

  it('sin número no hay página', () => {
    expect(paginaElegida('', 45)).toBeNull();
    expect(paginaElegida('abc', 45)).toBeNull();
  });
});

describe('direccionDePagina', () => {
  it('arma la dirección de cualquier página con la misma forma que el servidor', () => {
    const plantilla = plantillaDePagina(enlaceA);
    expect(direccionDePagina(plantilla, enlaceA(1), 12)).toBe('/lista?pagina=12');
  });

  it('la primera usa su propia dirección, que no lleva página', () => {
    const plantilla = plantillaDePagina(enlaceA);
    expect(direccionDePagina(plantilla, enlaceA(1), 1)).toBe('/lista');
  });
});
