'use client';

import { AvisoDeError } from '@/components/formularios/AvisoDeError';
import { Button } from '@/components/ui/button';
import type { CuentaDeLaLista } from '@/lib/usuarios/pantalla';
import { ETIQUETAS_DE_ACCION, type AccionDeUsuario } from '@/lib/usuarios/presentacion';
import { Confirmacion } from './Confirmacion';
import { ContrasenaTemporal } from './ContrasenaTemporal';
import { FormularioDeCorreccion } from './FormularioDeCorreccion';
import { useAccionesDeUsuario } from './useAccionesDeUsuario';

type Props = { cuenta: CuentaDeLaLista; acciones: AccionDeUsuario[] };

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
          <Button key={accion} variant="outline" disabled={enviando} onClick={() => elegir(accion)}>
            {ETIQUETAS_DE_ACCION[accion]}
          </Button>
        ))}
      </div>
    </div>
  );
}
