import { Wallet } from 'lucide-react';
import Link from 'next/link';
import { EncabezadoDePantalla } from './EncabezadoDePantalla';
import { EntradaDePantalla } from './Entradas';
import { BOTON_DE_ENCABEZADO } from './estilos';

/** Caja entra directo a lo unico que hace aca: cargar el cierre. */
export function InicioCaja({ nombre }: { nombre: string }) {
  return (
    <>
      <EncabezadoDePantalla titulo={`Hola, ${nombre}`} subtitulo="Cargá el cierre de tu turno." />
      <EntradaDePantalla>
        <Link href="/admin/caja" className={`${BOTON_DE_ENCABEZADO} w-fit`}>
          <Wallet size={18} />
          Cargar el cierre de caja
        </Link>
      </EntradaDePantalla>
    </>
  );
}

/** El invitado espera que un admin le de acceso. */
export function EsperaDeAcceso() {
  return (
    <>
      <EncabezadoDePantalla titulo="Tu cuenta está en espera" />
      <EntradaDePantalla>
        <div className="bg-card rounded-[2rem] border border-border/50 shadow-xl p-5 md:p-8">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Tu cuenta ya está creada. Un administrador tiene que darte acceso.
          </p>
        </div>
      </EntradaDePantalla>
    </>
  );
}
