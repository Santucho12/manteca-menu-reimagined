import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// En Ventas no va el dorado de marca: va el verde de lo que entra (Santiago, 2026-11-20, pedido 102).
describe('Ventas sin dorado', () => {
  it('la lista no usa el color de marca y su ícono va en verde', () => {
    const lista = readFileSync('src/app/admin/(panel)/ventas/ListaDeVentas.tsx', 'utf8');
    expect(lista).not.toMatch(/\b(text|ring|bg|border)-primary/);
    expect(lista).toContain('colorDelIcono="text-emerald-600"');
  });

  it('la tabla deja elegir el color del ícono y por defecto sigue el de marca', () => {
    const tabla = readFileSync('src/components/panel/TablaDeFilas.tsx', 'utf8');
    expect(tabla).toContain("colorDelIcono = 'text-primary'");
    expect(tabla).toContain('className={colorDelIcono}');
  });
});

describe('Tipos de venta sin dorado y sin carga a mano', () => {
  const formulario = readFileSync(
    'src/app/admin/(panel)/ventas/canales/FormularioDeCanal.tsx',
    'utf8',
  );
  const pagina = readFileSync('src/app/admin/(panel)/ventas/canales/page.tsx', 'utf8');

  it('el campo para sumar va en gris', () => {
    expect(formulario).toContain("tono: 'gris'");
    const campo = readFileSync('src/components/formularios/Campo.tsx', 'utf8');
    expect(campo).toContain("tono === 'gris'");
  });

  it('los textos dicen que el tipo se elige en Vender', () => {
    expect(pagina).not.toContain('a mano');
    expect(pagina).toContain('Vender');
  });
});
