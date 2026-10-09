import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { TituloDePagina } from '@/components/panel/TituloDePagina';
import { exigirPagina } from '@/lib/acceso/servidor';
import { nombresDe, registroPorId } from '@/lib/auditoria/consultas';
import {
  cambiosDe,
  datoDe,
  enlaceDe,
  fechaYHora,
  nombreDeAccion,
  personaDe,
  type Cambio,
} from '@/lib/auditoria/textos';

export const metadata: Metadata = { title: 'Registro de auditoría' };

// Cada campo con su valor anterior y el nuevo; en un alta, solo lo cargado.
function Cambios({ cambios, conAntes }: { cambios: Cambio[]; conAntes: boolean }) {
  if (cambios.length === 0) return null;
  const columnas = conAntes ? 'sm:grid-cols-3' : 'sm:grid-cols-2';
  return (
    <div className="bg-card rounded-xl border">
      <div
        className={`text-muted-foreground hidden gap-3 border-b p-4 text-sm sm:grid ${columnas}`}
      >
        <span>Campo</span>
        {conAntes ? <span>Antes</span> : null}
        <span>{conAntes ? 'Después' : 'Valor'}</span>
      </div>
      <ul aria-label="Cambios" className="divide-y">
        {cambios.map((cambio) => (
          <li key={cambio.campo} className={`grid gap-1 p-4 sm:gap-3 ${columnas}`}>
            <span className="font-medium">{cambio.campo}</span>
            {conAntes ? <span className="text-muted-foreground">{cambio.antes}</span> : null}
            <span>{cambio.despues}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function RegistroDeAuditoria({ params }: { params: Promise<{ id: string }> }) {
  const { cliente } = await exigirPagina('admin');
  const registro = await registroPorId(cliente, (await params).id);
  if (!registro) notFound();
  const nombres = await nombresDe(cliente, [registro]);
  const { modulo, dato } = datoDe(registro.tabla);
  const enlace = enlaceDe(registro);
  return (
    <div className="space-y-6">
      <TituloDePagina>
        {nombreDeAccion(registro.accion)}: {dato}
      </TituloDePagina>
      <p className="text-muted-foreground">
        {modulo} · {fechaYHora(registro.fecha)} · {personaDe(registro.usuario_id, nombres)}
      </p>
      {registro.motivo ? <p className="font-medium">Motivo: {registro.motivo}</p> : null}
      <Cambios cambios={cambiosDe(registro, nombres)} conAntes={registro.antes !== null} />
      <div className="flex flex-wrap gap-4 text-sm">
        {enlace ? (
          <Link href={enlace} className="underline underline-offset-4">
            Ver el dato
          </Link>
        ) : null}
        <Link href="/admin/auditoria" className="underline underline-offset-4">
          Volver a la auditoría
        </Link>
      </div>
    </div>
  );
}
