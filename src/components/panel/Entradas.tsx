'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

type Props = { children: ReactNode; className?: string };

/** El contenido de una pantalla entra subiendo 20 px (movimiento.md). La salida no se replica. */
export function EntradaDePantalla({ children, className }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** El bloque del titulo entra desde la izquierda. */
export function EntradaDelTitulo({ children, className }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** La tarjeta del ingreso sube 20 px en 0,6 s. */
export function EntradaDelIngreso({ children, className }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
