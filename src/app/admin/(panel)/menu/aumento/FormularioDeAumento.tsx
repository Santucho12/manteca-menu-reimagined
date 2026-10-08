'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { AvisoDeError } from '@/components/formularios/AvisoDeError';
import { AvisoDeExito } from '@/components/formularios/AvisoDeExito';
import { Campo } from '@/components/formularios/Campo';
import { CampoDeSeleccion } from '@/components/formularios/CampoDeSeleccion';
import { Button } from '@/components/ui/button';
import { esquemaAumento, type DatosDeAumento } from '@/lib/menu/esquemas';
import { useAumento } from '@/lib/menu/useAumento';
import { aplicarAumentoDelMenu, verCambiosDelAumento } from '../acciones';
import { TablaDeCambios } from './TablaDeCambios';

const REDONDEOS = [
  { valor: '1000', texto: 'A $10' },
  { valor: '5000', texto: 'A $50' },
  { valor: '10000', texto: 'A $100' },
  { valor: '50000', texto: 'A $500' },
];

export function FormularioDeAumento({
  categorias,
}: {
  categorias: { id: string; nombre: string }[];
}) {
  const aumento = useAumento({ ver: verCambiosDelAumento, aplicar: aplicarAumentoDelMenu });
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<DatosDeAumento>({
    resolver: zodResolver(esquemaAumento),
    defaultValues: { categoriaId: '', porcentaje: '', redondeo: '10000' },
  });
  // Lo que se aplica es lo que se vio: tocar un campo descarta la vista previa.
  const [categoriaId, porcentaje, redondeo] = useWatch({
    control,
    name: ['categoriaId', 'porcentaje', 'redondeo'],
  });
  const { descartar } = aumento;
  useEffect(() => descartar(), [categoriaId, porcentaje, redondeo, descartar]);
  const alcances = [
    { valor: '', texto: 'Todo el menú' },
    ...categorias.map((c) => ({ valor: c.id, texto: c.nombre })),
  ];
  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(aumento.ver)} noValidate className="max-w-xl space-y-4">
        <CampoDeSeleccion
          id="alcance"
          etiqueta="Alcance"
          opciones={alcances}
          {...register('categoriaId')}
        />
        <Campo
          id="porcentaje"
          etiqueta="Porcentaje"
          inputMode="numeric"
          error={errors.porcentaje?.message}
          {...register('porcentaje')}
        />
        <CampoDeSeleccion
          id="redondeo"
          etiqueta="Redondeo, al más cercano"
          opciones={REDONDEOS}
          {...register('redondeo')}
        />
        <Button type="submit" variant="outline">
          Ver cambios
        </Button>
      </form>
      {aumento.mensaje ? <AvisoDeError mensaje={aumento.mensaje} /> : null}
      {aumento.listo ? <AvisoDeExito mensaje={aumento.listo} /> : null}
      {aumento.cambios ? <TablaDeCambios cambios={aumento.cambios} /> : null}
      {aumento.cambios?.length ? <Button onClick={aumento.aplicar}>Aplicar aumento</Button> : null}
    </div>
  );
}
