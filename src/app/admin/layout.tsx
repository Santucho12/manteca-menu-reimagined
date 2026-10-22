import type { Metadata, Viewport } from 'next';
import { Inter, Outfit } from 'next/font/google';
import type { ReactNode } from 'react';
import './panel.css';

// Las letras de Plan Reminder Pro con sus mismos pesos: un 800 o un 900 se ven en 700, como alla.
const PESOS: Array<'400' | '500' | '600' | '700'> = ['400', '500', '600', '700'];
const inter = Inter({
  subsets: ['latin'],
  weight: PESOS,
  display: 'swap',
  variable: '--font-inter',
});
const outfit = Outfit({
  subsets: ['latin'],
  weight: PESOS,
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

/** Layout raiz del panel: su CSS y sus letras no tocan la carta, que tiene el suyo. */
export default function LayoutDelPanel({ children }: { children: ReactNode }) {
  return (
    <html lang="es-AR" className={`${inter.variable} ${outfit.variable}`}>
      <body>{children}</body>
    </html>
  );
}
