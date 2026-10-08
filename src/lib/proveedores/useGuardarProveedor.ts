import { useState } from 'react';
import { useUnaVez } from '../formularios/useUnaVez';
import type { Resultado } from '../resultado';
import type { Creado } from './escritura';
import type { DatosDeProveedor } from './esquemas';

type Guardar = (datos: DatosDeProveedor, confirmar: boolean) => Promise<Resultado<Creado>>;
type Estado = {
  mensaje: string | null;
  repetido: { nombre: string; datos: DatosDeProveedor } | null;
};

const NADA: Estado = { mensaje: null, repetido: null };

function estadoDe(resultado: Resultado<Creado>, datos: DatosDeProveedor): Estado {
  if (!resultado.ok) return { mensaje: resultado.mensaje, repetido: null };
  if (resultado.datos.estado === 'confirmar') {
    return { mensaje: null, repetido: { nombre: resultado.datos.nombre, datos } };
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
      setEstado(estadoDe(resultado, datos));
      if (resultado.ok && resultado.datos.estado === 'creado') alGuardar(resultado.datos.id);
    });
  const { repetido } = estado;
  return {
    ...estado,
    enviando,
    enviar: (datos: DatosDeProveedor) => correr(datos, false),
    confirmar: async () => (repetido ? correr(repetido.datos, true) : undefined),
    volver: () => setEstado(NADA),
  };
}
