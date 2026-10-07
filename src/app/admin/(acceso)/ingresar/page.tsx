import type { Metadata } from 'next';
import Link from 'next/link';
import { AvisoDeError } from '@/components/formularios/AvisoDeError';
import { TituloDePagina } from '@/components/panel/TituloDePagina';
import { soloSinSesion } from '@/lib/acceso/servidor';
import { MENSAJES } from '@/lib/usuarios/errores';
import { unValor } from '@/lib/usuarios/presentacion';
import { FormularioIngreso } from './FormularioIngreso';

export const metadata: Metadata = { title: 'Ingresar' };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function PaginaIngresar({ searchParams }: Props) {
  await soloSinSesion();
  const desactivada = unValor((await searchParams).motivo) === 'desactivada';
  return (
    <>
      <TituloDePagina>Ingresar</TituloDePagina>
      {desactivada ? <AvisoDeError mensaje={MENSAJES.desactivada} /> : null}
      <FormularioIngreso />
      <p className="text-muted-foreground text-sm">
        ¿No tenés cuenta?{' '}
        <Link href="/admin/registro" className="text-foreground underline underline-offset-4">
          Crear una cuenta
        </Link>
      </p>
    </>
  );
}
