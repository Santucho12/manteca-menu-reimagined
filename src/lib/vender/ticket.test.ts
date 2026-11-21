import { describe, expect, it } from 'vitest';
import {
  cambiarCantidad,
  claveDe,
  cuentaDeTicket,
  sacarDelTicket,
  sumarAlTicket,
  type ItemDelCatalogo,
  type RenglonDelTicket,
} from './ticket';

const docena: ItemDelCatalogo = {
  productoId: 'medialunas',
  presentacionId: 'docena',
  nombre: 'Medialunas de manteca',
  presentacion: 'Docena',
  precioCentavos: 1_800_000,
};
const cafe: ItemDelCatalogo = {
  productoId: 'cafe',
  presentacionId: 'grande',
  nombre: 'Café',
  presentacion: 'Grande',
  precioCentavos: 350_000,
};

const conCantidad = (item: ItemDelCatalogo, cantidad: number): RenglonDelTicket => ({
  ...item,
  cantidad,
});

describe('sumarAlTicket', () => {
  it('un producto nuevo entra con cantidad 1, al final', () => {
    expect(sumarAlTicket([conCantidad(cafe, 1)], docena)).toEqual([
      conCantidad(cafe, 1),
      conCantidad(docena, 1),
    ]);
  });

  it('el mismo producto en la misma forma de venta suma uno a su renglón', () => {
    expect(sumarAlTicket([conCantidad(docena, 2)], docena)).toEqual([conCantidad(docena, 3)]);
  });

  it('el mismo producto en otra forma de venta va en otro renglón', () => {
    const unidad = { ...docena, presentacionId: 'unidad', presentacion: 'Unidad' };
    expect(sumarAlTicket([conCantidad(docena, 1)], unidad)).toHaveLength(2);
  });
});

describe('cambiarCantidad', () => {
  it('suma y resta de a uno en el renglón elegido', () => {
    const ticket = [conCantidad(docena, 2), conCantidad(cafe, 1)];
    expect(cambiarCantidad(ticket, claveDe(docena), 1)).toEqual([
      conCantidad(docena, 3),
      conCantidad(cafe, 1),
    ]);
    expect(cambiarCantidad(ticket, claveDe(docena), -1)[0]?.cantidad).toBe(1);
  });

  it('restar el último saca el renglón', () => {
    expect(cambiarCantidad([conCantidad(cafe, 1)], claveDe(cafe), -1)).toEqual([]);
  });
});

describe('sacarDelTicket', () => {
  it('saca el renglón entero, con su cantidad', () => {
    const ticket = [conCantidad(docena, 4), conCantidad(cafe, 1)];
    expect(sacarDelTicket(ticket, claveDe(docena))).toEqual([conCantidad(cafe, 1)]);
  });
});

describe('subtotales y total', () => {
  it('cada renglón es precio por cantidad, y el total la suma, en centavos enteros', () => {
    const ticket = [conCantidad(docena, 2), conCantidad(cafe, 3)];
    const cuenta = cuentaDeTicket(ticket, {});
    expect(cuenta.renglones[0]!.subtotalCentavos).toBe(3_600_000);
    expect(cuenta.totalCentavos).toBe(3_600_000 + 1_050_000);
  });

  it('un ticket vacío da $0', () => {
    expect(cuentaDeTicket([], {}).totalCentavos).toBe(0);
  });
});
