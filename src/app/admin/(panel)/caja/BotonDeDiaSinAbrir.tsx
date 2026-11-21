'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useGuardar } from '@/lib/gastos/useGuardar';
import { cn } from '@/lib/utils';
import { marcarSinAbrirDesdeElPanel } from './acciones';

type Props = { fecha: string; marcar: boolean };

async function marcarYAvisar(datos: Props) {
  const resultado = await marcarSinAbrirDesdeElPanel(datos);
  if (!resultado.ok) toast.error(resultado.mensaje);
  return resultado;
}

/** "No abrió" marca un día sin cierre; "Deshacer" lo devuelve a pendiente. Solo el admin. */
export function BotonDeDiaSinAbrir({ fecha, marcar }: Props) {
  const router = useRouter();
  const guardado = useGuardar(marcarYAvisar, () => router.refresh());
  return (
    <button
      type="button"
      disabled={guardado.enviando}
      onClick={() => guardado.enviar({ fecha, marcar })}
      className={cn(
        'relative z-10 h-8 rounded-full border px-3 text-xs font-bold transition-all active:scale-95 disabled:opacity-50',
        marcar
          ? 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
          : 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100',
      )}
    >
      {marcar ? 'No abrió' : 'Deshacer'}
    </button>
  );
}
