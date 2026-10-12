# Arreglos de la revisión lógica Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** El fondo inicial que no coincide y los retiros a la vista en el control de cierres;
el efectivo de la caja solo por el cierre; un gasto mandado dos veces no se duplica.

**Architecture:** Una migración (clave de gastos, regla `PG207` en gastos y recurrentes,
función `cierres_fondos_anteriores`). Cálculos puros en `src/lib/caja/fondo.ts` y
`src/lib/gastos/`. Las pantallas de control, detalle y carga de gastos usan eso.

**Tech Stack:** Next.js 16, Supabase con RLS, TypeScript, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-12-revision-fase-1-design.md`

## Global Constraints

- TDD estricto: test, verlo fallar, código, verlo pasar. Sin mocks.
- `*.base.test.ts` usa la base; cualquier otro `*.test.ts` es puro.
- 20 líneas por función en `.ts`, 80 por componente, 300 por archivo. Lógica fuera de `.tsx`.
- Español con voseo. Plata en centavos enteros, `formatearPesos`.
- Nada se borra; toda escritura queda en la auditoría.
- Solo Santiago autoriza la base real, el merge y publicar.
- Hecho es `npm run verificar` y `npm run e2e` en verde.

## Review Focus

1. Un gasto viejo con "Efectivo de la caja" cargado antes de la regla: se tiene que poder
   editar (descripción, categoría) y anular sin que `PG207` lo frene (Tarea 2).
2. El gasto que sale de un cierre y el que genera un recurrente siguen entrando (Tarea 2).
3. El primer cierre del local no tiene anterior: sin marca (Tareas 1 y 2).
4. Un cierre anulado no cuenta como "anterior" (Tarea 2).
5. Guardar dos veces el mismo gasto devuelve el mismo, sin error para la persona (Tarea 2).

---

### Task 1: Cálculos puros

**Files:**
- Create: `src/lib/caja/fondo.ts`, test `src/lib/caja/fondo.test.ts`
- Modify: `src/lib/gastos/pantalla.ts` (`opcionesDeMedio(actual?)`), test `src/lib/gastos/pantalla.test.ts`
- Modify: `src/lib/gastos/esquemas.ts` (`clave` opcional; `gastoParaLaBase` sin la clave), test `src/lib/gastos/esquemas.test.ts`

**Interfaces (Produces):**
- `diferenciaDeFondo(fondoInicialCentavos: number, fondoAnteriorCentavos: number | null): number | null`
- `textoDeFondo(diferencia: number): string`
- `totalDeRetiros(retiros: { monto_centavos: number }[]): number`
- `opcionesDeMedio(actual?: MedioDePago | ''): OpcionDeLista[]`
- `esquemaGasto` con `clave?: string` (uuid)

- [ ] **Step 1: Tests**

`fondo.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { diferenciaDeFondo, textoDeFondo, totalDeRetiros } from './fondo';

describe('fondo de la caja', () => {
  it('compara el fondo con lo que quedo en el cierre anterior', () => {
    expect(diferenciaDeFondo(1000000, 1500000)).toBe(-500000);
    expect(diferenciaDeFondo(1000000, 1000000)).toBe(0);
    expect(diferenciaDeFondo(1000000, null)).toBeNull();
  });

  it('lo dice en palabras', () => {
    expect(textoDeFondo(-500000)).toBe(
      'Arrancó con $5.000,00 menos de lo que quedó en el cierre anterior.',
    );
    expect(textoDeFondo(120050)).toBe(
      'Arrancó con $1.200,50 más de lo que quedó en el cierre anterior.',
    );
  });

  it('suma los retiros', () => {
    expect(totalDeRetiros([{ monto_centavos: 500000 }, { monto_centavos: 1 }])).toBe(500001);
    expect(totalDeRetiros([])).toBe(0);
  });
});
```

En `pantalla.test.ts`:

```ts
describe('opcionesDeMedio', () => {
  it('no ofrece el efectivo de la caja: sale por el cierre', () => {
    expect(opcionesDeMedio().map((o) => o.valor)).toEqual(['transferencia', 'tarjeta', 'otro']);
  });

  it('lo deja en un gasto que ya lo tenia', () => {
    expect(opcionesDeMedio('efectivo_caja').map((o) => o.valor)).toContain('efectivo_caja');
  });
});
```

(Ajustar el test existente de `opcionesDeMedio` que espera "Efectivo de la caja" en la lista
sin parámetro: ahora sin parámetro no está. Anotarlo en el ledger.)

En `esquemas.test.ts`: `esquemaGasto` acepta un gasto con `clave` uuid y sin clave; rechaza
`clave: 'x'`; `gastoParaLaBase` no incluye `clave`.

- [ ] **Step 2: Verlos fallar.** `npx vitest run --project puros src/lib/caja/fondo.test.ts src/lib/gastos`.
  Commit de los tests.

- [ ] **Step 3: Implementar**

`fondo.ts`:

```ts
import { formatearPesos } from '../plata';

/** Fondo de hoy menos lo que quedo en el cierre anterior; nulo si no hay anterior. */
export function diferenciaDeFondo(fondoInicialCentavos: number, fondoAnteriorCentavos: number | null) {
  return fondoAnteriorCentavos === null ? null : fondoInicialCentavos - fondoAnteriorCentavos;
}

export function textoDeFondo(diferencia: number): string {
  const cuanto = formatearPesos(Math.abs(diferencia));
  const sentido = diferencia < 0 ? 'menos' : 'más';
  return `Arrancó con ${cuanto} ${sentido} de lo que quedó en el cierre anterior.`;
}

export const totalDeRetiros = (retiros: { monto_centavos: number }[]) =>
  retiros.reduce((suma, r) => suma + r.monto_centavos, 0);
```

`pantalla.ts`:

```ts
/** El efectivo de la caja sale por el cierre: solo se ve en un gasto que ya lo tenia. */
export const opcionesDeMedio = (actual?: MedioDePago | ''): OpcionDeLista[] =>
  Object.entries(MEDIOS)
    .filter(([valor]) => valor !== 'efectivo_caja' || actual === 'efectivo_caja')
    .map(([valor, texto]) => ({ valor, texto }));
```

`esquemas.ts`: `esquemaGasto = z.object({ fecha, ...camposDeGasto, comprobante: texto(60), clave: z.uuid().optional() })`.
`gastoParaLaBase` sigue devolviendo solo las columnas del gasto (no agrega `clave`).

- [ ] **Step 4: Verlos pasar** y `npm run tipos`. Commit.

---

### Task 2: Base y escritura

**Files:**
- Create: `supabase/migrations/20261012120000_revision_fase_1.sql`, su reversa, `schema.sql`
- Modify: `src/lib/gastos/escritura.ts` (`crearGasto` con clave; `PG207` en los mensajes)
- Modify: `src/lib/caja/consultas.ts` (`fondosAnteriores(cliente, ids)`; `retiros` en la fila)
- Modify: `tests/servicios/gastos.base.test.ts` (los datos por defecto pasan a `transferencia`)
- Test: `tests/reglas/revision-fase-1.base.test.ts`, `tests/servicios/revision-fase-1.base.test.ts`

**Interfaces (Produces):**
- RPC `cierres_fondos_anteriores(ids uuid[])` → `{ id: string; fondo_anterior_centavos: number | null }[]`
- `fondosAnteriores(cliente: Cliente, ids: string[]): Promise<Map<string, number | null>>`
- `FilaDeCierre` suma `fondoInicialCentavos: number` y `retirosCentavos: number`
- `MENSAJES_DE_GASTOS.efectivoDeCaja`: "El efectivo de la caja sale por el cierre del día: que lo cargue quien cierra la caja."

- [ ] **Step 1: Tests de la base**

`tests/reglas/revision-fase-1.base.test.ts`:
- Admin inserta un gasto con `efectivo_caja` sin cierre → `PG207`.
- Admin cambia a `efectivo_caja` el medio de un gasto con `transferencia` → `PG207`.
- Un gasto viejo con `efectivo_caja` (sembrado con la clave secreta, que saltea el trigger
  solo si se inserta antes de la migración: sembrarlo con `transferencia` y pasarlo con la
  clave secreta deshabilitando nada no se puede; en su lugar, sembrar el gasto con la clave
  secreta, que sí pasa por el trigger. Si el trigger lo rechaza, crear el gasto viejo como lo
  haría un cierre (`sembrarCierreConSalidas`) y editarle la descripción) se edita sin cambiar
  el medio: sin error.
- `sembrarCierreConSalidas` sigue creando su gasto de caja.
- Admin crea una plantilla recurrente con `efectivo_caja` → `PG207`.
- `cierres_fondos_anteriores`: tres cierres sembrados en días seguidos (`diaLibre`), el del
  medio anulado: el tercero devuelve el `queda_en_caja` del primero; el primero devuelve nulo
  si no hay ninguno antes (usar un año sin cierres, `1999`, para el primero).
- Caja llamando `cierres_fondos_anteriores` → `42501`.

`tests/servicios/revision-fase-1.base.test.ts`:
- `crearGasto` dos veces con la misma clave → mismo id, una sola fila con esa clave.
- `crearGasto` con `efectivo_caja` → `fallo` con el mensaje de `efectivoDeCaja`.
- `fondosAnteriores` devuelve el mapa de ids.

- [ ] **Step 2: Verlos fallar.** Commit.

- [ ] **Step 3: Migración**

```sql
-- Revision de la primera fase: el efectivo de la caja sale solo por el cierre (un gasto a mano
-- con ese medio nunca llega a la caja y deja un faltante); la misma carga de un gasto mandada
-- dos veces no lo duplica; y el control ve lo que quedo en el cierre anterior.

alter table public.gastos add column if not exists clave uuid;
create unique index if not exists gastos_clave on public.gastos (local_id, clave);

create or replace function public.gastos_exigir_medio(nuevo text, anterior text)
returns void
language plpgsql
immutable
set search_path = ''
as $$
begin
  if nuevo = 'efectivo_caja' and anterior is distinct from 'efectivo_caja' then
    raise exception 'El efectivo de la caja sale por el cierre del dia' using errcode = 'PG207';
  end if;
end
$$;
```

`reglas_de_gastos` (versión de `20261009120100`, copiada entera) suma, después del bloque de
anulación y antes del atajo de recurrente o cierre:

```sql
  if new.cierre_id is null and new.recurrente_id is null then
    perform public.gastos_exigir_medio(new.medio_de_pago::text,
      case when tg_op = 'UPDATE' then old.medio_de_pago::text end);
  end if;
```

`reglas_de_recurrentes` suma al principio:

```sql
  perform public.gastos_exigir_medio(new.medio_de_pago::text,
    case when tg_op = 'UPDATE' then old.medio_de_pago::text end);
```

```sql
create or replace function public.cierres_fondos_anteriores(ids uuid[])
returns table (id uuid, fondo_anterior_centavos bigint)
language plpgsql
stable
security invoker
set search_path = ''
as $$
#variable_conflict use_column
begin
  if not public.es_admin_activo() then
    raise exception 'No tenes permiso para ver los cierres' using errcode = '42501';
  end if;
  return query
    select c.id,
           (select a.queda_en_caja_centavos from public.cierres_de_caja a
             where a.local_id = c.local_id and not a.anulado and a.fecha < c.fecha
             order by a.fecha desc limit 1)
      from public.cierres_de_caja c
     where c.id = any(ids);
end
$$;
revoke all on function public.cierres_fondos_anteriores(uuid[]) from public, anon;
grant execute on function public.cierres_fondos_anteriores(uuid[]) to authenticated;
revoke all on function public.gastos_exigir_medio(text, text) from public, anon;
```

Reversa: vuelve `reglas_de_gastos` y `reglas_de_recurrentes` a la versión anterior, borra las
dos funciones nuevas, el índice y la columna (la columna no guarda nada que se pierda: es la
clave de carga).

Aplicar en pruebas (`apply_migration`), verificar, probar la reversa en una transacción,
regenerar tipos.

- [ ] **Step 4: Escritura y consultas**

`crearGasto`:

```ts
export async function crearGasto(cliente: Cliente, datos: DatosDeGasto) {
  const fila = { ...gastoParaLaBase(datos), clave: datos.clave ?? null };
  const creado = await cliente.from('gastos').insert(fila).select('id').single();
  if (creado.error?.code === '23505' && datos.clave) return gastoDeLaClave(cliente, datos.clave);
  return alCrear(creado);
}
```

`gastoDeLaClave` lee `id` por `clave` y devuelve `exito({ id })`. `PG207` entra a
`POR_CODIGO` con `MENSAJES_DE_GASTOS.efectivoDeCaja`. Como `23505` también es el código de la
categoría repetida, `crearGasto` resuelve la clave antes de caer a `alCrear`.

`consultas.ts` de caja: `COLUMNAS_DE_FILA` suma `retiros:retiros_de_caja(monto_centavos)`;
`aFila` agrega `fondoInicialCentavos` y `retirosCentavos: totalDeRetiros(...)`;
`fondosAnteriores(cliente, ids)` llama a la RPC (sin ids, mapa vacío).

- [ ] **Step 5: Verlos pasar** y `npm run tipos`. Commit.

---

### Task 3: Pantallas y prueba en vivo

**Files:**
- Modify: `src/app/admin/(panel)/caja/ListaDeCierres.tsx` (retiros y marca de fondo, solo en el control)
- Modify: `src/app/admin/(panel)/caja/control/page.tsx` (pide `fondosAnteriores` de la página)
- Modify: `src/app/admin/(panel)/caja/cierres/[id]/page.tsx` y `DetalleDelCierre.tsx` (texto del fondo)
- Modify: `src/app/admin/(panel)/gastos/CamposDelGasto.tsx` (`opcionesDeMedio(medioActual)`),
  `nuevo/page.tsx` (`clave: crypto.randomUUID()`), el formulario de recurrentes
- Test: `e2e/revision-fase-1.spec.ts`

- [ ] **Step 1: e2e**

- El admin abre el control con un rango que incluye dos cierres sembrados en días seguidos: el
  segundo con fondo menor a lo que quedó en el primero y un retiro. El segundo muestra
  "Fondo distinto" y "Retiros: $5.000,00"; su detalle dice "Arrancó con $… menos de lo que
  quedó en el cierre anterior."
- "Cargar gasto": el selector de medio de pago no tiene "Efectivo de la caja".

- [ ] **Step 2: Verlo fallar.** Commit.
- [ ] **Step 3: Pantallas** (la marca: `Badge variant="outline"` "Fondo distinto"; los
  retiros: texto chico "Retiros: $X" si son más de cero; solo cuando `conPersona`).
- [ ] **Step 4: Verlo pasar** en los dos tamaños y mirar las capturas. Commit.
- [ ] **Step 5: Documentación**: `docs/modulos/04-gastos.md` (regla del efectivo de la caja),
  `06-cierres-de-caja.md` (el fondo y los retiros en el control), `docs/producto.md` (sin
  decidir: a qué hora cierra el local). Commit.
