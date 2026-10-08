/**
 * El menu no le cambia los precios a Fudo: la caja sigue cobrando lo que diga Fudo. Es un
 * texto fijo y no una alerta: el lector de pantalla no tiene que anunciarlo cada vez.
 */
export function AvisoDeFudo() {
  return (
    <p className="bg-secondary rounded-lg border p-3 text-sm">
      Cambiar un precio acá no lo cambia en Fudo: acordate de cambiarlo también allá.
    </p>
  );
}
