import { describe, expect, it } from 'vitest';
import {
  cambiosDe,
  datoDe,
  enlaceDe,
  fechaYHora,
  nombreDeAccion,
  nombreDelDato,
  personaDe,
  resumenDe,
  type RegistroDeAuditoria,
} from './textos';

const CATEGORIA = '6f1c1e0a-2b1d-4c1e-9a6b-1f2e3d4c5b6a';
const PERSONA = '7a2d2f1b-3c2e-4d2f-8b7c-2a3b4c5d6e7f';
const nombres = new Map([
  [CATEGORIA, 'Alquiler'],
  [PERSONA, 'Prueba Admin'],
]);

function registro(cambios: Partial<RegistroDeAuditoria>): RegistroDeAuditoria {
  return {
    id: 1,
    fecha: '2026-10-09T15:30:00Z',
    tabla: 'gastos',
    registro_id: 'gasto-1',
    accion: 'cambio',
    usuario_id: PERSONA,
    antes: null,
    despues: null,
    motivo: null,
    ...cambios,
  };
}

describe('datoDe', () => {
  it('traduce la tabla a su modulo y su dato', () => {
    expect(datoDe('gastos')).toEqual({ modulo: 'Gastos', dato: 'Gasto' });
    expect(datoDe('retiros_de_caja')).toEqual({ modulo: 'Caja', dato: 'Retiro' });
    expect(datoDe('perfiles')).toEqual({ modulo: 'Usuarios', dato: 'Usuario' });
    expect(datoDe('ventas')).toEqual({ modulo: 'Ventas', dato: 'Venta' });
    expect(datoDe('renglones_de_venta')).toEqual({ modulo: 'Ventas', dato: 'Producto vendido' });
    expect(datoDe('gastos_por_pagar')).toEqual({ modulo: 'Gastos', dato: 'Por pagar' });
  });

  it('una tabla que no conoce se muestra igual, con su nombre', () => {
    expect(datoDe('tabla_nueva')).toEqual({ modulo: 'Otros', dato: 'tabla_nueva' });
  });
});

describe('cambiosDe', () => {
  it('un cambio muestra cada campo con su nombre y sus valores legibles', () => {
    const cambio = registro({
      antes: { monto_centavos: 1234550, categoria_id: null, anulado: false },
      despues: { monto_centavos: 9900, categoria_id: CATEGORIA, anulado: true },
    });
    expect(cambiosDe(cambio, nombres)).toEqual([
      { campo: 'Monto', antes: '$12.345,50', despues: '$99,00' },
      { campo: 'Categoría', antes: '—', despues: 'Alquiler' },
      { campo: 'Anulado', antes: 'No', despues: 'Sí' },
    ]);
  });

  it('un alta muestra lo cargado, sin las columnas internas', () => {
    const alta = registro({
      accion: 'alta',
      despues: {
        id: 'gasto-1',
        local_id: 'local',
        fecha: '2026-10-05',
        medio_de_pago: 'efectivo_caja',
        creado_por: PERSONA,
        fecha_creacion: '2026-10-05T10:00:00Z',
      },
    });
    expect(cambiosDe(alta, nombres)).toEqual([
      { campo: 'Fecha', antes: null, despues: '05/10/2026' },
      { campo: 'Medio de pago', antes: null, despues: 'Efectivo de la caja' },
      { campo: 'Cargado por', antes: null, despues: 'Prueba Admin' },
    ]);
  });

  it('un codigo que ya no existe no rompe, y una columna nueva se muestra tal cual', () => {
    // Un cambio siempre trae el antes: aca, vacio.
    const raro = registro({
      antes: {},
      despues: { proveedor_id: '00000000-0000-4000-8000-000000000000', columna_nueva: 'x' },
    });
    expect(cambiosDe(raro, nombres)).toEqual([
      { campo: 'Proveedor', antes: '—', despues: 'Dato no disponible' },
      { campo: 'columna_nueva', antes: '—', despues: 'x' },
    ]);
  });
});

describe('enlaceDe', () => {
  it('lleva al dato, o a la pantalla que lo contiene', () => {
    expect(enlaceDe(registro({ registro_id: 'g1' }))).toBe('/admin/gastos/g1');
    expect(enlaceDe(registro({ tabla: 'gastos_recurrentes', registro_id: 'f1' }))).toBe(
      '/admin/gastos/fijos/f1',
    );
    // Las categorías se editan en una ventana dentro de Gastos.
    expect(enlaceDe(registro({ tabla: 'categorias_de_gasto' }))).toBe('/admin/gastos');
    // Lo por pagar se ve y se paga en Próximos pagos.
    expect(enlaceDe(registro({ tabla: 'gastos_por_pagar' }))).toBe('/admin/gastos');
    expect(enlaceDe(registro({ tabla: 'retiros_de_caja', despues: { cierre_id: 'c1' } }))).toBe(
      '/admin/caja/cierres/c1',
    );
    expect(enlaceDe(registro({ tabla: 'configuracion_de_caja' }))).toBe('/admin/caja/control');
    expect(enlaceDe(registro({ tabla: 'precios', despues: { producto_id: 'p1' } }))).toBe(
      '/admin/menu/productos/p1',
    );
  });

  it('sin pantalla que lo contenga, no enlaza', () => {
    expect(enlaceDe(registro({ tabla: 'locales' }))).toBeNull();
    expect(enlaceDe(registro({ tabla: 'tabla_nueva' }))).toBeNull();
  });
});

describe('nombres y fechas', () => {
  it('de las acciones, incluidas las de contraseña', () => {
    expect(nombreDeAccion('anulacion')).toBe('Anulación');
    expect(nombreDeAccion('reseteo_de_contrasena')).toBe('Reseteo de contraseña');
    expect(nombreDeAccion('otra')).toBe('otra');
  });

  it('la fecha y hora en Argentina', () => {
    expect(fechaYHora('2026-10-09T15:30:00Z')).toBe('09/10/2026 12:30');
    expect(fechaYHora('2026-10-09T02:05:00Z')).toBe('08/10/2026 23:05');
  });
});

describe('personaDe y resumenDe', () => {
  it('la persona, el sistema o un dato que ya no esta', () => {
    expect(personaDe(PERSONA, nombres)).toBe('Prueba Admin');
    expect(personaDe(null, nombres)).toBe('El sistema');
    expect(personaDe('00000000-0000-4000-8000-000000000000', nombres)).toBe('Dato no disponible');
  });

  it('el resumen de un cambio son los campos que cambiaron; el de un alta, nada', () => {
    const cambio = registro({
      antes: { monto_centavos: 1, anulado: false },
      despues: { monto_centavos: 2, anulado: true },
    });
    expect(resumenDe(cambio)).toBe('Monto, Anulado');
    expect(resumenDe(registro({ accion: 'alta', despues: { monto_centavos: 2 } }))).toBe('');
  });
});

describe('nombreDelDato y el contexto de un cambio', () => {
  const PROVEEDOR = '8b3e3a2c-4d3f-4e3a-9c8d-3b4c5d6e7f80';
  const PRODUCTO = '9c4f4b3d-5e4a-4f4b-8d9e-4c5d6e7f8091';
  const PRESENTACION = 'ad5a5c4e-6f5b-4a5c-9e0f-5d6e7f8091a2';
  const conNombres = new Map([
    [PROVEEDOR, 'La Serenísima'],
    [PRODUCTO, 'Medialuna'],
    [PRESENTACION, 'Docena'],
    [PERSONA, 'Prueba Admin'],
  ]);

  it('dice cual dato fue: el proveedor, la persona, el producto del precio', () => {
    expect(
      nombreDelDato(registro({ tabla: 'proveedores', registro_id: PROVEEDOR }), conNombres),
    ).toBe('La Serenísima');
    expect(nombreDelDato(registro({ tabla: 'perfiles', registro_id: PERSONA }), conNombres)).toBe(
      'Prueba Admin',
    );
    const precio = registro({
      tabla: 'precios',
      despues: { monto_centavos: 2 },
      contexto: { producto_id: PRODUCTO, presentacion_id: PRESENTACION },
    });
    expect(nombreDelDato(precio, conNombres)).toBe('Medialuna · Docena');
    expect(nombreDelDato(registro({ tabla: 'locales' }), conNombres)).toBeNull();
  });

  it('un cambio de precio sin su producto enlaza igual, con el contexto', () => {
    const precio = registro({
      tabla: 'precios',
      despues: { monto_centavos: 2 },
      contexto: { producto_id: PRODUCTO },
    });
    expect(enlaceDe(precio)).toBe(`/admin/menu/productos/${PRODUCTO}`);
  });
});
