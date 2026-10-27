import type { Metadata } from 'next';
import { InicioAdmin } from '@/components/inicio/InicioAdmin';
import { EsperaDeAcceso, InicioCaja } from '@/components/panel/Inicios';
import { exigirPagina } from '@/lib/acceso/servidor';
import { diaEnArgentina } from '@/lib/fechas';
import { datosDelInicio } from '@/lib/inicio/consultas';

export const metadata: Metadata = { title: 'Inicio' };

// Cada pagina se controla sola: Next.js no vuelve a armar el layout en cada navegacion.
export default async function PaginaInicio() {
  const { cliente, perfil, estado } = await exigirPagina('panel');
  if (estado === 'admin') {
    const hoy = diaEnArgentina(new Date());
    return <InicioAdmin datos={await datosDelInicio(cliente, hoy)} hoy={hoy} />;
  }
  if (estado === 'caja') return <InicioCaja nombre={perfil.nombre} />;
  return <EsperaDeAcceso />;
}
