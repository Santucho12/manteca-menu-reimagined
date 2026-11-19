'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { AvisoDeError } from '@/components/formularios/AvisoDeError';
import { Campo } from '@/components/formularios/Campo';
import { CampoDeSeleccion } from '@/components/formularios/CampoDeSeleccion';
import { PieDelFormulario } from '@/components/formularios/PieDelFormulario';
import type { FormaParaComprar } from '@/lib/compras/consultas';
import {
  esquemaDesdeGasto,
  esquemaPedido,
  type DatosDePedido,
  type DatosDesdeGasto,
} from '@/lib/compras/esquemas';
import { formasDelProveedor } from '@/lib/compras/pantalla';
import { useUnaVez } from '@/lib/formularios/useUnaVez';
import type { Resultado } from '@/lib/resultado';
import { compraDesdeGastoDesdeElPanel, pedirCompraDesdeElPanel } from './acciones';
import { Renglones } from './Renglones';

type Opcion = { valor: string; texto: string };
type Guardar = (datos: unknown) => Promise<Resultado<{ id: string }>>;

/** Manda una vez, con la clave de esta carga, y lleva a la compra que quedo. */
function useCargarCompra(guardar: Guardar) {
  const router = useRouter();
  const [clave] = useState(() => crypto.randomUUID());
  const [mensaje, setMensaje] = useState<string | null>(null);
  const { enviando, unaVez } = useUnaVez();
  const enviar = (datos: object) =>
    unaVez(async () => {
      const resultado = await guardar({ ...datos, clave });
      setMensaje(resultado.ok ? null : resultado.mensaje);
      if (resultado.ok) router.push(`/admin/compras/${resultado.datos.id}`);
    });
  return { mensaje, enviando, enviar };
}

type PropsDelPedido = { proveedores: Opcion[]; formas: FormaParaComprar[] };

/** Lo que se le pide al proveedor; despues se manda por WhatsApp desde la compra. */
export function FormularioDePedido({ proveedores, formas }: PropsDelPedido) {
  const formulario = useForm<DatosDePedido>({
    resolver: zodResolver(esquemaPedido),
    defaultValues: { proveedorId: '', renglones: [] },
  });
  const carga = useCargarCompra(pedirCompraDesdeElPanel);
  const errores = formulario.formState.errors;
  return (
    <form onSubmit={formulario.handleSubmit(carga.enviar)} noValidate className="space-y-5">
      <CampoDeSeleccion
        id="proveedor"
        etiqueta="Proveedor"
        opciones={proveedores}
        error={errores.proveedorId?.message}
        {...formulario.register('proveedorId')}
      />
      <Renglones
        formulario={formulario as never}
        formas={formasDelProveedor(formas, formulario.watch('proveedorId'))}
        conPrecio={false}
      />
      {carga.mensaje ? <AvisoDeError mensaje={carga.mensaje} /> : null}
      <PieDelFormulario
        enviando={carga.enviando}
        texto="Guardar pedido"
        cancelar="/admin/compras"
      />
    </form>
  );
}

type PropsDesdeGasto = {
  gastoId: string;
  proveedores: Opcion[];
  formas: FormaParaComprar[];
};

/** Una compra pagada con la caja: los renglones del gasto que ya salio del cierre. */
export function FormularioDesdeGasto({ gastoId, proveedores, formas }: PropsDesdeGasto) {
  const formulario = useForm<DatosDesdeGasto>({
    resolver: zodResolver(esquemaDesdeGasto),
    defaultValues: { gastoId, proveedorId: '', renglones: [], factura: '' },
  });
  const carga = useCargarCompra(compraDesdeGastoDesdeElPanel);
  const errores = formulario.formState.errors;
  return (
    <form onSubmit={formulario.handleSubmit(carga.enviar)} noValidate className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <CampoDeSeleccion
          id="proveedor"
          etiqueta="Proveedor"
          opciones={proveedores}
          error={errores.proveedorId?.message}
          {...formulario.register('proveedorId')}
        />
        <Campo id="factura" etiqueta="Factura" {...formulario.register('factura')} />
      </div>
      <Renglones
        formulario={formulario as never}
        formas={formasDelProveedor(formas, formulario.watch('proveedorId'))}
        conPrecio
      />
      {carga.mensaje ? <AvisoDeError mensaje={carga.mensaje} /> : null}
      <PieDelFormulario enviando={carga.enviando} texto="Es una compra" cancelar="/admin/gastos" />
    </form>
  );
}
