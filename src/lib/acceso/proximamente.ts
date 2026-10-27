/** Secciones que todavía no dejan entrar desde la navegación (Santiago, 2026-10-27). */
const EN_PROXIMAMENTE = ['proveedores', 'costos', 'reportes', 'auditoria', 'cuenta'];

export const esProximamente = (clave: string) => EN_PROXIMAMENTE.includes(clave);
