'use client';

import { useState, type FormEvent } from 'react';
import { AvisoDeError } from '@/components/formularios/AvisoDeError';
import { useUnaVez } from '@/lib/formularios/useUnaVez';
import { guardarExcelDeFudo, revisarExcelDeFudo } from '../acciones';
import { VistaDeLaSubida, type Vista } from './VistaDeLaSubida';
import { ZonaDeArchivo } from './ZonaDeArchivo';

// El verde del botón que lleva hasta esta pantalla (Subir Excel de Fudo).
const VERDE =
  'h-12 w-fit rounded-xl bg-emerald-600 px-6 text-[10px] font-bold uppercase tracking-widest text-white shadow-lg shadow-emerald-600/25 transition-all duration-200 hover:-translate-y-0.5 hover:brightness-105 hover:shadow-xl active:translate-y-0 active:scale-95 disabled:opacity-60 disabled:hover:translate-y-0';

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
        {vista ? null : (
          <button type="submit" disabled={enviando} className={VERDE}>
            {enviando ? 'Revisando...' : 'Revisar archivo'}
          </button>
        )}
      </form>
      {error ? <AvisoDeError mensaje={error} /> : null}
      {listo ? (
        <p role="status" className="text-sm font-semibold text-emerald-700">
          {listo}
        </p>
      ) : null}
      {vista ? <VistaDeLaSubida vista={vista} /> : null}
      {vista ? (
        <button type="button" onClick={guardar} disabled={enviando} className={VERDE}>
          {enviando ? 'Guardando...' : 'Guardar ventas'}
        </button>
      ) : null}
    </div>
  );
}
