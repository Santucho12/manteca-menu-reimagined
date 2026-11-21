import { describe, expect, it } from 'vitest';
import { contadoAlCargar } from './vistaDelCierre';

// El frente de Caja rehecho desde cero (Santiago, 2026-11-21).
describe('contadoAlCargar', () => {
  it('suma lo que se escribió en cada medio y lo que salió de la caja; lo mal escrito cuenta cero', () => {
    const datos = {
      efectivo: '20.000',
      credito: '19.500',
      debito: '',
      qr: 'abc',
      transferencia: '1.000,50',
      retiros: [{ monto: '5.000', quien: 'Ana' }],
      gastos: [
        { monto: '1.500', descripcion: 'Hielo' },
        { monto: '', descripcion: '' },
      ],
    };
    expect(contadoAlCargar(datos)).toEqual({
      mediosCentavos: 4050050,
      salidasCentavos: 650000,
    });
  });
});
