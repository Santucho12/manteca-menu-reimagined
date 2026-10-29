import { FranjaDeAviso } from '@/components/panel/Avisos';

/**
 * El menu no le cambia los precios a Fudo: la caja sigue cobrando lo que diga Fudo. Es un
 * texto fijo y no una alerta: el lector de pantalla no tiene que anunciarlo cada vez.
 */
export function AvisoDeFudo() {
  return (
    <FranjaDeAviso>
      <p>
        Cambiar un precio acá no lo cambia en Fudo: acordate de cambiarlo también allá. Es porque
        todavía no estamos integrados con Fudo.
      </p>
    </FranjaDeAviso>
  );
}
