'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Save } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { AvisoDeError } from '@/components/formularios/AvisoDeError';
import { AvisoDeExito } from '@/components/formularios/AvisoDeExito';
import { Campo } from '@/components/formularios/Campo';
import { BOTON_PRINCIPAL } from '@/components/panel/estilos';
import { esquemaTolerancia } from '@/lib/caja/esquemas';
import { conValorInicial } from '@/lib/formularios/valorInicial';
import { useGuardar } from '@/lib/gastos/useGuardar';
import { cambiarToleranciaDesdeElPanel } from '../acciones';

type Datos = z.infer<typeof esquemaTolerancia>;

/** Hasta cuanta diferencia por medio un cierre figura como "cierra". La diferencia se ve igual. */
export function FormularioDeTolerancia({ inicial }: { inicial: string }) {
  const [guardada, setGuardada] = useState(false);
  const guardado = useGuardar(cambiarToleranciaDesdeElPanel, () => setGuardada(true));
  const valores = { tolerancia: inicial };
  const {
    register: registrar,
    handleSubmit,
    formState,
  } = useForm<Datos>({ resolver: zodResolver(esquemaTolerancia), defaultValues: valores });
  const registro = conValorInicial(registrar, valores);
  const guardar = (datos: Datos) => {
    setGuardada(false);
    return guardado.enviar(datos);
  };
  return (
    <form onSubmit={handleSubmit(guardar)} noValidate className="space-y-5">
      {guardada ? <AvisoDeExito titulo="Tolerancia guardada." /> : null}
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-40 flex-1">
          <Campo
            id="tolerancia"
            etiqueta="Tolerancia"
            inputMode="decimal"
            error={formState.errors.tolerancia?.message}
            {...registro('tolerancia')}
          />
        </div>
        <button type="submit" disabled={guardado.enviando} className={BOTON_PRINCIPAL}>
          <Save size={14} aria-hidden="true" />
          Guardar tolerancia
        </button>
      </div>
      {guardado.mensaje ? <AvisoDeError mensaje={guardado.mensaje} /> : null}
      <p className="text-xs text-muted-foreground">
        Una diferencia menor, por medio de pago, figura como “cierra”.
      </p>
    </form>
  );
}
