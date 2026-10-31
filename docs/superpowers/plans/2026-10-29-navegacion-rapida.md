# Cambiar de sección más rápido: plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que cada pantalla del panel pida sus datos junto con el control de acceso, en una sola tanda, y que volver a una sección recién vista sea instantáneo (pedidos 73 y 74).

**Architecture:** Un ayudante puro (`enParalelo.ts`) larga la lectura sin esperar el acceso y hace ganar la redirección si no hay permiso. `servidor.ts` lo envuelve para las páginas (`exigirPaginaYLeer`, `exigirPaginaConLectura`). Los fondos anteriores de Caja se calculan con los cierres del rango en la misma tanda. `staleTimes.dynamic = 30` guarda las secciones en el navegador.

**Tech Stack:** Next.js 16.4.3 (App Router), React 19, Supabase (`@supabase/ssr`), Vitest 5 (grupos `puros` y `base`), Playwright 1.63.

**Spec:** `docs/superpowers/specs/2026-10-29-navegacion-rapida-design.md`

## Global Constraints

- TDD: primero el test, verlo fallar, después el código. Código escrito antes que su test se borra y se rehace desde el test.
- Sin mocks: nada de `vi.mock`, `vi.fn` como reemplazo, `page.route` ni clientes falsos. Los puros usan promesas y `setTimeout` reales; los `*.base.test.ts` usan la base de pruebas con `clienteComo(rol)` y limpian lo que siembran.
- Largo: funciones de `.ts` ≤ 20 líneas, componentes de `.tsx` ≤ 80, archivos ≤ 300 (sin blancos ni comentarios). No se desactiva la regla.
- Español en nombres, comentarios y mensajes; `camelCase` y `PascalCase`; comentarios que explican el porqué.
- Plata en centavos enteros: `number` entero, nombres terminados en `Centavos` o `_centavos`.
- Cada consulta con la sesión del usuario (RLS). Clave secreta solo donde ya se usa: generar los gastos recurrentes de un admin.
- Sin migraciones ni cambios en la base real; publicar lo decide Santiago.
- Mientras se construye: cada tarea corre solo sus tests nuevos (Playwright en `computadora`) y `npm run tipos`. Al cerrar: `npm run verificar` y `npm run e2e` en los dos tamaños.
- Worktree `../Sistema-Manteca-navegacion` (excepción de Santiago, 2026-10-29): Playwright usa el 3211, el mismo que la otra sesión; antes de correrlo, comprobar que el 3211 esté libre.

## Review Focus

- Invitado, Caja o encargado que abren una pantalla de admin: van a su pantalla, sin página de error, aunque la lectura adelantada falle → Tarea 6 corre `e2e/acceso.spec.ts`.
- Caja o invitado en Inicio: la lectura de admin falla y nadie la espera; no puede quedar un rechazo suelto → Tarea 1, test «la lectura que nadie espera no deja un rechazo suelto».
- Admin con la base caída: ve el error como hoy, no datos vacíos → Tarea 1, test «con acceso, si la lectura falla, falla con el error de la lectura».
- Control filtrado por persona: el fondo anterior sale del cierre anterior de cualquier persona, como en SQL → Tarea 2, test «el anterior puede ser de otra persona».
- Guardar algo y volver a una sección en menos de 30 s: muestra lo nuevo → Tarea 7, test «después de guardar, la sección se vuelve a pedir».

---

### Task 1: Acceso y datos a la vez

**Files:**
- Create: `src/lib/acceso/enParalelo.ts`
- Test: `src/lib/acceso/enParalelo.test.ts`
- Modify: `src/lib/acceso/servidor.ts`

**Interfaces:**
- Produces:
  - `accesoYLectura<A extends object, T>(acceso: Promise<A>, leer: () => Promise<T>): Promise<A & { lectura: Promise<T> }>`
  - `accesoYDatos<A extends object, T>(acceso: Promise<A>, leer: () => Promise<T>): Promise<A & { datos: T }>`
  - En `servidor.ts`: `exigirPaginaYLeer<T>(pagina: PaginaConSesion, leer: (cliente: Cliente) => Promise<T>): Promise<Acceso & { datos: T }>` y `exigirPaginaConLectura<T>(pagina, leer): Promise<Acceso & { lectura: Promise<T> }>`.

- [ ] **Step 1: Tests que fallan** en `enParalelo.test.ts`, con promesas reales:
  - «devuelve el acceso con los datos»: acceso `{ rol: 'admin' }`, leer `[1, 2]` → `{ rol: 'admin', datos: [1, 2] }`.
  - «pide los datos sin esperar el acceso»: acceso que resuelve a los 30 ms con `setTimeout`; `leer` anota si el acceso ya había resuelto → `false`.
  - «sin acceso gana el error del acceso aunque la lectura también falle»: acceso rechaza `Error('redirigir')`, leer rechaza `Error('sin permiso')` → rechaza con `'redirigir'`.
  - «si leer lanza sin devolver una promesa, gana el error del acceso».
  - «con acceso, si la lectura falla, falla con el error de la lectura»: `Error('base caída')`.
  - «la lectura que nadie espera no deja un rechazo suelto»: `accesoYLectura` con acceso que resuelve y lectura que rechaza; no se espera `lectura`; un `process.on('unhandledRejection')` propio no se llama tras un `setTimeout` de 20 ms.
- [ ] **Step 2:** `npx vitest run --project puros src/lib/acceso/enParalelo.test.ts` → FAIL (no existe el módulo).
- [ ] **Step 3:** Implementar. `leer` se llama en la microtarea siguiente (`Promise.resolve().then(leer)`) y a la lectura se le cuelga un `catch` vacío antes de esperar el acceso.
- [ ] **Step 4:** Mismo comando → PASS.
- [ ] **Step 5:** En `servidor.ts`: `clienteActual = cache(crearClienteDelServidor)`, que también usa `accesoActual`, y las dos funciones de arriba con `exigirPagina(pagina)` como acceso. `npm run tipos` → sin errores.
- [ ] **Step 6:** Commit `feat: acceso y datos de cada pantalla a la vez (pedido 73)`.

### Task 2: Control de cierres en una tanda

**Files:**
- Create: `src/lib/caja/fondosAnteriores.ts`, `src/lib/caja/fondosAnteriores.test.ts`, `tests/servicios/fondos-del-rango.base.test.ts`
- Modify: `src/lib/caja/consultas.ts`, `src/app/admin/(panel)/caja/control/page.tsx`

**Interfaces:**
- Consumes: `exigirPaginaYLeer` (Tarea 1).
- Produces:
  - `type CierreParaFondo = { id: string; fecha: string; anulado: boolean; queda_en_caja_centavos: number }`
  - `fondosAnterioresDe(cierres: CierreParaFondo[], antesDelRangoCentavos: number | null): Map<string, number | null>`
  - `fondosDelRango(cliente: Cliente, desde: string, hasta: string): Promise<Map<string, number | null>>`

- [ ] **Step 1: Tests puros que fallan** (`fondosAnteriores.test.ts`): «el primero del rango toma lo que quedó antes del rango», «cada cierre toma lo que quedó en el anterior», «un cierre anulado no cuenta como anterior», «uno del mismo día no es anterior», «un anulado también tiene su fondo anterior», «sin nada antes, el primero queda en null», «no importa el orden en que lleguen».
- [ ] **Step 2:** `npx vitest run --project puros src/lib/caja/fondosAnteriores.test.ts` → FAIL.
- [ ] **Step 3:** Implementar `fondosAnterioresDe`: los no anulados ordenados por fecha; para cada cierre, el último con fecha menor; si no hay, `antesDelRangoCentavos`.
- [ ] **Step 4:** Mismo comando → PASS.
- [ ] **Step 5: Test de base que falla** (`fondos-del-rango.base.test.ts`): tres cierres en días seguidos desde `diaLibre()` (el del medio cargado por admin, para «el anterior puede ser de otra persona»), uno anterior al rango con `quedaEnCajaCentavos: 300000`; `fondosDelRango(admin, primero, último)` da, para los tres, lo mismo que `fondosAnteriores(admin, ids)`. Limpia con `borrarCierres`.
- [ ] **Step 6:** `npx vitest run --project base tests/servicios/fondos-del-rango.base.test.ts` → FAIL; implementar `fondosDelRango` (a la vez `cierres_con_resultado` sin persona y `fondoSugerido(cliente, desde)`) → PASS.
- [ ] **Step 7:** La página del control: todo lo que lee, más `fondosDelRango(cliente, filtros.desde, filtros.hasta)`, dentro de un solo `exigirPaginaYLeer('admin', …)`; se deja de llamar a `fondosAnteriores`. `npm run tipos`; `npx playwright test e2e/caja-control.spec.ts --project=computadora` → PASS.
- [ ] **Step 8:** Commit `feat: el control de cierres en una sola tanda (pedido 73)`.

### Task 3: Detalle de un cierre en dos tandas

**Files:**
- Modify: `src/lib/caja/consultas.ts`, `src/app/admin/(panel)/caja/cierres/[id]/page.tsx`
- Test: `tests/servicios/cierre-con-fondo.base.test.ts`

**Interfaces:**
- Produces: `cierreConFondoAnterior(cliente: Cliente, id: string): Promise<{ cierre: Cierre; fondoAnteriorCentavos: number | null } | null>`

- [ ] **Step 1: Tests de base que fallan:** «trae el cierre con lo que quedó en el anterior» (antes con 300000; el cierre devuelto es igual a `cierrePorId`), «un id que no existe da null», «Caja no ve el cierre de otra persona» (null).
- [ ] **Step 2:** `npx vitest run --project base tests/servicios/cierre-con-fondo.base.test.ts` → FAIL.
- [ ] **Step 3:** Implementar: la fila del cierre por id; con su fecha, a la vez `cierres_con_resultado` de ese día y `fondoSugerido(cliente, fecha)`. `cierrePorId` reutiliza las mismas partes.
- [ ] **Step 4:** Mismo comando → PASS.
- [ ] **Step 5:** La página usa `exigirPaginaYLeer('caja', (cliente) => cierreConFondoAnterior(cliente, id))`; el fondo se muestra solo al admin, como hoy. `npm run tipos`.
- [ ] **Step 6:** Commit `feat: el detalle de un cierre en dos tandas (pedido 73)`.

### Task 4: Mis cierres sin esperar el perfil

**Files:**
- Modify: `src/lib/caja/consultas.ts`, `src/app/admin/(panel)/caja/mis-cierres/page.tsx`
- Test: `tests/servicios/cierre-con-fondo.base.test.ts` (otro `describe`)

**Interfaces:**
- Produces: `misCierresDeLaSesion(cliente: Cliente): Promise<FilaDeCierre[]>`

- [ ] **Step 1: Test de base que falla:** Caja ve su cierre sembrado (`cargadoPor: 'caja'`) y el admin, con la suya, no lo ve en sus cierres.
- [ ] **Step 2:** Correr el archivo → FAIL. Implementar: el id sale de `cliente.auth.getClaims()`; sin sesión, `[]`; si no, `misCierres(cliente, id)`. → PASS.
- [ ] **Step 3:** La página usa `exigirPaginaYLeer('caja', misCierresDeLaSesion)`. `npm run tipos`. Commit `feat: mis cierres sin esperar el perfil (pedido 73)`.

### Task 5: Gastos lee junto con el acceso

**Files:**
- Create: `src/lib/gastos/alAbrir.ts`, `src/lib/gastos/alAbrir.test.ts`
- Modify: `src/app/admin/(panel)/gastos/page.tsx`

**Interfaces:**
- Produces: `listasAlDia<T>(generados: number, leidas: T, releer: () => Promise<T>): Promise<T>`

- [ ] **Step 1: Tests puros que fallan:** «si no se generó nada, usa lo que ya leyó y no vuelve a leer», «si se generó algo, vuelve a leer».
- [ ] **Step 2:** Correr → FAIL; implementar → PASS.
- [ ] **Step 3:** La página: las ocho lecturas en una función de la página, `exigirPaginaYLeer('admin', leer)`, después `generarAlAbrir(estado, hoy)` y `listasAlDia(generados, datos, () => leer(cliente))`. `npm run tipos`. Commit `feat: Gastos lee junto con el acceso (pedido 73)`.

### Task 6: Las demás pantallas, Inicio y la prueba que lo cuida

**Files:**
- Create: `tests/paginas-en-una-tanda.test.ts`
- Modify: las `page.tsx` del panel que todavía hagan `const { cliente … } = await exigirPagina(`, e Inicio (`src/app/admin/(panel)/page.tsx`).

- [ ] **Step 1: Test puro que falla:** recorre `src/app/admin/(panel)/**/page.tsx` y junta las que coinciden con `/const\s*\{[^}]*\bcliente\b[^}]*\}\s*=\s*await\s+exigirPagina\(/`; espera la lista vacía y, si no, la muestra.
- [ ] **Step 2:** `npx vitest run --project puros tests/paginas-en-una-tanda.test.ts` → FAIL con la lista.
- [ ] **Step 3:** Cada página de la lista pasa a `exigirPaginaYLeer` (lo que lee, en la función `leer`). Inicio usa `exigirPaginaConLectura('panel', (cliente) => datosDelInicio(cliente, hoy))` y espera `lectura` solo si es admin.
- [ ] **Step 4:** El test → PASS. `npm run tipos`. `npx playwright test e2e/acceso.spec.ts e2e/inicio-admin.spec.ts --project=computadora` → PASS.
- [ ] **Step 5:** Commit `feat: cada pantalla del panel en una sola tanda (pedido 73)`.

### Task 7: El navegador recuerda cada sección 30 segundos

**Files:**
- Create: `e2e/navegacion.spec.ts`
- Modify: `next.config.ts`

- [ ] **Step 1: Pruebas de Playwright que fallan** (sesión de admin, celular y computadora con `abrirSeccion`):
  - «volver a una sección recién vista no la vuelve a pedir»: Inicio → Caja → Inicio; los pedidos con `_rsc=` o cabecera `rsc: 1` a `/admin` durante la vuelta son 0.
  - «después de guardar, la sección se vuelve a pedir»: Inicio → Caja, guarda la tolerancia (750, como `caja-control.spec.ts`), vuelve a Inicio → al menos un pedido a `/admin`. `restaurarTolerancia()` en `finally`.
- [ ] **Step 2:** `npx playwright test e2e/navegacion.spec.ts --project=computadora` → la primera FALLA.
- [ ] **Step 3:** `next.config.ts`: `experimental: { staleTimes: { dynamic: 30 } }`, con el porqué en un comentario.
- [ ] **Step 4:** Mismo comando → PASS las dos.
- [ ] **Step 5:** Commit `feat: el navegador recuerda cada seccion 30 segundos (pedido 74)`.

### Task 8: Cierre

- [ ] **Step 1:** `npm run verificar` (lint, tipos, todos los tests, build), en primer plano y por partes si falta memoria.
- [ ] **Step 2:** `npm run e2e` en los dos tamaños, con el 3211 libre.
- [ ] **Step 3:** Medir de nuevo con los scripts del 2026-10-29 contra `npm run local` armado desde la rama; anotar los números en `PEDIDOS.md` y mover el 73 y el 74 a Completados si pasaron los dos pasos.
- [ ] **Step 4:** Push con la cuenta Santucho12 y PR a `main`; el merge lo decide Santiago.
