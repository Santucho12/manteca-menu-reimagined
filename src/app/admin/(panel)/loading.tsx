// Sin esto, el clic queda quieto hasta que el servidor termina, y Next no puede precargar
// ninguna seccion: con la carga, la pantalla cambia al instante y los datos llegan despues.
export default function CargandoLaSeccion() {
  const bloque = 'rounded-2xl bg-secondary/70 animate-pulse';
  return (
    <div role="status" aria-label="Cargando la sección" className="space-y-8">
      <div className="space-y-3">
        <div className={`${bloque} h-8 w-48`} />
        <div className={`${bloque} h-4 w-80 max-w-full`} />
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((n) => (
          <div key={n} className={`${bloque} h-32`} />
        ))}
      </div>
      <div className={`${bloque} h-80`} />
    </div>
  );
}
