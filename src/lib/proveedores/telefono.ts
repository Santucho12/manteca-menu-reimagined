// Un numero argentino de 10 cifras: caracteristica y numero, sin el 0 ni el 15. Ninguna
// caracteristica empieza con 15: asi se reconoce a quien escribio el 15 sin caracteristica.
function nacional(digitos: string): string | undefined {
  const sinCero = digitos.length === 11 && digitos.startsWith('0') ? digitos.slice(1) : digitos;
  if (sinCero.length !== 10 || sinCero.startsWith('15') || sinCero.startsWith('0'))
    return undefined;
  return sinCero;
}

/**
 * El telefono como lo pide WhatsApp: 549, caracteristica y numero, solo cifras. Vacio es sin
 * telefono (null); undefined es que no se pudo entender.
 */
export function normalizarTelefono(texto: string): string | null | undefined {
  if (texto.trim() === '') return null;
  const digitos = texto.replace(/\D/g, '');
  if (digitos.length === 13 && digitos.startsWith('549')) return digitos;
  if (digitos.length === 12 && digitos.startsWith('54')) return `549${digitos.slice(2)}`;
  const numero = nacional(digitos);
  return numero ? `549${numero}` : undefined;
}

export function urlDeWhatsApp(telefono: string): string {
  return `https://wa.me/${telefono}`;
}

/** +54 9 11 2345-6789: la caracteristica de Buenos Aires tiene 2 cifras; el resto, 3. */
export function telefonoParaMostrar(telefono: string): string {
  const numero = telefono.slice(3);
  const largo = numero.startsWith('11') ? 2 : 3;
  const local = numero.slice(largo);
  return `+54 9 ${numero.slice(0, largo)} ${local.slice(0, -4)}-${local.slice(-4)}`;
}
