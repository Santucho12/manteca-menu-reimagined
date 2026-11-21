import type { Ayuda, ClaveDeAyuda } from './ayudasDeLaBase';

/** Las ayudas de los modulos del negocio: ventas, caja y menu. */
export const AYUDAS_DEL_NEGOCIO: Partial<Record<ClaveDeAyuda, Ayuda>> = {
  vender: {
    titulo: 'Cómo funciona Vender',
    introduccion:
      'Es el mostrador: cada venta se cobra acá, en tres pasos: qué lleva, dónde se vendió y cómo paga. Abajo siempre ves el total, con Atrás y Siguiente.',
    temas: [
      {
        titulo: '1. Productos',
        puntos: [
          'Tocá la categoría (cada una tiene su color) y después la forma de venta que lleva el cliente: Docena, Media docena, Unidad, Grande. Tocá de nuevo para sumar otra.',
          'Con − y + cambiás la cantidad de un renglón, y con el tachito lo sacás. Cada producto va con el precio del menú, que acá no se cambia.',
          'Lo que va por peso abre la balanza: viene el peso de la forma (por ejemplo 250 g), lo cambiás con − y +, escribiéndolo o con un atajo, y el precio sale de la cuenta. Para cambiarlo después, tocá el peso en el ticket.',
          'Docena variada: las facturas sueltas se juntan solas. Cada 12 se cobra la docena y, si sobran 6 o más, la media docena, aunque sean distintas. En el ticket esas facturas dicen «por cantidad», y un recuadro verde muestra cómo se cobran y cuánto ahorra el cliente.',
        ],
      },
      {
        titulo: '2. Tipo de venta',
        puntos: [
          'Viene elegido Local: si es una venta común, tocá Siguiente. Si es de Pedidos Ya, Cheaf u otro, tocá su tarjeta. Salen en el orden de Tipos de venta.',
        ],
      },
      {
        titulo: '3. Cobro',
        puntos: [
          'Elegí el medio: efectivo, débito, crédito, QR o transferencia, cada uno con su color.',
          'Con Pagar con dos medios elegís el segundo y escribís cuánto va con el primero: el resto va con el segundo.',
          'Con Hacer un descuento elegís porcentaje o monto fijo, escribís el valor y el motivo: el total a cobrar ya lo descuenta. Sin motivo no se aplica.',
          'Al tocar Cobrar la venta queda guardada, de hoy y en la caja del turno, y te lleva a Ventas. Si fue en efectivo, ahí se abre Calcular vuelto: escribís cuánto te pagaron y muestra el vuelto. Si no la tocás, se va sola a los 5 segundos.',
        ],
      },
      {
        titulo: 'Qué tenés que saber',
        puntos: [
          'Acá no ves lo vendido en el día: así contás la caja a ciegas al cerrar.',
          'Si te equivocaste, en Ventas podés editar la venta durante los 30 minutos después de cobrarla, con un motivo. Después, o para anularla, avisale a un admin.',
          'A la hora de cierre de cada turno, Vender se traba hasta que cargues el cierre. Si hay gente esperando, tocá Postergar 10 min: lo vendido mientras tanto queda en el turno que vas a cerrar. Cada postergación queda registrada.',
          'Después del cierre de la noche no se vende hasta el día siguiente.',
          'Si se corta internet al cobrar, la venta queda en este equipo y se manda sola cuando vuelve la conexión: arriba avisa cuántas faltan mandar. No cierres la pestaña mientras tanto.',
          'Si cambió un precio mientras armabas el ticket, la venta no se guarda y aparece el precio nuevo.',
        ],
      },
    ],
  },
  ventas: {
    titulo: 'Cómo funciona Ventas',
    introduccion:
      'Todo lo que se vendió, con su total. Las ventas se cobran en Vender, el mostrador: acá se miran, se filtran, se editan y se anulan.',
    temas: [
      {
        titulo: 'La lista',
        puntos: [
          'Arranca en el día de hoy, de a 25 por página. Para ver el mes u otro período, cambiá las fechas.',
          'Filtrá también por medio de pago, tipo de venta, empleado (quién la cobró) y estado (cerradas o anuladas). La lista y las tarjetas se actualizan solas.',
          'Cada fila dice la fecha y la hora, el tipo de venta (Local, Pedidos Ya…), quién la cobró, el medio, el estado y el total. Si se editó, al lado del estado dice Editada.',
          'Si tuvo descuento, debajo del total dice cuál fue: «10 % de descuento» o «Descuento fijo de» un monto.',
          'Tocá cualquier parte de la fila para abrir la venta.',
        ],
      },
      {
        titulo: 'El detalle de una venta',
        puntos: [
          'A la izquierda, los productos con su cantidad y precio, y el total abajo. A la derecha, el estado, con qué se cobró, el tipo de venta, quién la cargó y los botones.',
          'Si tuvo descuento, antes del total se ve qué descuento fue, el motivo y cuánto se restó.',
          'Las facturas cobradas como docena variada dicen por cantidad, y abajo se ve lo cobrado y cuánto se ahorró.',
          'Si fue anulada, arriba lo dice en rojo con el motivo, y el total aparece tachado.',
          'Las ventas viejas que vinieron sin productos muestran solo el total.',
        ],
      },
      {
        titulo: 'Las tarjetas de arriba',
        puntos: [
          'Cobrado: lo que entró en el período, ya con los descuentos y sin lo anulado, y cuántas ventas fueron.',
          'Ticket promedio: lo cobrado dividido la cantidad de ventas.',
          'Anuladas: cuánto y cuántas se anularon.',
          'Siguen a los filtros. Con un medio de pago elegido, suman solo lo que se pagó con ese medio.',
        ],
      },
      {
        titulo: 'Editar y anular',
        puntos: [
          'Abrí la venta y tocá Editar: se abre Vender con la venta cargada. Cambiá productos, cantidades, tipo de venta, medio de pago o descuento, escribí el motivo y guardá. Se cobra con los precios del menú de hoy.',
          'La venta queda marcada como Editada, y Auditoría guarda cómo estaba antes, cómo quedó, quién la cambió y el motivo.',
          'Caja ve en Ventas solo las de los últimos 30 minutos, sin filtros ni totales, y puede editarlas en ese tiempo. Después, solo el admin.',
          'Cada venta cuenta en la caja del turno en que se cobró. Si ese turno ya tenía el cierre cargado, el cierre vuelve a calcular lo que debería haber y puede quedar con diferencia.',
          'Anular es solo del admin: se anula con un motivo, deja de contar y queda en el historial. Las viejas que vinieron sin productos solo se miran: no se cambian ni se anulan desde acá.',
        ],
      },
      {
        titulo: 'Vender y los tipos de venta',
        puntos: [
          'Vender abre el mostrador: se cobra en el momento, con los productos y los precios del menú, y siempre con la fecha de hoy.',
          'El tipo de venta viene Local y se cambia en Vender. Los tipos se suman, se ordenan y se desactivan en Tipos de venta.',
        ],
      },
    ],
  },
  canales: {
    titulo: 'Cómo funciona Tipos de venta',
    introduccion:
      'Por dónde se vende: Local, PedidosYa, Mayorista o el que armes. Se elige en Vender, en el paso 2, y sirve para filtrar Ventas y para controlar cada tipo en el cierre.',
    temas: [
      {
        titulo: 'Qué podés hacer',
        puntos: [
          'Sumá un tipo escribiendo su nombre y tocando Sumar. No se repite un nombre.',
          'Ordenalos arrastrando desde la manija de la izquierda, o con las flechas del teclado: es el orden de los botones en Vender. Se guarda solo.',
          'Con el lápiz lo renombrás: el nombre nuevo sale también en sus ventas anteriores.',
          'Con el interruptor lo desactivás: un tipo desactivado no se ofrece en Vender, pero conserva sus ventas. Con el tachito se borra, si nunca se usó.',
        ],
      },
      {
        titulo: 'Qué tenés que saber',
        puntos: [
          'Local es el tipo del mostrador: viene elegido en Vender y no se renombra, no se desactiva ni se borra.',
          'En Vender cada tipo tiene su color; Otro va en gris.',
        ],
      },
    ],
  },
  caja: {
    titulo: 'Cómo funciona el cierre de caja',
    introduccion:
      'Hay dos cierres por día, uno al mediodía y otro a la noche. Al terminar tu turno, contá lo que hay en la caja y cargalo acá. El cierre queda a tu nombre.',
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
          'Hay un cierre por turno: un segundo cierre del mismo turno no se guarda. Arriba elegís si es el del mediodía o el de la noche; viene elegido el que toca.',
          'La noche de hoy se carga después del mediodía, si al mediodía se vendió.',
          'Podés cargar el de un día anterior que quedó sin cargar, pero no uno de un día futuro.',
          'Un cierre guardado no lo cambiás vos. ¿Algo está mal? Avisale a un administrador: lo corrige o lo anula desde el control de cierres.',
        ],
      },
      {
        titulo: 'Después de guardar',
        puntos: [
          'Ves el resultado enseguida: Cierra si lo que contaste coincide con las ventas del turno, o Con diferencia si no.',
          'En Mis cierres ves los que cargaste vos, con su estado. Los de otros no se ven.',
        ],
      },
    ],
  },
  control: {
    titulo: 'Cómo funciona el control de cierres',
    introduccion:
      'Acá revisás los cierres de cada turno: quién los cargó, qué declaró y si cierran.',
    temas: [
      {
        titulo: 'Los estados',
        puntos: [
          'Pendiente: un turno que vendió en la caja y todavía no tiene cierre. Un turno sin ventas no queda pendiente.',
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
          'Los turnos pendientes aparecen en una franja que se abre, con el botón para cargar cada uno. El estado Pendiente los lista.',
          'Cada cierre dice su turno, Mediodía o Noche. Al abrirlo ves si se postergó y cuántas veces.',
          'Fondo distinto avisa que la caja arrancó con otro monto del que quedó el día anterior: puede tapar un faltante. El detalle dice cuánto.',
        ],
      },
      {
        titulo: 'Las horas de cierre',
        puntos: [
          'Con el botón Ajustes de caja, arriba, en Horas de cierre elegís a qué hora se traba Vender para el cierre del mediodía y para el de la noche.',
          'Lo vendido de cada turno se compara con su propio cierre.',
        ],
      },
      {
        titulo: 'La tolerancia',
        puntos: [
          'Es la diferencia por medio de pago que se acepta como Cierra, por ejemplo unos pesos de cambio. Se cambia en Ajustes de caja, arriba, en Diferencia aceptada.',
          'Una diferencia menor no genera aviso, pero se ve igual en el detalle.',
        ],
      },
      {
        titulo: 'Cómo se calcula si cierra',
        puntos: [
          'El efectivo esperado es el fondo inicial, más las ventas en efectivo, menos los retiros y los gastos de caja. En los demás medios, lo esperado son las ventas de ese medio.',
          'Solo cuentan las ventas cobradas en la caja del local, como todas las del mostrador.',
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
