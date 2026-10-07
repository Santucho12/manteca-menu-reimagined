import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { textoDePendientes } from '@/lib/usuarios/presentacion';
import { TituloDePagina } from './TituloDePagina';

export function InicioAdmin({ pendientes }: { pendientes: number }) {
  return (
    <section className="space-y-4">
      <TituloDePagina>Inicio</TituloDePagina>
      <p>{textoDePendientes(pendientes)}</p>
      <Link
        href="/admin/usuarios?estado=pendientes"
        className={buttonVariants({ variant: 'outline' })}
      >
        Ver usuarios
      </Link>
    </section>
  );
}

/** Mientras no exista la carga del cierre, caja ve su nombre, Mi cuenta y Salir. */
export function InicioCaja({ nombre }: { nombre: string }) {
  return <TituloDePagina>Hola, {nombre}</TituloDePagina>;
}

export function EsperaDeAcceso() {
  return (
    <section className="space-y-4">
      <TituloDePagina>Tu cuenta está en espera</TituloDePagina>
      <p>Tu cuenta ya está creada. Un administrador tiene que darte acceso.</p>
    </section>
  );
}
