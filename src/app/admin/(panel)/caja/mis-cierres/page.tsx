import type { Metadata } from 'next';
import { Pantalla } from '@/components/panel/Pantalla';
import { exigirPagina } from '@/lib/acceso/servidor';
import { misCierres } from '@/lib/caja/consultas';
import { AccesoACargarCierre } from '../AccesoACargarCierre';
import { ListaDeCierres } from '../ListaDeCierres';

export const metadata: Metadata = { title: 'Mis cierres' };

const Acceso = () => <AccesoACargarCierre />;

export default async function MisCierres() {
  const { cliente, perfil } = await exigirPagina('caja');
  const filas = await misCierres(cliente, perfil.id);
  return (
    <Pantalla
      titulo="Mis cierres"
      subtitulo="Los cierres que cargaste."
      acciones={<Acceso />}
      ayuda="caja"
    >
      <ListaDeCierres filas={filas} />
    </Pantalla>
  );
}
