'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

/**
 * Una fila de la tabla: aparece en 0,2 s, como en Plan Reminder Pro. Sin la salida: en Next la
 * pagina nueva trae sus filas y las viejas se van con la pagina.
 */
export function FilaAnimada({ children }: { children: ReactNode }) {
  return (
    <motion.tr
      role="listitem"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="group relative hover:bg-secondary/40 transition-all duration-200"
    >
      {children}
    </motion.tr>
  );
}
