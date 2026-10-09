import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
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

/** Caja entra directo a lo unico que hace aca: cargar el cierre. */
export function InicioCaja({ nombre }: { nombre: string }) {
  return (
    <section className="space-y-6">
      <TituloDePagina>Hola, {nombre}</TituloDePagina>
      <Button asChild>
        <Link href="/admin/caja">Cargar el cierre de caja</Link>
      </Button>
    </section>
  );
}

export function EsperaDeAcceso() {
  return (
    <section className="space-y-4">
      <TituloDePagina>Tu cuenta está en espera</TituloDePagina>
      <p>Tu cuenta ya está creada. Un administrador tiene que darte acceso.</p>
    </section>
  );
}
