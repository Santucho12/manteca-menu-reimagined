'use client';

import { AvisoDeError } from '@/components/formularios/AvisoDeError';
import { Button } from '@/components/ui/button';
import { useAccionDelMenu } from '@/lib/menu/useAccionDelMenu';
import { cambiarEstadoDesdeElPanel } from './acciones';

/** Desactivar o reactivar: el proveedor no se borra y conserva lo que tiene cargado. */
export function BotonDeEstado({ id, activo }: { id: string; activo: boolean }) {
  const { mensaje, enviando, hacer } = useAccionDelMenu();
  return (
    <div className="space-y-2">
      <Button
        variant="outline"
        disabled={enviando}
        onClick={() => hacer(() => cambiarEstadoDesdeElPanel({ id, activo: !activo }))}
      >
        {activo ? 'Desactivar' : 'Reactivar'}
      </Button>
      {mensaje ? <AvisoDeError mensaje={mensaje} /> : null}
    </div>
  );
}
