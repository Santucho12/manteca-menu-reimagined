import { Store, Wallet } from 'lucide-react';
import Link from 'next/link';
import { EncabezadoDePantalla } from './EncabezadoDePantalla';
import { EntradaDePantalla } from './Entradas';
import { BOTON_DE_ENCABEZADO, BOTON_DE_ENCABEZADO_NEUTRO } from './estilos';

/** Caja entra a lo que hace aca: vender en el mostrador y cargar el cierre (pedido 89). */
export function InicioCaja({ nombre }: { nombre: string }) {
  return (
    <>
      <EncabezadoDePantalla
        titulo={`Hola, ${nombre}`}
        subtitulo="Vendé en el mostrador y, al final del turno, cargá el cierre."
      />
      <EntradaDePantalla className="flex flex-wrap gap-3">
        <Link href="/admin/vender" className={`${BOTON_DE_ENCABEZADO} w-fit`}>
          <Store size={18} />
          Vender
        </Link>
        <Link href="/admin/caja" className={`${BOTON_DE_ENCABEZADO_NEUTRO} w-fit`}>
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
        <div className="bg-card rounded-2xl border border-border shadow-card p-5 md:p-8">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Tu cuenta ya está creada. Un administrador tiene que darte acceso.
          </p>
        </div>
      </EntradaDePantalla>
    </>
  );
}
