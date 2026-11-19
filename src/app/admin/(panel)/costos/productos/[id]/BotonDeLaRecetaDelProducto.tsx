'use client';

import { useRouter } from 'next/navigation';
import { AvisoDeError } from '@/components/formularios/AvisoDeError';
import { ENLACE_EN_TEXTO } from '@/components/panel/Avisos';
import { useAccionDelMenu } from '@/lib/menu/useAccionDelMenu';
import { usarLaRecetaDelProductoDesdeElPanel } from '../../acciones';

type Props = { productoId: string; presentacionId: string };

/** La presentacion deja su receta propia: vuelve a la del producto por sus unidades. */
export function BotonDeLaRecetaDelProducto({ productoId, presentacionId }: Props) {
  const router = useRouter();
  const { mensaje, enviando, hacer } = useAccionDelMenu();
  const alTocar = async () => {
    const datos = { productoId, presentacionId };
    if (await hacer(() => usarLaRecetaDelProductoDesdeElPanel(datos))) {
      router.push(`/admin/costos/productos/${productoId}`);
      router.refresh();
    }
  };
  return (
    <>
      <button type="button" disabled={enviando} onClick={alTocar} className={ENLACE_EN_TEXTO}>
        Usar la receta del producto
      </button>
      {mensaje ? <AvisoDeError mensaje={mensaje} /> : null}
    </>
  );
}
