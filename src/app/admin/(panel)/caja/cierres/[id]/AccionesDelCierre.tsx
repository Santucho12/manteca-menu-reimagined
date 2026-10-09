'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AvisoDeError } from '@/components/formularios/AvisoDeError';
import { Campo } from '@/components/formularios/Campo';
import { Button } from '@/components/ui/button';
import { useGuardar } from '@/lib/gastos/useGuardar';
import type { Resultado } from '@/lib/resultado';
import { anularCierreDesdeElPanel, revisarCierreDesdeElPanel } from '../../acciones';

type Accion = {
  abrir: string;
  etiqueta: string;
  confirmar: string;
  peligrosa: boolean;
  hacer: (texto: string) => Promise<Resultado<unknown>>;
};

// Un boton que abre un campo de texto y confirma: sirve para revisar y para anular.
function AccionConTexto({ abrir, etiqueta, confirmar, peligrosa, hacer }: Accion) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState('');
  const guardado = useGuardar(hacer, () => router.refresh());
  if (!abierto) {
    return (
      <Button type="button" variant="outline" onClick={() => setAbierto(true)}>
        {abrir}
      </Button>
    );
  }
  return (
    <div className="w-full max-w-xl space-y-3 rounded-lg border p-4">
      {guardado.mensaje ? <AvisoDeError mensaje={guardado.mensaje} /> : null}
      <Campo
        id={peligrosa ? 'motivo' : 'comentario-de-revision'}
        etiqueta={etiqueta}
        value={texto}
        onChange={(evento) => setTexto(evento.target.value)}
      />
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant={peligrosa ? 'destructive' : 'default'}
          disabled={guardado.enviando}
          onClick={() => guardado.enviar(texto)}
        >
          {confirmar}
        </Button>
        <Button type="button" variant="outline" onClick={() => setAbierto(false)}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}

/** Lo que hace el admin con un cierre: marcarlo como revisado o anularlo con motivo. */
export function AccionesDelCierre({ id, revisado }: { id: string; revisado: boolean }) {
  return (
    <div className="flex flex-wrap items-start gap-2">
      {revisado ? null : (
        <AccionConTexto
          abrir="Marcar como revisado"
          etiqueta="Comentario de la revisión"
          confirmar="Confirmar revisión"
          peligrosa={false}
          hacer={(comentario) => revisarCierreDesdeElPanel({ id, comentario })}
        />
      )}
      <AccionConTexto
        abrir="Anular"
        etiqueta="Motivo"
        confirmar="Confirmar anulación"
        peligrosa
        hacer={(motivo) => anularCierreDesdeElPanel({ id, motivo })}
      />
    </div>
  );
}
