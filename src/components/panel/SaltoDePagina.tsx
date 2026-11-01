'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { direccionDePagina, paginaElegida } from '@/lib/paginas';

type Props = { ultima: number; plantilla: string; primera: string };

/** "Ir a la página": se escribe el número y se abre esa página, sin pasar por todas. */
export function SaltoDePagina({ ultima, plantilla, primera }: Props) {
  const router = useRouter();
  const [texto, setTexto] = useState('');
  function ir(evento: FormEvent) {
    evento.preventDefault();
    const pagina = paginaElegida(texto, ultima);
    if (pagina === null) return;
    setTexto('');
    router.push(direccionDePagina(plantilla, primera, pagina));
  }
  return (
    <form onSubmit={ir} className="flex items-center gap-2">
      <input
        type="number"
        inputMode="numeric"
        min={1}
        max={ultima}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        aria-label="Ir a la página"
        placeholder="Ir a…"
        className="h-9 w-20 pointer-coarse:h-11 rounded-xl border border-border bg-white px-3 text-center text-sm font-semibold outline-hidden focus:border-[#d8cdb6]"
      />
      <button
        type="submit"
        className="h-9 pointer-coarse:h-11 pointer-coarse:min-w-11 rounded-xl border border-border bg-white px-3.5 text-sm font-semibold transition-all duration-200 hover:shadow-md active:scale-95"
      >
        Ir
      </button>
    </form>
  );
}
