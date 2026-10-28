const PASOS = ['Elegí el archivo', 'Revisá lo que entra', 'Guardá las ventas'];

/** Los tres pasos de la subida, para que se vea qué viene después. */
export function PasosDeLaSubida() {
  return (
    <ol aria-label="Pasos" className="grid gap-2 sm:grid-cols-3">
      {PASOS.map((paso, i) => (
        <li key={paso} className="flex items-center gap-3 rounded-xl bg-secondary/40 px-3 py-2.5">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            {i + 1}
          </span>
          <span className="text-xs font-semibold text-muted-foreground">{paso}</span>
        </li>
      ))}
    </ol>
  );
}
