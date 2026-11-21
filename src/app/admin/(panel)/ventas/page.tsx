import { ShoppingCart, Store } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ACCESO_SECUNDARIO,
  ACCESO_VERDE,
  ICONO_DE_ACCESO_SOBRE_VERDE,
  ICONO_DE_ACCESO_SUAVE,
} from '@/components/panel/estilos';
import { Paginas } from '@/components/panel/Paginas';
import { Pantalla } from '@/components/panel/Pantalla';
import { exigirPaginaYLeer } from '@/lib/acceso/servidor';
import { personasDeCaja } from '@/lib/caja/consultas';
import { diaEnArgentina } from '@/lib/fechas';
import { cantidadDePaginas } from '@/lib/usuarios/presentacion';
import { canalesDeVenta, listarVentas, ventasRecientes } from '@/lib/ventas/consultas';
import { enlaceDeVentas, filtrosDeVentas, type ParametrosDeVentas } from '@/lib/ventas/pantalla';
import { FiltrosDeVentas } from './FiltrosDeVentas';
import { ListaDeVentas } from './ListaDeVentas';
import { TarjetasDeVentas } from './TarjetasDeVentas';
import { VentasDeCaja } from './VentasDeCaja';
import { VueltoDeLaVenta } from './VueltoDeLaVenta';
import { datosDeLaVentana } from './ventanaAlCobrar';

export const metadata: Metadata = { title: 'Ventas' };

function Accesos() {
  return (
    <>
      <Link href="/admin/vender" className={ACCESO_VERDE}>
        <span className={ICONO_DE_ACCESO_SOBRE_VERDE}>
          <ShoppingCart size={15} aria-hidden="true" />
        </span>
        Vender
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
  const parametros = await searchParams;
  // El admin y Caja: Caja ve solo las de los últimos 30 minutos, sin filtros ni totales (pedido 102).
  const { cliente, estado } = await exigirPaginaYLeer('caja', async () => null);
  const ventana = await datosDeLaVentana(cliente, parametros);
  if (estado === 'caja') {
    return <VentasDeCaja filas={await ventasRecientes(cliente, new Date())} ventana={ventana} />;
  }
  const hoy = diaEnArgentina(new Date());
  const filtros = filtrosDeVentas(parametros, hoy);
  const [lista, tipos, personas] = await Promise.all([
    listarVentas(cliente, filtros),
    canalesDeVenta(cliente),
    personasDeCaja(cliente),
  ]);
  return (
    <Pantalla
      titulo="Ventas"
      subtitulo="Las ventas del período, con su total."
      acciones={<Accesos />}
      ayuda="ventas"
    >
      <FiltrosDeVentas filtros={filtros} tipos={tipos} personas={personas} />
      <TarjetasDeVentas totales={lista.totales} />
      <ListaDeVentas
        filas={lista.filas}
        total={lista.total}
        tipos={tipos.filter((t) => t.activo).map((t) => t.nombre)}
      />
      <Paginas
        pagina={lista.pagina}
        ultima={cantidadDePaginas(lista.total)}
        enlaceA={(pagina) => enlaceDeVentas({ ...filtros, pagina }, hoy)}
      />
      <VueltoDeLaVenta {...ventana} />
    </Pantalla>
  );
}
