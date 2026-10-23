'use client';

import { Ban } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AvisoDeError } from '@/components/formularios/AvisoDeError';
import { Campo } from '@/components/formularios/Campo';
import { useGuardar } from '@/lib/gastos/useGuardar';
import type { Resultado } from '@/lib/resultado';
import { BOTON_CANCELAR, BOTON_PELIGRO } from './estilos';
import { Ventana } from './Ventana';

type Props = {
  id: string;
  anular: (datos: { id: string; motivo: string }) => Promise<Resultado<unknown>>;
  /** Lo que se anula, para el titulo de la ventana: "Anular el gasto". */
  titulo: string;
};

/** Nada se borra: se anula con motivo, deja de contar y queda en el historial. */
export function BotonDeAnular({ id, anular, titulo }: Props) {
  const router = useRouter();
  const [abierta, setAbierta] = useState(false);
  const [motivo, setMotivo] = useState('');
  const guardado = useGuardar(anular, () => {
    setAbierta(false);
    router.refresh();
  });
  return (
    <>
      <button type="button" onClick={() => setAbierta(true)} className={BOTON_PELIGRO}>
        <Ban size={14} aria-hidden="true" />
        Anular
      </button>
      <Ventana abierta={abierta} cerrar={() => setAbierta(false)} titulo={titulo}>
        <div className="space-y-5">
          {guardado.mensaje ? <AvisoDeError mensaje={guardado.mensaje} /> : null}
          <Campo
            id="motivo"
            etiqueta="Motivo"
            value={motivo}
            onChange={(evento) => setMotivo(evento.target.value)}
          />
          <div className="flex flex-col-reverse sm:flex-row gap-3">
            <button type="button" onClick={() => setAbierta(false)} className={BOTON_CANCELAR}>
              Cancelar
            </button>
            <button
              type="button"
              disabled={guardado.enviando}
              onClick={() => guardado.enviar({ id, motivo })}
              className="flex-[2] h-12 rounded-xl bg-rose-600 text-white font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-rose-600/20 active:scale-95 transition-all disabled:opacity-60"
            >
              Confirmar anulación
            </button>
          </div>
        </div>
      </Ventana>
    </>
  );
}
