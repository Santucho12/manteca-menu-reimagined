import { useState, useTransition } from 'react';
import { panelAlElegir, siguientePanel, type Panel } from '@/lib/usuarios/pantalla';
import type { AccionDeUsuario } from '@/lib/usuarios/presentacion';
import { OPERACIONES, type Operable } from './operaciones';

// Corre una operacion en el servidor y deja el mensaje si no se pudo.
function useOperacion(id: string, alTerminar: (panel: Panel) => void) {
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [enviando, iniciar] = useTransition();
  function ejecutar(accion: Operable) {
    setMensaje(null);
    iniciar(async () => {
      const resultado = await OPERACIONES[accion](id);
      if (!resultado.ok) setMensaje(resultado.mensaje);
      alTerminar(siguientePanel(resultado));
    });
  }
  return { mensaje, enviando, ejecutar };
}

/** Que muestra la tarjeta de una cuenta: los botones, una confirmacion, la correccion o la temporal. */
export function useAccionesDeUsuario(id: string) {
  const [panel, setPanel] = useState<Panel>({ tipo: 'botones' });
  const operacion = useOperacion(id, setPanel);
  function elegir(accion: AccionDeUsuario) {
    const siguiente = panelAlElegir(accion);
    setPanel(siguiente);
    if (siguiente.tipo === 'botones' && accion !== 'corregir') operacion.ejecutar(accion);
  }
  return { ...operacion, panel, elegir, volver: () => setPanel({ tipo: 'botones' }) };
}
