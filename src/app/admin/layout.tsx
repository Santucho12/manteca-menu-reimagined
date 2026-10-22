import type { Metadata, Viewport } from 'next';
import { Inter, Outfit } from 'next/font/google';
import type { ReactNode } from 'react';
import { ScrollSuave } from '@/components/panel/ScrollSuave';
import { TooltipProvider } from '@/components/ui/tooltip';
import './panel.css';

// Las letras de Plan Reminder Pro con sus mismos pesos: un 800 o un 900 se ven en 700, como alla.
// next/font pide los valores escritos en cada llamada, no en una constante.
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-inter',
});
const outfit = Outfit({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-outfit',
});

// Nada del panel se indexa: ni el ingreso ni el registro.
export const metadata: Metadata = {
  title: 'Manteca',
  description: 'Sistema de gestión de Manteca',
  robots: { index: false, follow: false },
};

// cover: sin esto env(safe-area-inset-*) vale 0 y las barras del celular quedan bajo la muesca.
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' };

// El servidor de las pruebas esconde el aviso de problemas de Next (solo existe en desarrollo): su
// boton, "Open issues overlay", figura como un boton mas y las pruebas que buscan "Ver" lo toman.
const ESCONDER_AVISO_DE_NEXT = 'nextjs-portal { display: none !important; }';

/** Layout raiz del panel: su CSS y sus letras no tocan la carta, que tiene el suyo. */
export default function LayoutDelPanel({ children }: { children: ReactNode }) {
  return (
    <html lang="es-AR" className={`${inter.variable} ${outfit.variable}`}>
      <body>
        {process.env.E2E === '1' ? <style>{ESCONDER_AVISO_DE_NEXT}</style> : null}
        <TooltipProvider>
          <ScrollSuave />
          {children}
        </TooltipProvider>
      </body>
    </html>
  );
}
