'use client';

import { Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AvisoDeError } from '@/components/formularios/AvisoDeError';
import { BOTON_CANCELAR, BOTON_PELIGRO } from '@/components/panel/estilos';
import { Interruptor } from '@/components/panel/Interruptor';
import { Ventana } from '@/components/panel/Ventana';
import { useAccionDelMenu } from '@/lib/menu/useAccionDelMenu';
import {
  borrarCanalDesdeElPanel,
  cambiarControlDeCanalDesdeElPanel,
  cambiarEstadoDeCanalDesdeElPanel,
} from '../acciones';

const BASE =
  'flex h-7 w-7 pointer-coarse:h-11 pointer-coarse:w-11 items-center justify-center rounded-full text-slate-400 transition-all duration-200 active:scale-95 disabled:opacity-40';
const EDITAR = `${BASE} hover:bg-[#2563eb]/10 hover:text-[#2563eb] hover:scale-110`;
const BORRAR = `${BASE} hover:bg-rose-50 hover:text-rose-600 hover:scale-110`;

/** controla es null para Local: es la caja y no se controla aparte. */
type Props = { id: string; nombre: string; activo: boolean; controla: boolean | null };

function VentanaDeBorrar({
  nombre,
  mensaje,
  enviando,
  alConfirmar,
  alCerrar,
}: {
  nombre: string;
  mensaje: string | null;
  enviando: boolean;
  alConfirmar: () => void;
  alCerrar: () => void;
}) {
  return (
    <Ventana abierta cerrar={alCerrar} titulo="Borrar tipo de venta" rol="alertdialog">
      <div className="space-y-5">
        <p className="text-sm">
          ¿Borrar {nombre}? Solo se puede si nunca se usó en una venta; si no, desactivalo.
        </p>
        {mensaje ? <AvisoDeError mensaje={mensaje} /> : null}
        <div className="flex flex-col-reverse gap-3 max-sm:[&>*]:flex-none sm:flex-row">
          <button type="button" onClick={alCerrar} className={BOTON_CANCELAR}>
            Cancelar
          </button>
          <button
            type="button"
            disabled={enviando}
            onClick={alConfirmar}
            className={`${BOTON_PELIGRO} flex-[2] h-12`}
          >
            Confirmar
          </button>
        </div>
      </div>
    </Ventana>
  );
}

/** Editar, prender o apagar y borrar un canal. Apagarlo no toca las ventas que ya lo usan. */
export function AccionesDeCanal({ id, nombre, activo, controla }: Props) {
  const router = useRouter();
  const { mensaje, enviando, hacer } = useAccionDelMenu();
  const [borrando, setBorrando] = useState(false);
  const alternar = async () => {
    const listo = await hacer(() => cambiarEstadoDeCanalDesdeElPanel({ id, activo: !activo }));
    if (listo) router.refresh();
  };
  const alternarControl = async () => {
    const listo = await hacer(() => cambiarControlDeCanalDesdeElPanel({ id, controla: !controla }));
    if (listo) router.refresh();
  };
  const borrar = async () => {
    const listo = await hacer(() => borrarCanalDesdeElPanel({ id }));
    if (!listo) return;
    setBorrando(false);
    router.refresh();
  };
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <Interruptor
          activo={activo}
          etiqueta={`Tipo de venta ${nombre} activo`}
          deshabilitado={enviando}
          alCambiar={alternar}
        />
        <Link
          href={`/admin/ventas/canales/${id}`}
          aria-label={`Editar ${nombre}`}
          className={EDITAR}
        >
          <Pencil size={16} aria-hidden="true" />
        </Link>
        <button
          type="button"
          disabled={enviando}
          aria-label={`Borrar ${nombre}`}
          onClick={() => setBorrando(true)}
          className={BORRAR}
        >
          <Trash2 size={16} aria-hidden="true" />
        </button>
      </div>
      {controla === null ? null : (
        <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <Interruptor
            activo={controla}
            etiqueta={`${nombre} se controla en el cierre`}
            deshabilitado={enviando}
            alCambiar={alternarControl}
          />
          Se controla en el cierre
        </label>
      )}
      {mensaje && !borrando ? <AvisoDeError mensaje={mensaje} /> : null}
      {borrando ? (
        <VentanaDeBorrar
          nombre={nombre}
          mensaje={mensaje}
          enviando={enviando}
          alConfirmar={borrar}
          alCerrar={() => setBorrando(false)}
        />
      ) : null}
    </div>
  );
}
