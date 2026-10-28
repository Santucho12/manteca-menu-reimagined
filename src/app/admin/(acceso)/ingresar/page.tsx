import { UserPlus } from 'lucide-react';
import type { Metadata } from 'next';
import { BotonSecundarioDeAcceso, TituloDeAcceso } from '@/components/formularios/Acceso';
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
      <TituloDeAcceso
        inicio="Ingresar al"
        resaltado="sistema"
        subtitulo="Ingresá con tu usuario del local."
      />
      {desactivada ? (
        <AvisoDeError mensaje={MENSAJES.desactivada} variante="caja" className="mb-4" />
      ) : null}
      <FormularioIngreso />
      <BotonSecundarioDeAcceso href="/admin/registro" texto="Crear cuenta" icono={UserPlus} />
    </>
  );
}
