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
        className="pointer-events-auto relative w-[520px] max-w-full cursor-pointer overflow-hidden rounded-3xl border border-border bg-white p-9 shadow-2xl shadow-[#2b1d14]/25"
      >
        <div className="min-w-0 text-center">
          <p className="font-display text-4xl font-extrabold leading-none tracking-tight text-foreground">
            Próximamente
          </p>
          <p className="mt-3 text-lg font-medium leading-snug text-muted-foreground">
            {aviso.seccion} todavía no está disponible. Lo estamos programando.
          </p>
        </div>
        <motion.span
          aria-hidden="true"
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: SEGUNDOS, ease: 'linear' }}
          className="absolute bottom-0 left-0 h-1.5 bg-primary"
        />
      </motion.div>
    </div>
  );
}
