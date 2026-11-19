'use client';

import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import Link from 'next/link';
import { createPortal } from 'react-dom';
import { BOTON_PRINCIPAL, BOTON_SUAVE } from '@/components/panel/estilos';
import { enlaceDelCierre, textoDeLaTraba, type EstadoDelTurno } from '@/lib/caja/turnos';
import { useBloquearElFondo, useDestinoEnMain } from '@/lib/panel/ventanas';

type Props = {
  estado: EstadoDelTurno;
  postergar: () => void;
  postergando: boolean;
  error?: string;
};

/**
 * La traba del cierre: no se cierra con Escape ni tocando afuera. Se sale cargando el cierre o
 * postergándolo; después del cierre de la noche, no hay postergación.
 */
export function VentanaDelCierre({ estado, postergar, postergando, error }: Props) {
  const destino = useDestinoEnMain();
  useBloquearElFondo(true);
  const ventana = (
    <div className="fixed inset-0 z-[110] flex items-end justify-center bg-slate-900/60 backdrop-blur-xs sm:items-center sm:p-4">
      <motion.div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="titulo-del-cierre"
        aria-describedby="texto-del-cierre"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md space-y-5 rounded-t-3xl border border-border bg-card p-6 shadow-2xl sm:rounded-3xl"
      >
        <div className="flex items-center gap-3">
          <Clock className="text-primary" size={26} aria-hidden />
          <h2 id="titulo-del-cierre" className="text-xl font-bold tracking-tight">
            Cierre de caja
          </h2>
        </div>
        <p id="texto-del-cierre" className="text-sm font-medium">
          {textoDeLaTraba(estado)}
        </p>
        {error ? (
          <p role="alert" className="text-sm font-semibold text-rose-700">
            {error}
          </p>
        ) : null}
        {estado.motivo === 'cerrada' ? null : (
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              className={BOTON_SUAVE}
              onClick={postergar}
              disabled={postergando}
            >
              {postergando ? 'Postergando...' : 'Postergar 10 min'}
            </button>
            <Link href={enlaceDelCierre(estado)} className={BOTON_PRINCIPAL} autoFocus>
              Hacer el cierre
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  );
  return destino ? createPortal(ventana, destino) : null;
}
