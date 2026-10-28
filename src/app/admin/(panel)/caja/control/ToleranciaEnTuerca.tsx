'use client';

import { Settings } from 'lucide-react';
import { useState } from 'react';
import { BOTON_DE_ENCABEZADO_NEUTRO } from '@/components/panel/estilos';
import { Ventana } from '@/components/panel/Ventana';
import { FormularioDeTolerancia } from './FormularioDeTolerancia';

/** La tolerancia casi no se toca: queda detras de una tuerca y no ocupa lugar en el control. */
export function ToleranciaEnTuerca({ inicial }: { inicial: string }) {
  const [abierta, setAbierta] = useState(false);
  return (
    <>
      <button
        type="button"
        aria-label="Configurar tolerancia"
        onClick={() => setAbierta(true)}
        className={BOTON_DE_ENCABEZADO_NEUTRO}
      >
        <Settings aria-hidden="true" />
      </button>
      <Ventana abierta={abierta} cerrar={() => setAbierta(false)} titulo="Diferencia aceptada">
        <FormularioDeTolerancia inicial={inicial} />
      </Ventana>
    </>
  );
}
