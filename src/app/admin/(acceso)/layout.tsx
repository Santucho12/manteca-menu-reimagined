import type { ReactNode } from 'react';
import '@/estilos/ingreso-dorado.css';
import { EntradaDelIngreso } from '@/components/panel/Entradas';
import { Marca } from '@/components/panel/Marca';
import { Principal } from '@/components/panel/Principal';

/** Ingreso, registro y cambio obligado: la pantalla de ingreso de Plan Reminder Pro. */
export default function LayoutDeAcceso({ children }: { children: ReactNode }) {
  return (
    <div className="ingreso-dorado">
      <Principal className="min-h-screen bg-background relative overflow-clip flex items-center justify-center p-4">
        <EntradaDelIngreso className="w-full max-w-[26rem]">
          <div className="flex flex-col items-center mb-4 text-center animate-in-fade">
            <Marca tamano="ingreso" />
          </div>
          <div className="bg-card/70 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-white/50 px-8 py-7">
            {children}
          </div>
        </EntradaDelIngreso>
      </Principal>
    </div>
  );
}
