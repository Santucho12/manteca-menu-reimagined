/**
 * Secciones que todavía no dejan entrar desde la navegación: Costos no tiene pantalla en la
 * primera fase (pedido 87, postergado). Las demás se desbloquearon en el pedido 88.
 */
const EN_PROXIMAMENTE = ['costos'];

export const esProximamente = (clave: string) => EN_PROXIMAMENTE.includes(clave);
