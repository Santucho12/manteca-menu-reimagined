'use client';

import { ListFilter } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import {
  LISTA_DE_DESPLEGABLE,
  OPCION_DE_DESPLEGABLE,
} from '@/components/panel/estiloDeDesplegable';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  OPCIONES_DE_ESTADO,
  enlaceDeUsuarios,
  filtroDeEstado,
  type FiltroDeEstado as Estado,
} from '@/lib/usuarios/presentacion';

type Props = { estado: Estado; busqueda: string | null };

const DISPARADOR =
  'h-12 w-full gap-3 rounded-xl border-none bg-secondary/60 px-4 text-sm font-bold md:h-14 md:w-56 md:rounded-2xl';

/** El estado de las cuentas en un desplegable: elegir uno cambia la lista en el momento. */
export function FiltroDeEstado({ estado, busqueda }: Props) {
  const router = useRouter();
  const [pendiente, empezar] = useTransition();
  const elegir = (valor: string) =>
    empezar(() =>
      router.push(enlaceDeUsuarios({ busqueda, estado: filtroDeEstado(valor), pagina: 1 })),
    );
  return (
    <Select value={estado} onValueChange={elegir}>
      <SelectTrigger
        aria-label="Estado"
        aria-busy={pendiente}
        className={`${DISPARADOR} ${pendiente ? 'opacity-60' : ''}`}
      >
        <ListFilter size={16} className="shrink-0 text-primary" aria-hidden="true" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end" sideOffset={8} className={LISTA_DE_DESPLEGABLE}>
        {OPCIONES_DE_ESTADO.map((opcion) => (
          <SelectItem key={opcion.valor} value={opcion.valor} className={OPCION_DE_DESPLEGABLE}>
            {opcion.texto}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
