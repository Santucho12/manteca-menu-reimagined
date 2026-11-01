import type { ReactNode } from 'react';
import { AYUDAS, type ClaveDeAyuda } from '@/lib/panel/ayudas';
import { BotonDeAyuda } from './Ayuda';
import { EncabezadoDePantalla } from './EncabezadoDePantalla';
import { EntradaDePantalla } from './Entradas';

type Props = {
  titulo: string;
  subtitulo?: string;
  acciones?: ReactNode;
  ayuda?: ClaveDeAyuda;
  /** Las clases de espacio entre lo que va en la pantalla. */
  espacio?: string;
  children: ReactNode;
};

/** Una pantalla del panel: el encabezado de Plan Reminder Pro y el contenido que entra subiendo. */
export function Pantalla({
  titulo,
  subtitulo,
  acciones,
  ayuda,
  espacio = 'space-y-8 sm:space-y-6',
  children,
}: Props) {
  return (
    <>
      <EncabezadoDePantalla
        titulo={titulo}
        subtitulo={subtitulo}
        acciones={acciones}
        ayuda={ayuda ? <BotonDeAyuda ayuda={AYUDAS[ayuda]} /> : undefined}
      />
      <EntradaDePantalla className={espacio}>{children}</EntradaDePantalla>
    </>
  );
}
