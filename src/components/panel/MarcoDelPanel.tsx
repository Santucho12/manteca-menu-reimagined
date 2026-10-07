import Link from 'next/link';
import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { EnlaceDelMarco } from '@/lib/acceso/marco';

type Props = { nombre: string; enlaces: EnlaceDelMarco[]; children: ReactNode };

function Menu({ enlaces }: { enlaces: EnlaceDelMarco[] }) {
  return (
    <nav aria-label="Panel" className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
      {enlaces.map((enlace) => (
        <Link
          key={enlace.clave}
          href={enlace.href}
          className="inline-flex items-center gap-2 py-2 underline-offset-4 hover:underline"
        >
          {enlace.texto}
          {enlace.insignia ? <Badge>{enlace.insignia}</Badge> : null}
        </Link>
      ))}
    </nav>
  );
}

/** El marco de cada pantalla del panel: la marca, el menu, quien tiene la sesion y Salir. */
export function MarcoDelPanel({ nombre, enlaces, children }: Props) {
  return (
    <div className="min-h-dvh">
      <header className="bg-card border-b">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <span className="font-title text-2xl">Manteca</span>
          {enlaces.length > 0 ? <Menu enlaces={enlaces} /> : null}
          <div className="ml-auto flex items-center gap-3">
            <span className="text-sm">{nombre}</span>
            <form action="/admin/salir" method="post">
              <Button type="submit" variant="outline">
                Salir
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
