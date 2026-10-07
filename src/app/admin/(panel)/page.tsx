import type { Metadata } from 'next';
import { EsperaDeAcceso, InicioAdmin, InicioCaja } from '@/components/panel/Inicios';
import { exigirPagina, pendientesActuales } from '@/lib/acceso/servidor';

export const metadata: Metadata = { title: 'Inicio' };

// Cada pagina se controla sola: Next.js no vuelve a armar el layout en cada navegacion.
export default async function PaginaInicio() {
  const { cliente, perfil, estado } = await exigirPagina('panel');
  if (estado === 'admin') return <InicioAdmin pendientes={await pendientesActuales(cliente)} />;
  if (estado === 'caja') return <InicioCaja nombre={perfil.nombre} />;
  return <EsperaDeAcceso />;
}
