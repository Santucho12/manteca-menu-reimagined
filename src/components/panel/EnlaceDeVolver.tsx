import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { ACCESO_SECUNDARIO, ICONO_DE_ACCESO_SUAVE } from './estilos';

/** El "Volver a ..." de las fichas: la misma píldora blanca que los demás botones del panel. */
export function EnlaceDeVolver({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className={`${ACCESO_SECUNDARIO} w-fit flex-none`}>
      <span className={ICONO_DE_ACCESO_SUAVE}>
        <ArrowLeft size={15} aria-hidden="true" />
      </span>
      {children}
    </Link>
  );
}
