'use client';

import { motion } from 'framer-motion';
import { useEffect, useSyncExternalStore } from 'react';
import {
  cerrarProximamente,
  leerProximamente,
  suscribirseAProximamente,
} from '@/lib/panel/avisoDeProximamente';

const SEGUNDOS = 3.2;

/**
 * El aviso de una sección que todavía no está lista: una tarjeta blanca, grande y en el medio de
 * la pantalla. Se va sola, o con un toque o Escape. Una sola vez en el marco del panel.
 */
export function AvisoDeProximamente() {
  const aviso = useSyncExternalStore(suscribirseAProximamente, leerProximamente, () => null);
  const id = aviso?.id;
  useEffect(() => {
    if (id === undefined) return;
    const cerrar = setTimeout(cerrarProximamente, SEGUNDOS * 1000);
    const alApretar = (evento: KeyboardEvent) => evento.key === 'Escape' && cerrarProximamente();
    document.addEventListener('keydown', alApretar);
    return () => {
      clearTimeout(cerrar);
      document.removeEventListener('keydown', alApretar);
    };
  }, [id]);
  if (!aviso) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-[120] flex items-center justify-center p-4">
      <motion.div
        key={aviso.id}
        role="status"
        onClick={cerrarProximamente}
        initial={{ opacity: 0, scale: 0.92, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
        className="pointer-events-auto w-[380px] max-w-full cursor-pointer rounded-2xl border border-border bg-white px-6 py-5 text-center shadow-xl shadow-slate-900/10"
      >
        <p className="font-display text-xl font-bold tracking-tight text-foreground">
          Próximamente
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {aviso.seccion} todavía no está disponible. Lo estamos programando.
        </p>
      </motion.div>
    </div>
  );
}
