// Un id que no existe: la pantalla responde 404, pero el servidor la compila igual.
const SIN_ID = '00000000-0000-0000-0000-000000000000';

/** Las pantallas del panel que el servidor de desarrollo compila antes de las pruebas. */
export const PANTALLAS_PARA_CALENTAR = [
  '/admin',
  '/admin/cuenta',
  '/admin/proveedores',
  '/admin/proveedores/nuevo',
  `/admin/proveedores/${SIN_ID}`,
  `/admin/proveedores/${SIN_ID}/editar`,
  '/admin/gastos',
  '/admin/gastos/nuevo',
  `/admin/gastos/${SIN_ID}`,
  '/admin/gastos/categorias',
  `/admin/gastos/categorias/${SIN_ID}`,
  '/admin/gastos/recurrentes',
  '/admin/gastos/recurrentes/nuevo',
  `/admin/gastos/recurrentes/${SIN_ID}`,
  '/admin/ventas',
  '/admin/ventas/nueva',
  `/admin/ventas/${SIN_ID}`,
  '/admin/ventas/canales',
  `/admin/ventas/canales/${SIN_ID}`,
];
