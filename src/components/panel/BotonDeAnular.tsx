'use client';

import { Ban } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { AvisoDeError } from '@/components/formularios/AvisoDeError';
import { Campo } from '@/components/formularios/Campo';
import { useGuardar } from '@/lib/gastos/useGuardar';
import type { Resultado } from '@/lib/resultado';
import { ACCESO_DE_PELIGRO, BOTON_CANCELAR, ICONO_DE_ACCESO_PELIGRO } from './estilos';
import { Ventana } from './Ventana';

type Props = {
  id: string;
  anular: (datos: { id: string; motivo: string }) => Promise<Resultado<unknown>>;
  /** Lo que se anula, para el titulo de la ventana: "Anular el gasto". */
  titulo: string;
  /** Lo que dice el boton: "Anular", o como se lo llama en esa pantalla ("No se paga"). */
  texto?: string;
  /** Solo el icono, con el texto como nombre: para una fila. */
  compacto?: boolean;
  confirmar?: string;
  /** El aviso al terminar. */
  aviso?: string;
};

const ICONO_ANULAR =
  'p-1.5 pointer-coarse:p-3.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:scale-110 active:scale-95 transition-all duration-200';

/** Nada se borra: se anula con motivo, deja de contar y queda en el historial. */
export function BotonDeAnular({ id, anular, titulo, ...resto }: Props) {
  const { texto = 'Anular', compacto = false, confirmar = 'Confirmar anulación', aviso } = resto;
  const router = useRouter();
  const [abierta, setAbierta] = useState(false);
  const [motivo, setMotivo] = useState('');
  const guardado = useGuardar(anular, () => {
    setAbierta(false);
    if (aviso) toast.success(aviso);
    router.refresh();
  });
  const abrir = () => setAbierta(true);
  return (
    <>
      {compacto ? (
        <button
          type="button"
          onClick={abrir}
          aria-label={texto}
          title={texto}
          className={ICONO_ANULAR}
        >
          <Ban size={16} aria-hidden="true" />
        </button>
      ) : (
        <button type="button" onClick={abrir} className={ACCESO_DE_PELIGRO}>
          <span className={ICONO_DE_ACCESO_PELIGRO}>
            <Ban size={15} aria-hidden="true" />
          </span>
          {texto}
        </button>
      )}
      <Ventana abierta={abierta} cerrar={() => setAbierta(false)} titulo={titulo}>
        <div className="space-y-5">
          {guardado.mensaje ? <AvisoDeError mensaje={guardado.mensaje} /> : null}
          <Campo
            id="motivo"
            etiqueta="Motivo"
            value={motivo}
            onChange={(evento) => setMotivo(evento.target.value)}
          />
          <div className="flex flex-col-reverse gap-3 max-sm:[&>*]:flex-none sm:flex-row">
            <button type="button" onClick={() => setAbierta(false)} className={BOTON_CANCELAR}>
              Cancelar
            </button>
            <button
              type="button"
              disabled={guardado.enviando}
              onClick={() => guardado.enviar({ id, motivo })}
              className="flex-[2] h-12 rounded-xl bg-rose-600 text-white font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-rose-600/20 active:scale-95 transition-all disabled:opacity-60"
            >
              {confirmar}
            </button>
          </div>
        </div>
      </Ventana>
    </>
  );
}
