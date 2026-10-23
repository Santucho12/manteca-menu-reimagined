import { KeyRound, UserCog } from 'lucide-react';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { BotonDeAyuda } from '@/components/panel/Ayuda';
import { DatosDeLaCuenta } from '@/components/panel/DatosDeLaCuenta';
import { EncabezadoDePantalla } from '@/components/panel/EncabezadoDePantalla';
import { EntradaDePantalla } from '@/components/panel/Entradas';
import { TARJETA_DE_FORMULARIO } from '@/components/panel/estilos';
import { exigirPagina } from '@/lib/acceso/servidor';
import { AYUDAS } from '@/lib/panel/ayudas';
import { FormularioCambioDeContrasena } from './FormularioCambioDeContrasena';

export const metadata: Metadata = { title: 'Mi cuenta' };

export default async function PaginaMiCuenta() {
  const { perfil } = await exigirPagina('cuenta');
  return (
    <>
      <EncabezadoDePantalla
        titulo="Mi cuenta"
        subtitulo="Tus datos y tu contraseña."
        ayuda={<BotonDeAyuda ayuda={AYUDAS.cuenta} />}
      />
      <EntradaDePantalla className="space-y-10">
        <Seccion titulo="Tus datos" icono={<UserCog className="text-primary" size={24} />}>
          <DatosDeLaCuenta perfil={perfil} />
        </Seccion>
        <Seccion
          titulo="Cambiar la contraseña"
          icono={<KeyRound className="text-primary" size={24} />}
        >
          <FormularioCambioDeContrasena />
        </Seccion>
      </EntradaDePantalla>
    </>
  );
}

/** Titulo con la barrita verde y la tarjeta de formulario de Plan Reminder Pro (Configuracion). */
function Seccion({
  titulo,
  icono,
  children,
}: {
  titulo: string;
  icono: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3 px-1">
        <div className="w-1 h-6 bg-primary rounded-full" />
        <h2 className="text-xl font-bold tracking-tight text-slate-800">{titulo}</h2>
      </div>
      <div className={TARJETA_DE_FORMULARIO}>
        <div className="w-12 h-12 shrink-0 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
          {icono}
        </div>
        {children}
      </div>
    </section>
  );
}
