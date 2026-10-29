import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FranjaDeAviso } from '@/components/panel/Avisos';
import { BOTON_DE_ENCABEZADO } from '@/components/panel/estilos';
import { Pantalla } from '@/components/panel/Pantalla';
import { exigirPaginaYLeer } from '@/lib/acceso/servidor';
import { nombresDe, registroPorId } from '@/lib/auditoria/consultas';
import {
  cambiosDe,
  datoDe,
  enlaceDe,
  fechaYHora,
  nombreDeAccion,
  nombreDelDato,
  personaDe,
  type Cambio,
} from '@/lib/auditoria/textos';

export const metadata: Metadata = { title: 'Registro de auditoría' };

const TITULO = 'text-[10px] font-bold text-muted-foreground uppercase tracking-widest';

// Cada campo con su valor anterior y el nuevo; en un alta, solo lo cargado.
function Cambios({ cambios, conAntes }: { cambios: Cambio[]; conAntes: boolean }) {
  if (cambios.length === 0) return null;
  const columnas = conAntes ? 'sm:grid-cols-3' : 'sm:grid-cols-2';
  return (
    <div className="bg-card rounded-2xl shadow-card border border-border overflow-hidden">
      <div className={`hidden gap-3 border-b border-border bg-muted/30 p-4 sm:grid ${columnas}`}>
        <span className={TITULO}>Campo</span>
        {conAntes ? <span className={TITULO}>Antes</span> : null}
        <span className={TITULO}>{conAntes ? 'Después' : 'Valor'}</span>
      </div>
      <ul aria-label="Cambios" className="divide-y divide-border">
        {cambios.map((cambio) => (
          <li key={cambio.campo} className={`grid gap-1 p-4 text-sm sm:gap-3 ${columnas}`}>
            <span className="font-bold">{cambio.campo}</span>
            {conAntes ? <span className="text-muted-foreground">{cambio.antes}</span> : null}
            <span>{cambio.despues}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function RegistroDeAuditoria({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { cliente, datos: registro } = await exigirPaginaYLeer('admin', (cliente) =>
    registroPorId(cliente, id),
  );
  if (!registro) notFound();
  const nombres = await nombresDe(cliente, [registro]);
  const { modulo, dato } = datoDe(registro.tabla);
  const enlace = enlaceDe(registro);
  const nombre = nombreDelDato(registro, nombres);
  return (
    <Pantalla
      titulo={`${nombreDeAccion(registro.accion)}: ${dato}${nombre ? ` · ${nombre}` : ''}`}
      subtitulo={`${modulo} · ${fechaYHora(registro.fecha)} · ${personaDe(registro.usuario_id, nombres)}`}
      acciones={
        enlace ? (
          <Link href={enlace} className={BOTON_DE_ENCABEZADO}>
            Ver el dato
          </Link>
        ) : undefined
      }
      ayuda="auditoria"
    >
      {registro.motivo ? (
        <FranjaDeAviso>
          <p>Motivo: {registro.motivo}</p>
        </FranjaDeAviso>
      ) : null}
      <Cambios cambios={cambiosDe(registro, nombres)} conAntes={registro.antes !== null} />
      <Link
        href="/admin/auditoria"
        className="inline-block text-sm font-semibold text-muted-foreground hover:text-primary"
      >
        Volver a la auditoría
      </Link>
    </Pantalla>
  );
}
