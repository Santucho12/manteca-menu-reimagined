/** Los reportes, en el orden en que se muestran, con la pregunta que responde cada uno. */
export const REPORTES = [
  {
    ruta: '/admin/reportes/ventas',
    titulo: 'Ventas por período',
    pregunta: 'Cuánto se vendió cada día, cuántas ventas y el ticket promedio.',
  },
  {
    ruta: '/admin/reportes/productos',
    titulo: 'Ventas por producto',
    pregunta: 'Qué productos dejaron más plata y cuántos se vendieron.',
  },
  {
    ruta: '/admin/reportes/categorias',
    titulo: 'Ventas por categoría',
    pregunta: 'Cuánto dejó cada categoría del menú.',
  },
  {
    ruta: '/admin/reportes/tipos',
    titulo: 'Ventas por tipo de venta',
    pregunta: 'Cuánto entró por el mostrador y cuánto por encargos, comercios y los demás.',
  },
  {
    ruta: '/admin/reportes/gastos',
    titulo: 'Gastos por categoría',
    pregunta: 'En qué se fue la plata.',
  },
  {
    ruta: '/admin/reportes/gastos-por-periodo',
    titulo: 'Gastos por período',
    pregunta: 'Cuánto se gastó cada día o cada mes.',
  },
  {
    ruta: '/admin/reportes/caja',
    titulo: 'Caja',
    pregunta: 'Los cierres de cada día, quién los cargó y dónde no cierra.',
  },
  {
    ruta: '/admin/reportes/resultado',
    titulo: 'Balance',
    pregunta: 'Ventas menos gastos, con los gastos abiertos por categoría.',
  },
] as const;
