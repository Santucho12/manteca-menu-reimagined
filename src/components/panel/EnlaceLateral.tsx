'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import type { EnlaceDelMarco } from '@/lib/acceso/marco';
import { cn } from '@/lib/utils';
import { ICONOS_DEL_PANEL } from './iconos';
import { Insignia } from './Insignia';

type Props = {
  enlace: EnlaceDelMarco;
  activo: boolean;
  /** Solo en la barra lateral: el fondo verde se desliza de una seccion a otra. */
  deslizable?: boolean;
  /** La barra lateral: todo a escala 0,9 (Santiago, 2026-10-23). */
  compacto?: boolean;
  alTocar?: () => void;
};

const FONDO = 'absolute inset-0 bg-primary/10 rounded-2xl z-0';

/** El enlace de seccion de Plan Reminder Pro (alla es un boton; aca, Link con aria-current). */
export function EnlaceLateral({
  enlace,
  activo,
  deslizable = false,
  compacto = false,
  alTocar,
}: Props) {
  const Icono = ICONOS_DEL_PANEL[enlace.clave];
  return (
    <Link
      href={enlace.href}
      onClick={alTocar}
      aria-current={activo ? 'page' : undefined}
      className={cn(
        'relative group w-full flex items-center font-semibold transition-all duration-300 rounded-2xl',
        compacto ? 'gap-2.5 px-3.5 py-2.5 text-[13px] rounded-xl' : 'gap-3 px-4 py-3.5 text-sm',
        activo
          ? 'text-primary shadow-xs ring-1 ring-primary/20'
          : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50',
      )}
    >
      <Icono size={compacto ? 18 : 20} strokeWidth={activo ? 2.5 : 2} />
      <span className="relative z-10">{enlace.texto}</span>
      <Insignia numero={enlace.insignia} lugar="lateral" />
      {/* Ultimo: queda sobre el icono (apenas tenido) y bajo el texto (z-10), como en PRP. */}
      {activo ? <FondoActivo deslizable={deslizable} /> : null}
    </Link>
  );
}

function FondoActivo({ deslizable }: { deslizable: boolean }) {
  if (!deslizable) return <span aria-hidden="true" className={FONDO} />;
  return (
    <motion.div
      layoutId="activeNav"
      className={FONDO}
      initial={false}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    />
  );
}
