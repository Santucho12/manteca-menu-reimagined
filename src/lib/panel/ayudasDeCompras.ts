import type { Ayuda, ClaveDeAyuda } from './ayudasDeLaBase';

/** Las ayudas de lo que entra y lo que cuesta: Compras, Costos y Materia prima. */
export const AYUDAS_DE_COMPRAS: Partial<Record<ClaveDeAyuda, Ayuda>> = {
  compras: {
    titulo: 'Cómo funciona Compras',
    introduccion:
      'Acá cargás la mercadería que entra, con lo que llegó y a qué precio. Cada compra genera su gasto de Mercadería y actualiza lo que cuesta cada insumo.',
    temas: [
      {
        titulo: 'Cargar compra',
        puntos: [
          'Elegí el proveedor, el día que llegó y, por cada renglón, qué llegó, cuánto y a qué precio la unidad, con impuestos.',
          'Otros cargos (flete, percepciones, redondeos) suman al total pero no al costo de los insumos.',
          'Si ya la pagaste, elegí con qué y cuándo; si no, queda por pagar con su vencimiento, en Próximos pagos de Gastos.',
          'Un renglón a $0 es una bonificación: no cambia el precio del insumo.',
        ],
      },
      {
        titulo: 'Armar pedido',
        puntos: [
          'Elegí el proveedor y lo que le pedís. Mandar por WhatsApp abre su chat con el pedido escrito.',
          'Cuando llega, entrá al pedido y tocá Recibir: cargás lo que vino de verdad. Lo que no llegó no queda pendiente.',
        ],
      },
      {
        titulo: 'Pagada con la caja',
        puntos: [
          'Lo que Caja pagó con la caja llega a Gastos para clasificar. Ahí, Es una compra carga sus renglones sin crear otro gasto.',
        ],
      },
      {
        titulo: 'Anular',
        puntos: [
          'Una compra no se edita: se puede anular, con motivo, y cargar de nuevo. Al anularla se anula su gasto y los insumos vuelven al precio de la compra anterior.',
          'Si lo por pagar ya se pagó, primero se anula el pago, en Gastos. Una compra pagada con la caja vuelve a quedar para clasificar.',
        ],
      },
    ],
  },
  costos: {
    titulo: 'Cómo funciona Costos',
    introduccion:
      'Acá ves cuánto te cuesta hacer cada producto, cuánto te deja con el precio del menú y cuáles quedaron debajo de lo que querés ganar.',
    temas: [
      {
        titulo: 'La lista',
        puntos: [
          'Cada producto muestra, por presentación, el costo, el precio del menú, la ganancia en pesos y en porcentaje y el Precio sugerido.',
          'Por defecto va del que menos deja al que más. También se puede ordenar por nombre.',
          'Debajo del mínimo muestra los que dejan menos que el Margen mínimo; Sin receta, los que todavía no la tienen.',
          'Si no hay número, dice por qué: falta la receta, faltan las unidades o un insumo no tiene precio.',
        ],
      },
      {
        titulo: 'La receta',
        puntos: [
          'Lleva los insumos con su cantidad, cuánto rinde y el desperdicio, que se suma al costo.',
          'Lo que cuesta cada insumo sale de Materia prima.',
          'Una presentación que no es un múltiplo, como un café grande, puede tener su receta propia.',
        ],
      },
      {
        titulo: 'Ajustes',
        puntos: [
          'Margen objetivo: da el Precio sugerido, redondeado hacia arriba a $100. Margen mínimo: debajo de este el producto se marca y avisa en Inicio.',
          'Unidades: cuántas unidades lleva cada presentación (la docena, 12). Agregado: un monto fijo que se suma, como la caja.',
          'Cambiar una presentación cambia el costo de todos los productos de esa categoría.',
        ],
      },
    ],
  },
  'materia-prima': {
    titulo: 'Cómo funciona Materia prima',
    introduccion:
      'Acá tenés los insumos que usás y lo que cuesta cada uno hoy. Con eso se calcula después cuánto te cuesta cada producto.',
    temas: [
      {
        titulo: 'La lista',
        puntos: [
          'Muestra el nombre, en qué se mide y el costo de hoy. Va de a 25 por página.',
          'Lo que se mide en gramos se muestra por kilo, y lo que se mide en mililitros, por litro: se lee mejor que por gramo.',
          'De dónde sale el costo dice si viene del Precio de referencia o de la última compra. Sin precio, todavía no tiene costo.',
          'En Buscar por nombre escribí parte del nombre y apretá Buscar.',
        ],
      },
      {
        titulo: 'Cargar un insumo',
        puntos: [
          'Va el nombre y En qué se mide: gramos, mililitros o unidades. Es como se cuenta en una receta.',
          'Si ya hay uno con el mismo nombre, el sistema te avisa y te deja seguir.',
        ],
      },
      {
        titulo: 'Las formas de compra',
        puntos: [
          'Un insumo se compra de distintas formas y a distintos proveedores: la bolsa de 25 kg a uno y la de 50 kg a otro.',
          'Cuánto trae se escribe en la unidad del insumo: una bolsa de 25 kg trae 25.000 gramos.',
          'El Precio de referencia es lo que sale, cargado a mano. Vale el de la forma que cambiaste por última vez.',
        ],
      },
      {
        titulo: 'Desactivados',
        puntos: [
          'Un insumo o una forma de compra no se borran: se desactivan. Una forma desactivada no cuenta para el costo.',
          'Con Ver desactivados los ves, y desde su ficha los podés reactivar.',
        ],
      },
    ],
  },
};
