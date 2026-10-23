'use client';

import { BotonDeEstado as BotonGenerico } from '@/components/panel/BotonDeEstado';
import { cambiarEstadoDesdeElPanel } from './acciones';

/** Desactivar o reactivar: el proveedor no se borra y conserva lo que tiene cargado. */
export function BotonDeEstado({ id, activo }: { id: string; activo: boolean }) {
  return <BotonGenerico id={id} activo={activo} cambiar={cambiarEstadoDesdeElPanel} />;
}
