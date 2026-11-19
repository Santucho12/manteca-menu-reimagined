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
      'pagos vencidos',
      'No abrió',
      'en pesos',
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
        'Por pagar',
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
        'Ya lo pagaste',
        'no puede ser futura',
        'Todavía no',
        'Pagado',
        'Anotar el pago',
        'No se paga',
        'vuelve a Próximos pagos',
        'Pide proveedor',
        'Sin clasificar',
        'motivo',
        'Efectivo de la caja',
        'monto, la fecha ni el medio',
        '12.345,50',
        'Cargar igual',
        'fuera de la caja',
      ],
    ],
    [
      'fijos',
      [
        'por pagar',
        'Pagado',
        'antes de que venza',
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
        'Mostrador',
        'Vender',
        'tipo de venta',
        'Tipos de venta',
        'precio del menú',
        'Se cobró en la caja del local',
        'motivo',
        'futuro',
        'lo que no se cobró en el mostrador',
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
        'un cierre por turno',
        'día anterior',
        'Avisale a un administrador',
        'Mis cierres',
      ],
    ],
    [
      'control',
      [
        'Pendiente',
        'Cierra',
        'Con diferencia',
        'Fondo distinto',
        'tolerancia',
        'pendientes',
        'anula',
        'gastos',
        'No abrió',
        'Deshacer',
        'cada medio por separado',
        'Editar',
      ],
    ],
    [
      'menu',
      [
        'Cómo se vende',
        'Mismo precio para todos los productos',
        'pisarlo',
        'Más vendido',
        'Artesanal',
        'Nuevo',
        'foto',
        'Ocultar',
        'Desactivar',
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
        'Ventas por tipo de venta',
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
        'Desactivar',
        'Reactivar',
        'Resetear',
        'una sola vez',
        'al menos un administrador',
        'Buscar por nombre o email',
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

  it('Inicio ya no ata el aviso de ayer a las ventas, y Caja no edita', () => {
    const inicio = AYUDAS.inicio.temas.flatMap((t) => t.puntos).join(' ');
    expect(inicio).not.toContain('no hubo ventas');
    const caja = AYUDAS.caja.temas.flatMap((t) => t.puntos).join(' ');
    expect(caja).not.toContain('tocá Editar');
  });

  it('la ayuda de Vender cuenta cómo se arma el ticket y cómo se cobra', () => {
    const ayuda = AYUDAS.vender;
    const texto = [ayuda.introduccion, ...ayuda.temas.flatMap((t) => t.puntos)].join(' ');
    for (const parte of ['Tocá', 'dos medios', 'vuelto', 'precio del menú', 'a ciegas', 'admin']) {
      expect(texto).toContain(parte);
    }
  });

  it('Vender, Caja y el control cuentan los turnos y la traba del cierre (pedido 98)', () => {
    const texto = (clave: 'vender' | 'caja' | 'control') =>
      AYUDAS[clave].temas.flatMap((t) => t.puntos).join(' ');
    expect(texto('vender')).toContain('Postergar 10 min');
    expect(texto('caja')).toContain('un cierre por turno');
    expect(texto('caja')).not.toContain('un cierre por día');
    expect(texto('control')).toContain('Horas de cierre');
  });

  it('ninguna ayuda habla de Fudo: Manteca lo dejó (pedido 89)', () => {
    for (const ayuda of Object.values(AYUDAS)) {
      const texto = [ayuda.introduccion, ...ayuda.temas.flatMap((t) => [t.titulo, ...t.puntos])];
      expect(texto.join(' ')).not.toContain('Fudo');
    }
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
      'vender',
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
