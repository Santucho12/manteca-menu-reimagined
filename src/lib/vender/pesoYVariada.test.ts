import { describe, expect, it } from 'vitest';
import { catalogoDeFilas, paquetesDelCatalogo, type FilaDelCatalogo } from './catalogo';
import { esquemaVentaDelMostrador, ventaDelMostradorParaLaBase, ventaDelTicket } from './esquemas';
import { cuentaDeTicket, pesarEnElTicket, type ItemDelCatalogo } from './ticket';

// Vender con la docena variada y lo que va por peso (Santiago, 2026-11-20, pedido 102).
const UUID = (n: number) => `00000000-0000-4000-8000-00000000000${n}`;

const PRESENTACIONES: Record<string, number> = { Docena: 5, Unidad: 6, Cuarto: 7 };

const fila = (
  producto: number,
  presentacion: string,
  precio: number,
  medida: Partial<FilaDelCatalogo> = {},
): FilaDelCatalogo => ({
  categoria_id: 'facturas',
  categoria: 'Facturas',
  producto_id: UUID(producto),
  producto: `Factura ${producto}`,
  presentacion_id: UUID(PRESENTACIONES[presentacion]!),
  presentacion,
  precio_centavos: precio,
  unidades: null,
  gramos: null,
  compartido: true,
  ...medida,
});

const CATALOGO = catalogoDeFilas([
  fila(1, 'Docena', 2000000, { unidades: 12 }),
  fila(1, 'Unidad', 300000, { unidades: 1 }),
  fila(2, 'Unidad', 300000, { unidades: 1 }),
  fila(3, 'Cuarto', 800000, { gramos: 250, compartido: false, categoria_id: 'clasicos' }),
]);
const forma = (producto: number, presentacion: string): ItemDelCatalogo =>
  CATALOGO.flatMap((c) => c.productos.flatMap((p) => p.formas)).find(
    (f) => f.productoId === UUID(producto) && f.presentacion === presentacion,
  )!;

describe('el catálogo con sus medidas', () => {
  it('cada forma sabe su categoría, cuánto es y si el precio es para todos', () => {
    expect(forma(1, 'Docena')).toMatchObject({
      categoriaId: 'facturas',
      unidades: 12,
      compartido: true,
    });
    expect(forma(3, 'Cuarto')).toMatchObject({ gramosDeLaForma: 250, compartido: false });
  });

  it('arma los paquetes de la docena variada', () => {
    expect(paquetesDelCatalogo(CATALOGO)).toEqual({
      facturas: [
        { unidades: 12, precioCentavos: 2000000, nombre: 'Docena' },
        { unidades: 1, precioCentavos: 300000, nombre: 'Unidad' },
      ],
    });
  });
});

describe('el ticket con lo pesado y la docena variada', () => {
  it('lo pesado entra con sus gramos, y pesarlo de nuevo los cambia', () => {
    const ticket = pesarEnElTicket(
      pesarEnElTicket([], forma(3, 'Cuarto'), 300),
      forma(3, 'Cuarto'),
      500,
    );
    expect(ticket).toMatchObject([{ cantidad: 1, gramos: 500 }]);
  });

  it('la cuenta del ticket junta las sueltas en docena y cobra lo pesado por peso', () => {
    const sueltas = Array.from({ length: 6 }, () => [
      forma(1, 'Unidad'),
      forma(2, 'Unidad'),
    ]).flat();
    let ticket = sueltas.reduce(
      (t, f) => {
        const previo = t.find((r) => r.productoId === f.productoId);
        return previo
          ? t.map((r) => (r === previo ? { ...r, cantidad: r.cantidad + 1 } : r))
          : [...t, { ...f, cantidad: 1 }];
      },
      [] as ReturnType<typeof pesarEnElTicket>,
    );
    ticket = pesarEnElTicket(ticket, forma(3, 'Cuarto'), 300);
    const cuenta = cuentaDeTicket(ticket, paquetesDelCatalogo(CATALOGO));
    expect(cuenta.totalCentavos).toBe(2000000 + 960000);
    expect(cuenta.variadas).toHaveLength(1);
  });
});

describe('al cobrar', () => {
  it('lo pesado manda sus gramos a la base', () => {
    const ticket = pesarEnElTicket([], forma(3, 'Cuarto'), 300);
    const venta = esquemaVentaDelMostrador.parse({
      clave: UUID(9),
      ...ventaDelTicket(ticket, [{ medio: 'efectivo', montoCentavos: 960000 }]),
    });
    expect(ventaDelMostradorParaLaBase(venta).renglones[0]).toMatchObject({ gramos: 300 });
  });

  it('los pagos los controla la base, que conoce la docena variada', () => {
    const ticket = [{ ...forma(1, 'Unidad'), cantidad: 12 }];
    const venta = {
      clave: UUID(9),
      ...ventaDelTicket(ticket, [{ medio: 'efectivo', montoCentavos: 2000000 }]),
    };
    expect(esquemaVentaDelMostrador.safeParse(venta).success).toBe(true);
  });
});

describe('la balanza', () => {
  it('abre con lo que ya se pesó, o con el peso de la forma', async () => {
    const { pesoInicial } = await import('./usePasos');
    expect(pesoInicial(forma(3, 'Cuarto'), [])).toBe(250);
    expect(pesoInicial(forma(3, 'Cuarto'), pesarEnElTicket([], forma(3, 'Cuarto'), 420))).toBe(420);
  });
});
