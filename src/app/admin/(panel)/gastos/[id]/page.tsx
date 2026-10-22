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
import { gastoPorId, opcionesDeGasto, type Gasto } from '@/lib/gastos/consultas';
import { datosDeGastoParaEditar } from '@/lib/gastos/esquemas';
import { fechaParaMostrar, nombreDeMedio } from '@/lib/gastos/pantalla';
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

export default async function FichaDeGasto({ params }: { params: Promise<{ id: string }> }) {
  const { cliente } = await exigirPagina('admin');
  const gasto = await gastoPorId(cliente, (await params).id);
  if (!gasto) notFound();
  const opciones = await opcionesDeGasto(cliente);
  const datos = datosDeGastoParaEditar(gasto);
  // Sin clasificar no se ofrece: el selector arranca vacio y pide elegir una categoria.
  const seOfrece = opciones.categorias.some((categoria) => categoria.id === datos.categoriaId);
  const inicial = { ...datos, categoriaId: seOfrece ? datos.categoriaId : '' };
  return (
    <Pantalla titulo="Gasto" subtitulo="Corregilo o anulalo con un motivo." ayuda="gastos">
      <CargadoPor cliente={cliente} tabla="gastos" id={gasto.id} />
      {gasto.anulado ? (
        <GastoAnulado gasto={gasto} />
      ) : (
        <>
          {gasto.cierre_id ? <DeCaja cierreId={gasto.cierre_id} /> : null}
          <Seccion icono={<Receipt className="text-primary" size={24} />}>
            <FormularioDeGasto
              inicial={inicial}
              id={gasto.id}
              deCaja={gasto.cierre_id !== null}
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
