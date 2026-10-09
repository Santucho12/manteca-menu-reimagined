'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { AvisoDeError } from '@/components/formularios/AvisoDeError';
import { AvisoDeExito } from '@/components/formularios/AvisoDeExito';
import { Campo } from '@/components/formularios/Campo';
import { Button } from '@/components/ui/button';
import { esquemaTolerancia } from '@/lib/caja/esquemas';
import { useGuardar } from '@/lib/gastos/useGuardar';
import { cambiarToleranciaDesdeElPanel } from '../acciones';

type Datos = z.infer<typeof esquemaTolerancia>;

/** Hasta cuanta diferencia por medio un cierre figura como "cierra". La diferencia se ve igual. */
export function FormularioDeTolerancia({ inicial }: { inicial: string }) {
  const [guardada, setGuardada] = useState(false);
  const guardado = useGuardar(cambiarToleranciaDesdeElPanel, () => setGuardada(true));
  const { register, handleSubmit, formState } = useForm<Datos>({
    resolver: zodResolver(esquemaTolerancia),
    defaultValues: { tolerancia: inicial },
  });
  return (
    <form
      onSubmit={handleSubmit((datos) => {
        setGuardada(false);
        return guardado.enviar(datos);
      })}
      noValidate
      className="max-w-xl space-y-3"
    >
      {guardado.mensaje ? <AvisoDeError mensaje={guardado.mensaje} /> : null}
      {guardada ? <AvisoDeExito mensaje="Tolerancia guardada." /> : null}
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-40 flex-1">
          <Campo
            id="tolerancia"
            etiqueta="Tolerancia"
            inputMode="decimal"
            error={formState.errors.tolerancia?.message}
            {...register('tolerancia')}
          />
        </div>
        <Button type="submit" variant="outline" disabled={guardado.enviando}>
          Guardar tolerancia
        </Button>
      </div>
      <p className="text-muted-foreground text-sm">
        Una diferencia menor, por medio de pago, figura como “cierra”.
      </p>
    </form>
  );
}
