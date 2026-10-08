'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { AvisoDeError } from '@/components/formularios/AvisoDeError';
import { Campo } from '@/components/formularios/Campo';
import { CampoDeTextoLargo } from '@/components/formularios/CampoDeTextoLargo';
import { Button } from '@/components/ui/button';
import { esquemaProveedor, type DatosDeProveedor } from '@/lib/proveedores/esquemas';
import { useGuardarProveedor } from '@/lib/proveedores/useGuardarProveedor';
import { crearProveedorDesdeElPanel, editarProveedorDesdeElPanel } from './acciones';

type Props = { inicial: DatosDeProveedor; id?: string };

function Repetido({
  nombre,
  enviando,
  alConfirmar,
  alVolver,
}: {
  nombre: string;
  enviando: boolean;
  alConfirmar: () => void;
  alVolver: () => void;
}) {
  return (
    <div role="alertdialog" aria-labelledby="repetido" className="space-y-3 rounded-lg border p-4">
      <p id="repetido" className="text-sm">
        Ya hay un proveedor llamado {nombre}. ¿Lo cargás igual?
      </p>
      <div className="flex gap-2">
        <Button disabled={enviando} onClick={alConfirmar}>
          Cargar igual
        </Button>
        <Button variant="outline" onClick={alVolver}>
          Volver
        </Button>
      </div>
    </div>
  );
}

export function FormularioDeProveedor({ inicial, id }: Props) {
  const router = useRouter();
  const guardar = (datos: DatosDeProveedor, confirmar: boolean) =>
    id
      ? editarProveedorDesdeElPanel({ ...datos, id })
      : crearProveedorDesdeElPanel({ ...datos, confirmar });
  const guardado = useGuardarProveedor(guardar, (nuevo) =>
    router.push(`/admin/proveedores/${nuevo}`),
  );
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DatosDeProveedor>({
    resolver: zodResolver(esquemaProveedor),
    defaultValues: inicial,
  });
  return (
    <form onSubmit={handleSubmit(guardado.enviar)} noValidate className="max-w-xl space-y-4">
      {guardado.mensaje ? <AvisoDeError mensaje={guardado.mensaje} /> : null}
      <Campo id="nombre" etiqueta="Nombre" error={errors.nombre?.message} {...register('nombre')} />
      <Campo
        id="telefono"
        etiqueta="Teléfono de WhatsApp"
        inputMode="tel"
        error={errors.telefono?.message}
        {...register('telefono')}
      />
      <Campo
        id="ubicacion"
        etiqueta="Ubicación"
        error={errors.ubicacion?.message}
        {...register('ubicacion')}
      />
      <Campo
        id="que-compra"
        etiqueta="Qué le comprás"
        error={errors.queCompra?.message}
        {...register('queCompra')}
      />
      <CampoDeTextoLargo
        id="observaciones"
        etiqueta="Observaciones"
        error={errors.observaciones?.message}
        {...register('observaciones')}
      />
      {guardado.repetido ? (
        <Repetido
          nombre={guardado.repetido.nombre}
          enviando={guardado.enviando}
          alConfirmar={guardado.confirmar}
          alVolver={guardado.volver}
        />
      ) : (
        <Button type="submit" disabled={guardado.enviando}>
          {guardado.enviando ? 'Guardando…' : 'Guardar'}
        </Button>
      )}
    </form>
  );
}
