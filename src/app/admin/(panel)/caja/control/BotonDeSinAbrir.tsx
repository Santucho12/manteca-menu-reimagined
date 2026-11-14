'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useGuardar } from '@/lib/gastos/useGuardar';
import { marcarSinAbrirDesdeElPanel } from '../acciones';

type Props = { fecha: string; marcar: boolean };

async function marcarYAvisar(datos: Props) {
  const resultado = await marcarSinAbrirDesdeElPanel(datos);
  if (!resultado.ok) toast.error(resultado.mensaje);
  return resultado;
}

/** "No abrió" marca el día; "Deshacer" lo devuelve a pendiente. Solo lo ve el admin. */
export function BotonDeSinAbrir({ fecha, marcar }: Props) {
  const router = useRouter();
  const guardado = useGuardar(marcarYAvisar, () => router.refresh());
  return (
    <button
      type="button"
      disabled={guardado.enviando}
      onClick={() => guardado.enviar({ fecha, marcar })}
      className="mr-3 shrink-0 rounded-lg px-3 py-1.5 pointer-coarse:py-3 text-xs font-bold text-amber-800 hover:bg-amber-100 active:scale-95 disabled:opacity-60 transition-all"
    >
      {marcar ? 'No abrió' : 'Deshacer'}
    </button>
  );
}
