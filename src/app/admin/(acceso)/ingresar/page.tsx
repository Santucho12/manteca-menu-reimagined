import type { Metadata } from 'next';
import { EnlaceDeAcceso, TituloDeAcceso } from '@/components/formularios/Acceso';
import { AvisoDeError } from '@/components/formularios/AvisoDeError';
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
      <TituloDeAcceso>Ingresar</TituloDeAcceso>
      {desactivada ? (
        <AvisoDeError mensaje={MENSAJES.desactivada} variante="caja" className="mb-4" />
      ) : null}
      <FormularioIngreso />
      <EnlaceDeAcceso
        pregunta="¿No tenés cuenta?"
        href="/admin/registro"
        texto="Crear una cuenta"
      />
    </>
  );
}
