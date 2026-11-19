'use client';

import { Clock } from 'lucide-react';
import { useState } from 'react';
import { ACCESO_SECUNDARIO, ICONO_DE_ACCESO_SUAVE } from '@/components/panel/estilos';
import { Ventana } from '@/components/panel/Ventana';
import type { HorasDeCierre } from '@/lib/caja/turnos';
import { FormularioDeHoras } from './FormularioDeHoras';

/** Las horas de cierre casi no se tocan: quedan detras de un boton y no ocupan lugar en el control. */
export function HorasEnTuerca({ inicial }: { inicial: HorasDeCierre }) {
  const [abierta, setAbierta] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setAbierta(true)} className={ACCESO_SECUNDARIO}>
        <span className={ICONO_DE_ACCESO_SUAVE}>
          <Clock size={15} aria-hidden="true" />
        </span>
        Horas de cierre
      </button>
      <Ventana abierta={abierta} cerrar={() => setAbierta(false)} titulo="Horas de cierre">
        <FormularioDeHoras inicial={inicial} />
      </Ventana>
    </>
  );
}
