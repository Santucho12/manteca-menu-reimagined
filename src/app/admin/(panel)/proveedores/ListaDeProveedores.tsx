import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { FilaDeProveedor } from '@/lib/proveedores/consultas';
import { telefonoParaMostrar, urlDeWhatsApp } from '@/lib/proveedores/telefono';

function FilaDeLaLista({ proveedor }: { proveedor: FilaDeProveedor }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 p-4">
      <div className="min-w-0 space-y-1">
        <Link
          href={`/admin/proveedores/${proveedor.id}`}
          className="font-medium underline-offset-4 hover:underline"
        >
          {proveedor.nombre}
        </Link>
        {proveedor.que_compra ? (
          <p className="text-muted-foreground text-sm">{proveedor.que_compra}</p>
        ) : null}
        {proveedor.telefono ? (
          <p className="text-sm">{telefonoParaMostrar(proveedor.telefono)}</p>
        ) : null}
      </div>
      {proveedor.telefono ? (
        <Button asChild variant="outline" size="sm">
          <a href={urlDeWhatsApp(proveedor.telefono)} target="_blank" rel="noopener noreferrer">
            WhatsApp
          </a>
        </Button>
      ) : null}
    </li>
  );
}

export function ListaDeProveedores({ filas }: { filas: FilaDeProveedor[] }) {
  if (filas.length === 0)
    return <p className="text-muted-foreground">No hay proveedores para mostrar.</p>;
  return (
    <ul aria-label="Proveedores" className="bg-card divide-y rounded-xl border">
      {filas.map((proveedor) => (
        <FilaDeLaLista key={proveedor.id} proveedor={proveedor} />
      ))}
    </ul>
  );
}
