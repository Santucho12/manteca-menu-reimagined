'use client';

import { useRouter } from 'next/navigation';
import { AvisoDeError } from '@/components/formularios/AvisoDeError';
import { useAccionDelMenu } from '@/lib/menu/useAccionDelMenu';
import type { Resultado } from '@/lib/resultado';
import { BOTON_PELIGRO, BOTON_REACTIVAR } from './estilos';

type Props = {
  id: string;
  activo: boolean;
  cambiar: (datos: { id: string; activo: boolean }) => Promise<Resultado<unknown>>;
};

/** Desactivar o reactivar: nada se borra, y lo que ya se cargo con esto queda como estaba. */
export function BotonDeEstado({ id, activo, cambiar }: Props) {
  const router = useRouter();
  const { mensaje, enviando, hacer } = useAccionDelMenu();
  const alTocar = async () => {
    if (await hacer(() => cambiar({ id, activo: !activo }))) router.refresh();
  };
  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={enviando}
        onClick={alTocar}
        className={activo ? BOTON_PELIGRO : BOTON_REACTIVAR}
      >
        {activo ? 'Desactivar' : 'Reactivar'}
      </button>
      {mensaje ? <AvisoDeError mensaje={mensaje} /> : null}
    </div>
  );
}
