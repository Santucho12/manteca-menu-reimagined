import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// El detalle de una venta, rediseñado para leerse de un vistazo (Santiago, 2026-11-20, pedido 102).
const partes = readFileSync('src/app/admin/(panel)/ventas/[id]/PartesDeLaVenta.tsx', 'utf8');
const pagina = readFileSync('src/app/admin/(panel)/ventas/[id]/page.tsx', 'utf8');

describe('el detalle de una venta', () => {
  it('va en dos columnas: el ticket a la izquierda y los datos a la derecha', () => {
    expect(pagina).toContain('xl:grid-cols-3');
    expect(pagina).toContain('<TicketDeLaVenta');
    expect(pagina).toContain('<DatosDeLaVenta');
  });

  it('la anulada se avisa arriba, en rojo, y su total va tachado', () => {
    expect(pagina.indexOf('<AvisoDeAnulada')).toBeLessThan(pagina.indexOf('<TicketDeLaVenta'));
    expect(partes).toContain('bg-rose-50');
    expect(partes).toContain('line-through');
  });

  it('cada medio de pago muestra cuánto se pagó con él', () => {
    expect(partes).toContain('venta.pagos.map');
    expect(partes).toContain('formatearPesos(pago.monto_centavos)');
  });

  it('el subtítulo dice la hora, el tipo y el origen', () => {
    expect(pagina).toContain('subtituloDeVenta(');
  });
});
