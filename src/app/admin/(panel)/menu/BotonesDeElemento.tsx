'use client';

import Link from 'next/link';
import { useState } from 'react';
import { AvisoDeError } from '@/components/formularios/AvisoDeError';
import { Button } from '@/components/ui/button';
import { PREGUNTA_DE_DESACTIVAR } from '@/lib/menu/pantalla';
import { useAccionDelMenu } from '@/lib/menu/useAccionDelMenu';
import { cambiarVisibilidadEnElMenu, desactivarEnElMenu, moverEnElMenu } from './acciones';

type Props = {
  tipo: 'categoria' | 'producto';
  id: string;
  nombre: string;
  visible: boolean;
  editar: string;
};

type PropsDeConfirmar = {
  nombre: string;
  enviando: boolean;
  alConfirmar: () => void;
  alCancelar: () => void;
};

function ConfirmarDesactivar({ nombre, enviando, alConfirmar, alCancelar }: PropsDeConfirmar) {
  return (
    <div className="space-y-2 rounded-lg border p-3">
      <p className="text-sm">{PREGUNTA_DE_DESACTIVAR(nombre)}</p>
      <div className="flex gap-2">
        <Button variant="destructive" disabled={enviando} onClick={alConfirmar}>
          Confirmar
        </Button>
        <Button variant="outline" onClick={alCancelar}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}

export function BotonesDeElemento({ tipo, id, nombre, visible, editar }: Props) {
  const { mensaje, enviando, hacer } = useAccionDelMenu();
  const [confirmando, setConfirmando] = useState(false);
  const mover = (direccion: 'arriba' | 'abajo') =>
    hacer(() => moverEnElMenu({ tipo, id, direccion }));
  async function confirmar() {
    if (await hacer(() => desactivarEnElMenu({ tipo, id }))) setConfirmando(false);
  }
  const accion = visible ? 'Ocultar' : 'Mostrar';
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={enviando}
          aria-label={`Subir ${nombre}`}
          onClick={() => mover('arriba')}
        >
          ↑
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={enviando}
          aria-label={`Bajar ${nombre}`}
          onClick={() => mover('abajo')}
        >
          ↓
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={enviando}
          aria-label={`${accion} ${nombre}`}
          onClick={() => hacer(() => cambiarVisibilidadEnElMenu({ tipo, id, mostrar: !visible }))}
        >
          {accion}
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href={editar} aria-label={`Editar ${nombre}`}>
            Editar
          </Link>
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={enviando}
          aria-label={`Desactivar ${nombre}`}
          onClick={() => setConfirmando(true)}
        >
          Desactivar
        </Button>
      </div>
      {confirmando ? (
        <ConfirmarDesactivar
          nombre={nombre}
          enviando={enviando}
          alConfirmar={confirmar}
          alCancelar={() => setConfirmando(false)}
        />
      ) : null}
      {mensaje ? <AvisoDeError mensaje={mensaje} /> : null}
    </div>
  );
}
