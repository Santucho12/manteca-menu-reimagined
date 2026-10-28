import { LogIn } from 'lucide-react';
import type { Metadata } from 'next';
import { BotonSecundarioDeAcceso, TituloDeAcceso } from '@/components/formularios/Acceso';
import { soloSinSesion } from '@/lib/acceso/servidor';
import { FormularioRegistro } from './FormularioRegistro';

export const metadata: Metadata = { title: 'Crear una cuenta' };

// Publica pero sin enlace desde el menu: solo se llega desde el ingreso.
export default async function PaginaRegistro() {
  await soloSinSesion();
  return (
    <>
      <TituloDeAcceso
        inicio="Crear"
        resaltado="cuenta"
        subtitulo="Un administrador te va a dar acceso."
      />
      <FormularioRegistro />
      <BotonSecundarioDeAcceso href="/admin/ingresar" texto="Ya tengo cuenta" icono={LogIn} />
    </>
  );
}
