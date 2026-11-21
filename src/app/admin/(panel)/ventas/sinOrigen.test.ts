import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Sin el origen en Ventas: todo se cobra en Vender (Santiago, 2026-11-20, pedido 102).
const leer = (ruta: string) => readFileSync(`src/app/admin/(panel)/ventas/${ruta}`, 'utf8');

describe('Ventas sin origen', () => {
  it('la lista va por fecha, tipo de venta, quién cobró, medio, estado y total', () => {
    const lista = leer('ListaDeVentas.tsx');
    expect(lista).not.toContain("titulo: 'Origen'");
    expect(lista).toContain("titulo: 'Tipo de venta'");
    expect(lista).toContain("titulo: 'Cobró'");
    expect(lista).not.toContain('OrigenDeVenta');
  });

  it('el detalle no muestra el origen', () => {
    expect(leer('[id]/PartesDeLaVenta.tsx')).not.toContain('OrigenDeVenta');
    expect(readFileSync('src/lib/ventas/pantalla.ts', 'utf8')).not.toContain(
      'nombreDeOrigen(origen)].filter',
    );
  });
});
