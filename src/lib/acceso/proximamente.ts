// Secciones que todavia no se abren desde el panel: se ven, pero no llevan a ningun lado.
const PROXIMAMENTE = ['proveedores', 'reportes', 'auditoria', 'cuenta'];

export const esProximamente = (clave: string) => PROXIMAMENTE.includes(clave);
