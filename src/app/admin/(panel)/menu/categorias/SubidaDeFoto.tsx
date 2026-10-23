'use client';

import Image from 'next/image';
import { useFormContext, useWatch } from 'react-hook-form';
import { AvisoDeError } from '@/components/formularios/AvisoDeError';
import { ETIQUETA } from '@/components/panel/estilos';
import { leerEntornoPublico } from '@/lib/entorno/publico';
import type { DatosDeCategoria } from '@/lib/menu/esquemas';
import { urlDeFoto } from '@/lib/menu/fotos';
import { useSubidaDeFoto } from '@/lib/menu/useSubidaDeFoto';

export function SubidaDeFoto({ localId }: { localId: string }) {
  const { setValue, control } = useFormContext<DatosDeCategoria>();
  const [foto, nombre] = useWatch({ control, name: ['foto', 'nombre'] });
  const { mensaje, subiendo, elegir } = useSubidaDeFoto(localId, (ruta) => setValue('foto', ruta));
  const url = urlDeFoto(foto || null, leerEntornoPublico().NEXT_PUBLIC_SUPABASE_URL);
  return (
    <div className="space-y-2">
      <label htmlFor="foto" className={ETIQUETA}>
        Foto
      </label>
      {url ? (
        <Image
          src={url}
          alt={`Foto de ${nombre}`}
          width={160}
          height={160}
          className="aspect-square w-40 rounded-2xl object-cover"
        />
      ) : null}
      <input
        id="foto"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        disabled={subiendo}
        onChange={(e) => elegir(e.target.files?.[0])}
        className="block w-full min-h-11 text-sm rounded-xl bg-secondary/30 p-2 file:mr-3 file:rounded-lg file:border-none file:bg-primary file:px-3 file:py-2 file:text-xs file:font-bold file:text-white"
      />
      {subiendo ? <p className="text-xs text-muted-foreground">Subiendo la foto…</p> : null}
      {mensaje ? <AvisoDeError mensaje={mensaje} /> : null}
    </div>
  );
}
