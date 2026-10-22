import type { ComponentProps } from 'react';

type Props = Omit<ComponentProps<'input'>, 'type'> & { id: string; etiqueta: string };

/** La casilla de Plan Reminder Pro: la nativa, con su etiqueta al lado. */
export function Casilla({ id, etiqueta, ...props }: Props) {
  return (
    <label
      htmlFor={id}
      className="flex items-center gap-2 text-xs font-semibold text-muted-foreground cursor-pointer select-none"
    >
      <input
        {...props}
        id={id}
        type="checkbox"
        className="rounded border-border size-4 accent-primary"
      />
      {etiqueta}
    </label>
  );
}
