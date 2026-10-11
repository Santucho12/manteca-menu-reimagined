'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AvisoDeError } from '@/components/formularios/AvisoDeError';
import { Campo } from '@/components/formularios/Campo';
import { Button } from '@/components/ui/button';
import { useGuardar } from '@/lib/gastos/useGuardar';
import { anularVentaDesdeElPanel } from '../acciones';

/** Una venta a mano no se edita: se anula con motivo, deja de contar y queda en el historial. */
export function BotonDeAnularVenta({ id }: { id: string }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [motivo, setMotivo] = useState('');
  const guardado = useGuardar(anularVentaDesdeElPanel, () => router.refresh());
  if (!abierto) {
    return (
      <Button type="button" variant="outline" onClick={() => setAbierto(true)}>
        Anular
      </Button>
    );
  }
  return (
    <div className="max-w-xl space-y-3 rounded-lg border p-4">
      {guardado.mensaje ? <AvisoDeError mensaje={guardado.mensaje} /> : null}
      <Campo
        id="motivo"
        etiqueta="Motivo"
        value={motivo}
        onChange={(evento) => setMotivo(evento.target.value)}
      />
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="destructive"
          disabled={guardado.enviando}
          onClick={() => guardado.enviar({ id, motivo })}
        >
          Confirmar anulación
        </Button>
        <Button type="button" variant="outline" onClick={() => setAbierto(false)}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
