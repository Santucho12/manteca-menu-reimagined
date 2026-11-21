import { ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import type { ComponentProps } from 'react';
import { ACCESO_VERDE, ICONO_DE_ACCESO_SOBRE_VERDE } from '@/components/panel/estilos';
import { Pantalla } from '@/components/panel/Pantalla';
import type { FilaDeVenta } from '@/lib/ventas/consultas';
import { ListaDeVentas } from './ListaDeVentas';
import { VueltoDeLaVenta } from './VueltoDeLaVenta';

type Props = { filas: FilaDeVenta[]; ventana: ComponentProps<typeof VueltoDeLaVenta> };

/** Lo que Caja ve de Ventas: las de los últimos 30 minutos, para abrirlas y corregirlas. */
export function VentasDeCaja({ filas, ventana }: Props) {
  return (
    <Pantalla
      titulo="Ventas"
      subtitulo="Las de los últimos 30 minutos: tocá una para verla o corregirla."
      acciones={
        <Link href="/admin/vender" className={ACCESO_VERDE}>
          <span className={ICONO_DE_ACCESO_SOBRE_VERDE}>
            <ShoppingCart size={15} aria-hidden="true" />
          </span>
          Vender
        </Link>
      }
      ayuda="ventas"
    >
      <ListaDeVentas filas={filas} total={filas.length} />
      <VueltoDeLaVenta {...ventana} />
    </Pantalla>
  );
}
