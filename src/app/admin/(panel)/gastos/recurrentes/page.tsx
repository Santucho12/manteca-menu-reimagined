import type { Metadata } from 'next';
import Link from 'next/link';
import { TituloDePagina } from '@/components/panel/TituloDePagina';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { exigirPagina } from '@/lib/acceso/servidor';
import { diaEnArgentina } from '@/lib/fechas';
import { listarRecurrentes, type FilaDeRecurrente } from '@/lib/gastos/consultas';
import { fechaParaMostrar, nombreDeFrecuencia } from '@/lib/gastos/pantalla';
import { proximoVencimiento } from '@/lib/gastos/vencimientos';
import { formatearPesos } from '@/lib/plata';

export const metadata: Metadata = { title: 'Gastos recurrentes' };

function Fila({ recurrente, hoy }: { recurrente: FilaDeRecurrente; hoy: string }) {
  const { frecuencia, primer_vencimiento: primero } = recurrente;
  const detalle = [recurrente.categoria, recurrente.proveedor, nombreDeFrecuencia(frecuencia)];
  return (
    <li className="flex flex-wrap items-start justify-between gap-3 p-4">
      <div className="min-w-0 space-y-1">
        <Link
          href={`/admin/gastos/recurrentes/${recurrente.id}`}
          className="font-medium underline-offset-4 hover:underline"
        >
          {recurrente.descripcion ?? recurrente.categoria}
        </Link>
        <p className="text-muted-foreground text-sm">{detalle.filter(Boolean).join(' · ')}</p>
        {recurrente.activo ? (
          <p className="text-sm">
            Próximo: {fechaParaMostrar(proximoVencimiento(primero, frecuencia, hoy))}
          </p>
        ) : (
          <Badge variant="outline">Desactivado</Badge>
        )}
      </div>
      <span className="font-medium">{formatearPesos(recurrente.monto_centavos)}</span>
    </li>
  );
}

export default async function PaginaDeRecurrentes() {
  const { cliente } = await exigirPagina('admin');
  const hoy = diaEnArgentina(new Date());
  const recurrentes = await listarRecurrentes(cliente);
  return (
    <div className="space-y-6">
      <TituloDePagina>Gastos recurrentes</TituloDePagina>
      <p className="text-muted-foreground max-w-xl text-sm">
        Cada vencimiento se carga solo como gasto, el mismo día. Si cambiás el monto, vale para los
        próximos; lo ya cargado queda como estaba.
      </p>
      <Button asChild>
        <Link href="/admin/gastos/recurrentes/nuevo">Nuevo recurrente</Link>
      </Button>
      {recurrentes.length === 0 ? (
        <p className="text-muted-foreground">Todavía no hay gastos recurrentes.</p>
      ) : (
        <ul aria-label="Recurrentes" className="bg-card divide-y rounded-xl border">
          {recurrentes.map((recurrente) => (
            <Fila key={recurrente.id} recurrente={recurrente} hoy={hoy} />
          ))}
        </ul>
      )}
      <Link href="/admin/gastos" className="inline-block py-2 text-sm underline underline-offset-4">
        Volver a gastos
      </Link>
    </div>
  );
}
