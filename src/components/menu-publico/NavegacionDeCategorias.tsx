'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { useCategoriaActiva } from '@/lib/menu/useCategoriaActiva';

type Enlace = { ancla: string; nombre: string; icono: string };

function Enlaces({
  enlaces,
  activa,
  alElegir,
}: {
  enlaces: Enlace[];
  activa: string;
  alElegir: () => void;
}) {
  return enlaces.map((e) => (
    <a
      key={e.ancla}
      href={`#${e.ancla}`}
      onClick={alElegir}
      aria-current={e.ancla === activa ? 'true' : undefined}
      className={`flex min-h-11 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
        e.ancla === activa
          ? 'bg-accent text-accent-foreground'
          : 'text-muted-foreground hover:bg-secondary'
      }`}
    >
      <span aria-hidden="true">{e.icono}</span>
      {e.nombre}
    </a>
  ));
}

export function NavegacionDeCategorias({ enlaces }: { enlaces: Enlace[] }) {
  const [abierta, setAbierta] = useState(false);
  const anclas = useMemo(() => enlaces.map((e) => e.ancla), [enlaces]);
  const { activa, arriba } = useCategoriaActiva(anclas);
  const actual = enlaces.find((e) => e.ancla === activa)?.nombre ?? 'Productos';
  return (
    <header className="bg-background/90 fixed inset-x-0 top-0 z-50 border-b shadow-sm backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6 md:h-16">
        <a href="#" aria-label="Volver arriba">
          <Image
            src="/menu/logo-oscuro.png"
            alt="Manteca"
            width={120}
            height={40}
            className="h-7 w-auto md:h-10"
          />
        </a>
        <button
          type="button"
          className="bg-secondary/50 flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm md:hidden"
          aria-expanded={abierta}
          onClick={() => setAbierta(!abierta)}
        >
          {arriba ? 'Productos' : actual} <span aria-hidden="true">{abierta ? '✕' : '☰'}</span>
        </button>
        <nav
          aria-label="Categorías"
          className={`${abierta ? 'flex' : 'hidden'} bg-background absolute inset-x-0 top-14 flex-col gap-2 border-b p-6 md:static md:flex md:flex-row md:gap-1 md:border-0 md:bg-transparent md:p-0`}
        >
          <Enlaces enlaces={enlaces} activa={activa} alElegir={() => setAbierta(false)} />
        </nav>
      </div>
    </header>
  );
}
