'use client';

import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import type { EnlaceDelMarco } from '@/lib/acceso/marco';
import { enlaceActivo } from '@/lib/acceso/navegacion';
import { EnlaceLateral } from './EnlaceLateral';
import { Marca } from './Marca';
import { PieDeSesion } from './PieDeSesion';

type Props = { nombre: string; enlaces: EnlaceDelMarco[] };

/** La barra lateral de Plan Reminder Pro, desde lg. El invitado no tiene secciones: no hay nav. */
export function BarraLateral({ nombre, enlaces }: Props) {
  const activo = enlaceActivo(enlaces, usePathname());
  return (
    <aside className="fixed left-0 top-0 h-full w-[260px] border-r border-border bg-card hidden lg:flex flex-col z-50">
      <div className="p-8 pb-6">
        <Marca tamano="lateral" />
      </div>
      {/* overflow-y-auto (extension): 10 secciones no entran en una pantalla baja. */}
      {enlaces.length > 0 ? (
        <motion.nav
          layoutScroll
          aria-label="Panel"
          className="flex-1 p-4 space-y-1 mt-4 overflow-y-auto"
        >
          {enlaces.map((enlace) => (
            <EnlaceLateral
              key={enlace.clave}
              enlace={enlace}
              activo={enlace.clave === activo}
              deslizable
            />
          ))}
        </motion.nav>
      ) : (
        <div className="flex-1" />
      )}
      <PieDeSesion nombre={nombre} />
    </aside>
  );
}
