import type { Metadata } from 'next';
import { EnlaceDeAcceso, TituloDeAcceso } from '@/components/formularios/Acceso';
import { soloSinSesion } from '@/lib/acceso/servidor';
import { FormularioRegistro } from './FormularioRegistro';

export const metadata: Metadata = { title: 'Crear una cuenta' };

// Publica pero sin enlace desde el menu: solo se llega desde el ingreso.
export default async function PaginaRegistro() {
  await soloSinSesion();
  return (
    <>
      <TituloDeAcceso>Crear una cuenta</TituloDeAcceso>
      <FormularioRegistro />
      <EnlaceDeAcceso pregunta="¿Ya tenés cuenta?" href="/admin/ingresar" texto="Ingresar" />
    </>
  );
}
