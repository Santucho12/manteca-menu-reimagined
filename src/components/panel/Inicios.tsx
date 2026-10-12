import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { TituloDePagina } from './TituloDePagina';

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
