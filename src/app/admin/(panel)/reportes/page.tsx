import type { Metadata } from 'next';
import Link from 'next/link';
import { TituloDePagina } from '@/components/panel/TituloDePagina';
import { exigirPagina } from '@/lib/acceso/servidor';
import { REPORTES } from '@/lib/reportes/lista';

export const metadata: Metadata = { title: 'Reportes' };

export default async function PaginaDeReportes() {
  await exigirPagina('admin');
  return (
    <div className="space-y-6">
      <TituloDePagina subtitulo="Para entender por qué un mes fue mejor o peor.">
        Reportes
      </TituloDePagina>
      <ul className="grid gap-3 sm:grid-cols-2">
        {REPORTES.map((r) => (
          <li key={r.ruta} className="bg-card space-y-1 rounded-xl border p-4">
            <Link href={r.ruta} className="font-medium underline-offset-4 hover:underline">
              {r.titulo}
            </Link>
            <p className="text-muted-foreground text-sm">{r.pregunta}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
