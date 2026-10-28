'use client';

import { Settings } from 'lucide-react';
import { useState } from 'react';
import { ACCESO_SECUNDARIO, ICONO_DE_ACCESO_SUAVE } from '@/components/panel/estilos';
import { Ventana } from '@/components/panel/Ventana';
import { FormularioDeTolerancia } from './FormularioDeTolerancia';

/** La tolerancia casi no se toca: queda detras de una tuerca y no ocupa lugar en el control. */
export function ToleranciaEnTuerca({ inicial }: { inicial: string }) {
  const [abierta, setAbierta] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setAbierta(true)} className={ACCESO_SECUNDARIO}>
        <span className={ICONO_DE_ACCESO_SUAVE}>
          <Settings size={15} aria-hidden="true" />
        </span>
        Diferencia aceptada
      </button>
      <Ventana abierta={abierta} cerrar={() => setAbierta(false)} titulo="Diferencia aceptada">
        <FormularioDeTolerancia inicial={inicial} />
      </Ventana>
    </>
  );
}
