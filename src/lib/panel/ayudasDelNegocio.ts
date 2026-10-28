import type { Ayuda, ClaveDeAyuda } from './ayudasDeLaBase';

/** Las ayudas de los modulos del negocio: ventas, caja y menu. */
export const AYUDAS_DEL_NEGOCIO: Partial<Record<ClaveDeAyuda, Ayuda>> = {
  ventas: {
    titulo: 'Cómo funciona Ventas',
    introduccion:
      'Todo lo que se vendió, con su total: las ventas de Fudo y las que cargás a mano. Fudo todavía no está conectado: sus ventas entran subiendo el reporte de ventas de Fudo (Excel), que trae totales por día y medio de pago, sin productos.',
    temas: [
      {
        titulo: 'La lista',
        puntos: [
          'Arranca en el mes de hoy, de a 25 por página. Filtrá por fechas, origen (Fudo o a mano), medio de pago y estado.',
          'El total de arriba suma lo cobrado, sin lo cancelado ni lo anulado. Lo cancelado se muestra aparte, con cuánto fue.',
          'Con un medio de pago elegido, el total suma solo lo que se pagó con ese medio.',
          'Abrí una venta para ver sus productos, sus pagos y quién la cargó.',
        ],
      },
      {
        titulo: 'Las de Fudo',
        puntos: [
          'Cuando Fudo esté conectado, sus ventas van a entrar solas y no se van a duplicar aunque se traigan dos veces.',
          'Una venta de Fudo no se edita ni se anula acá: se corrige en Fudo y el cambio llega solo.',
        ],
      },
      {
        titulo: 'Cargar una venta a mano',
        puntos: [
          'Es para lo que no pasa por Fudo: Cheaf, encargos, ventas a comercios. El tipo de venta se elige de la lista que armás en Tipos de venta.',
          'Sumá uno o varios productos. Cada uno trae el precio del menú, y lo podés cambiar. El total se calcula mientras escribís.',
          'La fecha viene con hoy; puede ser un día anterior, pero no uno futuro.',
          'Si se cobró en efectivo, suma a lo que debería haber en la caja de ese día.',
        ],
      },
      {
        titulo: 'Anular',
        puntos: [
          'Una venta a mano no se edita ni se borra: se anula con un motivo, deja de contar y queda en el historial.',
          'Si te equivocaste en un monto, anulala y cargala de nuevo.',
        ],
      },
    ],
  },
  canales: {
    titulo: 'Cómo funciona Tipos de venta',
    introduccion:
      'Por dónde entran las ventas que no pasan por Fudo. Arrancan Cheaf, Encargo, Venta a comercios y Otro.',
    temas: [
      {
        titulo: 'Qué tenés que saber',
        puntos: [
          'Sumá, renombrá y desactivá tipos de venta. No se repite un nombre.',
          'Un tipo de venta desactivado no se ofrece al cargar una venta, pero conserva las que ya tiene.',
          'Renombrar un tipo de venta cambia el nombre también en sus ventas anteriores.',
        ],
      },
    ],
  },
  caja: {
    titulo: 'Cómo funciona el cierre de caja',
    introduccion:
      'Al terminar el turno, contá lo que hay en la caja y cargalo acá. El cierre queda a tu nombre.',
    temas: [
      {
        titulo: 'Qué se carga',
        puntos: [
          'Fondo inicial: la plata con la que arrancó la caja.',
          'Efectivo contado: los billetes y monedas que hay al cerrar, contando el fondo.',
          'Lo cobrado con tarjeta de crédito, de débito, QR y transferencia, según los comprobantes del día.',
          'El conteo es a ciegas: el sistema no te muestra cuánto debería haber, para que cargues lo que contaste de verdad.',
        ],
      },
      {
        titulo: 'Retiros y gastos',
        puntos: [
          'Retiros: el efectivo que se sacó de la caja durante el día, con quién lo retiró.',
          'Gastos pagados con la caja: lo que se pagó con ese efectivo, con su monto y qué fue. Le llega al admin como un gasto Sin clasificar.',
        ],
      },
      {
        titulo: 'Reglas',
        puntos: [
          'Hay un cierre por día: un segundo cierre del mismo día no se guarda.',
          'Podés cargar el de un día anterior que quedó sin cargar, pero no uno de un día futuro.',
          'Si te equivocaste, abrí el cierre y tocá Editar: el resultado se vuelve a calcular. El admin también puede anularlo, con un motivo.',
        ],
      },
      {
        titulo: 'Después de guardar',
        puntos: [
          'Ves el resultado enseguida: Cierra si lo que contaste coincide con las ventas del día, o Con diferencia si no.',
          'En Mis cierres ves los que cargaste vos, con su estado. Los de otros no se ven.',
        ],
      },
    ],
  },
  control: {
    titulo: 'Cómo funciona el control de cierres',
    introduccion: 'Acá revisás los cierres de cada día: quién los cargó, qué declaró y si cierran.',
    temas: [
      {
        titulo: 'Los estados',
        puntos: [
          'Pendiente: el día todavía no tiene cierre cargado.',
          'Cierra: lo contado coincide con las ventas del día, o la diferencia es menor que la tolerancia.',
          'Con diferencia: en algún medio de pago falta o sobra más que la tolerancia.',
          'Anulado: no cuenta, y ese día queda libre para cargarlo de nuevo. Se ve con Ver anulados.',
        ],
      },
      {
        titulo: 'La lista',
        puntos: [
          'Filtrá por fechas, persona y estado.',
          'Los días pendientes aparecen en una franja que se abre, con el botón para cargar cada uno. El estado Pendiente los lista.',
          'Fondo distinto avisa que la caja arrancó con otro monto del que quedó el día anterior: puede tapar un faltante. El detalle dice cuánto.',
        ],
      },
      {
        titulo: 'La tolerancia',
        puntos: [
          'Es la diferencia por medio de pago que se acepta como Cierra, por ejemplo unos pesos de cambio.',
          'Una diferencia menor no genera aviso, pero se ve igual en el detalle.',
        ],
      },
      {
        titulo: 'Editar y anular',
        puntos: [
          'Al abrir un cierre ves lo declarado en cada medio, los retiros, los gastos de caja y el comentario de quien lo cargó.',
          'Editar cambia lo declarado, los retiros y los gastos de caja; cada cambio queda en la auditoría.',
          'Un cierre no se borra: se anula con un motivo, y los gastos que salieron de él quedan anulados también.',
        ],
      },
    ],
  },
  menu: {
    titulo: 'Cómo funciona el Menú',
    introduccion:
      'Lo que ve el cliente en la carta: categorías, productos y precios. Cada cambio sale en la carta al guardar, sin borrador.',
    temas: [
      {
        titulo: 'Categorías',
        puntos: [
          'Cada categoría tiene nombre, subtítulo, foto, ícono y su lugar en la carta. La foto es de la categoría: los productos no tienen foto propia.',
          'En Cómo se vende ponés las formas en que se vende lo de adentro: Docena, Media docena, Unidad, Mediano, Grande.',
          'Con Mismo precio para todos los productos, el precio lo pone la categoría y lo toman todos sus productos que no tengan uno propio. Es el caso de Facturas.',
          'Una categoría nueva se crea oculta: mostrala cuando tenga productos.',
        ],
      },
      {
        titulo: 'Productos',
        puntos: [
          'Cada producto tiene nombre, descripción, categoría, precios y una etiqueta opcional: Más vendido, Artesanal o Nuevo.',
          'Carga el precio de cada forma de venta que ofrece: un café puede tener solo Grande. La pantalla dice de dónde sale el precio que ves.',
          'Un producto que se vende en Fudo pero no va en la carta (una botella de agua) se carga igual, sin marcar que se muestre.',
          'Si lo pasás a una categoría que se vende de otra forma, queda sin precio y se oculta hasta que le cargues uno.',
        ],
      },
      {
        titulo: 'Ordenar, ocultar y desactivar',
        puntos: [
          'Las flechas suben y bajan categorías y productos en la carta.',
          'Ocultar saca algo de la carta sin borrarlo. Una categoría oculta esconde todos sus productos. Un producto sin precio no se puede mostrar.',
          'Desactivar es para lo que ya no se usa: no se ofrece más y conserva su historial. En Ver desactivados lo reactivás, y vuelve oculto para que lo revises.',
          'Una categoría con productos no se desactiva hasta mover o desactivar sus productos.',
        ],
      },
      {
        titulo: 'Precios y Fudo',
        puntos: [
          'Los precios van en pesos enteros.',
          'Cambiar un precio acá no lo cambia en Fudo: cambialo también allá.',
          'Cada cambio de precio queda en la Auditoría, con el anterior y el nuevo.',
        ],
      },
    ],
  },
  aumento: {
    titulo: 'Cómo funciona el Aumento de precios',
    introduccion:
      'Sube o baja de una vez todos los precios del menú o de una categoría, con un porcentaje.',
    temas: [
      {
        titulo: 'Cómo se usa',
        puntos: [
          'Elegí el alcance: todo el menú o una categoría.',
          'Escribí el porcentaje. Para bajar precios, usá uno negativo (por ejemplo -10).',
          'Elegí el redondeo, al más cercano: $10, $50, $100 o $500. Viene marcado $100.',
          'Tocá Ver cambios: aparece la tabla con el precio actual y el nuevo de cada uno, y todavía no se cambió nada.',
          'Revisá la tabla y recién ahí tocá Aplicar aumento.',
        ],
      },
      {
        titulo: 'Qué tenés que saber',
        puntos: [
          'También entran los productos ocultos, para que no queden con el precio viejo cuando los muestres.',
          'En una categoría con el mismo precio para todos, cambia ese precio y no el de cada producto: en la tabla figura como precio para todos.',
          'Si al redondear dos precios quedan iguales, se muestran así: corregilos a mano si hace falta.',
          'No hay deshacer: un error se corrige con otro aumento o editando el precio.',
          'Acordate de cambiar los precios también en Fudo.',
        ],
      },
    ],
  },
};
