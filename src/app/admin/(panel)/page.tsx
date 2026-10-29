import type { Metadata } from 'next';
import { InicioAdmin } from '@/components/inicio/InicioAdmin';
import { EsperaDeAcceso, InicioCaja } from '@/components/panel/Inicios';
import { exigirPaginaConLectura } from '@/lib/acceso/servidor';
import { diaEnArgentina } from '@/lib/fechas';
import { datosDelInicio } from '@/lib/inicio/consultas';

export const metadata: Metadata = { title: 'Inicio' };

// Cada pagina se controla sola: Next.js no vuelve a armar el layout en cada navegacion. Lo del
// admin sale junto con el acceso; a Caja o a un invitado la base no le da nada y se descarta.
export default async function PaginaInicio() {
  const hoy = diaEnArgentina(new Date());
  const { perfil, estado, lectura } = await exigirPaginaConLectura('panel', (cliente) =>
    datosDelInicio(cliente, hoy),
  );
  if (estado === 'admin') return <InicioAdmin datos={await lectura} hoy={hoy} />;
  if (estado === 'caja') return <InicioCaja nombre={perfil.nombre} />;
  return <EsperaDeAcceso />;
}
