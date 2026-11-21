import { useId, type ReactNode } from 'react';

type Props = {
  ayuda: string;
  /** De qué lado se abre el cartel: la etiqueta de la derecha lo abre hacia adentro. */
  lado: 'izquierda' | 'derecha';
  className: string;
  children: ReactNode;
};

/** Una etiqueta que explica qué es al pasar el mouse o al llegar con el teclado. */
export function EtiquetaConAyuda({ ayuda, lado, className, children }: Props) {
  const id = useId();
  return (
    <span tabIndex={0} aria-describedby={id} className="group relative inline-flex outline-none">
      <span
        className={`${className} cursor-help group-focus-visible:ring-2 group-focus-visible:ring-ring`}
      >
        {children}
      </span>
      <span
        id={id}
        role="tooltip"
        className={`pointer-events-none absolute top-full z-20 mt-2 w-64 rounded-xl bg-foreground px-3 py-2 text-xs font-medium leading-relaxed text-white shadow-xl opacity-0 translate-y-1 transition-all duration-200 group-hover:opacity-100 group-focus-visible:opacity-100 group-hover:translate-y-0 group-focus-visible:translate-y-0 ${lado === 'derecha' ? 'right-0' : 'left-0'}`}
      >
        {ayuda}
      </span>
    </span>
  );
}
