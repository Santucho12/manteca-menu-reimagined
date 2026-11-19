import { EnlaceDeVolver } from '@/components/panel/EnlaceDeVolver';
import { Pencil, Send } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ENLACE_EN_TEXTO, FranjaDeAviso } from '@/components/panel/Avisos';
import { CargadoPor } from '@/components/panel/CargadoPor';
import { BOTON_DE_ENCABEZADO, BOTON_DE_ENCABEZADO_NEUTRO } from '@/components/panel/estilos';
import { InsigniaDeEstado } from '@/components/panel/Insignias';
import { Pantalla } from '@/components/panel/Pantalla';
import { Dato, Datos, Seccion } from '@/components/panel/Seccion';
import { exigirPaginaYLeer } from '@/lib/acceso/servidor';
import { diaEnArgentina } from '@/lib/fechas';
import { porPagarPorProveedor, recurrentesActivosDelProveedor } from '@/lib/gastos/proveedores';
import { textoDePorPagar } from '@/lib/proveedores/pantalla';
import { proveedorPorId, type Proveedor } from '@/lib/proveedores/consultas';
import { telefonoParaMostrar, urlDeWhatsApp } from '@/lib/proveedores/telefono';
import { BotonDeEstado } from '../BotonDeEstado';
import { PagosDelProveedor } from './PagosDelProveedor';

export const metadata: Metadata = { title: 'Proveedor' };

function DatosDelProveedor({ proveedor }: { proveedor: Proveedor }) {
  const telefono = proveedor.telefono ? telefonoParaMostrar(proveedor.telefono) : null;
  return (
    <Seccion forma="lista">
      <Datos>
        <Dato titulo="Teléfono" valor={telefono} />
        <Dato titulo="Ubicación" valor={proveedor.ubicacion} />
        <Dato titulo="Qué le comprás" valor={proveedor.que_compra} />
        <Dato titulo="Observaciones" valor={proveedor.observaciones} />
      </Datos>
    </Seccion>
  );
}

// Un gasto fijo sigue cargandose aunque su proveedor se desactive: se avisa antes.
function AvisoDeRecurrentes({ cantidad }: { cantidad: number }) {
  const texto = cantidad === 1 ? '1 gasto fijo activo' : `${cantidad} gastos fijos activos`;
  return (
    <FranjaDeAviso>
      <p>
        Tiene {texto}. Si lo desactivás, se siguen cargando: pausalos desde Próximos pagos, en{' '}
        <Link href="/admin/gastos" className={ENLACE_EN_TEXTO}>
          Gastos
        </Link>
        , si ya no le pagás.
      </p>
    </FranjaDeAviso>
  );
}

function Acciones({ proveedor }: { proveedor: Proveedor }) {
  return (
    <>
      {proveedor.telefono ? (
        <a
          href={urlDeWhatsApp(proveedor.telefono)}
          target="_blank"
          rel="noopener noreferrer"
          className={BOTON_DE_ENCABEZADO}
        >
          <Send size={18} aria-hidden="true" /> WhatsApp
        </a>
      ) : null}
      <Link
        href={`/admin/proveedores/${proveedor.id}/editar`}
        className={BOTON_DE_ENCABEZADO_NEUTRO}
      >
        <Pencil size={18} aria-hidden="true" /> Editar
      </Link>
    </>
  );
}

export default async function FichaDeProveedor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { cliente, datos } = await exigirPaginaYLeer('admin', (cliente) =>
    Promise.all([
      proveedorPorId(cliente, id),
      recurrentesActivosDelProveedor(cliente, id),
      porPagarPorProveedor(cliente),
    ]),
  );
  const [proveedor, recurrentes, deudas] = datos;
  if (!proveedor) notFound();
  const porPagarCentavos = deudas.get(id) ?? 0;
  const avisoDePorPagar = proveedor.activo ? textoDePorPagar(porPagarCentavos) : null;
  return (
    <Pantalla
      titulo={proveedor.nombre}
      subtitulo="Sus datos y lo que le pagaste."
      acciones={<Acciones proveedor={proveedor} />}
      ayuda="proveedores"
    >
      {proveedor.activo ? null : (
        <div>
          <InsigniaDeEstado tono="pizarra">Desactivado</InsigniaDeEstado>
        </div>
      )}
      <CargadoPor cliente={cliente} tabla="proveedores" id={proveedor.id} />
      <DatosDelProveedor proveedor={proveedor} />
      <BotonDeEstado id={proveedor.id} activo={proveedor.activo} />
      {proveedor.activo && recurrentes > 0 ? <AvisoDeRecurrentes cantidad={recurrentes} /> : null}
      {avisoDePorPagar ? (
        <FranjaDeAviso>
          <p>{avisoDePorPagar}</p>
        </FranjaDeAviso>
      ) : null}
      <PagosDelProveedor
        cliente={cliente}
        porPagarCentavos={porPagarCentavos}
        proveedorId={proveedor.id}
        hoy={diaEnArgentina(new Date())}
      />
      <EnlaceDeVolver href="/admin/proveedores">Volver a proveedores</EnlaceDeVolver>
    </Pantalla>
  );
}
