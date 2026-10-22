/** La explicacion de una pantalla, en el lenguaje de quien la usa (el boton ⓘ del encabezado). */
export type Ayuda = {
  titulo: string;
  introduccion: string;
  temas: { titulo: string; puntos: string[] }[];
};

export type ClaveDeAyuda = 'inicio' | 'cuenta';

export const AYUDAS: Record<ClaveDeAyuda, Ayuda> = {
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
          'Ventas, gastos, balance y ticket promedio del mes en curso.',
          'Cada uno se compara con los mismos días del mes anterior: el día 12 compara del 1 al 12 de este mes contra del 1 al 12 del anterior.',
          'Lo cancelado y lo anulado no cuentan.',
        ],
      },
      {
        titulo: 'Gráficos y más vendidos',
        puntos: [
          'El mes a mes muestra ventas, gastos y balance: arranca con 4 meses y se amplía a todo el año.',
          'Más vendidos: los 5 productos que más plata dejaron en el mes.',
          'Abajo de todo, las ventas de los últimos 7 días contra los 7 anteriores.',
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
