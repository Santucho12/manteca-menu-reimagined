'use client';

import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  leerEstadoDelMostrador,
  postergarDesdeElMostrador,
} from '@/app/admin/acciones-de-la-traba';
import { trabaEnLaRuta } from '@/lib/caja/dondeTraba';
import { textoDePostergado, type EstadoDelTurno } from '@/lib/caja/turnos';
import { useEstadoDelTurno } from '@/lib/caja/useEstadoDelTurno';
import { VentanaDelCierre } from './VentanaDelCierre';

type Props = { inicial: EstadoDelTurno; acceso: string };

/** La ventana del cierre donde corresponde, y el aviso de hasta cuándo se postergó. */
export function TrabaDelCierre({ inicial, acceso }: Props) {
  const ruta = usePathname();
  const { estado, refrescar } = useEstadoDelTurno(inicial, leerEstadoDelMostrador, ruta);
  const [postergando, setPostergando] = useState(false);
  const [error, setError] = useState<string>();
  if (!trabaEnLaRuta(acceso, ruta)) return null;
  async function postergar() {
    setPostergando(true);
    const resultado = await postergarDesdeElMostrador();
    setError(resultado.ok ? undefined : resultado.mensaje);
    await refrescar();
    setPostergando(false);
  }
  const postergado = estado.trabado ? null : textoDePostergado(estado);
  return (
    <>
      {postergado ? (
        <p
          role="status"
          className="mb-4 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-900"
        >
          {postergado}
        </p>
      ) : null}
      {estado.trabado ? (
        <VentanaDelCierre
          estado={estado}
          postergar={postergar}
          postergando={postergando}
          error={error}
        />
      ) : null}
    </>
  );
}
