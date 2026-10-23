'use client';

import { AvisoDeError } from '@/components/formularios/AvisoDeError';
import {
  BOTON_ESMERALDA,
  BOTON_PELIGRO,
  BOTON_REACTIVAR,
  BOTON_SUAVE,
} from '@/components/panel/estilos';
import type { CuentaDeLaLista } from '@/lib/usuarios/pantalla';
import { ETIQUETAS_DE_ACCION, type AccionDeUsuario } from '@/lib/usuarios/presentacion';
import { Confirmacion } from './Confirmacion';
import { ContrasenaTemporal } from './ContrasenaTemporal';
import { FormularioDeCorreccion } from './FormularioDeCorreccion';
import { useAccionesDeUsuario } from './useAccionesDeUsuario';

type Props = { cuenta: CuentaDeLaLista; acciones: AccionDeUsuario[] };

// Dar un rol es la accion que avanza (verde); rechazar y desactivar, las que cortan (rosa).
const ESTILOS: Record<AccionDeUsuario, string> = {
  darCaja: BOTON_ESMERALDA,
  darAdmin: BOTON_ESMERALDA,
  rechazar: BOTON_PELIGRO,
  desactivar: BOTON_PELIGRO,
  reactivar: BOTON_REACTIVAR,
  resetear: BOTON_SUAVE,
  corregir: BOTON_SUAVE,
};

export function AccionesDeUsuario({ cuenta, acciones }: Props) {
  const { panel, mensaje, enviando, elegir, ejecutar, volver } = useAccionesDeUsuario(cuenta.id);
  if (panel.tipo === 'corregir') {
    return <FormularioDeCorreccion cuenta={cuenta} alTerminar={volver} />;
  }
  if (panel.tipo === 'confirmar') {
    return (
      <Confirmacion
        accion={panel.accion}
        nombre={cuenta.nombre}
        enviando={enviando}
        alConfirmar={() => ejecutar(panel.accion)}
        alCancelar={volver}
      />
    );
  }
  return (
    <div className="space-y-3">
      {mensaje ? <AvisoDeError mensaje={mensaje} /> : null}
      {panel.tipo === 'temporal' ? (
        <ContrasenaTemporal nombre={cuenta.nombre} contrasena={panel.contrasena} />
      ) : null}
      <div className="flex flex-wrap gap-2">
        {acciones.map((accion) => (
          <button
            key={accion}
            type="button"
            disabled={enviando}
            onClick={() => elegir(accion)}
            className={`${ESTILOS[accion]} h-10 px-4`}
          >
            {ETIQUETAS_DE_ACCION[accion]}
          </button>
        ))}
      </div>
    </div>
  );
}
