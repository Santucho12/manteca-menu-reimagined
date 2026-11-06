# El Excel de Fudo en el sistema: plan (pedido 84)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que cierres, Inicio, Reportes y Auditoría funcionen bien con las ventas que entran por el Excel de Fudo: cierres "Esperando ventas", "Ventas de Fudo cargadas hasta", fila "Sin detalle de productos" y un solo registro de auditoría por subida.

**Architecture:** Una migración agrega lo de la base (columna `ventas_cargadas` en `cierres_con_resultado`, dos funciones de lectura, la acción `importacion` y el apagado de `auditar()` durante la subida). El estado del cierre se sigue calculando al mostrar, en `src/lib/caja/`, con un tercer valor. Las pantallas leen lo nuevo dentro de la tanda de consultas que ya hacen.

**Tech Stack:** Next.js 16, Supabase (Postgres, RLS), Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-05-excel-de-fudo-en-el-sistema-design.md`

## Global Constraints

- TDD estricto: primero el test y verlo fallar. Código escrito antes que su test se borra y se rehace.
- Sin mocks: nada de `vi.mock`, `vi.fn` como reemplazo, `page.route` ni clientes falsos. `*.base.test.ts` contra la base de pruebas; el resto, puro (`npx vitest run --project puros`).
- La fecha de hoy entra como parámetro. Cada test siembra lo suyo y limpia (`clienteSecretoDePruebas()` de `tests/clientes.ts`).
- 20 líneas por función en `.ts`, 80 por componente `.tsx`, 300 por archivo (sin blancos ni comentarios). La lógica, fuera de los `.tsx`.
- Español en nombres, base y mensajes; pantalla en rioplatense con voseo.
- Plata en centavos enteros, nombres `_centavos`/`Centavos`; se muestra `$1.234,50`. "El día" es el de Argentina.
- Sesión del usuario y RLS. Caja no recibe montos de ventas. Toda escritura deja auditoría.
- La migración se aplica solo a la base de pruebas, con su reversa. Aplicarla a la real y publicar lo decide Santiago.
- Skills: `migracion-supabase` y `tests-rls` (tarea 1), `endpoint-staff` (servidor), `estetica-panel` (pantallas), `pre-finish` al cerrar.
- Por tarea: sus tests nuevos (Playwright en un solo tamaño) y `npm run tipos`. Al cerrar el pedido: `npm run verificar` y `npm run e2e` completos, en primer plano y por partes.
- Commits chicos, conventional commits en español, cada archivo con su ruta, con `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. Una subida que cubre hoy a medias (se exportó al mediodía) y un cierre de hoy: el cierre se calcula con lo parcial. Se acepta (se corrige subiendo de nuevo), pero el test de la tarea 1 fija que `ventas_cargadas` mira la fecha de la venta, no la hora de la subida.
2. Solo hay ventas a mano después del último Excel: el cierre sigue esperando (tarea 1, caso propio).
3. Una venta de Fudo anulada por una resubida no cuenta para "cargadas hasta" (tarea 1).
4. La subida que falla a mitad no deja el registro de auditoría ni la marca encendida: la transacción revierte todo (tarea 1, subida con un lote inválido).
5. Caja que lee `cierres_con_resultado` recibe `ventas_cargadas` pero no montos nuevos; y `ventas_fudo_cargadas_hasta()` y `reporte_ventas_sin_detalle` rechazan a Caja con `42501` (tarea 1, RLS).

---

### Task 1: La base

**Files:**
- Create: `supabase/migrations/20261105120000_excel_de_fudo_en_el_sistema.sql` y su reversa según la skill `migracion-supabase`
- Modify: `supabase/schema.sql` si la skill lo pide; tipos generados de Supabase
- Test: `tests/servicios/excel-en-el-sistema.base.test.ts`, `tests/rls/ventas.base.test.ts` (casos nuevos)

**Interfaces:**
- Produces:
  - `cierres_con_resultado(desde, hasta, persona)` devuelve además `ventas_cargadas boolean`: existe una venta `origen = 'fudo'`, sin anular, del mismo local, con `fecha >= c.fecha`.
  - `ventas_fudo_cargadas_hasta() returns date` (null sin ventas de Fudo). Solo admin activo; si no, `42501`.
  - `reporte_ventas_sin_detalle(desde date, hasta date) returns table (ventas bigint, monto_centavos bigint)`: ventas cerradas y sin anular del período sin ningún renglón. Mismo control que las demás `reporte_*` (`reportes_exigir_admin`).
  - `auditoria_accion_check` admite `'importacion'`. `ventas_importar_excel` enciende `manteca.importando_excel = 'si'` (local a la transacción); `auditar()` devuelve sin escribir si la marca está encendida y la tabla es `ventas` o `pagos_de_venta`; al final la importación inserta un registro `tabla = 'ventas'`, `accion = 'importacion'`, `registro_id = 'excel:<desde>:<hasta>'`, `usuario_id = auth.uid()`, `despues = {desde, hasta, dias, nuevas, actualizadas, iguales, anuladas, total_centavos}`, y apaga la marca.

- [ ] **Step 1: Tests que fallan**, en `excel-en-el-sistema.base.test.ts`:
  - `cierre posterior al último día con ventas de Fudo: ventas_cargadas es falso`
  - `cierre del mismo día o anterior: ventas_cargadas es verdadero, aunque ese día no tenga ventas`
  - `solo ventas a mano después del Excel: sigue en falso`
  - `una venta de Fudo anulada no cuenta para ventas_cargadas ni para cargadas_hasta`
  - `ventas_fudo_cargadas_hasta devuelve el último día, y null sin ventas de Fudo`
  - `reporte_ventas_sin_detalle cuenta solo las ventas sin renglones, sin canceladas ni anuladas`
  - `una subida deja un solo registro importacion con el resumen y ninguno de ventas ni pagos`
  - `una venta a mano se sigue auditando como alta`
  - `una subida con un lote inválido no deja registro de auditoría`
  - En RLS: Caja y el invitado reciben `42501` en `ventas_fudo_cargadas_hasta` y `reporte_ventas_sin_detalle`.
- [ ] **Step 2:** `npx vitest run tests/servicios/excel-en-el-sistema.base.test.ts tests/rls/ventas.base.test.ts` → fallan (columna y funciones inexistentes).
- [ ] **Step 3:** Escribir la migración y aplicarla solo en pruebas; regenerar tipos.
- [ ] **Step 4:** Mismos tests → pasan. Probar la reversa en pruebas dentro de una transacción con `rollback`. `npm run tipos`.
- [ ] **Step 5:** Commit `feat: la base sabe hasta qué día hay ventas de Fudo y audita la subida en un registro`.

### Task 2: El estado "Esperando ventas"

**Files:**
- Modify: `src/lib/caja/resultadoDeFila.ts`, `src/lib/caja/resultado.ts` (tipo), `src/lib/caja/consultas.ts`, `src/lib/caja/pantalla.ts`, `src/lib/caja/titular.ts`, `src/lib/reportes/caja.ts`, `src/lib/reportes/consultas.ts` (`cierresDelPeriodo`)
- Test: `src/lib/caja/resultadoDeFila.test.ts`, `src/lib/caja/pantalla.test.ts`, `src/lib/caja/titular.test.ts`, `src/lib/reportes/caja.test.ts`, `tests/servicios/inicio.base.test.ts`

**Interfaces:**
- Consumes: `ventas_cargadas` de la tarea 1.
- Produces: `FilaConVentas` suma `ventas_cargadas: boolean`. `type EstadoDelCierre = 'cierra' | 'con_diferencia' | 'esperando_ventas'` (el estado de `FilaDeCierre` y de `ResultadoDelCierre`). `ESTADOS` de `pantalla.ts` suma `'esperando_ventas'`, nombre `'Esperando ventas'`, tono `'ambar'`. Con `esperando_ventas`, `diferenciaTotalCentavos` es `0` y el reporte de Caja recibe `diferenciaCentavos: null`.

- [ ] **Step 1: Tests que fallan:**
  - `resultadoDeFila con ventas_cargadas falso da esperando_ventas, aunque lo declarado no coincida`
  - `con ventas_cargadas verdadero y sin ventas, lo esperado es $0 y da con_diferencia` (lo de hoy)
  - `titularDelCierre de esperando_ventas dice "Esperando las ventas del día"`
  - `el filtro Esperando ventas existe y su tono es ámbar`
  - `resumenPorEmpleado no suma la diferencia de un cierre esperando`
  - Base de Inicio: `un cierre esperando ventas no entra en "cierres con diferencia"`.
- [ ] **Step 2:** `npx vitest run --project puros src/lib/caja src/lib/reportes` y el de Inicio → fallan.
- [ ] **Step 3:** Implementar. `resultadoDeFila` resuelve el estado antes de llamar a `resultadoDelCierre`; si el día espera, los medios llevan lo declarado y esperado/diferencia en 0. `cierresDelPeriodo` pasa `diferenciaCentavos: null` para los que esperan. Revisar que `'pendiente'` siga significando "día sin cierre" y que su texto en `titular.ts` no se confunda con el nuevo estado.
- [ ] **Step 4:** Mismos tests → pasan. `npm run tipos`.
- [ ] **Step 5:** Commit `feat: un cierre sin ventas de Fudo cargadas espera, no tiene diferencia`.

### Task 3: Pantallas de Caja con "Esperando ventas"

**Files:**
- Modify: `src/app/admin/(panel)/caja/` (resultado después de guardar, `ListaDeCierres.tsx`, `mis-cierres/page.tsx`, `cierres/[id]/ResumenDelCierre.tsx` y `MediosDelCierre.tsx`, `control/FiltrosDelControl.tsx`); textos en `src/lib/caja/pantalla.ts`
- Test: `e2e/caja.spec.ts`, `e2e/caja-control.spec.ts`

**Interfaces:**
- Consumes: el estado de la tarea 2.

- [ ] **Step 1: Tests que fallan (Playwright, computadora):**
  - `Caja guarda un cierre de un día sin ventas de Fudo y ve "Guardado. El resultado va a estar cuando se carguen las ventas del día", sin faltantes ni sobrantes`
  - `en Mis cierres ese cierre dice "Esperando ventas"`
  - `el admin filtra por "Esperando ventas" y el detalle muestra lo declarado sin esperado ni diferencia`
  - `después de subir ventas de Fudo de ese día, el mismo cierre muestra su diferencia` (siembra la venta con la clave secreta)
- [ ] **Step 2:** `npx playwright test e2e/caja.spec.ts e2e/caja-control.spec.ts --project=<computadora>` → fallan.
- [ ] **Step 3:** Implementar con `estetica-panel` (pastilla ámbar, mismo componente de estado).
- [ ] **Step 4:** Mismos tests → pasan. `npm run tipos`.
- [ ] **Step 5:** Commit `feat: Caja y el control muestran los cierres que esperan ventas`.

### Task 4: "Ventas de Fudo cargadas hasta"

**Files:**
- Create: `src/lib/ventas/cargadasHasta.ts` (+ `.test.ts`), `src/components/panel/VentasCargadasHasta.tsx`
- Modify: `src/lib/ventas/consultas.ts` (lectura), `src/lib/inicio/consultas.ts` (`leerElInicio`), las páginas de `src/app/admin/(panel)/reportes/*` y `ventas/page.tsx`, `src/components/inicio/BloqueDelMes.tsx`
- Test: `src/lib/ventas/cargadasHasta.test.ts`, `e2e/inicio-admin.spec.ts`, `e2e/reportes.spec.ts`, `e2e/ventas.spec.ts`

**Interfaces:**
- Consumes: `ventas_fudo_cargadas_hasta()`.
- Produces: `ventasFudoCargadasHasta(cliente: Cliente): Promise<string | null>` en `consultas.ts`; `textoDeCargadasHasta(fecha: string | null, hoy: string): { texto: string; atrasado: boolean }` en `cargadasHasta.ts`.

- [ ] **Step 1: Tests que fallan:**
  - `textoDeCargadasHasta('2026-10-28', '2026-11-05')` → `{ texto: 'Ventas de Fudo cargadas hasta el 28/10', atrasado: true }`
  - con fecha de ayer → `atrasado: false`; con `null` → `'Todavía no se subieron ventas de Fudo'`, `atrasado: true`
  - Playwright: Inicio, un reporte y Ventas muestran el texto con la fecha sembrada.
- [ ] **Step 2:** Correrlos → fallan.
- [ ] **Step 3:** Implementar. La lectura entra en el `Promise.all` que ya tiene cada pantalla (pedido 73).
- [ ] **Step 4:** Pasan. `npm run tipos`.
- [ ] **Step 5:** Commit `feat: Inicio, Reportes y Ventas dicen hasta qué día hay ventas de Fudo`.

### Task 5: "Sin detalle de productos" en los reportes

**Files:**
- Modify: `src/lib/reportes/ventas.ts`, `src/lib/reportes/consultas.ts`, `src/app/admin/(panel)/reportes/productos/page.tsx`, `reportes/categorias/page.tsx`
- Test: `src/lib/reportes/ventas.test.ts`, `tests/servicios/reportes.base.test.ts`, `e2e/reportes.spec.ts`

**Interfaces:**
- Consumes: `reporte_ventas_sin_detalle`.
- Produces: `export const SIN_DETALLE = 'sin-detalle'`; `productosDelReporte(renglones, sinDetalle?: { ventas: number; monto_centavos: number })` y `categoriasDelReporte(filas, sinDetalle?)` agregan al final la fila `{ clave: SIN_DETALLE, nombre: 'Sin detalle de productos (Excel de Fudo)' }` si `monto_centavos > 0`. `masVendidos` de Inicio la excluye igual que `SIN_VINCULAR`.

- [ ] **Step 1: Tests que fallan:**
  - `la fila sin detalle va al final, después de Sin vincular`
  - `sin ventas sin detalle, no hay fila`
  - `masVendidos no incluye sin detalle`
  - Base: `con ventas del Excel y a mano, el total por producto y por categoría es igual al total por período`.
- [ ] **Step 2:** Correrlos → fallan.
- [ ] **Step 3:** Implementar; la lectura entra en la tanda de cada reporte.
- [ ] **Step 4:** Pasan, y Playwright de `reportes/productos` muestra la fila. `npm run tipos`.
- [ ] **Step 5:** Commit `feat: los reportes por producto y categoría cierran con el total`.

### Task 6: La subida en la pantalla de Auditoría

**Files:**
- Modify: `src/lib/auditoria/diccionario.ts`, `src/lib/auditoria/textos.ts`, `src/lib/auditoria/pantalla.ts` (filtro de acción y enlace)
- Test: `src/lib/auditoria/textos.test.ts`, `src/lib/auditoria/pantalla.test.ts`, `e2e/auditoria.spec.ts`

**Interfaces:**
- Consumes: el registro `importacion` de la tarea 1.

- [ ] **Step 1: Tests que fallan:**
  - `un registro importacion se lee "Subida del Excel de Fudo", en el módulo Ventas`
  - `su detalle dice el período, nuevas, actualizadas, iguales, anuladas y el total en pesos`
  - `su enlace es /admin/ventas?desde=<desde>&hasta=<hasta>`
  - `el filtro de acción ofrece "Subida del Excel"`
  - Playwright: después de subir un Excel, Auditoría muestra un solo registro de la subida.
- [ ] **Step 2:** Correrlos → fallan.
- [ ] **Step 3:** Implementar.
- [ ] **Step 4:** Pasan. `npm run tipos`.
- [ ] **Step 5:** Commit `feat: Auditoría muestra la subida del Excel en un registro`.

### Task 7: Documentos y cierre

**Files:**
- Modify: `docs/modulos/05-ventas.md` (sección "Mientras no esté la API: el Excel"), `06-cierres-de-caja.md` (estado "Esperando ventas"), `07-auditoria.md`, `08-reportes.md`, `09-inicio.md`, `PEDIDOS.md`

- [ ] **Step 1:** Poner al día los documentos con lo construido (parte funcional y técnica).
- [ ] **Step 2:** `pre-finish`: `npm run verificar` y `npm run e2e` completos, en primer plano y por partes; revisar las capturas a 360 px.
- [ ] **Step 3:** Mover el pedido 84 a Completados con la fecha y cómo se verificó; si algo no pasó, queda en Pendientes con lo que falta.
- [ ] **Step 4:** Commit `docs: pedido 84 hecho`.
