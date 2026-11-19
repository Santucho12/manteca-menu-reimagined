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
  | 'materia-prima'
  | 'costos'
  | 'compras'
  | 'gastos'
  | 'fijos'
  | 'vender'
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
          'Aparece solo si hay algo pendiente: cierres con diferencia, ayer sin cierre de caja, personas que esperan un rol, gastos sin clasificar, y pagos vencidos o que vencen en la semana, los mismos de Próximos pagos en Gastos.',
          'Cada aviso te lleva a la pantalla donde se resuelve, y desaparece solo cuando lo resolvés.',
          'El aviso de ayer sin cierre sale aunque no haya ventas cargadas. Si ese día el local no abrió, marcalo con No abrió en el control de cierres y el aviso se va.',
        ],
      },
      {
        titulo: 'Los números del mes',
        puntos: [
          'El bloque oscuro muestra lo vendido en el mes, con los gastos y el balance debajo. La barra de avance dice qué parte de las ventas queda como balance.',
          'Ventas: todo lo vendido del 1 del mes hasta hoy.',
          'Gastos: todo lo pagado del 1 del mes hasta hoy, sea mercadería, alquiler, servicios, impuestos u otros.',
          'Balance: lo que queda, las ventas menos los gastos. Si todavía no hay gastos cargados, no se puede calcular.',
          'Ticket promedio: cuánto deja una venta en promedio, el total vendido dividido la cantidad de ventas del mes.',
          'El número chico de cada tarjeta es el cambio contra los mismos días del mes anterior: el día 12 compara del 1 al 12 de este mes contra del 1 al 12 del anterior.',
          'Lo anulado no cuenta.',
        ],
      },
      {
        titulo: 'Gráficos y más vendidos',
        puntos: [
          'El mes a mes muestra ventas, gastos y balance: arranca con 4 meses y se amplía a todo el año.',
          'Esta semana vs la anterior es un acumulado: suma las ventas día a día, desde hoy y los 6 días anteriores, y las compara con los 7 días de antes. El título dice en pesos cuánto vas arriba o abajo.',
          'Los gastos por categoría van en una torta: las 5 categorías que más pesan, y el resto junto en Otras.',
          'Más vendidos: los 5 productos que más plata dejaron en el mes, con medallas de oro, plata y bronce para los tres primeros.',
        ],
      },
      {
        titulo: 'Los botones de cada tarjeta',
        puntos: [
          'Ver reportes, Ver gastos y Ver todo el año abren el detalle de cada gráfico.',
          'Ver costos abre Costos, con lo que cuesta y deja cada producto.',
        ],
      },
    ],
  },
  proveedores: {
    titulo: 'Cómo funciona Proveedores',
    introduccion:
      'Acá tenés a quién le comprás, cómo contactarlo y cuánto le pagaste. Lo pagado sale de los gastos que le cargaste a cada uno.',
    temas: [
      {
        titulo: 'La lista',
        puntos: [
          'Muestra el nombre, qué le comprás, el teléfono y lo pagado en el mes. Va de a 25 por página.',
          'En Buscar por nombre escribí parte del nombre y apretá Buscar.',
          'Pagado este mes suma los gastos cargados a ese proveedor del 1 del mes hasta hoy, sin los anulados.',
          'Por pagar suma lo anotado a ese proveedor que todavía no se pagó. Desactivarlo no lo cancela: sigue en Próximos pagos.',
          'El botón verde abre el chat de WhatsApp con el proveedor: no arma ningún pedido. Si no tiene teléfono, no aparece.',
        ],
      },
      {
        titulo: 'La ficha',
        puntos: [
          'Tiene sus datos de contacto, el total pagado en el mes y del año, y los gastos del año, del más nuevo al más viejo.',
          'Los totales no cuentan los gastos anulados. Un proveedor sin gastos muestra los totales en cero.',
          'Cargado por dice quién lo dio de alta y cuándo.',
        ],
      },
      {
        titulo: 'Cargar y editar',
        puntos: [
          'Solo el nombre es obligatorio. El alias, el CBU o el CUIT van en Observaciones.',
          'El teléfono escribilo con la característica (por ejemplo 11 2345 6789): se guarda solo con el 549 adelante, que es lo que pide WhatsApp. Con el 15 y sin característica no se acepta.',
          'Si ya hay uno con el mismo nombre, el sistema te avisa y te deja seguir.',
        ],
      },
      {
        titulo: 'Desactivados',
        puntos: [
          'Un proveedor no se borra: se desactiva y conserva sus gastos. Desactivado, no se ofrece al cargar un gasto nuevo.',
          'Si tiene gastos fijos activos, te avisa: sus pagos siguen apareciendo por pagar hasta que los pauses aparte, en Gastos.',
          'Con Ver desactivados los ves, y desde su ficha lo podés reactivar.',
        ],
      },
    ],
  },
  gastos: {
    titulo: 'Cómo funciona Gastos',
    introduccion:
      'Todo lo que sale, para que el balance del mes sea real: lo que pagaste y lo que viene, en una sola pantalla.',
    temas: [
      {
        titulo: 'Pagados',
        puntos: [
          'Los gastos del mes, del más nuevo al más viejo, de a 25 por página. Cambiá de mes con las flechas: no se pasa a un mes que no llegó.',
          'Filtrá por Fijos, De caja y categoría: la lista se actualiza sola. El total suma lo filtrado, sin lo anulado.',
          'Fijo marca el pago de un gasto fijo, con cada cuánto se repite. De caja marca uno que vino de un cierre.',
        ],
      },
      {
        titulo: 'Próximos pagos',
        puntos: [
          'Lo que falta pagar: lo que anotaste por pagar y el próximo pago de cada gasto fijo, del más cercano al más lejano. Lo vencido queda arriba, en rosa. No cuenta en el balance hasta que lo pagás.',
          'Pagado abre una ventana con la fecha de hoy, el monto y el medio ya completos: corregí lo que haga falta y tocá Anotar el pago. Pasa a Pagados con la fecha en que lo pagaste. Un fijo se puede pagar antes de que venza.',
          'No se paga lo saca de la lista, con un motivo. Si anulás un pago desde Pagados, vuelve a Próximos pagos.',
          'Falta pagar este mes suma lo que vence hasta fin de mes, con lo vencido. Los pausados quedan abajo.',
        ],
      },
      {
        titulo: 'Para clasificar',
        puntos: [
          'Los gastos que anota Caja en su cierre llegan sin categoría, de cualquier mes. Elegile una ahí mismo y tocá Listo.',
          'Cuentan en el balance desde que llegan. A un gasto De caja no se le cambia el monto, la fecha ni el medio de pago, porque cambiaría la caja: se anula su cierre.',
        ],
      },
      {
        titulo: 'Cargar un gasto',
        puntos: [
          'En ¿Se repite? elegí todos los meses, cada dos meses o una vez por año, y es un gasto fijo: cada pago queda por pagar el día que vence, y la frase de abajo dice qué va a pasar.',
          '¿Ya lo pagaste? Con Sí, la fecha es la del pago, viene con hoy (tocá Ayer o elegí otra) y no puede ser futura: define a qué mes cuenta. Con Todavía no, queda por pagar: la fecha es cuándo vence y el medio lo elegís al pagarlo.',
          'El proveedor aparece solo en las categorías que lo piden, y ahí es obligatorio. El monto va con coma para los centavos: 12.345,50.',
          'Efectivo de la caja no se ofrece: lo que se paga con la caja se anota en el cierre del día. Efectivo (fuera de la caja) es plata que no salió de la caja.',
          'Si ya hay un gasto del mismo proveedor, monto y día, te avisa por si lo cargaste dos veces. Si son dos compras distintas, tocá Cargar igual.',
        ],
      },
      {
        titulo: 'Categorías',
        puntos: [
          'El botón Categorías abre la lista: sumá, renombrá, desactivá o reactivá. Pide proveedor hace que esa categoría pida elegir uno.',
          'Sin clasificar la usa el sistema para los gastos de la caja: no se elige a mano ni se desactiva.',
        ],
      },
      {
        titulo: 'Corregir',
        puntos: [
          'Abrí un gasto para corregirlo o anularlo con un motivo: deja de contar en los totales y queda en la lista. En la Auditoría queda el valor anterior y el nuevo.',
        ],
      },
    ],
  },
  fijos: {
    titulo: 'Cómo funciona un gasto fijo',
    introduccion:
      'Un gasto fijo deja cada pago por pagar el día que toca: el alquiler, un servicio, un sueldo.',
    temas: [
      {
        titulo: 'Cómo vence',
        puntos: [
          'El día que toca, el pago aparece por pagar en Próximos pagos, a las 3 de la mañana y también al abrir Gastos. Cuenta en el balance cuando lo marcás Pagado. Si un día el proceso no corrió, aparece lo atrasado con la fecha que correspondía.',
          'Si el día no existe en ese mes (el 31 en abril), vence el último día del mes. Nunca aparece dos veces el mismo pago.',
          'Si lo pagás antes de que venza, tocá Marcar como pago en su próximo pago.',
        ],
      },
      {
        titulo: 'Corregir',
        puntos: [
          'Cambiar el monto vale para los próximos: lo que ya venció queda con el suyo, y al pagarlo lo corregís en la ventana.',
          'Si cambiás el próximo pago o cada cuánto, vale desde el próximo pago: no vuelven meses pasados.',
          'Pausado, deja de vencer; lo que ya venció sigue por pagar. Al reactivarlo, vence desde ese día: lo que tocaba mientras estuvo pausado no aparece.',
          'Pagos muestra los últimos seis que pagaste.',
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
          'El email es tu nombre de usuario para entrar.',
        ],
      },
      {
        titulo: 'Cambiar la contraseña',
        puntos: [
          'Escribí la actual y después la nueva, de 6 caracteres como mínimo.',
          'Con el ojo ves lo que escribiste antes de guardar.',
          'Si te olvidaste la contraseña, pedile a un administrador que te dé una temporal: la cambiás apenas entrás.',
        ],
      },
      {
        titulo: 'La sesión',
        puntos: [
          'La sesión no vence: queda abierta hasta que tocás Salir. En una computadora compartida, salí al terminar.',
        ],
      },
    ],
  },
};
