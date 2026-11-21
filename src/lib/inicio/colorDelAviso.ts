/**
 * El color de un aviso de Para atender: el de la sección a la que lleva (Santiago, 2026-11-21), sin
 * verde, rojo ni gris, que dicen bien, mal y apagado.
 */
export type ColorDelAviso = { nombre: string; fondo: string; texto: string; borde: string };

// Escritas enteras para que Tailwind las encuentre.
const SECCIONES: ColorDelAviso[] = [
  { nombre: 'caja', fondo: 'bg-teal-50', texto: 'text-teal-600', borde: 'border-teal-200' },
  { nombre: 'gastos', fondo: 'bg-blue-50', texto: 'text-blue-600', borde: 'border-blue-200' },
  {
    nombre: 'ventas',
    fondo: 'bg-blue-50',
    texto: 'text-blue-600',
    borde: 'border-blue-200',
  },
  { nombre: 'usuarios', fondo: 'bg-teal-50', texto: 'text-teal-600', borde: 'border-teal-200' },
  { nombre: 'costos', fondo: 'bg-blue-50', texto: 'text-blue-700', borde: 'border-blue-200' },
];
const NEUTRO: ColorDelAviso = {
  nombre: 'otro',
  fondo: 'bg-slate-50',
  texto: 'text-slate-600',
  borde: 'border-slate-200',
};

export function colorDelAviso(enlace: string): ColorDelAviso {
  const seccion = enlace.split('?')[0]!.split('/')[2] ?? '';
  return SECCIONES.find((s) => s.nombre === seccion) ?? NEUTRO;
}
