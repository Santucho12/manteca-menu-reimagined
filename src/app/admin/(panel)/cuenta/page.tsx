import type { Metadata } from 'next';
import { DatosDeLaCuenta } from '@/components/cuenta/DatosDeLaCuenta';
import { TituloDePagina } from '@/components/panel/TituloDePagina';
import { exigirPagina } from '@/lib/acceso/servidor';
import { FormularioCambioDeContrasena } from './FormularioCambioDeContrasena';

export const metadata: Metadata = { title: 'Mi cuenta' };

export default async function PaginaMiCuenta() {
  const { perfil } = await exigirPagina('cuenta');
  return (
    <div className="max-w-md space-y-8">
      <TituloDePagina>Mi cuenta</TituloDePagina>
      <DatosDeLaCuenta perfil={perfil} />
      <section aria-labelledby="titulo-contrasena" className="space-y-4">
        <h2 id="titulo-contrasena" className="font-heading text-xl font-semibold">
          Cambiar la contraseña
        </h2>
        <FormularioCambioDeContrasena />
      </section>
    </div>
  );
}
