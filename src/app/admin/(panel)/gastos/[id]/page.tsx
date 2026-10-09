import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { TituloDePagina } from '@/components/panel/TituloDePagina';
import { exigirPagina } from '@/lib/acceso/servidor';
import { gastoPorId, opcionesDeGasto, type Gasto } from '@/lib/gastos/consultas';
import { datosDeGastoParaEditar } from '@/lib/gastos/esquemas';
import { fechaParaMostrar, nombreDeMedio } from '@/lib/gastos/pantalla';
import { formatearPesos } from '@/lib/plata';
import { BotonDeAnular } from '../BotonDeAnular';
import { FormularioDeGasto } from '../FormularioDeGasto';

export const metadata: Metadata = { title: 'Gasto' };

function GastoAnulado({ gasto }: { gasto: Gasto }) {
  return (
    <div className="bg-card max-w-xl space-y-2 rounded-xl border p-4">
      <p className="font-medium">Anulado: {gasto.motivo_anulacion}</p>
      <p className="text-muted-foreground text-sm">
        {fechaParaMostrar(gasto.fecha)} · {formatearPesos(gasto.monto_centavos)} ·{' '}
        {nombreDeMedio(gasto.medio_de_pago)}
      </p>
      {gasto.descripcion ? <p className="text-sm">{gasto.descripcion}</p> : null}
    </div>
  );
}

export default async function FichaDeGasto({ params }: { params: Promise<{ id: string }> }) {
  const { cliente } = await exigirPagina('admin');
  const gasto = await gastoPorId(cliente, (await params).id);
  if (!gasto) notFound();
  const opciones = await opcionesDeGasto(cliente);
  return (
    <div className="space-y-6">
      <TituloDePagina>Gasto</TituloDePagina>
      {gasto.anulado ? (
        <GastoAnulado gasto={gasto} />
      ) : (
        <>
          <FormularioDeGasto inicial={datosDeGastoParaEditar(gasto)} id={gasto.id} {...opciones} />
          <BotonDeAnular id={gasto.id} />
        </>
      )}
      <Link href="/admin/gastos" className="inline-block py-2 text-sm underline underline-offset-4">
        Volver a gastos
      </Link>
    </div>
  );
}
