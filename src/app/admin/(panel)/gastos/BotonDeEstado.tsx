'use client';

import { AvisoDeError } from '@/components/formularios/AvisoDeError';
import { Button } from '@/components/ui/button';
import { useAccionDelMenu } from '@/lib/menu/useAccionDelMenu';
import type { Resultado } from '@/lib/resultado';

type Props = {
  id: string;
  activo: boolean;
  cambiar: (datos: { id: string; activo: boolean }) => Promise<Resultado<unknown>>;
};

/** Desactivar o reactivar: nada se borra, y lo que ya se cargo con esto queda como estaba. */
export function BotonDeEstado({ id, activo, cambiar }: Props) {
  const { mensaje, enviando, hacer } = useAccionDelMenu();
  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        disabled={enviando}
        onClick={() => hacer(() => cambiar({ id, activo: !activo }))}
      >
        {activo ? 'Desactivar' : 'Reactivar'}
      </Button>
      {mensaje ? <AvisoDeError mensaje={mensaje} /> : null}
    </div>
  );
}
