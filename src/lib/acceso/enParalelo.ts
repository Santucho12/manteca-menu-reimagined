/**
 * El acceso y la lectura de una pagina salen a la vez, y cada viaje a la base cuesta lo mismo:
 * esperar el perfil para recien despues leer suma una tanda entera. Adelantar la lectura no
 * muestra nada de mas, porque cada consulta va con la sesion y la base decide con RLS.
 */
export async function accesoYLectura<A extends object, T>(
  acceso: Promise<A>,
  leer: () => Promise<T>,
): Promise<A & { lectura: Promise<T> }> {
  // En la microtarea siguiente: un leer que lanza no se adelanta a la redireccion del acceso.
  const lectura = Promise.resolve().then(leer);
  // Sin acceso nadie espera la lectura, y su error no puede quedar suelto.
  lectura.catch(() => undefined);
  return { ...(await acceso), lectura };
}

/** Lo mismo, con los datos ya leidos. Sin acceso gana el error del acceso: la redireccion. */
export async function accesoYDatos<A extends object, T>(
  acceso: Promise<A>,
  leer: () => Promise<T>,
): Promise<A & { datos: T }> {
  const { lectura, ...permitido } = await accesoYLectura(acceso, leer);
  return { ...(permitido as A), datos: await lectura };
}
