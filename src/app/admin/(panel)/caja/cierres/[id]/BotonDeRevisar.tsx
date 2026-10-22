'use client';

import { CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AvisoDeError } from '@/components/formularios/AvisoDeError';
import { Campo } from '@/components/formularios/Campo';
import { BOTON_CANCELAR, BOTON_ESMERALDA } from '@/components/panel/estilos';
import { Ventana } from '@/components/panel/Ventana';
import { useGuardar } from '@/lib/gastos/useGuardar';
import { revisarCierreDesdeElPanel } from '../../acciones';

/** El admin controla el cierre y lo marca como revisado, con un comentario. */
export function BotonDeRevisar({ id }: { id: string }) {
  const router = useRouter();
  const [abierta, setAbierta] = useState(false);
  const [comentario, setComentario] = useState('');
  const guardado = useGuardar(revisarCierreDesdeElPanel, () => {
    setAbierta(false);
    router.refresh();
  });
  return (
    <>
      <button type="button" onClick={() => setAbierta(true)} className={BOTON_ESMERALDA}>
        <CheckCircle2 size={14} aria-hidden="true" />
        Marcar como revisado
      </button>
      <Ventana abierta={abierta} cerrar={() => setAbierta(false)} titulo="Revisar el cierre">
        <div className="space-y-5">
          {guardado.mensaje ? <AvisoDeError mensaje={guardado.mensaje} /> : null}
          <Campo
            id="comentario-de-revision"
            etiqueta="Comentario de la revisión"
            value={comentario}
            onChange={(evento) => setComentario(evento.target.value)}
          />
          <div className="flex flex-col-reverse sm:flex-row gap-3">
            <button type="button" onClick={() => setAbierta(false)} className={BOTON_CANCELAR}>
              Cancelar
            </button>
            <button
              type="button"
              disabled={guardado.enviando}
              onClick={() => guardado.enviar({ id, comentario })}
              className={`${BOTON_ESMERALDA} flex-[2]`}
            >
              Confirmar revisión
            </button>
          </div>
        </div>
      </Ventana>
    </>
  );
}
