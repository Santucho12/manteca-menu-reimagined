import type { Metadata } from 'next';
import { SeccionColores } from '@/components/guia/SeccionColores';
import { SeccionComponentes } from '@/components/guia/SeccionComponentes';
import { SeccionEspaciados, SeccionRadios, SeccionSombras } from '@/components/guia/SeccionMedidas';
import { SeccionTipografias } from '@/components/guia/SeccionTipografias';
import { exigirPagina } from '@/lib/acceso/servidor';

export const metadata: Metadata = { title: 'Guía de estilos' };

export default async function PaginaGuiaDeEstilos() {
  await exigirPagina('admin');
  return (
    <div className="space-y-12">
      <header className="space-y-2">
        <h1 className="font-heading text-4xl font-semibold">Guía de estilos</h1>
        <p className="text-muted-foreground">
          Colores, tipografías, medidas y componentes que usa toda la aplicación.
        </p>
      </header>
      <SeccionColores />
      <SeccionTipografias />
      <SeccionRadios />
      <SeccionSombras />
      <SeccionEspaciados />
      <SeccionComponentes />
    </div>
  );
}
