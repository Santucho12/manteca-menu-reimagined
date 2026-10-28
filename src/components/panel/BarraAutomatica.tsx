'use client';

import Form from 'next/form';
import type { ReactNode } from 'react';
import { BARRA_DE_FILTROS } from './estilos';

/** La barra de filtros sin botón: cada cambio vuelve a pedir la lista, sin recargar la página. */
export function BarraAutomatica({ accion, children }: { accion: string; children: ReactNode }) {
  return (
    <Form
      action={accion}
      role="search"
      className={BARRA_DE_FILTROS}
      onChange={(evento) => evento.currentTarget.requestSubmit()}
    >
      {children}
    </Form>
  );
}
