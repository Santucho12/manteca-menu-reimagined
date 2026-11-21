import type { Metadata } from 'next';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { ACCESO_VERDE, ICONO_DE_ACCESO_SOBRE_VERDE } from '@/components/panel/estilos';
import { Pantalla } from '@/components/panel/Pantalla';
import { exigirPaginaYLeer } from '@/lib/acceso/servidor';
import { misCierresDeLaSesion } from '@/lib/caja/consultas';
import { TablaDeCierres } from '../TablaDeCierres';

export const metadata: Metadata = { title: 'Mis cierres' };

const CargarCierre = () => (
  <Link href="/admin/caja" className={ACCESO_VERDE}>
    <span className={ICONO_DE_ACCESO_SOBRE_VERDE}>
      <Plus size={15} aria-hidden="true" />
    </span>
    Cargar cierre
  </Link>
);

export default async function MisCierres() {
  const { datos: filas } = await exigirPaginaYLeer('caja', misCierresDeLaSesion);
  return (
    <Pantalla
      titulo="Mis cierres"
      subtitulo="Los cierres que cargaste."
      acciones={<CargarCierre />}
      ayuda="caja"
    >
      <TablaDeCierres filas={filas} />
    </Pantalla>
  );
}
