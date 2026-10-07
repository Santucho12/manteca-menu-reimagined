/** Dice si una URL de Supabase es exactamente la del proyecto de pruebas. */
export function esBaseDePruebas(url: string, ref: string): boolean {
  if (ref === '') return false;
  try {
    const direccion = new URL(url);
    // Sin https, la clave secreta viajaria sin cifrar.
    return direccion.protocol === 'https:' && direccion.hostname === `${ref}.supabase.co`;
  } catch {
    return false;
  }
}

/** Aborta si la base no es la de pruebas: los tests siembran y borran datos. */
export function exigirBaseDePruebas(url: string, ref: string): void {
  if (esBaseDePruebas(url, ref)) return;
  throw new Error(
    `La URL de Supabase (${url}) no es la del proyecto de pruebas (${ref}). No se corre nada.`,
  );
}
