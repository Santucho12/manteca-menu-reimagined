'use client';

import { ArrowDown, ArrowUp, Eye, EyeOff, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { AvisoDeError } from '@/components/formularios/AvisoDeError';
import { BOTON_CANCELAR, BOTON_PELIGRO } from '@/components/panel/estilos';
import { Ventana } from '@/components/panel/Ventana';
import { PREGUNTA_DE_DESACTIVAR } from '@/lib/menu/pantalla';
import { useAccionDelMenu } from '@/lib/menu/useAccionDelMenu';
import { cambiarVisibilidadEnElMenu, desactivarEnElMenu, moverEnElMenu } from './acciones';

// Las flechas van juntas en una pastilla y las otras tres, sueltas: se distingue mover de cambiar.
const BASE =
  'flex h-10 w-10 sm:h-8 sm:w-8 items-center justify-center rounded-full text-slate-500 transition-all duration-200 active:scale-95 disabled:opacity-40';
const ACCION = `${BASE} hover:bg-white hover:text-foreground hover:shadow-sm`;
const EDITAR =
  'flex h-10 w-10 sm:h-8 sm:w-8 items-center justify-center rounded-full text-slate-400 hover:text-[#2563eb] hover:bg-[#2563eb]/10 hover:scale-110 active:scale-95 transition-all duration-200';
const BORRAR = `${BASE} hover:bg-rose-50 hover:text-rose-600`;
const GRUPO = 'flex items-center rounded-full bg-secondary/60 p-0.5';

type Props = {
  tipo: 'categoria' | 'producto';
  id: string;
  nombre: string;
  visible: boolean;
  editar: string;
};

type PropsDeLaVentana = {
  abierta: boolean;
  nombre: string;
  mensaje: string | null;
  enviando: boolean;
  alConfirmar: () => void;
  alCerrar: () => void;
};

function VentanaDeDesactivar({
  abierta,
  nombre,
  mensaje,
  enviando,
  ...acciones
}: PropsDeLaVentana) {
  return (
    <Ventana abierta={abierta} cerrar={acciones.alCerrar} titulo="Desactivar" rol="alertdialog">
      <div className="space-y-5">
        <p className="text-sm">{PREGUNTA_DE_DESACTIVAR(nombre)}</p>
        {mensaje ? <AvisoDeError mensaje={mensaje} /> : null}
        <div className="flex flex-col-reverse gap-3 max-sm:[&>*]:flex-none sm:flex-row">
          <button type="button" onClick={acciones.alCerrar} className={BOTON_CANCELAR}>
            Cancelar
          </button>
          <button
            type="button"
            disabled={enviando}
            onClick={acciones.alConfirmar}
            className={`${BOTON_PELIGRO} flex-[2] h-12`}
          >
            Confirmar
          </button>
        </div>
      </div>
    </Ventana>
  );
}

/** Subir, bajar, mostrar u ocultar, editar y desactivar: los iconos de acciones de una fila. */
export function BotonesDeElemento({ tipo, id, nombre, visible, editar }: Props) {
  const { mensaje, enviando, hacer } = useAccionDelMenu();
  const [confirmando, setConfirmando] = useState(false);
  // La ventana se arma la primera vez que se pide: hay cien filas y casi ninguna la abre.
  const [pedida, setPedida] = useState(false);
  const mover = (direccion: 'arriba' | 'abajo') =>
    hacer(() => moverEnElMenu({ tipo, id, direccion }));
  async function confirmar() {
    if (await hacer(() => desactivarEnElMenu({ tipo, id }))) setConfirmando(false);
  }
  const accion = visible ? 'Ocultar' : 'Mostrar';
  const Ojo = visible ? EyeOff : Eye;
  const cambiarVisibilidad = () =>
    hacer(() => cambiarVisibilidadEnElMenu({ tipo, id, mostrar: !visible }));
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className={GRUPO}>
          <button
            type="button"
            disabled={enviando}
            aria-label={`Subir ${nombre}`}
            onClick={() => mover('arriba')}
            className={ACCION}
          >
            <ArrowUp size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            disabled={enviando}
            aria-label={`Bajar ${nombre}`}
            onClick={() => mover('abajo')}
            className={ACCION}
          >
            <ArrowDown size={16} aria-hidden="true" />
          </button>
        </div>
        <button
          type="button"
          disabled={enviando}
          aria-label={`${accion} ${nombre}`}
          onClick={cambiarVisibilidad}
          className={ACCION}
        >
          <Ojo size={16} aria-hidden="true" />
        </button>
        <Link href={editar} aria-label={`Editar ${nombre}`} className={EDITAR}>
          <Pencil size={16} aria-hidden="true" />
        </Link>
        <button
          type="button"
          disabled={enviando}
          aria-label={`Desactivar ${nombre}`}
          onClick={() => {
            setPedida(true);
            setConfirmando(true);
          }}
          className={BORRAR}
        >
          <Trash2 size={16} aria-hidden="true" />
        </button>
      </div>
      {mensaje && !confirmando ? <AvisoDeError mensaje={mensaje} /> : null}
      {pedida ? (
        <VentanaDeDesactivar
          abierta={confirmando}
          nombre={nombre}
          mensaje={mensaje}
          enviando={enviando}
          alConfirmar={confirmar}
          alCerrar={() => setConfirmando(false)}
        />
      ) : null}
    </div>
  );
}
