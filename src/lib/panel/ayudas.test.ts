import { describe, expect, it } from 'vitest';
import { AYUDAS } from './ayudas';

describe('ayudas', () => {
  it('cada ayuda tiene titulo, introduccion y al menos un tema con puntos', () => {
    for (const ayuda of Object.values(AYUDAS)) {
      expect(ayuda.titulo).toMatch(/^Cómo funciona /);
      expect(ayuda.introduccion.length).toBeGreaterThan(0);
      expect(ayuda.temas.length).toBeGreaterThan(0);
      for (const tema of ayuda.temas) expect(tema.puntos.length).toBeGreaterThan(0);
    }
  });

  it('Inicio y Mi cuenta tienen la suya', () => {
    expect(AYUDAS.inicio.titulo).toBe('Cómo funciona Inicio');
    expect(AYUDAS.cuenta.titulo).toBe('Cómo funciona Mi cuenta');
  });

  it('la ayuda de Inicio cuenta todo lo que se ve en la pantalla', () => {
    const texto = AYUDAS.inicio.temas.flatMap((t) => [t.titulo, ...t.puntos]).join(' ');
    for (const parte of [
      'ayer sin cierre',
      'pagos que vencen',
      'barra de avance',
      'Ventas:',
      'Gastos:',
      'Balance:',
      'Ticket promedio:',
      'las ventas menos los gastos',
      'dividido',
      'hoy y los 6 días anteriores',
      'acumulado',
      'torta',
      'medallas',
      'Otras',
    ]) {
      expect(texto).toContain(parte);
    }
  });

  it.each([
    [
      'proveedores',
      [
        'Buscar por nombre',
        'Pagado este mes',
        'WhatsApp',
        '549',
        'mes y del año',
        'mismo nombre',
        'gastos fijos',
        'Observaciones',
      ],
    ],
    [
      'gastos',
      [
        'Pagados',
        'flechas',
        'Próximos pagos',
        'Falta pagar este mes',
        'Para clasificar',
        'Listo',
        'Fijo',
        'De caja',
        'Ayer',
        'Se repite',
        'fecha futura',
        'Pide proveedor',
        'Sin clasificar',
        'motivo',
        'Efectivo de la caja',
        'monto, la fecha ni el medio',
        '12.345,50',
      ],
    ],
    [
      'fijos',
      [
        'se carga solo',
        'último día del mes',
        'próximos',
        'próximo pago',
        'Pausado',
        'atrasado',
        'seis',
      ],
    ],
    [
      'ventas',
      [
        'todavía no está conectado',
        'cancelado',
        'Canales',
        'precio del menú',
        'efectivo',
        'motivo',
        'futuro',
      ],
    ],
    ['canales', ['Cheaf', 'Encargo', 'Venta a comercios', 'desactivado']],
    [
      'caja',
      [
        'Fondo inicial',
        'Efectivo contado',
        'a ciegas',
        'Retiros',
        'Sin clasificar',
        'un cierre por día',
        'día anterior',
        'Esperando ventas',
        'Mis cierres',
      ],
    ],
    [
      'control',
      [
        'Esperando ventas',
        'Cierra',
        'Con diferencia',
        'Revisado',
        'Fondo distinto',
        'tolerancia',
        'sin cierre',
        'anula',
        'gastos',
      ],
    ],
    [
      'menu',
      [
        'Cómo se vende',
        'Mismo precio para todos los productos',
        'Más vendido',
        'Artesanal',
        'Nuevo',
        'foto',
        'Ocultar',
        'Desactivar',
        'Fudo',
        'al guardar',
      ],
    ],
    [
      'aumento',
      [
        'negativo',
        '$100',
        'Ver cambios',
        'Aplicar aumento',
        'ocultos',
        'precio para todos',
        'deshacer',
      ],
    ],
    [
      'reportes',
      [
        'Este mes',
        'Mes pasado',
        'Últimos 7 días',
        'mismos días del mes anterior',
        'mismo largo',
        'Comparar',
        'Sin vincular',
        'Balance',
        'por mes',
        'Inicio',
      ],
    ],
    [
      'usuarios',
      [
        'Invitado',
        'Caja',
        'Admin',
        'Rechazar',
        'Desactivar',
        'Reactivar',
        'Resetear',
        'una sola vez',
        'al menos un administrador',
        'Buscar por nombre o email',
        'Mi cuenta',
      ],
    ],
    [
      'auditoria',
      [
        'últimos 7 días',
        'El sistema',
        'anterior',
        'nuevo',
        'no se puede editar ni borrar',
        'contraseña',
        'Cargado por',
      ],
    ],
    ['cuenta', ['6 caracteres', 'administrador', 'Salir', 'temporal']],
  ] as const)('la ayuda de %s cuenta lo que hace su pantalla', (clave, partes) => {
    const ayuda = AYUDAS[clave];
    const texto = [ayuda.introduccion, ...ayuda.temas.flatMap((t) => [t.titulo, ...t.puntos])].join(
      ' ',
    );
    for (const parte of partes) expect(texto).toContain(parte);
  });

  it('Reportes no ofrece atajos que la pantalla no tiene', () => {
    const texto = AYUDAS.reportes.temas.flatMap((t) => t.puntos).join(' ');
    expect(texto).not.toContain('esta semana');
  });

  it('cada pantalla del panel tiene su ayuda', () => {
    const claves = [
      'inicio',
      'cuenta',
      'proveedores',
      'gastos',
      'fijos',
      'ventas',
      'canales',
      'caja',
      'control',
      'menu',
      'aumento',
      'reportes',
      'usuarios',
      'auditoria',
    ];
    expect(Object.keys(AYUDAS).sort()).toEqual([...claves].sort());
  });
});
