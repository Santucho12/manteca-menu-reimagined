import { useState } from 'react';
import { crearClienteDelNavegador } from '../supabase/navegador';
import { subirFoto } from './subida';

/** Sube la foto elegida y devuelve la ruta para guardarla con la categoria. */
export function useSubidaDeFoto(localId: string, alSubir: (ruta: string) => void) {
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  async function elegir(archivo: File | undefined) {
    if (!archivo) return;
    setSubiendo(true);
    setMensaje(null);
    const resultado = await subirFoto(crearClienteDelNavegador(), localId, archivo);
    setSubiendo(false);
    if (resultado.ok) alSubir(resultado.datos);
    else setMensaje(resultado.mensaje);
  }
  return { mensaje, subiendo, elegir };
}
