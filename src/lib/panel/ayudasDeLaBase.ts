/** La explicacion de una pantalla, en el lenguaje de quien la usa (el boton ⓘ del encabezado). */
export type Ayuda = {
  titulo: string;
  introduccion: string;
  temas: { titulo: string; puntos: string[] }[];
};

export type ClaveDeAyuda =
  | 'inicio'
  | 'cuenta'
  | 'proveedores'
  | 'gastos'
  | 'categorias'
  | 'recurrentes'
  | 'ventas'
  | 'canales'
  | 'caja'
  | 'control'
  | 'menu'
  | 'aumento'
  | 'reportes'
  | 'usuarios'
  | 'auditoria';

export const AYUDAS_DE_LA_BASE: Partial<Record<ClaveDeAyuda, Ayuda>> = {
  inicio: {
    titulo: 'Cómo funciona Inicio',
    introduccion:
      'Es el resumen del mes: cómo vienen las ventas y los gastos, y qué hay que atender hoy. Todos los números salen de lo que está cargado en el sistema.',
    temas: [
      {
        titulo: 'Lo que requiere acción',
        puntos: [
          'Aparece solo si hay algo pendiente: cierres con diferencia, gastos sin clasificar o personas que esperan un rol.',
          'Cada aviso te lleva a la pantalla donde se resuelve, y desaparece solo cuando lo resolvés.',
        ],
      },
      {
        titulo: 'Los números del mes',
        puntos: [
          'Ventas: todo lo vendido del 1 del mes hasta hoy.',
          'Gastos: todo lo pagado del 1 del mes hasta hoy, sea mercadería, alquiler, servicios, impuestos u otros.',
          'Balance: lo que queda, las ventas menos los gastos. Si todavía no hay gastos cargados, no se puede calcular.',
          'Ticket promedio: cuánto deja una venta en promedio, el total vendido dividido la cantidad de ventas del mes.',
          'El número chico de cada tarjeta es el cambio contra los mismos días del mes anterior: el día 12 compara del 1 al 12 de este mes contra del 1 al 12 del anterior.',
          'Lo cancelado y lo anulado no cuentan.',
        ],
      },
      {
        titulo: 'Gráficos y más vendidos',
        puntos: [
          'El mes a mes muestra ventas, gastos y balance: arranca con 4 meses y se amplía a todo el año.',
          'Esta semana vs la anterior es un acumulado: suma las ventas día a día, desde hoy y los 6 días anteriores, y las compara con los 7 días de antes. El título dice si vas arriba o abajo.',
          'Los gastos por categoría van en una torta: las 5 categorías que más pesan, y el resto junto en Otras.',
          'Más vendidos: los 5 productos que más plata dejaron en el mes, con medallas de oro, plata y bronce para los tres primeros.',
        ],
      },
    ],
  },
  proveedores: {
    titulo: 'Cómo funciona Proveedores',
    introduccion: 'Acá tenés a quién le comprás, cómo contactarlo y cuánto le pagaste en el mes.',
    temas: [
      {
        titulo: 'La lista',
        puntos: [
          'Escribí parte del nombre y apretá Buscar.',
          'Pagado este mes suma los gastos cargados a cada proveedor en el mes, sin los anulados.',
          'El botón verde abre el chat de WhatsApp. Si el proveedor no tiene teléfono, no aparece.',
        ],
      },
      {
        titulo: 'Desactivados',
        puntos: [
          'Un proveedor no se borra: se desactiva y conserva sus gastos.',
          'Con Ver desactivados los ves, y desde su ficha lo podés reactivar.',
        ],
      },
    ],
  },
  gastos: {
    titulo: 'Cómo funciona Gastos',
    introduccion:
      'Todo lo que sale, para que el balance del mes sea real: lo que se pagó, por categoría y proveedor.',
    temas: [
      {
        titulo: 'La lista',
        puntos: [
          'Va del más nuevo al más viejo. Filtrá por fechas, categoría y proveedor.',
          'El total de arriba no cuenta lo anulado.',
          'Los gastos sin clasificar vienen de un cierre de caja y esperan su categoría.',
        ],
      },
      {
        titulo: 'Cargar, editar y anular',
        puntos: [
          'Un gasto no se borra: se anula con un motivo, deja de contar y queda en el historial.',
          'La compra de mercadería se carga como gasto, con su proveedor.',
          'Los recurrentes se cargan solos el día que tocan, y quedan marcados como automáticos.',
        ],
      },
    ],
  },
  categorias: {
    titulo: 'Cómo funciona Categorías',
    introduccion: 'Las categorías ordenan los gastos. Podés sumar, renombrar y desactivar.',
    temas: [
      {
        titulo: 'Qué tenés que saber',
        puntos: [
          'Pedir proveedor obliga a elegir uno al cargar un gasto de esa categoría.',
          'Una categoría desactivada no se ofrece más, pero conserva sus gastos.',
          'Sin clasificar la usa el sistema para los gastos de un cierre: no se elige ni se desactiva.',
        ],
      },
    ],
  },
  recurrentes: {
    titulo: 'Cómo funciona Recurrentes',
    introduccion: 'Un recurrente es una plantilla que carga un gasto solo, el día que toca.',
    temas: [
      {
        titulo: 'Cómo se cargan',
        puntos: [
          'Elegí la frecuencia (mensual, bimestral o anual) y el primer vencimiento.',
          'El gasto nace ya contado en el balance del mes y queda marcado como automático.',
          'Si ese mes el monto fue otro, editá el gasto. Si no se pagó, anulalo.',
        ],
      },
    ],
  },
  cuenta: {
    titulo: 'Cómo funciona Mi cuenta',
    introduccion: 'Tus datos y tu contraseña.',
    temas: [
      {
        titulo: 'Tus datos',
        puntos: [
          'Tu nombre, tu email y tu rol se ven acá pero no se cambian: los corrige un administrador.',
        ],
      },
      {
        titulo: 'Cambiar la contraseña',
        puntos: [
          'Escribí la actual y después la nueva, de 6 caracteres como mínimo.',
          'Con el ojo ves lo que escribiste antes de guardar.',
        ],
      },
    ],
  },
};
