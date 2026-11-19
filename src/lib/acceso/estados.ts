export type Rol = 'invitado' | 'caja' | 'encargado' | 'admin';

export type PerfilDeAcceso = {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  activo: boolean;
  debe_cambiar_contrasena: boolean;
};

export type EstadoDeAcceso = 'sin-sesion' | 'desactivado' | 'cambiar-contrasena' | Rol;

/**
 * Lo que pide cada pagina: publica (ingreso y registro), panel, cuenta, caja (cargar y ver los
 * cierres propios), admin o el cambio obligado.
 */
export type Pagina = 'publica' | 'panel' | 'cuenta' | 'caja' | 'admin' | 'cambiar-contrasena';

export type EnlaceDelPanel = {
  clave:
    | 'inicio'
    | 'vender'
    | 'menu'
    | 'ventas'
    | 'proveedores'
    | 'costos'
    | 'gastos'
    | 'caja'
    | 'reportes'
    | 'cierres'
    | 'usuarios'
    | 'auditoria'
    | 'cuenta';
  href: string;
  texto: string;
  /** El titulo del grupo de la barra lateral; Mi cuenta no lleva: va aparte, abajo. */
  grupo?: 'Día a día' | 'Plata' | 'Ajustes';
};

const INGRESAR = '/admin/ingresar';
const PANEL = '/admin';
const RUTAS_ABIERTAS = ['/admin/ingresar', '/admin/registro'];

// Quien entra a cada pagina que exige sesion.
const PERMITIDOS: Record<Exclude<Pagina, 'publica'>, readonly EstadoDeAcceso[]> = {
  panel: ['invitado', 'encargado', 'caja', 'admin'],
  cuenta: ['caja', 'admin'],
  caja: ['caja', 'admin'],
  admin: ['admin'],
  'cambiar-contrasena': ['cambiar-contrasena'],
};

const ENLACES: Record<'caja' | 'admin', EnlaceDelPanel[]> = {
  caja: [
    { clave: 'vender', href: '/admin/vender', texto: 'Vender' },
    { clave: 'caja', href: '/admin/caja', texto: 'Cargar cierre' },
    { clave: 'cierres', href: '/admin/caja/mis-cierres', texto: 'Mis cierres' },
    { clave: 'cuenta', href: '/admin/cuenta', texto: 'Mi cuenta' },
  ],
  admin: [
    // Sin Vender: el admin entra desde Ventas, y la barra entra entera en una pantalla baja.
    { clave: 'inicio', href: '/admin', texto: 'Inicio', grupo: 'Día a día' },
    { clave: 'ventas', href: '/admin/ventas', texto: 'Ventas', grupo: 'Día a día' },
    { clave: 'caja', href: '/admin/caja/control', texto: 'Caja', grupo: 'Día a día' },
    { clave: 'gastos', href: '/admin/gastos', texto: 'Gastos', grupo: 'Plata' },
    { clave: 'proveedores', href: '/admin/proveedores', texto: 'Proveedores', grupo: 'Plata' },
    // Segunda fase: por ahora la navegación solo avisa "Próximamente" (src/lib/acceso/proximamente.ts).
    { clave: 'costos', href: '/admin/costos', texto: 'Costos', grupo: 'Plata' },
    { clave: 'reportes', href: '/admin/reportes', texto: 'Reportes', grupo: 'Plata' },
    { clave: 'menu', href: '/admin/menu', texto: 'Menú', grupo: 'Ajustes' },
    { clave: 'usuarios', href: '/admin/usuarios', texto: 'Usuarios', grupo: 'Ajustes' },
    { clave: 'auditoria', href: '/admin/auditoria', texto: 'Auditoría', grupo: 'Ajustes' },
    { clave: 'cuenta', href: '/admin/cuenta', texto: 'Mi cuenta' },
  ],
};

export function estadoDeAcceso(perfil: PerfilDeAcceso | null): EstadoDeAcceso {
  if (!perfil) return 'sin-sesion';
  if (!perfil.activo) return 'desactivado';
  if (perfil.debe_cambiar_contrasena) return 'cambiar-contrasena';
  return perfil.rol;
}

/** Adonde mandar a alguien que pide una pagina, o null si puede verla. */
export function destinoDe(estado: EstadoDeAcceso, pagina: Pagina): string | null {
  if (pagina === 'publica') {
    return estado === 'sin-sesion' || estado === 'desactivado' ? null : PANEL;
  }
  if (estado === 'sin-sesion') return INGRESAR;
  if (estado === 'desactivado') return '/admin/salir?motivo=desactivada';
  if (PERMITIDOS[pagina].includes(estado)) return null;
  return estado === 'cambiar-contrasena' ? '/admin/cambiar-contrasena' : PANEL;
}

/** Si una ruta exige sesion. Ingreso y registro quedan abiertos. */
export function requiereSesion(ruta: string): boolean {
  if (RUTAS_ABIERTAS.some((abierta) => ruta === abierta || ruta.startsWith(`${abierta}/`))) {
    return false;
  }
  return ruta === PANEL || ruta.startsWith(`${PANEL}/`);
}

export function enlacesDelPanel(estado: EstadoDeAcceso): EnlaceDelPanel[] {
  return estado === 'caja' || estado === 'admin' ? ENLACES[estado] : [];
}
