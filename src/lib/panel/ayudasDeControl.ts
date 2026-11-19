import type { Ayuda, ClaveDeAyuda } from './ayudasDeLaBase';

/** Las ayudas de los modulos para controlar el negocio: reportes, usuarios y auditoria. */
export const AYUDAS_DE_CONTROL: Partial<Record<ClaveDeAyuda, Ayuda>> = {
  reportes: {
    titulo: 'Cómo funciona Reportes',
    introduccion:
      'Para entender por qué un mes fue mejor o peor, en qué se fue la plata y dónde no cierra la caja. Inicio muestra cómo viene el mes; acá se busca el porqué.',
    temas: [
      {
        titulo: 'Qué reportes hay',
        puntos: [
          'Ventas por período: cuánto se vendió cada día, cuántas ventas y el ticket promedio.',
          'Ventas por producto: cuánto dejó cada producto y cuántos se vendieron de cada forma de venta.',
          'Ganancia por producto: cuánto dejó cada producto después de lo que costó hacerlo, con el costo guardado en cada venta. Lo vendido sin costo se cuenta aparte.',
          'Ventas por categoría: cuánto dejó cada categoría del menú.',
          'Ventas por tipo de venta: cuánto entró por el mostrador (Local) y cuánto por encargos, comercios y los demás tipos, con la parte del total de cada uno.',
          'Gastos por categoría y Gastos por período: en qué se fue la plata y cuánto se gastó cada día o cada mes.',
          'Caja: los cierres de cada día, quién los cargó y los días sin cierre.',
          'Balance: ventas menos gastos, con los gastos abiertos por categoría.',
        ],
      },
      {
        titulo: 'El período',
        puntos: [
          'Sin fechas elegidas, va del 1 del mes a hoy. Elegí otras fechas o usá un atajo: Este mes, Mes pasado o Últimos 7 días.',
          'Hasta 62 días se ve día por día; un período más largo, por mes.',
        ],
      },
      {
        titulo: 'La comparación',
        puntos: [
          'Un período que empieza el día 1 se compara con los mismos días del mes anterior, igual que en Inicio. Cualquier otro, con el anterior del mismo largo.',
          'En Comparar podés elegir otro período a mano, por ejemplo el mismo mes del año pasado.',
          'Cada número muestra cuánto cambió, en pesos y en porcentaje. Si el otro período no tiene datos, dice que no hay con qué comparar.',
          'En el gráfico los dos períodos van superpuestos: el día 1 con el día 1.',
        ],
      },
      {
        titulo: 'Qué tenés que saber',
        puntos: [
          'Los números salen del mismo cálculo que Inicio: el mismo dato no da distinto en dos pantallas.',
          'Lo anulado no cuenta. Las ventas incluyen las del mostrador y las cargadas a mano.',
          'Un producto que cambió de categoría cuenta en la que tiene hoy.',
          'En Balance, un mes sin gastos cargados muestra solo las ventas, sin balance.',
        ],
      },
    ],
  },
  usuarios: {
    titulo: 'Cómo funciona Usuarios',
    introduccion:
      'Quién entra al sistema y qué puede hacer. Cada uno entra con su cuenta, y todo lo que carga queda a su nombre.',
    temas: [
      {
        titulo: 'Los roles',
        puntos: [
          'Invitado: se acaba de registrar y no ve nada hasta que le des un rol.',
          'Caja: carga el cierre de su turno y ve sus propios cierres, nada más.',
          'Admin: ve y hace todo, incluida esta pantalla.',
        ],
      },
      {
        titulo: 'La lista',
        puntos: [
          'Los que esperan un rol van arriba, y el menú de la izquierda muestra cuántos son.',
          'En Buscar por nombre o email la lista se filtra mientras escribís. El estado filtra Todos, Esperando rol, Activos o Desactivados.',
        ],
      },
      {
        titulo: 'Qué podés hacer',
        puntos: [
          'Dar rol de Caja o de Admin a quien se registró; también cambiar el rol de alguien que ya entra.',
          'Con el interruptor Cuenta activa, Desactivar le saca el acceso en el momento, aunque tenga la sesión abierta, y Reactivar se lo devuelve con el rol que tenía.',
          'En los tres puntos, Resetear contraseña muestra una temporal una sola vez: pasásela a la persona, que la cambia apenas entra. Después no la vas a poder ver de nuevo.',
          'En los tres puntos, Corregir datos cambia el nombre y el email. El email no se puede repetir.',
        ],
      },
      {
        titulo: 'Límites',
        puntos: [
          'Sobre tu propia cuenta solo corregís los datos: no te cambiás el rol ni te desactivás. Si necesitás otra contraseña, pedile a otro administrador que te la resetee.',
          'Tiene que quedar al menos un administrador activo: conviene tener dos, por si uno se olvida la contraseña.',
          'Nada se borra: una cuenta desactivada conserva todo lo que cargó.',
        ],
      },
    ],
  },
  auditoria: {
    titulo: 'Cómo funciona la Auditoría',
    introduccion:
      'Todo lo que se cargó o se cambió en el sistema, quién lo hizo y cuándo. La anota el sistema solo, en cada cambio.',
    temas: [
      {
        titulo: 'Cómo se lee',
        puntos: [
          'Va de lo más nuevo a lo más viejo y arranca en los últimos 7 días.',
          'Filtrá por fechas, persona, módulo y acción. Lo que hace el sistema solo (como cargar un gasto fijo) figura como El sistema.',
          'Ver el detalle muestra cada campo con su valor anterior y el nuevo, con nombres y pesos, y te lleva al dato que cambió.',
        ],
      },
      {
        titulo: 'Qué queda anotado',
        puntos: [
          'Altas, cambios, anulaciones y desactivaciones de todos los módulos, con el motivo cuando lo hay.',
          'Un aumento de precios deja un registro por cada precio que cambió.',
          'Los reseteos y cambios de contraseña quedan anotados, pero nunca la contraseña.',
          'Los ingresos al sistema no se anotan. Un cambio que no modifica nada tampoco.',
        ],
      },
      {
        titulo: 'Qué tenés que saber',
        puntos: [
          'La auditoría no se puede editar ni borrar, ni siquiera un admin, y no vence.',
          'Cada gasto, proveedor y producto muestra en su ficha Cargado por: quién lo cargó y cuándo. La historia completa está acá.',
        ],
      },
    ],
  },
};
