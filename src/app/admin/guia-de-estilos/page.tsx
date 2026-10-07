import type { Metadata } from 'next';
import { SeccionColores } from '@/components/guia/SeccionColores';
import { SeccionComponentes } from '@/components/guia/SeccionComponentes';
import { SeccionEspaciados, SeccionRadios, SeccionSombras } from '@/components/guia/SeccionMedidas';
import { SeccionTipografias } from '@/components/guia/SeccionTipografias';

export const metadata: Metadata = {
  title: 'Guía de estilos',
  robots: { index: false, follow: false },
};

export default function PaginaGuiaDeEstilos() {
  return (
    <main className="mx-auto max-w-5xl space-y-12 px-4 py-8">
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
    </main>
  );
}
