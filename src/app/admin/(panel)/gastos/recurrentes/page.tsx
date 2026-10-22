import { Plus, Repeat } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { BOTON_DE_ENCABEZADO } from '@/components/panel/estilos';
import { InsigniaDeEstado } from '@/components/panel/Insignias';
import { ListaDelPanel, type Columna } from '@/components/panel/ListaDelPanel';
import { Pantalla } from '@/components/panel/Pantalla';
import { SinResultados } from '@/components/panel/SinResultados';
import { exigirPagina } from '@/lib/acceso/servidor';
import { diaEnArgentina } from '@/lib/fechas';
import { listarRecurrentes, type FilaDeRecurrente } from '@/lib/gastos/consultas';
import { fechaParaMostrar, nombreDeFrecuencia } from '@/lib/gastos/pantalla';
import { proximoVencimiento } from '@/lib/gastos/vencimientos';
import { formatearPesos } from '@/lib/plata';

export const metadata: Metadata = { title: 'Gastos recurrentes' };

const ENLACE =
  'text-xs font-semibold text-foreground hover:text-primary rounded focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40 transition-colors';

const nombre = (r: FilaDeRecurrente) => r.descripcion ?? r.categoria;

function Proximo({ recurrente, hoy }: { recurrente: FilaDeRecurrente; hoy: string }) {
  if (!recurrente.activo) return <InsigniaDeEstado tono="pizarra">Desactivado</InsigniaDeEstado>;
  const { frecuencia, primer_vencimiento: primero } = recurrente;
  return (
    <span className="text-xs font-medium">
      Próximo: {fechaParaMostrar(proximoVencimiento(primero, frecuencia, hoy))}
    </span>
  );
}

function columnasDe(hoy: string): Columna<FilaDeRecurrente>[] {
  return [
    {
      titulo: 'Gasto',
      celda: (r) => (
        <Link href={`/admin/gastos/recurrentes/${r.id}`} className={ENLACE}>
          {nombre(r)}
        </Link>
      ),
    },
    {
      titulo: 'Detalle',
      desde: 'lg',
      celda: (r) => (
        <span className="text-xs text-foreground/80">
          {[r.categoria, r.proveedor].filter(Boolean).join(' · ')}
        </span>
      ),
    },
    {
      titulo: 'Frecuencia',
      celda: (r) => <span className="text-xs">{nombreDeFrecuencia(r.frecuencia)}</span>,
    },
    { titulo: 'Vencimiento', celda: (r) => <Proximo recurrente={r} hoy={hoy} /> },
    {
      titulo: 'Monto',
      alinear: 'der',
      celda: (r) => <span className="text-sm font-bold">{formatearPesos(r.monto_centavos)}</span>,
    },
  ];
}

export default async function PaginaDeRecurrentes() {
  const { cliente } = await exigirPagina('admin');
  const hoy = diaEnArgentina(new Date());
  const recurrentes = await listarRecurrentes(cliente);
  const nuevo = (
    <Link href="/admin/gastos/recurrentes/nuevo" className={BOTON_DE_ENCABEZADO}>
      <Plus size={18} aria-hidden="true" /> Nuevo recurrente
    </Link>
  );
  return (
    <Pantalla
      titulo="Gastos recurrentes"
      subtitulo="Cada vencimiento se carga solo como gasto, el mismo día."
      acciones={nuevo}
      ayuda="recurrentes"
    >
      <p className="text-xs text-muted-foreground max-w-xl">
        Si cambiás el monto, vale para los próximos; lo ya cargado queda como estaba.
      </p>
      {recurrentes.length === 0 ? (
        <SinResultados
          titulo="Todavía no hay gastos recurrentes"
          texto="Cargá el primero con Nuevo recurrente."
        />
      ) : (
        <ListaDelPanel
          etiqueta="Recurrentes"
          icono={Repeat}
          total={recurrentes.length}
          filas={recurrentes}
          clave={(r) => r.id}
          columnas={columnasDe(hoy)}
          tarjeta={(r) => (
            <>
              <div className="flex items-start justify-between gap-3">
                <Link
                  href={`/admin/gastos/recurrentes/${r.id}`}
                  className="text-sm font-bold break-words"
                >
                  {nombre(r)}
                </Link>
                <span className="text-sm font-bold">{formatearPesos(r.monto_centavos)}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {[r.categoria, r.proveedor, nombreDeFrecuencia(r.frecuencia)]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
              <Proximo recurrente={r} hoy={hoy} />
            </>
          )}
        />
      )}
      <Link
        href="/admin/gastos"
        className="inline-block text-sm font-semibold text-muted-foreground hover:text-primary"
      >
        Volver a gastos
      </Link>
    </Pantalla>
  );
}
