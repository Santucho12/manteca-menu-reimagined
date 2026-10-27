'use client';

import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { esProximamente } from '@/lib/acceso/proximamente';
import { avisarProximamente } from './avisarProximamente';
import { BOTON_DE_TARJETA, CIRCULO_DE_BOTON, FLECHA_DE_BOTON } from './estilos';

type Props = { clave: string; seccion: string; href: string; texto: string };

/** Un botón que lleva a otra sección; si todavía no está lista, avisa Próximamente y no se mueve. */
export function EnlaceASeccion({ clave, seccion, href, texto }: Props) {
  return (
    <Link
      href={href}
      onClick={(evento) => {
        if (!esProximamente(clave)) return;
        evento.preventDefault();
        avisarProximamente(seccion);
      }}
      className={BOTON_DE_TARJETA}
    >
      {texto}
      <span className={CIRCULO_DE_BOTON}>
        <ArrowUpRight size={15} strokeWidth={2.6} aria-hidden="true" className={FLECHA_DE_BOTON} />
      </span>
    </Link>
  );
}
