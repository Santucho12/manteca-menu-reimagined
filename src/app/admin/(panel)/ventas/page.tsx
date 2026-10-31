import { FileSpreadsheet, Plus, Store } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { FranjaDeAviso } from '@/components/panel/Avisos';
import {
  ACCESO_SECUNDARIO,
  ACCESO_VERDE,
  ICONO_DE_ACCESO_SOBRE_VERDE,
  ICONO_DE_ACCESO_SUAVE,
} from '@/components/panel/estilos';
import { Paginas } from '@/components/panel/Paginas';
import { Pantalla } from '@/components/panel/Pantalla';
import { exigirPaginaYLeer } from '@/lib/acceso/servidor';
import { diaEnArgentina } from '@/lib/fechas';
import { cantidadDePaginas } from '@/lib/usuarios/presentacion';
import { listarVentas } from '@/lib/ventas/consultas';
import { enlaceDeVentas, filtrosDeVentas, type ParametrosDeVentas } from '@/lib/ventas/pantalla';
import { FiltrosDeVentas } from './FiltrosDeVentas';
import { ListaDeVentas } from './ListaDeVentas';
import { TarjetasDeVentas } from './TarjetasDeVentas';

export const metadata: Metadata = { title: 'Ventas' };

function Accesos() {
  return (
    <>
      <Link href="/admin/ventas/nueva" className={ACCESO_SECUNDARIO}>
        <span className={ICONO_DE_ACCESO_SUAVE}>
          <Plus size={16} strokeWidth={2.6} aria-hidden="true" />
        </span>
        Cargar venta
      </Link>
      <Link href="/admin/ventas/subir" className={ACCESO_VERDE}>
        <span className={ICONO_DE_ACCESO_SOBRE_VERDE}>
          <FileSpreadsheet size={15} aria-hidden="true" />
        </span>
        Subir Excel de Fudo
      </Link>
      <Link href="/admin/ventas/canales" className={ACCESO_SECUNDARIO}>
        <span className={ICONO_DE_ACCESO_SUAVE}>
          <Store size={15} aria-hidden="true" />
        </span>
        Tipos de venta
      </Link>
    </>
  );
}

export default async function PaginaDeVentas({
  searchParams,
}: {
  searchParams: Promise<ParametrosDeVentas>;
}) {
  const hoy = diaEnArgentina(new Date());
  const filtros = filtrosDeVentas(await searchParams, hoy);
  const { datos: lista } = await exigirPaginaYLeer('admin', (cliente) =>
    listarVentas(cliente, filtros),
  );
  return (
    <Pantalla
      titulo="Ventas"
      subtitulo="Las ventas del período, con su total."
      acciones={<Accesos />}
      ayuda="ventas"
    >
      <FranjaDeAviso>
        <p>
          Fudo todavía no está conectado: sus ventas entran subiendo el Excel de Fudo, y se ven
          junto con las cargadas a mano.
        </p>
      </FranjaDeAviso>
      <FiltrosDeVentas filtros={filtros} />
      <TarjetasDeVentas totales={lista.totales} />
      <ListaDeVentas filas={lista.filas} total={lista.total} />
      <Paginas
        pagina={lista.pagina}
        ultima={cantidadDePaginas(lista.total)}
        enlaceA={(pagina) => enlaceDeVentas({ ...filtros, pagina }, hoy)}
      />
    </Pantalla>
  );
}
