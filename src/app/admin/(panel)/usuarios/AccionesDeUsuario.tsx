'use client';

import { AvisoDeError } from '@/components/formularios/AvisoDeError';
import { BOTON_PELIGRO, BOTON_SUAVE } from '@/components/panel/estilos';
import { Interruptor } from '@/components/panel/Interruptor';
import type { Rol } from '@/lib/acceso/estados';
import type { CuentaDeLaLista } from '@/lib/usuarios/pantalla';
import {
  ETIQUETAS_DE_ACCION,
  repartirAcciones,
  type AccionDeUsuario,
} from '@/lib/usuarios/presentacion';
import { Confirmacion } from './Confirmacion';
import { ContrasenaTemporal } from './ContrasenaTemporal';
import { FormularioDeCorreccion } from './FormularioDeCorreccion';
import { MenuDeAcciones } from './MenuDeAcciones';
import { SelectorDeRol } from './SelectorDeRol';
import { useAccionesDeUsuario } from './useAccionesDeUsuario';

type Props = { cuenta: CuentaDeLaLista; rol: Rol; acciones: AccionDeUsuario[] };

// Rechazar corta (rosa) y queda a la vista; resetear y corregir van en el menú de tres puntos.
const ESTILOS: Partial<Record<AccionDeUsuario, string>> = { rechazar: BOTON_PELIGRO };
const EN_EL_MENU: AccionDeUsuario[] = ['resetear', 'corregir'];

export function AccionesDeUsuario({ cuenta, rol, acciones }: Props) {
  const { panel, mensaje, enviando, elegir, ejecutar, volver } = useAccionesDeUsuario(cuenta.id);
  const { roles, interruptor, botones } = repartirAcciones(acciones);
  const enMenu = botones.filter((a) => EN_EL_MENU.includes(a));
  const directas = botones.filter((a) => !EN_EL_MENU.includes(a));
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
    <div className="space-y-4">
      {mensaje ? <AvisoDeError mensaje={mensaje} /> : null}
      {panel.tipo === 'temporal' ? (
        <ContrasenaTemporal nombre={cuenta.nombre} contrasena={panel.contrasena} />
      ) : null}
      <div className="flex min-h-[6.75rem] flex-col justify-between gap-3">
        <div className="flex items-center justify-between gap-3">
          {roles.length > 0 ? (
            <SelectorDeRol rol={rol} deshabilitado={enviando} alElegir={elegir} />
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            {directas.map((accion) => (
              <button
                key={accion}
                type="button"
                disabled={enviando}
                onClick={() => elegir(accion)}
                className={`${ESTILOS[accion] ?? BOTON_SUAVE} h-9 px-3.5`}
              >
                {ETIQUETAS_DE_ACCION[accion]}
              </button>
            ))}
            {enMenu.length > 0 ? (
              <MenuDeAcciones acciones={enMenu} deshabilitado={enviando} alElegir={elegir} />
            ) : null}
          </div>
        </div>
        <div className="flex h-6 justify-end">
          {interruptor ? (
            <label className="flex items-center gap-2.5 text-xs font-bold text-foreground">
              Cuenta activa
              <Interruptor
                activo={interruptor === 'desactivar'}
                etiqueta="Cuenta activa"
                deshabilitado={enviando}
                alCambiar={() => elegir(interruptor)}
              />
            </label>
          ) : null}
        </div>
      </div>
    </div>
  );
}
