'use client';

import { useState, type FormEvent } from 'react';
import { AvisoDeError } from '@/components/formularios/AvisoDeError';
import { BOTON_PRINCIPAL, BOTON_SUAVE } from '@/components/panel/estilos';
import { useUnaVez } from '@/lib/formularios/useUnaVez';
import { guardarExcelDeFudo, revisarExcelDeFudo } from '../acciones';
import { VistaDeLaSubida, type Vista } from './VistaDeLaSubida';
import { ZonaDeArchivo } from './ZonaDeArchivo';

// Revisar no guarda nada: el archivo se vuelve a mandar al confirmar, y la base decide.
export function FormularioDeExcel() {
  const [archivo, setArchivo] = useState<File | null>(null);
  const [vista, setVista] = useState<Vista | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [listo, setListo] = useState<string | null>(null);
  const { enviando, unaVez } = useUnaVez();
  const datosDel = (elegido: File | null) => {
    const datos = new FormData();
    if (elegido) datos.set('archivo', elegido);
    return datos;
  };
  const elegir = (nuevo: File | null) => {
    setArchivo(nuevo);
    setVista(null);
    setError(null);
    setListo(null);
  };
  const revisar = (evento: FormEvent) => {
    evento.preventDefault();
    return unaVez(async () => {
      setListo(null);
      const respuesta = await revisarExcelDeFudo(datosDel(archivo));
      setError(respuesta.ok ? null : respuesta.mensaje);
      setVista(respuesta.ok ? respuesta.datos : null);
    });
  };
  const guardar = () =>
    unaVez(async () => {
      const respuesta = await guardarExcelDeFudo(datosDel(archivo));
      setError(respuesta.ok ? null : respuesta.mensaje);
      if (!respuesta.ok) return;
      setListo(respuesta.datos);
      setVista(null);
    });
  return (
    <div className="space-y-5">
      <form onSubmit={revisar} noValidate className="space-y-5">
        <ZonaDeArchivo archivo={archivo} elegir={elegir} />
        <button type="submit" disabled={enviando} className={BOTON_SUAVE}>
          {enviando && !vista ? 'Revisando...' : 'Revisar archivo'}
        </button>
      </form>
      {error ? <AvisoDeError mensaje={error} /> : null}
      {listo ? (
        <p role="status" className="text-sm font-semibold text-emerald-700">
          {listo}
        </p>
      ) : null}
      {vista ? <VistaDeLaSubida vista={vista} /> : null}
      {vista ? (
        <button type="button" onClick={guardar} disabled={enviando} className={BOTON_PRINCIPAL}>
          {enviando ? 'Guardando...' : 'Guardar ventas'}
        </button>
      ) : null}
    </div>
  );
}
