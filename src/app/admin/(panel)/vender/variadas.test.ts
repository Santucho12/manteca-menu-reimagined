import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// La docena variada: las facturas que entran no muestran precio suelto, y abajo un recuadro dice
// con qué formas se cobran, el total y el ahorro (Santiago, 2026-11-20, pedido 102).
const leer = (archivo: string) => readFileSync(`src/app/admin/(panel)/vender/${archivo}`, 'utf8');

describe('la docena variada en el ticket', () => {
  const ticket = leer('TicketDelMostrador.tsx');

  it('cada forma con que se cobra va en su línea, con el ahorro', () => {
    expect(ticket).toContain('Precio por cantidad');
    expect(ticket).toContain('v.paquetes.map');
    expect(ticket).toContain('Ahorrás');
    expect(ticket).toContain('<Tag');
  });

  it('lo que entra en la docena no muestra precio suelto', () => {
    expect(ticket).toContain('por cantidad</span>');
  });
});

// Al cobrar en efectivo aparece la ventana de vuelto; si no se toca en 5 segundos, se va.
describe('la ventana de vuelto', () => {
  const ventana = leer('VentanaDeVuelto.tsx');

  it('pregunta cuánto pagaron y muestra el vuelto', () => {
    expect(ventana).toContain('Calcular vuelto');
    expect(ventana).toContain('¿Cuánto te pagaron?');
    expect(ventana).toContain('vueltoParaMostrar(');
  });

  it('se va sola a los 5 segundos, salvo que se la toque', () => {
    expect(ventana).toContain('SE_VA_EN = 5000');
    expect(ventana).toContain('onPointerDown={() => setTocada(true)}');
  });

  it('aparece en Ventas al cobrar con efectivo, no antes', () => {
    const enVentas = readFileSync('src/app/admin/(panel)/ventas/VueltoDeLaVenta.tsx', 'utf8');
    expect(enVentas).toContain('<VentanaDeVuelto');
    expect(leer('CobroDelMostrador.tsx')).not.toContain('CalcularVuelto');
  });
});
