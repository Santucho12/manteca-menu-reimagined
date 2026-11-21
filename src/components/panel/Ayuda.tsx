'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Info, X } from 'lucide-react';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import type { Ayuda } from '@/lib/panel/ayudas';
import { useBloquearElFondo, useCerrarConEscape, useDestinoEnMain } from '@/lib/panel/ventanas';
import { colorDeTema } from './coloresDeAyuda';
import { CERRAR_VENTANA } from './estilos';

/** El boton ⓘ del final del encabezado (ModuleHelp.tsx de Plan Reminder Pro). */
export function BotonDeAyuda({ ayuda }: { ayuda: Ayuda }) {
  const [abierta, setAbierta] = useState(false);
  const destino = useDestinoEnMain();
  const ventana = (
    <VentanaDeAyuda ayuda={ayuda} abierta={abierta} cerrar={() => setAbierta(false)} />
  );
  return (
    <>
      <button
        type="button"
        aria-label="Cómo funciona esta pantalla"
        title="Cómo funciona esta pantalla"
        onClick={() => setAbierta(true)}
        className="shrink-0 p-2 pointer-coarse:p-3 rounded-full text-slate-400 hover:text-slate-600 hover:bg-secondary transition-colors"
      >
        <Info size={22} />
      </button>
      {destino ? createPortal(ventana, destino) : null}
    </>
  );
}

type PropsDeLaVentana = { ayuda: Ayuda; abierta: boolean; cerrar: () => void };

/** Se cierra con Escape, con la X, con "Entendido" y tocando afuera. */
function VentanaDeAyuda({ ayuda, abierta, cerrar }: PropsDeLaVentana) {
  useCerrarConEscape(abierta, cerrar);
  useBloquearElFondo(abierta);
  return (
    <AnimatePresence>
      {abierta ? (
        <div
          key="ayuda"
          onClick={cerrar}
          className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/70 backdrop-blur-md animate-in-fade"
        >
          <motion.div
            role="dialog"
            aria-label={ayuda.titulo}
            onClick={(evento) => evento.stopPropagation()}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="bg-white w-full max-w-2xl rounded-t-3xl sm:rounded-3xl shadow-2xl border border-border overflow-hidden max-h-[90vh] flex flex-col"
          >
            <div className="px-6 py-5 border-b border-border bg-white flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 shrink-0 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                  <Info size={20} />
                </div>
                <h2 className="text-lg font-bold tracking-tight wrap-break-word">{ayuda.titulo}</h2>
              </div>
              <button
                type="button"
                aria-label="Cerrar ayuda"
                onClick={cerrar}
                className={`${CERRAR_VENTANA} shrink-0`}
              >
                <X size={20} />
              </button>
            </div>
            <TemasDeAyuda ayuda={ayuda} />
            <div className="p-4 border-t border-border bg-white">
              <button
                type="button"
                onClick={cerrar}
                className="w-full h-12 rounded-xl bg-foreground text-white font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-slate-900/20 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-xl hover:shadow-slate-900/30 active:translate-y-0 active:scale-95 transition-all duration-200"
              >
                Entendido
              </button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

function TemasDeAyuda({ ayuda }: { ayuda: Ayuda }) {
  return (
    <div className="p-6 space-y-10 overflow-y-auto">
      <p className="text-sm text-muted-foreground leading-relaxed">{ayuda.introduccion}</p>
      {ayuda.temas.map((tema, indice) => (
        <TemaDeAyuda key={tema.titulo} tema={tema} indice={indice} />
      ))}
    </div>
  );
}

type Tema = Ayuda['temas'][number];

function TemaDeAyuda({ tema, indice }: { tema: Tema; indice: number }) {
  const color = colorDeTema(indice);
  return (
    <section className="space-y-2">
      <h3
        className={`flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.15em] ${color.titulo}`}
      >
        <span aria-hidden="true" className={`h-3.5 w-1 rounded-full ${color.raya}`} />
        {tema.titulo}
      </h3>
      <ul className="space-y-2">
        {tema.puntos.map((punto) => (
          <li key={punto} className="flex gap-2.5 text-sm leading-relaxed text-slate-700">
            <span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${color.punto}`} />
            <span>{punto}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
