import { Save } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { BOTON_CANCELAR, BOTON_PRINCIPAL } from '@/components/panel/estilos';
import { cn } from '@/lib/utils';

const BLANCO =
  'group h-14 w-full sm:w-auto gap-3 rounded-full bg-white pl-3 pr-8 text-foreground border border-border shadow-lg shadow-slate-900/10 hover:bg-white hover:-translate-y-0.5 hover:shadow-xl hover:border-emerald-300 active:translate-y-0';
const ICONO_BLANCO =
  'flex size-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 transition-colors group-hover:bg-emerald-600 group-hover:text-white';

type Props = {
  enviando: boolean;
  texto?: string;
  /** Adonde vuelve "Cancelar"; sin esto no hay boton. */
  cancelar?: string;
  extra?: ReactNode;
  /** El botón de guardar en blanco con sombra, para las pantallas sin dorado. */
  blanco?: boolean;
};

/** Los botones al pie de un formulario: el principal de Plan Reminder Pro y, si se pide, Cancelar. */
export function PieDelFormulario({ enviando, texto = 'Guardar', cancelar, extra, blanco }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button type="submit" disabled={enviando} className={cn(BOTON_PRINCIPAL, blanco && BLANCO)}>
        {blanco ? (
          <span className={ICONO_BLANCO}>
            <Save size={16} aria-hidden="true" />
          </span>
        ) : (
          <Save size={14} aria-hidden="true" />
        )}
        {enviando ? 'Guardando...' : texto}
      </button>
      {cancelar ? (
        <Link href={cancelar} className={`${BOTON_CANCELAR} flex-none px-6`}>
          Cancelar
        </Link>
      ) : null}
      {extra}
    </div>
  );
}
