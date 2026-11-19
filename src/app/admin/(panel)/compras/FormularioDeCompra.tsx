'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { AvisoDeError } from '@/components/formularios/AvisoDeError';
import { Campo } from '@/components/formularios/Campo';
import { CampoDeSeleccion } from '@/components/formularios/CampoDeSeleccion';
import { PieDelFormulario } from '@/components/formularios/PieDelFormulario';
import type { FormaParaComprar } from '@/lib/compras/consultas';
import { esquemaCompra, MEDIOS_DE_COMPRA, type DatosDeCompra } from '@/lib/compras/esquemas';
import { formasDelProveedor, totalDeLaCompra } from '@/lib/compras/pantalla';
import { useUnaVez } from '@/lib/formularios/useUnaVez';
import { centavosDeMonto } from '@/lib/gastos/plata';
import { nombreDeMedio } from '@/lib/gastos/pantalla';
import { contenidoDeTexto } from '@/lib/materia-prima/esquemas';
import { formatearPesos } from '@/lib/plata';
import { recibirCompraDesdeElPanel } from './acciones';
import { Renglones } from './Renglones';

type Opcion = { valor: string; texto: string };
type Props = { inicial: DatosDeCompra; proveedores: Opcion[]; formas: FormaParaComprar[] };
type Formulario = UseFormReturn<DatosDeCompra>;

const PAGOS = [
  { valor: 'pagada', texto: 'Ya la pagué' },
  { valor: 'por_pagar', texto: 'Queda por pagar' },
];
const MEDIOS = MEDIOS_DE_COMPRA.map((m) => ({ valor: m, texto: nombreDeMedio(m) }));

function Pago({ formulario }: { formulario: Formulario }) {
  const { register, watch, formState } = formulario;
  const errores = formState.errors;
  const pagada = watch('pago') === 'pagada';
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <CampoDeSeleccion
        id="pago"
        etiqueta="¿Ya la pagaste?"
        opciones={PAGOS}
        {...register('pago')}
      />
      {pagada ? (
        <>
          <CampoDeSeleccion
            id="medio"
            etiqueta="Cómo la pagaste"
            opciones={MEDIOS}
            error={errores.medio?.message}
            {...register('medio')}
          />
          <Campo
            id="fecha-de-pago"
            etiqueta="Día del pago"
            type="date"
            error={errores.fechaDePago?.message}
            {...register('fechaDePago')}
          />
        </>
      ) : (
        <Campo
          id="vencimiento"
          etiqueta="Vence el"
          type="date"
          error={errores.vencimiento?.message}
          {...register('vencimiento')}
        />
      )}
    </div>
  );
}

function Total({ formulario }: { formulario: Formulario }) {
  const renglones = formulario.watch('renglones').map((r) => ({
    cantidad: contenidoDeTexto(r.cantidad) ?? 0,
    precioCentavos: centavosDeMonto(r.precio) ?? 0,
  }));
  const total = totalDeLaCompra(renglones, centavosDeMonto(formulario.watch('otrosCargos')) ?? 0);
  return <p className="text-sm font-bold">Total: {formatearPesos(total)}</p>;
}

/** Lo que llego, a que precio, y si ya se pago o queda por pagar. */
export function FormularioDeCompra({ inicial, proveedores, formas }: Props) {
  const router = useRouter();
  const [clave] = useState(() => crypto.randomUUID());
  const [mensaje, setMensaje] = useState<string | null>(null);
  const { enviando, unaVez } = useUnaVez();
  const formulario = useForm<DatosDeCompra>({
    resolver: zodResolver(esquemaCompra),
    defaultValues: inicial,
  });
  const { register, handleSubmit, watch, formState } = formulario;
  const enviar = (datos: DatosDeCompra) =>
    unaVez(async () => {
      const resultado = await recibirCompraDesdeElPanel({ ...datos, clave });
      setMensaje(resultado.ok ? null : resultado.mensaje);
      if (resultado.ok) router.push(`/admin/compras/${resultado.datos.id}`);
    });
  return (
    <form onSubmit={handleSubmit(enviar)} noValidate className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <CampoDeSeleccion
          id="proveedor"
          etiqueta="Proveedor"
          opciones={proveedores}
          error={formState.errors.proveedorId?.message}
          {...register('proveedorId')}
        />
        <Campo
          id="fecha"
          etiqueta="Día que llegó"
          type="date"
          error={formState.errors.fecha?.message}
          {...register('fecha')}
        />
        <Campo
          id="factura"
          etiqueta="Factura"
          error={formState.errors.factura?.message}
          {...register('factura')}
        />
      </div>
      <Renglones
        formulario={formulario as never}
        formas={formasDelProveedor(formas, watch('proveedorId'))}
        conPrecio
      />
      <Campo
        id="otros-cargos"
        etiqueta="Otros cargos"
        inputMode="decimal"
        error={formState.errors.otrosCargos?.message}
        {...register('otrosCargos')}
      />
      <Pago formulario={formulario} />
      <Total formulario={formulario} />
      {mensaje ? <AvisoDeError mensaje={mensaje} /> : null}
      <PieDelFormulario enviando={enviando} cancelar="/admin/compras" />
    </form>
  );
}
