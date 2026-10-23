import { Plus } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { BOTON_DE_ENCABEZADO } from '@/components/panel/estilos';
import { Pantalla } from '@/components/panel/Pantalla';
import { exigirPagina } from '@/lib/acceso/servidor';
import { misCierres } from '@/lib/caja/consultas';
import { ListaDeCierres } from '../ListaDeCierres';

export const metadata: Metadata = { title: 'Mis cierres' };

const Acceso = () => (
  <Link href="/admin/caja" className={BOTON_DE_ENCABEZADO}>
    <Plus size={18} aria-hidden="true" /> Cargar cierre
  </Link>
);

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
