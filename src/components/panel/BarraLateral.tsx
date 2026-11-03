'use client';

import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import type { EnlaceDelMarco } from '@/lib/acceso/marco';
import { enlaceActivo, partirEnlaces } from '@/lib/acceso/navegacion';
import { EnlaceLateral } from './EnlaceLateral';
import { Marca } from './Marca';
import { PieDeSesion } from './PieDeSesion';

type Props = { nombre: string; enlaces: EnlaceDelMarco[] };

type PropsDeEnlace = { enlace: EnlaceDelMarco; activo: string | null };

const Enlace = ({ enlace, activo }: PropsDeEnlace) => (
  <EnlaceLateral enlace={enlace} activo={enlace.clave === activo} deslizable compacto />
);

/**
 * La barra lateral de Plan Reminder Pro, desde lg, con las secciones en grupos (extension) y
 * Mi cuenta fija abajo, fuera de ellos. El invitado no tiene secciones: no hay nav.
 */
export function BarraLateral({ nombre, enlaces }: Props) {
  const activo = enlaceActivo(enlaces, usePathname());
  const { grupos, cuenta } = partirEnlaces(enlaces);
  return (
    <aside className="fixed left-0 top-0 h-full w-[234px] border-r border-border bg-card hidden lg:flex flex-col z-50 [&>*]:[zoom:0.99]">
      <div className="px-6 pt-6 pb-4">
        <Marca tamano="lateral" />
      </div>
      {enlaces.length > 0 ? (
        <motion.nav aria-label="Panel" className="flex-1 min-h-0 flex flex-col px-3.5 pb-2">
          {/* Sin desplazamiento (Santiago, 2026-11-02): en una pantalla baja se juntan los grupos. */}
          <div className="flex-1 min-h-0 overflow-hidden space-y-4 [@media(max-height:760px)]:space-y-2 pt-1">
            {grupos.map((grupo) => (
              <div key={grupo.titulo ?? 'secciones'} className="space-y-1">
                {grupo.titulo ? (
                  <p className="px-3.5 pb-0.5 text-[9px] font-black uppercase tracking-widest text-muted-foreground/70">
                    {grupo.titulo}
                  </p>
                ) : null}
                {grupo.enlaces.map((enlace) => (
                  <Enlace key={enlace.clave} enlace={enlace} activo={activo} />
                ))}
              </div>
            ))}
          </div>
          {cuenta ? (
            <div className="pt-1.5 mt-1.5 border-t border-border">
              <Enlace enlace={cuenta} activo={activo} />
            </div>
          ) : null}
        </motion.nav>
      ) : (
        <div className="flex-1" />
      )}
      <PieDeSesion nombre={nombre} />
    </aside>
  );
}
