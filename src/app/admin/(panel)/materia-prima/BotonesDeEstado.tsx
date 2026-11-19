'use client';

import { BotonDeEstado } from '@/components/panel/BotonDeEstado';
import { cambiarEstadoDeFormaDesdeElPanel, cambiarEstadoDeInsumoDesdeElPanel } from './acciones';

type Props = { id: string; activo: boolean };

/** Desactivar o reactivar un insumo: no se borra y las recetas que lo usan lo conservan. */
export function EstadoDelInsumo({ id, activo }: Props) {
  return <BotonDeEstado id={id} activo={activo} cambiar={cambiarEstadoDeInsumoDesdeElPanel} />;
}

/** Una forma de compra desactivada no cuenta para el costo del insumo. */
export function EstadoDeLaForma({ id, activo }: Props) {
  return <BotonDeEstado id={id} activo={activo} cambiar={cambiarEstadoDeFormaDesdeElPanel} />;
}
