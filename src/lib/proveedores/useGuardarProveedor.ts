import { useState } from 'react';
import { useUnaVez } from '../formularios/useUnaVez';
import type { Resultado } from '../resultado';
import type { Creado } from './escritura';
import type { DatosDeProveedor } from './esquemas';

type Guardar = (datos: DatosDeProveedor, confirmar: boolean) => Promise<Resultado<Creado>>;
type Estado = {
  mensaje: string | null;
  repetido: { nombre: string } | null;
};

const NADA: Estado = { mensaje: null, repetido: null };

function estadoDe(resultado: Resultado<Creado>): Estado {
  if (!resultado.ok) return { mensaje: resultado.mensaje, repetido: null };
  if (resultado.datos.estado === 'confirmar') {
    return { mensaje: null, repetido: { nombre: resultado.datos.nombre } };
  }
  return NADA;
}

/** Guarda; si el nombre ya existe, guarda la pregunta y "Cargar igual" repite con la confirmacion. */
export function useGuardarProveedor(guardar: Guardar, alGuardar: (id: string) => void) {
  const [estado, setEstado] = useState<Estado>(NADA);
  const { enviando, unaVez } = useUnaVez();
  const correr = (datos: DatosDeProveedor, confirmar: boolean) =>
    unaVez(async () => {
      const resultado = await guardar(datos, confirmar);
      setEstado(estadoDe(resultado));
      if (resultado.ok && resultado.datos.estado === 'creado') alGuardar(resultado.datos.id);
    });
  return {
    ...estado,
    enviando,
    enviar: (datos: DatosDeProveedor) => correr(datos, false),
    // Con lo que esta en pantalla: la persona pudo corregir algo mientras veia el aviso.
    confirmar: (datos: DatosDeProveedor) => correr(datos, true),
    volver: () => setEstado(NADA),
  };
}
