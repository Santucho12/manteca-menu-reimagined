import type { Ayuda, ClaveDeAyuda } from './ayudasDeLaBase';

/** Las ayudas de los modulos del negocio: ventas, caja y menu. */
export const AYUDAS_DEL_NEGOCIO: Partial<Record<ClaveDeAyuda, Ayuda>> = {
  vender: {
    titulo: 'Cómo funciona Vender',
    introduccion:
      'Es el mostrador: cada venta se carga acá en el momento de cobrar, con los productos y los precios del menú.',
    temas: [
      {
        titulo: 'Armar el ticket',
        puntos: [
          'Elegí la categoría y tocá cada forma de venta que lleva el cliente: Docena, Unidad, Grande. Tocá de nuevo para sumar otra.',
          'Con − y + cambiás la cantidad de un renglón. Restar el último lo saca del ticket.',
          'Cada producto va con el precio del menú, que acá no se cambia. Si cambió mientras armabas el ticket, la venta no se guarda y aparece el precio nuevo.',
        ],
      },
      {
        titulo: 'Cobrar',
        puntos: [
          'Elegí el medio: efectivo, débito, crédito, QR o transferencia.',
          'Con Pagar con dos medios elegís el segundo y escribís cuánto va con el primero: el resto va con el segundo.',
          'Con efectivo podés escribir con cuánto paga el cliente y la pantalla te muestra el vuelto.',
          'Al cobrar queda guardada la venta, de hoy y cobrada en la caja, y el ticket queda vacío para la próxima.',
        ],
      },
      {
        titulo: 'Qué tenés que saber',
        puntos: [
          'Acá no ves lo vendido en el día: así contás la caja a ciegas al cerrar.',
          'Si te equivocaste en una venta, avisale a un admin: él la anula con un motivo.',
          'Si se corta internet, la venta no se guarda y el ticket queda como estaba. Si no vuelve, anotala y el admin la carga después.',
        ],
      },
    ],
  },
  ventas: {
    titulo: 'Cómo funciona Ventas',
    introduccion:
      'Todo lo que se vendió, con su total: lo cobrado en el mostrador desde Vender y lo que cargás a mano.',
    temas: [
      {
        titulo: 'La lista',
        puntos: [
          'Arranca en el mes de hoy, de a 25 por página. Filtrá por fechas, medio de pago y estado.',
          'El origen dice si la venta se cobró en el Mostrador o la cargaste A mano, y quién la cargó.',
          'El total de arriba suma lo cobrado, sin lo anulado.',
          'Las tarjetas de arriba muestran lo cobrado, el ticket promedio y las anuladas del período filtrado.',
          'Con un medio de pago elegido, el total suma solo lo que se pagó con ese medio.',
          'Abrí una venta para ver sus productos, sus pagos y quién la cargó.',
        ],
      },
      {
        titulo: 'Las del mostrador',
        puntos: [
          'Se cargan en Vender, en el momento de cobrar, con los productos y los precios del menú.',
          'Se pueden pagar con uno o dos medios. Cuentan siempre en lo que debería haber en la caja de ese día.',
        ],
      },
      {
        titulo: 'Cargar una venta a mano',
        puntos: [
          'Es para lo que no se cobró en el mostrador: encargos, ventas a comercios, Cheaf, o lo que se vendió sin conexión. El tipo de venta se elige de la lista que armás en Tipos de venta.',
          'Sumá uno o varios productos. Cada uno trae el precio del menú, y lo podés cambiar. El total se calcula mientras escribís.',
          'La fecha viene con hoy; puede ser un día anterior, pero no uno futuro.',
          'Marcá Se cobró en la caja del local si la plata entró a la caja: así suma a lo que debería haber en el cierre de ese día.',
        ],
      },
      {
        titulo: 'Anular',
        puntos: [
          'Una venta no se edita ni se borra: se anula con un motivo, deja de contar y queda en el historial.',
          'Si te equivocaste en un monto, anulala y cargala de nuevo. Caja no anula: te avisa a vos.',
        ],
      },
    ],
  },
  canales: {
    titulo: 'Cómo funciona Tipos de venta',
    introduccion:
      'Por dónde se vende lo que cargás a mano. Arrancan Cheaf, Encargo, Venta a comercios y Otro.',
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
          'Un cierre guardado no lo cambiás vos. ¿Algo está mal? Avisale a un administrador: lo corrige o lo anula desde el control de cierres.',
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
          'No abrió: el día que el local no abrió, marcado a mano. No cuenta como pendiente ni avisa en Inicio; con Deshacer vuelve a pendiente.',
          'Cierra: lo contado coincide con las ventas del día, o la diferencia es menor que la tolerancia.',
          'Con diferencia: en algún medio de pago falta o sobra más que la tolerancia. Se mira cada medio por separado: un faltante en efectivo y un sobrante en tarjeta no se compensan.',
          'Anulado: no cuenta, y ese día queda libre para cargarlo de nuevo.',
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
          'Es la diferencia por medio de pago que se acepta como Cierra, por ejemplo unos pesos de cambio. Se cambia con el botón Diferencia aceptada, arriba.',
          'Una diferencia menor no genera aviso, pero se ve igual en el detalle.',
        ],
      },
      {
        titulo: 'Cómo se calcula si cierra',
        puntos: [
          'El efectivo esperado es el fondo inicial, más las ventas en efectivo, menos los retiros y los gastos de caja. En los demás medios, lo esperado son las ventas de ese medio.',
          'Solo cuentan las ventas cobradas en la caja del local: las del mostrador y las cargadas a mano con esa casilla marcada.',
          'Efectivo contado es todo el efectivo que había en la caja, fondo incluido. Queda en la caja no puede ser más que lo contado.',
          'Lo que queda en la caja de un día es el fondo inicial del siguiente cierre. Si no coincide, el detalle lo avisa.',
          'Para cargar un cierre que falta, usá el botón Cargar cierre o tocá el día pendiente.',
        ],
      },
      {
        titulo: 'Editar y anular',
        puntos: [
          'Al abrir un cierre ves lo declarado en cada medio, los retiros, los gastos de caja y el comentario de quien lo cargó.',
          'Editar, solo el admin, cambia lo declarado, los retiros y los gastos de caja; el resultado se vuelve a calcular y cada cambio queda en la auditoría.',
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
          'Si le ponés un precio propio donde la categoría tiene uno para todos, antes de guardar te avisa que el producto está tomando el de la categoría y te pregunta si querés pisarlo.',
          'Un producto que se vende en el mostrador pero no va en la carta (una botella de agua) se carga igual, sin marcar que se muestre.',
          'Si lo pasás a una categoría que se vende de otra forma, queda sin precio y se oculta hasta que le cargues uno.',
        ],
      },
      {
        titulo: 'Crear y editar',
        puntos: [
          'Nuevo crea una categoría o un producto. Para editar uno que ya está, tocalo en la lista.',
          'Aumentar precios sube o baja de una vez los precios de todo el menú o de una categoría. Tiene su propia ayuda.',
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
        titulo: 'Precios',
        puntos: [
          'Los precios van en pesos enteros.',
          'Son los mismos con los que se cobra en Vender: un cambio vale desde la próxima venta.',
          'Cada cambio de precio queda en la Auditoría, con el anterior y el nuevo.',
        ],
      },
    ],
  },
  aumento: {
    titulo: 'Cómo funciona Aumentar precios',
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
        ],
      },
    ],
  },
};
