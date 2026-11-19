'use client';

import type { FieldErrors } from 'react-hook-form';
import { AvisoDeError } from '@/components/formularios/AvisoDeError';
import { Campo } from '@/components/formularios/Campo';
import { CampoDeTextoLargo } from '@/components/formularios/CampoDeTextoLargo';
import { BOTON_CANCELAR, BOTON_PRINCIPAL } from '@/components/panel/estilos';
import { Ventana } from '@/components/panel/Ventana';
import type { DatosDeCierre } from '@/lib/caja/esquemas';
import type { PasoDelCierre } from '@/lib/caja/pasosDelCierre';
import type { Registro } from '@/lib/formularios/valorInicial';
import { CAMPO_CONTRASTADO } from './contraste';

export type TipoControlado = { canalId: string; nombre: string };

type PropsDelTipo = {
  indice: number;
  tipo: TipoControlado;
  registro: Registro<DatosDeCierre>;
  errors: FieldErrors<DatosDeCierre>;
};

// A ciegas: lo cargado en el sistema se ve recién al guardar (pedido 99).
function CamposDelTipo({ indice, tipo, registro, errors }: PropsDelTipo) {
  return (
    <div className="space-y-4">
      <Campo
        className={CAMPO_CONTRASTADO}
        id={`control-${indice}-total`}
        etiqueta={`Facturado en ${tipo.nombre}`}
        inputMode="decimal"
        autoFocus
        error={errors.controles?.[indice]?.total?.message}
        {...registro(`controles.${indice}.total`)}
      />
      <Campo
        className={CAMPO_CONTRASTADO}
        id={`control-${indice}-cantidad`}
        etiqueta={`Ventas de ${tipo.nombre} (opcional)`}
        inputMode="numeric"
        error={errors.controles?.[indice]?.cantidad?.message}
        {...registro(`controles.${indice}.cantidad`)}
      />
    </div>
  );
}

type Props = {
  paso: PasoDelCierre;
  numero: number;
  total: number;
  tipos: TipoControlado[];
  registro: Registro<DatosDeCierre>;
  errors: FieldErrors<DatosDeCierre>;
  avanzar: () => void;
  volver: () => void;
  cerrar: () => void;
  guardar: () => void;
  enviando: boolean;
  mensaje: string | null;
  textoDeGuardar: string;
};

/** Después de la caja, una ventana por tipo de venta y al final el comentario y guardar. */
export function VentanasDelCierre(props: Props) {
  const { paso, numero, total, tipos, registro, errors } = props;
  const ultimo = paso.tipo === 'comentario';
  const tipo = paso.tipo === 'control' ? tipos[paso.indice] : undefined;
  const titulo = tipo ? `¿Cuánto se hizo con ${tipo.nombre}?` : '¿Algo para comentar?';
  return (
    <Ventana abierta={paso.tipo !== 'caja'} cerrar={props.cerrar} titulo={titulo}>
      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
        Paso {numero} de {total}
      </p>
      {tipo && paso.tipo === 'control' ? (
        <CamposDelTipo
          key={paso.indice}
          indice={paso.indice}
          tipo={tipo}
          registro={registro}
          errors={errors}
        />
      ) : null}
      {ultimo ? (
        <CampoDeTextoLargo
          className={CAMPO_CONTRASTADO}
          id="comentario"
          etiqueta="Comentario (opcional)"
          error={errors.comentario?.message}
          {...registro('comentario')}
        />
      ) : null}
      {ultimo && props.mensaje ? <AvisoDeError mensaje={props.mensaje} /> : null}
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={props.volver} className={`${BOTON_CANCELAR} flex-none px-6`}>
          Atrás
        </button>
        <button
          type="button"
          disabled={props.enviando}
          onClick={ultimo ? props.guardar : props.avanzar}
          className={BOTON_PRINCIPAL}
        >
          {ultimo ? (props.enviando ? 'Guardando...' : props.textoDeGuardar) : 'Siguiente'}
        </button>
      </div>
    </Ventana>
  );
}
