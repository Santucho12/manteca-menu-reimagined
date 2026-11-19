import type { Metadata } from 'next';
import { Pantalla } from '@/components/panel/Pantalla';
import { exigirPaginaYLeer } from '@/lib/acceso/servidor';
import { catalogoParaVender } from '@/lib/vender/consultas';
import { Mostrador } from './Mostrador';

export const metadata: Metadata = { title: 'Vender' };

export default async function PaginaDeVender() {
  const { datos: catalogo } = await exigirPaginaYLeer('caja', catalogoParaVender);
  return (
    <Pantalla titulo="Vender" subtitulo="Tocá lo que lleva el cliente y cobrá." ayuda="vender">
      <Mostrador catalogo={catalogo} />
    </Pantalla>
  );
}
