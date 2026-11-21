import { describe, expect, it } from 'vitest';
import { AYUDAS } from './ayudas';

describe('la ayuda de Ventas', () => {
  it('dice que arranca en el día de hoy (Santiago, 2026-11-20, pedido 102)', () => {
    const texto = AYUDAS.ventas.temas.flatMap((t) => t.puntos).join(' ');
    expect(texto).toContain('Arranca en el día de hoy');
    expect(texto).not.toContain('mes de hoy');
  });
});

describe('sin carga a mano (Santiago, 2026-11-20, pedido 102)', () => {
  const textoDe = (clave: 'ventas' | 'canales' | 'control' | 'reportes') => {
    const ayuda = AYUDAS[clave];
    return [ayuda.introduccion, ...ayuda.temas.flatMap((t) => [t.titulo, ...t.puntos])].join(' ');
  };

  it.each(['ventas', 'canales', 'control', 'reportes'] as const)(
    'la ayuda de %s no habla de cargar ventas a mano',
    (clave) => {
      expect(textoDe(clave)).not.toMatch(/cargás a mano|cargar una venta a mano|cargala de nuevo/i);
    },
  );

  // El origen ya no se muestra: es el tipo de venta (Santiago, 2026-11-20).
  it('Ventas no habla del origen', () => {
    expect(textoDe('ventas')).not.toMatch(/origen/i);
  });
});

describe('la ayuda de Tipos de venta', () => {
  it('dice cómo se ordenan (pedido 102)', () => {
    const texto = AYUDAS.canales.temas.flatMap((t) => t.puntos).join(' ');
    expect(texto).toContain('arrastrando');
    expect(texto).toContain('orden de los botones en Vender');
  });
});

describe('la ayuda de Ventas al día (pedido 102)', () => {
  const ayuda = AYUDAS.ventas;
  const texto = [ayuda.introduccion, ...ayuda.temas.flatMap((t) => [t.titulo, ...t.puntos])].join(
    ' ',
  );

  it('cuenta la caja por turno, los botones de arriba y las viejas sin productos', () => {
    for (const parte of [
      'caja del turno',
      'Tipos de venta',
      'sin productos',
      'con la fecha de hoy',
    ])
      expect(texto).toContain(parte);
  });

  it('no repite el total de arriba: son las tarjetas', () => {
    expect(texto).not.toContain('El total de arriba');
  });
});

describe('la ayuda de Vender, por pasos (pedido 102)', () => {
  const ayuda = AYUDAS.vender;
  const texto = [ayuda.introduccion, ...ayuda.temas.flatMap((t) => [t.titulo, ...t.puntos])].join(
    ' ',
  );

  it('cuenta los tres pasos, el peso y la docena variada', () => {
    for (const parte of ['tres pasos', 'Siguiente', 'balanza', 'docena', 'Tipo de venta'])
      expect(texto).toContain(parte);
  });

  it('ya no manda a cargar a mano lo que no se pudo cobrar', () => {
    expect(texto).not.toContain('el admin la carga después');
  });
});

describe('la ayuda de Ventas con la edición (pedido 102)', () => {
  const ayuda = AYUDAS.ventas;
  const texto = [ayuda.introduccion, ...ayuda.temas.flatMap((t) => [t.titulo, ...t.puntos])].join(
    ' ',
  );

  it('cuenta cómo se edita, quién y que queda marcada', () => {
    for (const parte of ['Editar', 'motivo', 'Editada', '30 minutos', 'Auditoría'])
      expect(texto).toContain(parte);
    expect(texto).not.toContain('no se edita');
  });
});

describe('las ayudas de Vender y Ventas al día (pedido 102)', () => {
  const texto = (clave: 'vender' | 'ventas') =>
    AYUDAS[clave].temas.flatMap((t) => t.puntos).join(' ');

  it('Vender cuenta el descuento y que sin internet la venta queda en el equipo', () => {
    for (const parte of ['Hacer un descuento', 'porcentaje', 'queda en este equipo'])
      expect(texto('vender')).toContain(parte);
  });

  it('Ventas cuenta el filtro por empleado, el descuento y el precio por cantidad', () => {
    for (const parte of ['empleado', 'descuento', 'por cantidad'])
      expect(texto('ventas')).toContain(parte);
  });
});
