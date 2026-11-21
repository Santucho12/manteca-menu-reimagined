import { useState } from 'react';
import type { TipoParaVender } from './consultas';
import type { ItemDelCatalogo, RenglonDelTicket } from './ticket';

export type Pesando = { forma: ItemDelCatalogo; gramos: number } | null;

/** El peso con que abre la balanza: el que ya se pesó o el de la forma (Por cuarto = 250). */
export function pesoInicial(forma: ItemDelCatalogo, ticket: RenglonDelTicket[]): number {
  const previo = ticket.find(
    (r) => r.productoId === forma.productoId && r.presentacionId === forma.presentacionId,
  );
  return previo?.gramos ?? forma.gramosDeLaForma ?? 250;
}

/** Lo que se está pesando, si hay algo. */
function useBalanza() {
  const [pesando, setPesando] = useState<Pesando>(null);
  return {
    pesando,
    dejarDePesar: () => setPesando(null),
    pesar: (forma: ItemDelCatalogo, ticket: RenglonDelTicket[]) =>
      setPesando({ forma, gramos: pesoInicial(forma, ticket) }),
  };
}

/** En qué paso va la venta, el tipo elegido (Local de entrada) y lo que se está pesando. */
export function usePasos(tipos: TipoParaVender[] = [], tipoInicial: string | null = null) {
  const local = tipos.find((t) => t.deSistema)?.id ?? null;
  const [paso, irA] = useState(0);
  const [tipo, setTipo] = useState(tipoInicial ?? local);
  const balanza = useBalanza();
  const nombreDelTipo = tipos.find((t) => t.id === tipo)?.nombre ?? 'Local';
  const reiniciar = () => {
    setTipo(local);
    irA(0);
    balanza.dejarDePesar();
  };
  return { paso, irA, tipo, setTipo, local, nombreDelTipo, reiniciar, ...balanza };
}
