import type { Metadata } from 'next';
import Link from 'next/link';
import { TituloDePagina } from '@/components/panel/TituloDePagina';
import { soloSinSesion } from '@/lib/acceso/servidor';
import { FormularioRegistro } from './FormularioRegistro';

export const metadata: Metadata = { title: 'Crear una cuenta' };

// Publica pero sin enlace desde el menu: solo se llega desde el ingreso.
export default async function PaginaRegistro() {
  await soloSinSesion();
  return (
    <>
      <TituloDePagina>Crear una cuenta</TituloDePagina>
      <FormularioRegistro />
      <p className="text-muted-foreground text-sm">
        ¿Ya tenés cuenta?{' '}
        <Link href="/admin/ingresar" className="text-foreground underline underline-offset-4">
          Ingresar
        </Link>
      </p>
    </>
  );
}
