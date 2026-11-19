import type { Cliente } from '../../src/lib/supabase/cliente';

type Fila = Record<string, unknown> & { id: string };
type TablaDelMenu = 'categorias' | 'presentaciones' | 'productos' | 'precios';
// Las cuatro tablas en el orden en que se crean: cada una apunta a las anteriores.
const TABLAS: TablaDelMenu[] = ['categorias', 'presentaciones', 'productos', 'precios'];
const REFERENCIAS = ['categoria_id', 'presentacion_id', 'producto_id'];

// Con tablas que se eligen en una lista, el cliente tipado no sabe qué columnas tiene cada una.
type ClienteSuelto = {
  from: (tabla: string) => {
    select: (columnas: string) => {
      eq: (
        columna: string,
        valor: string,
      ) => PromiseLike<{ data: Fila[] | null; error: Error | null }>;
    };
    insert: (filas: Fila[]) => PromiseLike<{ error: { message: string } | null }>;
  };
};
const suelto = (cliente: Cliente) => cliente as unknown as ClienteSuelto;

async function leerDelLocal(secreto: Cliente, tabla: TablaDelMenu, local: string): Promise<Fila[]> {
  const { data, error } = await suelto(secreto).from(tabla).select('*').eq('local_id', local);
  if (error) throw new Error(`No pude leer ${tabla}: ${error.message}`);
  return data ?? [];
}

// Las fechas las pone la base al copiar.
function sinFechas(fila: Fila): Fila {
  const copia = { ...fila };
  delete copia.fecha_creacion;
  delete copia.fecha_actualizacion;
  return copia;
}

// Cada fila sale con un id nuevo y apuntando a las copias de las filas de las que depende.
function copias(filas: Fila[], ids: Map<string, string>, local: string): Fila[] {
  return filas.map(sinFechas).map((fila) => {
    const id = crypto.randomUUID();
    ids.set(fila.id, id);
    const movidas = REFERENCIAS.filter((r) => fila[r]).map((r) => [r, ids.get(String(fila[r]))]);
    return { ...fila, ...Object.fromEntries(movidas), id, local_id: local };
  });
}

/** Copia el menú del local principal al de ejemplo, si todavía no tiene. */
export async function copiarMenu(secreto: Cliente, desde: string, hacia: string): Promise<void> {
  if ((await leerDelLocal(secreto, 'categorias', hacia)).length > 0) return;
  const ids = new Map<string, string>();
  for (const tabla of TABLAS) {
    const filas = copias(await leerDelLocal(secreto, tabla, desde), ids, hacia);
    const { error } = await suelto(secreto).from(tabla).insert(filas);
    if (error) throw new Error(`No pude copiar ${tabla}: ${error.message}`);
  }
}

/** Borra el menú del local de ejemplo, de la última tabla a la primera. */
export async function borrarMenu(secreto: Cliente, local: string): Promise<void> {
  for (const tabla of [...TABLAS].reverse()) {
    await secreto.from(tabla).delete().eq('local_id', local);
  }
}
