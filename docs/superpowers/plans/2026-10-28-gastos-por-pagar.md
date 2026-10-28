# Gastos por pagar: plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Anotar gastos por pagar, verlos en Próximos pagos con su botón Pagado y que los fijos queden por pagar el día que vencen.

**Architecture:** Tabla nueva `gastos_por_pagar`. Pagar es cargar un gasto con `por_pagar_id`: un trigger copia los datos del por pagar y un índice único impide pagarlo dos veces. La generación de los fijos pasa a crear por pagar. La pantalla junta lo por pagar (`pagos_pendientes()`) con el próximo pago calculado de cada fijo.

**Tech Stack:** Next.js 16, React 19, Supabase (Postgres, RLS, triggers), Zod 4, React Hook Form, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-28-gastos-por-pagar-design.md`

## Global Constraints

- TDD sin mocks: `*.base.test.ts` contra la base de pruebas, el resto puro. Cada test se ve fallar antes del código.
- Largo: 20 líneas por función en `.ts`, 80 por componente, 300 por archivo. La lógica, fuera de los `.tsx`.
- Español rioplatense con voseo en pantalla. Plata en centavos enteros.
- Sesión del usuario y RLS; la clave secreta solo en el proceso que genera y en la siembra de los tests.
- Nada se borra: se anula con motivo. Toda escritura deja auditoría.
- "Hoy" es el día en Argentina y lo decide el servidor (`diaEnArgentina`).
- Pantallas con `estetica-panel`.
- Cada tarea: sus tests nuevos (Playwright en un solo tamaño) y `npm run tipos`. El cierre: `npm run verificar` y `npm run e2e` en los dos tamaños.
- La migración se aplica solo a `supabase-pruebas`. A la real va recién con el OK de Santiago.
- Commits con la ruta de cada archivo, nunca `git add -A`. El repo lo comparten otras sesiones.

## Review Focus

1. Pagar dos veces lo mismo (doble toque y dos pestañas): un solo gasto; la segunda vez, "Ese pago ya estaba anotado.".
2. Anular el pago devuelve lo por pagar a Próximos pagos; anular lo pagado se rechaza (`PG210`).
3. La generación no duplica los vencimientos que los fijos ya habían cargado pagados antes del cambio.
4. Pagar un fijo antes de que venza: el proceso de ese día no lo vuelve a crear y el próximo pago calculado salta al siguiente.
5. Un por pagar cuya categoría o proveedor se desactivó se paga igual.

---

### Task 1: Base de lo por pagar

**Files:**
- Create: `supabase/migrations/20261028150000_gastos_por_pagar.sql`, `supabase/reversas/20261028150000_gastos_por_pagar.sql`
- Modify: `supabase/schema.sql`, `src/lib/supabase/tipos.ts` (se regeneran)
- Test: `tests/rls/gastos-por-pagar.base.test.ts` (nuevo), `tests/reglas/gastos-por-pagar.base.test.ts` (nuevo), `tests/reglas/gastos-recurrentes.base.test.ts` (la generación lee `gastos_por_pagar`), `tests/gastos-de-prueba.ts` (siembra y limpieza)

**Interfaces:**
- Produce: tabla `gastos_por_pagar` con `id, local_id, vencimiento, categoria_id, monto_centavos, descripcion, proveedor_id, medio_de_pago (null), comprobante, recurrente_id, clave, anulado, motivo_anulacion, anulado_por, fecha_anulacion, creado_por, fecha_creacion, fecha_actualizacion`, `unique (recurrente_id, vencimiento)` y único `(local_id, clave)`.
- Produce: `gastos.por_pagar_id` con índice único sin anulados, `grant insert (por_pagar_id)`.
- Produce: `pagos_pendientes()`, que devuelve `id, vencimiento, descripcion, monto_centavos, medio_de_pago, recurrente_id, categoria, proveedor, frecuencia`.
- Produce: códigos `PG209` (ya no está por pagar), `PG210` (lo pagado no se anula) y `PG211` (no es un próximo pago del fijo).
- Produce, en `tests/gastos-de-prueba.ts`: `sembrarPorPagar(semilla: SemillaDePorPagar): Promise<{ id: string }>`, `borrarGastos({ ..., porPagar })` (borra los pagos, lo por pagar, lo generado por los fijos y su auditoría) y `pagarComoAdmin(porPagarId, extra?)`.

- [ ] **Step 1: Tests de RLS.** Admin ve lo de su local y no lo de otro. Invitado, caja, encargado y desactivado reciben `[]`. El visitante recibe `42501`. El admin anota y queda en su local, a su nombre. No puede mandar el local (`42501`). Caja no anota (`42501`). Nadie borra (`42501`). Ni los sin permiso ni `adminOtroLocal` anulan (releer: sigue sin anular). `pagos_pendientes()` como invitado: `[]`.
- [ ] **Step 2: Tests de reglas.**
  - El pago copia la categoría, el proveedor, la descripción, el comprobante y el fijo, aunque se mande otra categoría.
  - Pagar dos veces da `23505`.
  - Anular el pago deja pagar de nuevo.
  - Lo anulado no se paga (`PG209`).
  - Lo pagado no se anula (`PG210`).
  - Anular pide motivo (`PG205`) y lo anulado no cambia (`PG204`).
  - La categoría desactivada se paga igual.
  - El pago con efectivo de la caja da `PG207`, y lo por pagar con ese medio también.
  - Una categoría que pide proveedor lo exige al anotar (`PG202`).
  - Adelantar un fijo:
    - el próximo vencimiento da OK y copia el monto del fijo;
    - una fecha fuera de la serie da `PG211`;
    - hoy o antes, también `PG211`.
  - `pagos_pendientes()` trae solo lo vigente sin pago, con el nombre de la categoría.
  - Generación (en `gastos-recurrentes.base.test.ts`):
    - `generados()` lee `gastos_por_pagar`;
    - lo anulado no vuelve;
    - lo que ya se había cargado pagado no se vuelve a generar;
    - el total por tipo `fijos` cuenta el pago, no lo por pagar.
- [ ] **Step 3: Correrlos y verlos fallar.** `npx vitest run --project base tests/rls/gastos-por-pagar.base.test.ts tests/reglas/gastos-por-pagar.base.test.ts tests/reglas/gastos-recurrentes.base.test.ts`. Esperado: FAIL, porque no existe la tabla.
- [ ] **Step 4: Escribir la migración y su reversa.**
  - Tabla, índices, RLS (select, insert y update para el admin activo de su local), grants por columna (insert de los datos y `recurrente_id` y `clave`; update de `anulado` y `motivo_anulacion`) y `grant insert (por_pagar_id)` en gastos.
  - `reglas_de_por_pagar()`:
    - al anotar, valida el medio, y la categoría y el proveedor;
    - con fijo, copia del fijo y, si hay usuario, exige un vencimiento de la serie, posterior a hoy, no anterior a `generar_desde` y con el fijo activo;
    - al anular, motivo, no pagado y anulado cerrado.
  - `datos_del_por_pagar()`: antes de insertar un gasto con `por_pagar_id`, copia los datos y exige que esté vigente.
  - `reglas_de_gastos()` saltea la validación de categoría en los pagos, pero no la del medio.
  - `generar_gastos_recurrentes()` crea por pagar y saltea lo ya cargado pagado.
  - `pagos_pendientes()`.
  - Auditoría y `marcar_actualizacion`.
- [ ] **Step 5: Aplicar en pruebas y verificar.** `apply_migration` con `supabase-pruebas`. Consultar columnas, grants y policies. `get_advisors`. Correr la reversa y volver a aplicar con `execute_sql`.
- [ ] **Step 6: Correr los tests del paso 3.** Esperado: PASS.
- [ ] **Step 7: Regenerar tipos y sincronizar `schema.sql`; `npm run tipos`.**
- [ ] **Step 8: Commit** (`feat: base de los gastos por pagar`).

### Task 2: Lógica de pantalla

**Files:**
- Modify: `src/lib/gastos/esquemas.ts`, `src/lib/gastos/fijos.ts`
- Create: `src/lib/gastos/porPagar.ts`
- Test: `src/lib/gastos/esquemas.test.ts`, `src/lib/gastos/fijos.test.ts`, `src/lib/gastos/porPagar.test.ts`

**Interfaces:**
- Produce en `esquemas.ts`:
  - `YA_PAGADO = ['si', 'no']`.
  - `esquemaCarga(hoy)` suma `yaPagado` y `medioDePago` acepta `''` solo si no se repite y todavía no se pagó. La fecha va hasta hoy solo si no se repite y ya se pagó; el mensaje es `NO_FUTURO = 'Si ya lo pagaste, la fecha no puede ser futura. Si lo vas a pagar, elegí Todavía no.'`.
  - `esquemaPago(hoy)`: `{ porPagarId?, fijoId?, vencimiento?, fecha (hasta hoy: 'La fecha del pago no puede ser futura.'), monto, medioDePago, clave }`, con `porPagarId` o con `fijoId` y `vencimiento`.
  - `porPagarParaLaBase(datos)` y `pagoParaLaBase(datos)`.
  - Los tipos `DatosDePago` y `YaPagado`.
- Produce en `fijos.ts`:
  - `cuandoVence(fecha, hoy)`: suma 'Vencido' y 'Vence hoy'.
  - `proximosPagos(recurrentes, hoy, tomados: Set<string> = new Set())` saltea los vencimientos tomados, con clave `${fijoId}|${fecha}`.
  - `faltaPagarEsteMes(items: { fecha: string; montoCentavos: number }[], hoy)`.
- Produce en `porPagar.ts`:
  - el tipo `Pendiente`, que es la fila de `pagos_pendientes()`;
  - el tipo `ItemPorPagar`: `{ clave, porPagarId, fijoId, vencimiento, nombre, detalle, fecha, montoCentavos, medio }`;
  - `itemsPorPagar(pendientes, proximos): ItemPorPagar[]`, ordenados por fecha y nombre;
  - `tomadosDe(filas: { recurrente_id: string; vencimiento: string }[]): Set<string>`.

- [ ] **Step 1: Tests puros.**
  - `esquemaCarga`: con Todavía no acepta una fecha futura y el medio vacío. Con Sí rechaza la fecha futura con `NO_FUTURO`. Un fijo sigue pidiendo el medio.
  - `esquemaPago`: rechaza la fecha futura, sin `porPagarId` ni fijo, y el efectivo de la caja.
  - `cuandoVence`: Vencido y Vence hoy.
  - `proximosPagos` con tomados: salta al mes siguiente.
  - `itemsPorPagar`: junta y ordena, con el detalle del fijo ("Todos los meses") y del suelto ("Mercadería · Granja El Nido").
  - `faltaPagarEsteMes`: incluye lo vencido.
- [ ] **Step 2: `npx vitest run --project puros src/lib/gastos`.** Esperado: FAIL.
- [ ] **Step 3: Implementar.**
- [ ] **Step 4: Correrlos.** Esperado: PASS. Después, `npm run tipos`.
- [ ] **Step 5: Commit** (`feat: lógica de lo por pagar en la pantalla`).

### Task 3: Servicios

**Files:**
- Create: `src/lib/gastos/pagos.ts`
- Modify: `src/lib/gastos/escritura.ts`, que exporta `alCrear`, `alCambiar` y `mensajeDe`, suma mensajes y hace que `cargarGasto` devuelva `tipo`
- Test: `tests/servicios/gastos-por-pagar.base.test.ts`

**Interfaces:**
- Produce:
  - `pagosPendientes(cliente): Promise<Pendiente[]>` y `vencimientosTomados(cliente, hoy): Promise<Set<string>>`.
  - `crearPorPagar(cliente, datos: DatosDeCarga)`, que con la misma clave devuelve el mismo por pagar.
  - `pagar(cliente, datos: DatosDePago): Promise<Resultado<{ id: string }>>`. Con la misma clave devuelve el mismo gasto; si ya está pagado, devuelve `MENSAJES_DE_GASTOS.yaPagado = 'Ese pago ya estaba anotado.'`.
  - `anularPorPagar(cliente, id, motivo)`.
  - `cargarGasto(...)` devuelve `{ id, tipo: 'gasto' | 'fijo' | 'porPagar' }`.
- Mensajes nuevos:
  - `PG209`: 'Eso ya no está por pagar. Recargá la página.'
  - `PG210`: 'Ya está pagado: si no corresponde, anulá el pago desde Pagados.'
  - `PG211`: 'Esa fecha no es un próximo pago del fijo.'

- [ ] **Step 1: Tests de servicio.**
  - Cargar con Todavía no crea un por pagar y no un gasto.
  - La misma clave da el mismo por pagar.
  - Pagar con la sesión del admin crea el gasto con la fecha del pago.
  - Pagar dos veces con otra clave devuelve `yaPagado`.
  - La misma clave devuelve el mismo gasto.
  - Pagar el próximo pago de un fijo lo saca de los tomados del día.
  - `pagosPendientes` no trae lo pagado.
  - `anularPorPagar` con lo pagado devuelve el mensaje de `PG210`.
- [ ] **Step 2: Verlos fallar.**
- [ ] **Step 3: Implementar.**
- [ ] **Step 4: Verlos pasar y correr `npm run tipos`.**
- [ ] **Step 5: Commit** (`feat: servicios de lo por pagar y de los pagos`).

### Task 4: Cargar gasto con "¿Ya lo pagaste?"

**Files:**
- Modify: `src/app/admin/(panel)/gastos/FechaYRepeticion.tsx`, `CamposDelGasto.tsx`, `FormularioDeGasto.tsx`, `nuevo/page.tsx`, `[id]/page.tsx` (con `yaPagado: 'si'`)
- Test: `e2e/gastos-por-pagar.spec.ts` (nuevo)

- [ ] **Step 1: Test de Playwright.** "anotar algo por pagar": Cargar gasto, "Todavía no", "Vence el" en 3 días, medio sin elegir. Esperado: el aviso "Quedó por pagar" y la fila en Próximos pagos con "En 3 días". No figura en Pagados.
- [ ] **Step 2: Verlo fallar** (computadora).
- [ ] **Step 3: Implementar.**
  - El orden queda: ¿Se repite?, después ¿Ya lo pagaste? (si no se repite), después la fecha ("Fecha" o "Vence el") con el resumen.
  - El medio dice "(opcional)" con Todavía no.
- [ ] **Step 4: Verlo pasar y correr `npm run tipos`.**
- [ ] **Step 5: Commit.**

### Task 5: Próximos pagos con Pagado y No se paga

**Files:**
- Modify: `src/app/admin/(panel)/gastos/ProximosPagos.tsx`, `page.tsx`, `acciones.ts`, `src/components/panel/BotonDeAnular.tsx` (botón compacto con su texto)
- Create: `src/app/admin/(panel)/gastos/VentanaDePago.tsx`, `FilaPorPagar.tsx`
- Test: `e2e/gastos-por-pagar.spec.ts`

**Interfaces:**
- Consume: `itemsPorPagar`, `proximosPagos`, `pagosPendientes`, `vencimientosTomados`, `pagar` y `anularPorPagar`.
- Produce: las acciones `pagarDesdeElPanel(datos)` y `anularPorPagarDesdeElPanel(datos)`.

- [ ] **Step 1: Tests de Playwright.**
  - "Pagado corrige el monto y pasa a Pagados".
  - "lo vencido queda arriba marcado Vencido".
  - "No se paga, con motivo, lo saca".
  - "un fijo se paga antes de que venza y aparece el siguiente".
- [ ] **Step 2: Verlos fallar.**
- [ ] **Step 3: Implementar.** La ventana es una `Ventana` con fecha, monto y medio, y el botón "Anotar el pago"; al terminar, el aviso "Pago anotado". Al pie, "Falta pagar este mes" o "Este mes no queda nada por pagar.".
- [ ] **Step 4: Verlos pasar** (computadora) y correr `npm run tipos`.
- [ ] **Step 5: Commit.**

### Task 6: Lo que cambia afuera y documentación

**Files:**
- Modify: `src/app/admin/(panel)/gastos/[id]/page.tsx` (franja), `src/lib/gastos/consultas.ts` (`Gasto.por_pagar_id`), `fijos/PagosDelFijo.tsx` ("Pagos"), `src/lib/panel/ayudasDeLaBase.ts`, `docs/modulos/04-gastos.md`, `PEDIDOS.md`
- Modify: los e2e que esperaban gastos pagados generados por los fijos (`e2e/gastos-fijos.spec.ts`, `e2e/gastos.spec.ts`)

- [ ] **Step 1: Ajustar los tests de Playwright de los fijos** al nuevo comportamiento y a los textos nuevos. Verlos fallar.
- [ ] **Step 2: Implementar los textos y la documentación.**
- [ ] **Step 3: Correr los e2e de Gastos en computadora y `npm run tipos`.**
- [ ] **Step 4: Commit.**
