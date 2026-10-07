import type { CSSProperties } from 'react';
import { ESPACIADOS, RADIOS, SOMBRAS, type Token } from '@/lib/guia/tokens';
import { SeccionGuia } from './SeccionGuia';

type PropsCajas = { tokens: readonly Token[]; estilo: (valor: string) => CSSProperties };

function Cajas({ tokens, estilo }: PropsCajas) {
  return (
    <ul className="grid grid-cols-2 gap-6 sm:grid-cols-4">
      {tokens.map((token) => (
        <li key={token.variable} className="space-y-2">
          <div className="bg-card h-16 border" style={estilo(`var(${token.variable})`)} />
          <p className="text-sm font-medium">{token.nombre}</p>
          <p className="text-muted-foreground text-xs">{token.variable}</p>
        </li>
      ))}
    </ul>
  );
}

export function SeccionRadios() {
  return (
    <SeccionGuia titulo="Radios">
      <Cajas tokens={RADIOS} estilo={(valor) => ({ borderRadius: valor })} />
    </SeccionGuia>
  );
}

export function SeccionSombras() {
  return (
    <SeccionGuia titulo="Sombras">
      <Cajas
        tokens={SOMBRAS}
        estilo={(valor) => ({ boxShadow: valor, borderRadius: 'var(--radio-grande)' })}
      />
    </SeccionGuia>
  );
}

export function SeccionEspaciados() {
  return (
    <SeccionGuia titulo="Espaciados">
      <ul className="space-y-2">
        {ESPACIADOS.map((paso) => (
          <li key={paso} className="flex items-center gap-4">
            <span className="text-muted-foreground w-8 text-xs">{paso}</span>
            <div className="bg-primary h-3" style={{ width: `calc(var(--spacing) * ${paso})` }} />
          </li>
        ))}
      </ul>
    </SeccionGuia>
  );
}
