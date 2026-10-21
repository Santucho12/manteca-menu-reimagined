import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import type { ReactNode } from 'react';
import './globals.css';

// El panel usa las mismas tipografias que plan-reminder-pro (decision de Santiago, 2026-10-21).
const inter = Inter({ subsets: ['latin'], variable: '--fuente-inter' });
const outfit = Outfit({ subsets: ['latin'], variable: '--fuente-outfit' });

export const metadata: Metadata = {
  title: 'Manteca',
  description: 'Sistema de gestión de Manteca',
};

export default function LayoutRaiz({ children }: { children: ReactNode }) {
  return (
    <html lang="es-AR" className={`${inter.variable} ${outfit.variable}`}>
      <body>{children}</body>
    </html>
  );
}
