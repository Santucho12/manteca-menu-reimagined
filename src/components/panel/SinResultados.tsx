'use client';

import { motion } from 'framer-motion';
import { Croissant } from 'lucide-react';

/** "Sin resultados" de Plan Reminder Pro: donde tiene su rayo, la medialuna. */
export function SinResultados({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-card rounded-2xl shadow-card border border-border p-10 md:p-16 text-center flex flex-col items-center gap-4"
    >
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
        <Croissant size={32} aria-hidden="true" />
      </div>
      <div>
        <h3 className="text-lg font-semibold">{titulo}</h3>
        <p className="text-muted-foreground text-sm max-w-xs mx-auto mt-1">{texto}</p>
      </div>
    </motion.div>
  );
}
