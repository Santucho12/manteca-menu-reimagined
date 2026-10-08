import type { ComponentProps } from 'react';

type Props = Omit<ComponentProps<'input'>, 'type'> & { id: string; etiqueta: string };

/** Una casilla con su etiqueta al lado, con el area tactil de 44 px. */
export function Casilla({ id, etiqueta, ...props }: Props) {
  return (
    <label htmlFor={id} className="flex min-h-11 items-center gap-3 text-sm">
      <input {...props} id={id} type="checkbox" className="accent-primary size-5" />
      {etiqueta}
    </label>
  );
}
