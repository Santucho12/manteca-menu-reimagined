import { Receipt } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ENLACE_EN_TEXTO, FranjaDeAviso } from '@/components/panel/Avisos';
import { BotonDeAnular } from '@/components/panel/BotonDeAnular';
import { CargadoPor } from '@/components/panel/CargadoPor';
import { Pantalla } from '@/components/panel/Pantalla';
import { Dato, Datos, Seccion } from '@/components/panel/Seccion';
import { exigirPagina } from '@/lib/acceso/servidor';
import { diaEnArgentina } from '@/lib/fechas';
import {
  gastoPorId,
  opcionesDeGasto,
  recurrentePorId,
  type Gasto,
  type OpcionDeCategoria,
} from '@/lib/gastos/consultas';
import { datosDeGastoParaEditar } from '@/lib/gastos/esquemas';
import { fechaParaMostrar, nombreDeMedio } from '@/lib/gastos/pantalla';
import type { Cliente } from '@/lib/supabase/cliente';
import { formatearPesos } from '@/lib/plata';
import { anularGastoDesdeElPanel } from '../acciones';
import { FormularioDeGasto } from '../FormularioDeGasto';

export const metadata: Metadata = { title: 'Gasto' };

function GastoAnulado({ gasto }: { gasto: Gasto }) {
  return (
    <Seccion forma="lista">
      <p className="font-bold">Anulado: {gasto.motivo_anulacion}</p>
      <Datos>
        <Dato titulo="Fecha" valor={fechaParaMostrar(gasto.fecha)} />
        <Dato titulo="Monto" valor={formatearPesos(gasto.monto_centavos)} />
        <Dato titulo="Medio de pago" valor={nombreDeMedio(gasto.medio_de_pago)} />
        <Dato titulo="Descripción" valor={gasto.descripcion} />
      </Datos>
    </Seccion>
  );
}

// La plata de este gasto la declaro Caja: aca solo se clasifica.
function DeCaja({ cierreId }: { cierreId: string }) {
  return (
    <FranjaDeAviso>
      <p>
        Salió de un cierre de caja. Elegí la categoría y, si hace falta, el proveedor. El monto y la
        fecha se corrigen anulando{' '}
        <Link href={`/admin/caja/cierres/${cierreId}`} className={ENLACE_EN_TEXTO}>
          el cierre
        </Link>
        .
      </p>
    </FranjaDeAviso>
  );
}

const VUELVE = 'Si lo anulás, vuelve a Próximos pagos.';

function DeUnFijo({ id, nombre, vuelve }: { id: string; nombre: string; vuelve: boolean }) {
  return (
    <FranjaDeAviso>
      <p>
        Es un pago del gasto fijo «{nombre}». Si cambió para los próximos meses,{' '}
        <Link href={`/admin/gastos/fijos/${id}`} className={ENLACE_EN_TEXTO}>
          editá el gasto fijo
        </Link>
        .{vuelve ? ` ${VUELVE}` : null}
      </p>
    </FranjaDeAviso>
  );
}

// Lo que se pagó de lo anotado por pagar: anularlo lo deja por pagar otra vez.
function DePorPagar() {
  return (
    <FranjaDeAviso>
      <p>Es el pago de algo que estaba por pagar. {VUELVE}</p>
    </FranjaDeAviso>
  );
}

function Franjas({ gasto, fijo }: { gasto: Gasto; fijo: { id: string; nombre: string } | null }) {
  const vuelve = gasto.por_pagar_id !== null;
  if (gasto.cierre_id) return <DeCaja cierreId={gasto.cierre_id} />;
  if (fijo) return <DeUnFijo id={fijo.id} nombre={fijo.nombre} vuelve={vuelve} />;
  return vuelve ? <DePorPagar /> : null;
}

/** El nombre del fijo que cargó el gasto: su descripción, o su categoría. */
async function fijoDelGasto(cliente: Cliente, gasto: Gasto, categorias: OpcionDeCategoria[]) {
  if (!gasto.recurrente_id) return null;
  const fijo = await recurrentePorId(cliente, gasto.recurrente_id);
  if (!fijo) return null;
  const categoria = categorias.find((c) => c.id === fijo.categoria_id)?.nombre ?? 'Gasto fijo';
  return { id: fijo.id, nombre: fijo.descripcion ?? categoria };
}

export default async function FichaDeGasto({ params }: { params: Promise<{ id: string }> }) {
  const { cliente } = await exigirPagina('admin');
  const gasto = await gastoPorId(cliente, (await params).id);
  if (!gasto) notFound();
  const opciones = await opcionesDeGasto(cliente);
  const fijo = await fijoDelGasto(cliente, gasto, opciones.categorias);
  const datos = datosDeGastoParaEditar(gasto);
  // Sin clasificar no se ofrece: el selector arranca vacio y pide elegir una categoria.
  const seOfrece = opciones.categorias.some((categoria) => categoria.id === datos.categoriaId);
  const inicial = {
    ...datos,
    categoriaId: seOfrece ? datos.categoriaId : '',
    seRepite: 'no' as const,
    yaPagado: 'si' as const,
  };
  return (
    <Pantalla titulo="Gasto" subtitulo="Corregilo o anulalo con un motivo." ayuda="gastos">
      <CargadoPor cliente={cliente} tabla="gastos" id={gasto.id} />
      {gasto.anulado ? (
        <GastoAnulado gasto={gasto} />
      ) : (
        <>
          <Franjas gasto={gasto} fijo={fijo} />
          <Seccion icono={<Receipt className="text-primary" size={24} />}>
            <FormularioDeGasto
              inicial={inicial}
              id={gasto.id}
              deCaja={gasto.cierre_id !== null}
              hoy={diaEnArgentina(new Date())}
              {...opciones}
            />
          </Seccion>
          {gasto.cierre_id ? null : (
            <BotonDeAnular
              id={gasto.id}
              anular={anularGastoDesdeElPanel}
              titulo="Anular el gasto"
            />
          )}
        </>
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
