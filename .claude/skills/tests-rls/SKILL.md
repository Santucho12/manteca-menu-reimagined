---
name: tests-rls
description: Usar al crear o cambiar una tabla, una policy de RLS, un grant o una función de la base del Sistema Manteca, y al escribir la migración de una tabla nueva.
---

# Tests de RLS (aislamiento por rol y por local)

**Cada tabla trae el test de que quien no debe NO puede leerla ni escribirla.** Esos tests
corren con el cliente del usuario, firmado con la clave publicable, **nunca con la clave
secreta**. Si fallan, un invitado recién registrado lee las ventas, o un empleado se cambia
el rol a admin.

> ⚠️ **La trampa que da falsa tranquilidad:** la clave secreta (rol `service_role`) saltea
> RLS entera. Un test de acceso que la usa pasa siempre, aunque las policies estén rotas.

> ⚠️ **Los ejemplos de esta skill todavía no corrieron contra una base real.** Con la
> primera tabla, validar `clienteComo` y el ejemplo de `gastos` contra la base de pruebas y
> corregir acá lo que haga falta. Cuando estén validados, se borra esta nota.

## La regla de hierro

**Se siembra con privilegio y se verifica sin él.** La clave secreta sirve para preparar y
limpiar filas. Toda aserción de acceso se hace con un cliente firmado como el usuario
(`signInWithPassword` sobre la clave publicable, la misma superficie que usa un atacante).

| Clave | Variable | Rol en Postgres |
|---|---|---|
| Publicable, sin sesión | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `anon` |
| Publicable, con sesión | la misma, después de `signInWithPassword` | `authenticated` |
| Secreta | `SUPABASE_SECRET_KEY` | `service_role` (saltea RLS) |

## Qué probar, por tabla (la matriz)

Las dos direcciones: quien debe SÍ puede, y quien no debe NO puede.

| Caso | Resultado esperado |
|---|---|
| **Admin** lee y escribe lo de su local | ✅ funciona (control positivo) |
| **Invitado** lee o escribe cualquier tabla | 🔒 vacío / 0 filas |
| **Caja** y **Encargado**, mientras no esté definido su alcance | 🔒 vacío / 0 filas en todo |
| **Anon** lee el menú publicado (productos y categorías visibles) | ✅ funciona |
| **Anon** lee productos ocultos, costos, ventas o cualquier otra tabla | 🔒 vacío |
| Usuario del **local B** lee o escribe datos del **local A** | 🔒 vacío / 0 filas |
| Un usuario **desactivado** lee o escribe | 🔒 vacío / rechazado |
| Alguien que no es admin intenta **cambiar un rol** o activar/desactivar usuarios | 🔒 rechazado, y el valor sigue igual |
| Un cierre de caja cargado **a nombre de otro** | 🔒 rechazado / queda a nombre de quien lo cargó |
| Cualquier rol intenta **borrar** una fila (se anula, no se borra) | 🔒 rechazado |
| Cualquier rol intenta **modificar o borrar la auditoría** | 🔒 rechazado |
| Un no admin lee las **notas personales** | 🔒 vacío |

Cuando Santiago defina Caja y Encargado, sus filas se reemplazan por lo definido, cada una
con su control positivo. El caso del local B se prueba aunque hoy haya un solo local: el
aislamiento es mucho más barato de garantizar desde la primera tabla.

## 🔴 Gotcha 1: negar es silencioso, y de dos formas

RLS **no tira error** cuando bloquea: un `select` de filas negadas vuelve **vacío** y un
`update` o `delete` afecta **0 filas**. Por eso se afirma sobre la cantidad de filas o sobre
el valor releído, no solo sobre el error.

| Qué bloquea | Qué devuelve |
|---|---|
| **Falta el grant** (el rol no tiene la columna o el verbo) | `error.code === '42501'` y `data === null` |
| **La policy filtra la fila** (hay grant, la fila no es suya) | `error === null` y `data === []` |

- **Nunca `expect(data ?? []).toHaveLength(0)`.** El `??` junta los dos casos y además da
  verde si el cliente está roto. No prueba nada.
- **Verificá contra la base cuál de los dos aplica** antes de fijar la aserción.
- **En un `update`, releé la fila y afirmá que el valor no cambió.** Es la aserción que
  sobrevive a un cambio de mecanismo (grant, policy o trigger).

## 🔴 Gotcha 2: sin control positivo no se prueba nada

Un `toEqual([])` da verde si la RLS bloqueó, pero también si la consulta está mal escrita o
la tabla no existe. **Cada tabla necesita al menos un caso donde el acceso legítimo SÍ
funcione**, y el camino anónimo del menú también. Si la tabla está vacía, se siembra la
fila en el test.

## Usuarios de prueba y preparación

- Uno por rol, fijos, en la base de pruebas: `prueba.<rol>@manteca.test`. Los crea
  `npm run sembrar:pruebas`, que crea solo los que faltan. La preparación de Vitest y la de
  Playwright lo corren solas antes de empezar, así que un usuario borrado se vuelve a crear.
- La contraseña sale de `CONTRASENA_USUARIOS_PRUEBA` en `.env.local`. Nunca se escribe en el
  repo.
- Antes de sembrar nada, la preparación comprueba que la URL de Supabase sea la del proyecto
  de pruebas (`SUPABASE_REF_PRUEBAS`) y aborta si no lo es.
- Las filas de cada corrida llevan una marca propia y se borran al terminar.

```ts
// tests/rls/clientes.ts — cliente firmado como un usuario de prueba.
// leerVariable falla con un mensaje claro si la variable de entorno no está.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { leerVariable } from '../entorno';

export type RolDePrueba =
  | 'invitado' | 'caja' | 'encargado' | 'admin' | 'adminOtroLocal' | 'desactivado';

export async function clienteComo(rol: RolDePrueba): Promise<SupabaseClient> {
  const cliente = createClient(
    leerVariable('NEXT_PUBLIC_SUPABASE_URL'),
    leerVariable('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'),
  );
  const { error } = await cliente.auth.signInWithPassword({
    email: `prueba.${rol}@manteca.test`,
    password: leerVariable('CONTRASENA_USUARIOS_PRUEBA'),
  });
  if (error) throw new Error(`No pude entrar como ${rol}: ${error.message}`);
  return cliente;
}
```

## Ejemplo: aislamiento de `gastos`

Tablas y columnas ilustrativas: usar las del esquema real.

```ts
// tests/rls/gastos.test.ts
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { clienteComo } from './clientes';
import { limpiarCorrida, sembrarGasto } from './siembra'; // usan la clave secreta

const corrida = `rls-gastos-${Date.now()}`;
let idGasto: string;

beforeAll(async () => {
  idGasto = await sembrarGasto({ local: 'A', corrida, montoCentavos: 150_000 });
});
afterAll(() => limpiarCorrida(corrida));

describe('RLS de gastos', () => {
  it('el admin del local A ve el gasto de su local', async () => {
    const admin = await clienteComo('admin');
    const { data, error } = await admin.from('gastos').select('id').eq('id', idGasto);
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
  });

  it('un invitado no ve el gasto', async () => {
    const invitado = await clienteComo('invitado');
    const { data, error } = await invitado.from('gastos').select('id').eq('id', idGasto);
    // Fijar UNA forma de negar, verificada contra la base (Gotcha 1).
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it('el admin de otro local no puede cambiar el monto', async () => {
    const otro = await clienteComo('adminOtroLocal');
    await otro.from('gastos').update({ monto_centavos: 1 }).eq('id', idGasto);
    const admin = await clienteComo('admin');
    const { data } = await admin.from('gastos').select('monto_centavos').eq('id', idGasto).single();
    expect(data?.monto_centavos).toBe(150_000); // releído por el dueño: no cambió
  });
});
```

## Checklist al crear o revisar la RLS de una tabla

1. ¿Hay control positivo: quien debe, puede?
2. ¿Invitado, caja y encargado reciben vacío o 0 filas, en lectura y en escritura?
3. ¿Anon solo llega al menú publicado?
4. ¿Un usuario de otro local recibe vacío o 0 filas?
5. ¿Las columnas protegidas (rol, activo, quién cargó, montos de un cierre) resisten el
   `update` del propio usuario?
6. ¿Nadie puede cambiar un rol, borrar una fila ni tocar la auditoría?
7. ¿Las aserciones de acceso corren con el cliente del usuario, sin la clave secreta?
8. ¿Se afirma sobre filas o sobre el valor releído, y no con `data ?? []`?

## Dónde encaja

- Cada migración que crea una tabla trae su test de RLS (`migracion-supabase`).
- Cubre la capa de datos. El código de servidor lo cubre `endpoint-staff`.
- Se cierra con `pre-finish`. Un agujero de RLS "cerrado" sin el test que lo prueba es una
  sospecha, no un cierre.
