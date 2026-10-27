'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useBloquearElFondo, useCerrarConEscape, useDestinoEnMain } from '@/lib/panel/ventanas';
import { CERRAR_VENTANA } from './estilos';

type Props = {
  abierta: boolean;
  cerrar: () => void;
  titulo: string;
  /** 'alertdialog' para las confirmaciones. */
  rol?: 'dialog' | 'alertdialog';
  ancho?: 'max-w-md' | 'max-w-lg';
  children: ReactNode;
};

/**
 * La ventana de Plan Reminder Pro: abajo en el celular, al centro desde sm. Va a main con un
 * portal, afuera de lo animado, para que su alert quede donde lo buscan las pruebas.
 */
export function Ventana({
  abierta,
  cerrar,
  titulo,
  rol = 'dialog',
  ancho = 'max-w-md',
  children,
}: Props) {
  const destino = useDestinoEnMain();
  useCerrarConEscape(abierta, cerrar);
  useBloquearElFondo(abierta);
  const ventana = (
    <AnimatePresence>
      {abierta ? (
        <div
          key="ventana"
          onClick={cerrar}
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in-fade"
        >
          <motion.div
            role={rol}
            aria-modal="true"
            aria-labelledby="titulo-de-ventana"
            onClick={(evento) => evento.stopPropagation()}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={`bg-card w-full ${ancho} rounded-t-3xl sm:rounded-3xl shadow-2xl border border-border p-6 space-y-5 max-h-[92vh] overflow-y-auto`}
          >
            <div className="flex items-start justify-between gap-4">
              <h2 id="titulo-de-ventana" className="text-xl font-bold tracking-tight break-words">
                {titulo}
              </h2>
              <button
                type="button"
                aria-label="Cerrar"
                onClick={cerrar}
                className={`${CERRAR_VENTANA} shrink-0`}
              >
                <X size={20} />
              </button>
            </div>
            {children}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
  return destino ? createPortal(ventana, destino) : null;
}
