'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Ellipsis, X } from 'lucide-react';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import type { EnlaceDelMarco } from '@/lib/acceso/marco';
import { activoEnMas, insigniaDeMas } from '@/lib/acceso/navegacion';
import { useBloquearElFondo, useCerrarConEscape, useDestinoEnMain } from '@/lib/panel/ventanas';
import { cn } from '@/lib/utils';
import { EnlaceLateral } from './EnlaceLateral';
import { CERRAR_VENTANA, LUGAR_DE_ABAJO } from './estilos';
import { Insignia } from './Insignia';

type Props = { enlaces: EnlaceDelMarco[]; activo: string | null };

/** "Mas" (extension): el quinto lugar de abajo. La hoja va a main con un portal. */
export function MasSecciones({ enlaces, activo }: Props) {
  const [abierta, setAbierta] = useState(false);
  const destino = useDestinoEnMain();
  const marcado = activoEnMas(enlaces, activo);
  const hoja = (
    <HojaDeMas
      enlaces={enlaces}
      activo={activo}
      abierta={abierta}
      cerrar={() => setAbierta(false)}
    />
  );
  return (
    <>
      <button
        type="button"
        onClick={() => setAbierta(true)}
        aria-haspopup="dialog"
        aria-expanded={abierta}
        className={cn(LUGAR_DE_ABAJO, marcado ? 'text-primary' : 'text-muted-foreground')}
      >
        <span className="relative">
          <Insignia numero={insigniaDeMas(enlaces)} />
          <Ellipsis size={20} strokeWidth={marcado ? 2.5 : 2} />
        </span>
        <span className="truncate max-w-full px-0.5">Más</span>
      </button>
      {destino ? createPortal(hoja, destino) : null}
    </>
  );
}

type PropsDeLaHoja = Props & { abierta: boolean; cerrar: () => void };

function HojaDeMas({ enlaces, activo, abierta, cerrar }: PropsDeLaHoja) {
  useCerrarConEscape(abierta, cerrar);
  useBloquearElFondo(abierta);
  return (
    <AnimatePresence>
      {abierta ? (
        <div
          key="mas"
          onClick={cerrar}
          className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-900/60 backdrop-blur-xs animate-in-fade lg:hidden"
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-de-mas"
            onClick={(evento) => evento.stopPropagation()}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="bg-card w-full rounded-t-3xl shadow-2xl border border-border overflow-hidden max-h-[92vh] overflow-y-auto pb-[env(safe-area-inset-bottom)]"
          >
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h2 id="titulo-de-mas" className="text-xl font-bold tracking-tight">
                Más secciones
              </h2>
              <button type="button" aria-label="Cerrar" onClick={cerrar} className={CERRAR_VENTANA}>
                <X size={20} />
              </button>
            </div>
            <nav aria-label="Más secciones" className="p-4 space-y-1">
              {enlaces.map((enlace) => (
                <EnlaceLateral
                  key={enlace.clave}
                  enlace={enlace}
                  activo={enlace.clave === activo}
                  alTocar={cerrar}
                />
              ))}
            </nav>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
