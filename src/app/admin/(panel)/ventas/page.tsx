import { Plus } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { FranjaDeAviso } from '@/components/panel/Avisos';
import { BOTON_DE_ENCABEZADO, BOTON_DE_ENCABEZADO_NEUTRO } from '@/components/panel/estilos';
import { Paginas } from '@/components/panel/Paginas';
import { Pantalla } from '@/components/panel/Pantalla';
import { exigirPagina } from '@/lib/acceso/servidor';
import { diaEnArgentina } from '@/lib/fechas';
import { cantidadDePaginas } from '@/lib/usuarios/presentacion';
import { listarVentas } from '@/lib/ventas/consultas';
import {
  enlaceDeVentas,
  filtrosDeVentas,
  lineasDelResumen,
  type ParametrosDeVentas,
} from '@/lib/ventas/pantalla';
import { FiltrosDeVentas } from './FiltrosDeVentas';
import { ListaDeVentas } from './ListaDeVentas';

export const metadata: Metadata = { title: 'Ventas' };

function Accesos() {
  return (
    <>
      <Link href="/admin/ventas/nueva" className={BOTON_DE_ENCABEZADO}>
        <Plus size={18} aria-hidden="true" /> Cargar venta
      </Link>
      <Link href="/admin/ventas/canales" className={BOTON_DE_ENCABEZADO_NEUTRO}>
        Canales
      </Link>
    </>
  );
}

export default async function PaginaDeVentas({
  searchParams,
}: {
  searchParams: Promise<ParametrosDeVentas>;
}) {
  const { cliente } = await exigirPagina('admin');
  const hoy = diaEnArgentina(new Date());
  const filtros = filtrosDeVentas(await searchParams, hoy);
  const lista = await listarVentas(cliente, filtros);
  return (
    <Pantalla
      titulo="Ventas"
      subtitulo="Las ventas del período, con su total."
      acciones={<Accesos />}
      ayuda="ventas"
    >
      <FranjaDeAviso>
        <p>Fudo todavía no está conectado: por ahora se ven las ventas cargadas a mano.</p>
      </FranjaDeAviso>
      <FiltrosDeVentas filtros={filtros} />
      <div className="space-y-1">
        {lineasDelResumen(lista.totales, filtros.estado).map((linea) => (
          <p key={linea} className="text-lg font-bold">
            {linea}
          </p>
        ))}
      </div>
      <ListaDeVentas filas={lista.filas} total={lista.total} />
      <Paginas
        pagina={lista.pagina}
        ultima={cantidadDePaginas(lista.total)}
        enlaceA={(pagina) => enlaceDeVentas({ ...filtros, pagina }, hoy)}
      />
    </Pantalla>
  );
}
