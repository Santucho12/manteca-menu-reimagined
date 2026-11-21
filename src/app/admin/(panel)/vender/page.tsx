import type { Metadata } from 'next';
import { Pantalla } from '@/components/panel/Pantalla';
import { exigirPaginaYLeer } from '@/lib/acceso/servidor';
import { catalogoParaVender, porArmar, tiposParaVender } from '@/lib/vender/consultas';
import { productosParaArmar } from '@/lib/vender/surtidas';
import { MOSTRAR_SURTIDAS } from '@/lib/vender/catalogo';
import { Mostrador } from './Mostrador';
import { PorArmarEnVender } from './PorArmarEnVender';
import { VentasSinMandar } from './VentasSinMandar';

export const metadata: Metadata = { title: 'Vender' };

export default async function PaginaDeVender() {
  const { datos } = await exigirPaginaYLeer('caja', (cliente) =>
    Promise.all([catalogoParaVender(cliente), tiposParaVender(cliente), porArmar(cliente)]),
  );
  const [catalogo, tipos, pendientes] = datos;
  const productos = Object.fromEntries(
    pendientes.map((p) => [p.categoriaId, productosParaArmar(catalogo, p.categoriaId)]),
  );
  return (
    <Pantalla titulo="Vender" subtitulo="Tocá lo que lleva el cliente y cobrá." ayuda="vender">
      <VentasSinMandar />
      {/* Con Surtidas oculta (Santiago, 2026-11-20), tampoco se muestra Por armar. */}
      {MOSTRAR_SURTIDAS ? <PorArmarEnVender pendientes={pendientes} productos={productos} /> : null}
      <Mostrador catalogo={catalogo} tipos={tipos} />
    </Pantalla>
  );
}
