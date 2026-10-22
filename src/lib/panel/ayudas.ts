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
  ventas: {
    titulo: 'Cómo funciona Ventas',
    introduccion: 'Las ventas del período, con su total: las de Fudo y las que cargás a mano.',
    temas: [
      {
        titulo: 'La lista',
        puntos: [
          'Arranca en el mes de hoy. Filtrá por fechas, origen, medio de pago y estado.',
          'El total de arriba no cuenta lo cancelado ni lo anulado.',
          'Las ventas de Fudo entran solas: se corrigen en Fudo, no acá.',
        ],
      },
      {
        titulo: 'Cargar y anular',
        puntos: [
          'Cargá a mano lo que no pasa por Fudo: Cheaf, encargos, ventas a comercios.',
          'Una venta a mano no se edita ni se borra: se anula con un motivo y queda en el historial.',
        ],
      },
    ],
  },
  canales: {
    titulo: 'Cómo funciona Canales',
    introduccion: 'Por dónde entran las ventas que no pasan por Fudo.',
    temas: [
      {
        titulo: 'Qué tenés que saber',
        puntos: [
          'Sumá, renombrá y desactivá canales. No se repite un nombre.',
          'Un canal desactivado no se ofrece al cargar una venta, pero conserva las que ya tiene.',
        ],
      },
    ],
  },
  caja: {
    titulo: 'Cómo funciona el cierre de caja',
    introduccion: 'Al terminar el turno, contá lo que hay en la caja y cargalo acá.',
    temas: [
      {
        titulo: 'Cómo se carga',
        puntos: [
          'Cargás lo que contaste: el efectivo y lo cobrado por cada medio. El sistema no te muestra lo esperado, para que el conteo sea a ciegas.',
          'Sumá los retiros (con quién retiró) y los gastos que se pagaron con la plata de la caja.',
          'Hay un cierre por día. Si te equivocaste, pedile al admin que lo anule.',
        ],
      },
      {
        titulo: 'Después de guardar',
        puntos: [
          'El resultado aparece cuando entran las ventas del día.',
          'En Mis cierres ves los que cargaste vos.',
        ],
      },
    ],
  },
  control: {
    titulo: 'Cómo funciona el control de cierres',
    introduccion: 'Acá revisás los cierres de cada día: quién los cargó y si cierran.',
    temas: [
      {
        titulo: 'La lista',
        puntos: [
          'Filtrá por fechas, persona y estado. Los días sin cierre aparecen marcados y se pueden cargar.',
          'Fondo distinto avisa que la caja arrancó con otro monto del que quedó el día anterior.',
          'La tolerancia es la diferencia por medio de pago que se acepta como "cierra".',
        ],
      },
      {
        titulo: 'Revisar y anular',
        puntos: [
          'Marcá como revisado con un comentario cuando lo controlaste.',
          'Un cierre no se borra: se anula con un motivo y sus gastos quedan anulados.',
        ],
      },
    ],
  },
  menu: {
    titulo: 'Cómo funciona el Menú',
    introduccion: 'Lo que ve el cliente en la carta: categorías, productos y precios.',
    temas: [
      {
        titulo: 'Ordenar y mostrar',
        puntos: [
          'Las flechas suben y bajan categorías y productos.',
          'Ocultar saca algo de la carta sin borrarlo. Un producto sin precio no se puede mostrar.',
          'Una categoría nueva se crea oculta: mostrala cuando tenga productos.',
        ],
      },
      {
        titulo: 'Precios y desactivados',
        puntos: [
          'Cambiar un precio acá no lo cambia en Fudo: cambialo también allá.',
          'Desactivar no borra: en Ver desactivados lo reactivás y vuelve oculto, para que lo revises.',
          'Una categoría con productos no se desactiva hasta mover o desactivar sus productos.',
        ],
      },
    ],
  },
  aumento: {
    titulo: 'Cómo funciona el Aumento de precios',
    introduccion: 'Sube o baja todos los precios de un alcance con un porcentaje.',
    temas: [
      {
        titulo: 'Cómo se usa',
        puntos: [
          'Elegí el alcance, el porcentaje y el redondeo, y tocá Ver cambios: no se cambia nada todavía.',
          'Revisá la tabla (también entran los productos ocultos) y recién ahí tocá Aplicar aumento.',
          'No hay deshacer: un error se corrige con otro aumento o editando el precio.',
        ],
      },
    ],
  },
  reportes: {
    titulo: 'Cómo funcionan los Reportes',
    introduccion: 'Para entender por qué un mes fue mejor o peor, con los números que ya cargaste.',
    temas: [
      {
        titulo: 'El período',
        puntos: [
          'Elegí las fechas o usá un atajo (esta semana, este mes, mes pasado).',
          'Cada número se compara con el período de antes, o con el que elijas en Comparar.',
          'Lo anulado y lo cancelado no cuenta.',
        ],
      },
      {
        titulo: 'Cada reporte',
        puntos: [
          'Ventas y gastos se ven por período, por producto o categoría.',
          'Caja muestra los cierres de cada día y marca los días sin cierre.',
          'Resultado es ventas menos gastos; sin gastos cargados no se calcula.',
        ],
      },
    ],
  },
  usuarios: {
    titulo: 'Cómo funciona Usuarios',
    introduccion: 'Quién entra al sistema y qué puede hacer. Solo un administrador asigna roles.',
    temas: [
      {
        titulo: 'Las cuentas',
        puntos: [
          'Quien se registra queda esperando un rol. Con Dar rol de Caja entra a cargar su cierre.',
          'Rechazar corta el acceso y no deja volver a registrarse con ese email.',
          'Desactivar saca el acceso en el momento; Reactivar lo devuelve.',
        ],
      },
      {
        titulo: 'Contraseña y datos',
        puntos: [
          'Resetear muestra una contraseña temporal una sola vez: pasásela a la persona, que tiene que cambiarla al entrar.',
          'Corregir datos cambia el nombre y el email. Sobre tu propia cuenta solo podés corregir los datos.',
        ],
      },
    ],
  },
  auditoria: {
    titulo: 'Cómo funciona la Auditoría',
    introduccion: 'Todo lo que se cargó o se cambió en el sistema, quién lo hizo y cuándo.',
    temas: [
      {
        titulo: 'Cómo se lee',
        puntos: [
          'Filtrá por fechas, persona, módulo y tipo de acción.',
          'Ver el detalle muestra cada campo con su valor anterior y el nuevo, con nombres y pesos.',
          'Lo que hace el sistema solo (como cargar un recurrente) figura como El sistema.',
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
