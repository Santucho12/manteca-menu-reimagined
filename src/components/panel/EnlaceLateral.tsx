'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import type { EnlaceDelMarco } from '@/lib/acceso/marco';
import { esProximamente } from '@/lib/acceso/proximamente';
import { cn } from '@/lib/utils';
import { avisarProximamente } from './avisarProximamente';
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

const FONDO = 'absolute -left-3.5 top-1.5 bottom-1.5 w-1 rounded-r-full bg-primary z-0';

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
      onClick={(evento) => {
        if (esProximamente(enlace.clave)) {
          evento.preventDefault();
          avisarProximamente(enlace.texto);
        }
        alTocar?.();
      }}
      aria-current={activo ? 'page' : undefined}
      className={cn(
        'relative group w-full flex items-center font-semibold transition-all duration-300 rounded-2xl',
        compacto ? 'gap-2.5 px-3.5 py-2 text-[13px] rounded-xl' : 'gap-3 px-4 py-3.5 text-sm',
        activo
          ? 'text-foreground font-bold bg-secondary/70'
          : 'border border-transparent text-muted-foreground hover:text-foreground hover:bg-white hover:border-border hover:shadow-md hover:shadow-slate-900/5',
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
