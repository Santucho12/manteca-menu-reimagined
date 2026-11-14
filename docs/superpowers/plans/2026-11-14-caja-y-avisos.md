# Caja y avisos: plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Caja deja de editar su cierre, el control suma "No abrió" y abre la diferencia por medio, e Inicio avisa bien ayer sin cierre y los pagos, compara la semana en plata y explica Más vendidos con el Excel.

**Architecture:** Una migración (función `cierres_editar` solo para admin, tabla `dias_sin_abrir` escrita por una función y un trigger). El cálculo va en archivos puros de `src/lib/caja` y `src/lib/inicio`; las pantallas solo muestran. Inicio lee todo en una sola tanda.

**Tech Stack:** Next.js 16 (App Router), Supabase (Postgres, RLS), Zod, Vitest (puros y base), Playwright.

**Spec:** `docs/superpowers/specs/2026-11-14-caja-y-avisos-design.md`

## Global Constraints

- TDD estricto: primero el test, verlo fallar, después el código. Código escrito antes que su test se borra y se rehace.
- Tests reales, sin mocks: nada de `vi.mock`, `vi.fn`, `page.route` ni clientes falsos. `*.base.test.ts` contra la base de pruebas; puros aparte. La fecha de hoy entra como parámetro. Cada test siembra lo suyo y lo limpia.
- Largo: 20 líneas por función en `.ts`, 80 por componente `.tsx`, 300 por archivo. La lógica no vive en los `.tsx`.
- Español en nombres, base y mensajes; pantalla en rioplatense con voseo.
- Plata en centavos enteros (`bigint` / `number` entero, `_centavos`); se muestra `$1.234,50`. "El día" es el de Argentina.
- Sesión del usuario y RLS. La clave secreta, solo para sembrar y limpiar tests (`clienteSecretoDePruebas()`). Caja carga su cierre y ve los suyos, nada más. Nada se borra. Toda escritura deja auditoría.
- La migración se aplica solo a pruebas (`supabase-pruebas`, nunca el MCP `supabase` general). A la real, el merge y publicar: los decide Santiago.
- Panel con `estetica-panel`; base con `migracion-supabase` y `tests-rls`; servidor con `endpoint-staff`; cierre con `pre-finish`.
- Cada tarea corre solo sus tests y `npm run tipos`. El chequeo completo (`npm run verificar`, `npm run e2e` en los dos tamaños, capturas) va una vez, en la tarea 10, en primer plano y por partes.
- A `src/lib/supabase/tipos.ts` entra solo lo de esta migración: pruebas tiene además las tablas de Costos (pedido 87, postergado).
- Commits chicos, conventional commits en español, el `test:` antes que su `feat:`. Cada archivo con su ruta, nunca `git add -A`. Rama `feat/caja-y-avisos`.

## Review Focus

1. Doble toque en "No abrió" o dos admins marcando el mismo día: queda una sola fila (tarea 1).
2. Un día marcado al que después se le carga un cierre y ese cierre se anula: vuelve a pendiente, no a "No abrió" (tarea 1).
3. Un fijo que ya dejó su por pagar y además tiene próximo pago: el aviso no lo cuenta dos veces (tarea 6).
4. Montos de millones en el celular: el título y la etiqueta de la semana no se salen de la tarjeta (tarea 7).
5. Caja con la pantalla de editar abierta desde antes: al guardar recibe "sin permiso" y el cierre no cambia (tareas 1 y 2).

---

### Task 1: Base

**Files:**
- Create: `supabase/migrations/20261114120000_caja_y_avisos.sql`, `supabase/reversas/20261114120000_caja_y_avisos.sql`
- Modify: `supabase/schema.sql`, `src/lib/supabase/tipos.ts`, `tests/cierres-de-prueba.ts`
- Test: `tests/reglas/cierres-resultado.base.test.ts` (modificar), `tests/reglas/dias-sin-abrir.base.test.ts`, `tests/rls/dias-sin-abrir.base.test.ts`

**Interfaces:**
- Produces (base): `cierres_editar(el_id uuid, datos jsonb)` solo admin activo del local del cierre; tabla `dias_sin_abrir (id, local_id, fecha, activo, marcado_por, fecha_creacion, fecha_actualizacion)` única por `(local_id, fecha)`; `cierres_marcar_sin_abrir(la_fecha date, marcar boolean) returns void`; códigos `PC307` (día con cierre sin anular) y `PC308` (día futuro).
- Produces (tests): en `tests/cierres-de-prueba.ts`, `diaSinAbrirDe(fecha): Promise<{ activo: boolean; marcado_por: string } | null>` y `borrarDiasSinAbrir(fechas: string[]): Promise<void>` (con la clave secreta, local principal).

- [ ] **Step 1: Tests de `cierres_editar`** (en el archivo que ya existe): los dos casos de edición pasan a correr como `admin`; `caja no edita ni su propio cierre` (`42501`, y `cierreDe(id).efectivo_centavos` sigue igual); `el admin de otro local no edita` (`42501`); `un cierre anulado no se edita` queda.
- [ ] **Step 2: Tests de reglas de los días sin abrir:** el admin marca y queda `activo` a su nombre; marcar dos veces deja una fila; deshacer desactiva y volver a marcar reactiva; día futuro (`2099-01-01`) → `PC308`; día con cierre sin anular → `PC307`, y con el cierre anulado sí marca; guardar un cierre (`cierres_guardar`) de un día marcado desactiva la marca, y anulado ese cierre la marca sigue desactivada; la auditoría tiene `alta`, `desactivacion` y `reactivacion` de ese registro; `caja`, `invitado`, `encargado` y `desactivado` reciben `42501` y no queda fila.
- [ ] **Step 3: Tests de RLS:** el admin ve la marca de su local y no la del otro; `caja`, `invitado`, `encargado` y `desactivado` leen `[]` sin error; el visitante, `42501`; insertar, cambiar y borrar directo dan `42501` para el admin; `adminOtroLocal` que deshace el día no cambia la marca de este local.
- [ ] **Step 4:** `npx vitest run --project base tests/reglas/cierres-resultado.base.test.ts tests/reglas/dias-sin-abrir.base.test.ts tests/rls/dias-sin-abrir.base.test.ts`: FAIL (la tabla y la función no existen; Caja todavía edita).
- [ ] **Step 5:** escribir la migración y la reversa (cabecera sin tildes; `revoke all … from anon, authenticated` y `grant select`; función `security definer` con `set search_path = ''`; `revoke all on function … from public, anon` y `grant execute … to authenticated`; el trigger `after insert on cierres_de_caja`). Aplicarla con `apply_migration` de `supabase-pruebas`, nombre `caja_y_avisos`.
- [ ] **Step 6:** el mismo comando: PASS. Verificar por consulta columnas, grants y policy; `get_advisors` sin nada nuevo sin explicar; reversa y migración en un bloque `do` que se deshace.
- [ ] **Step 7:** sumar la migración a `schema.sql` y los tipos de la tabla y de la función a `tipos.ts`. `npm run tipos`.
- [ ] **Step 8:** commits: `test:` (los tres archivos y las ayudas) y `feat:` (migración, reversa, schema y tipos).

### Task 2: Caja no edita, en el servidor y en la pantalla

**Files:**
- Modify: `src/app/admin/(panel)/caja/acciones.ts`, `src/app/admin/(panel)/caja/cierres/[id]/editar/page.tsx`, `src/app/admin/(panel)/caja/cierres/[id]/page.tsx`, `src/lib/caja/escritura.ts`
- Test: `e2e/caja.spec.ts`, `e2e/caja-control.spec.ts`

- [ ] **Step 1: e2e de Caja:** `no deja cargar dos cierres del mismo dia` espera "Ya hay un cierre cargado para ese día. Si está mal, lo corrige un administrador desde el control de cierres."; el caso "…y se puede editar" pasa a `caja no edita su cierre: no ve Editar y la dirección la saca` (sin enlace "Editar cierre", con el texto "¿Algo está mal? Avisale a un administrador: lo corrige desde el control de cierres.", y `goto('/admin/caja/cierres/<id>/editar')` termina en `/admin`).
- [ ] **Step 2: e2e del control:** `el admin edita un cierre y el resultado se vuelve a calcular` (siembra venta en efectivo de $15.000 y cierre; "Editar cierre", efectivo `24.000`, "Guardar cambios", ve "Con diferencia").
- [ ] **Step 3:** `npm run e2e -- e2e/caja.spec.ts e2e/caja-control.spec.ts --project=computadora`: FAIL en los casos nuevos.
- [ ] **Step 4:** acción y página de editar a `'admin'`; en la ficha, "Editar cierre" solo para el admin y la línea para Caja; el mensaje `diaRepetido`.
- [ ] **Step 5:** el mismo comando: PASS. `npm run tipos`. Commits `test:` y `feat:`.

### Task 3: "No abrió" en el control

**Files:**
- Create: `src/lib/caja/sinAbrir.ts`, `src/app/admin/(panel)/caja/control/BotonDeSinAbrir.tsx`, `src/app/admin/(panel)/caja/control/DiasQueNoAbrio.tsx`
- Modify: `src/lib/caja/dias.ts`, `src/lib/caja/esquemas.ts`, `src/lib/caja/pantalla.ts`, `src/app/admin/(panel)/caja/acciones.ts`, `src/app/admin/(panel)/caja/control/page.tsx`, `src/app/admin/(panel)/caja/control/FiltrosDelControl.tsx`
- Test: `src/lib/caja/dias.test.ts`, `src/lib/caja/esquemas.test.ts`, `src/lib/caja/pantalla.test.ts`, `tests/servicios/dias-sin-abrir.base.test.ts`, `e2e/caja-control.spec.ts`

**Interfaces:**
- Produces: `diasSinCierre({ desde, hasta, conCierre, sinAbrir?, primero, hoy }): string[]` (sin los marcados); `diasQueNoAbrio({ conCierre, sinAbrir }): string[]` (marcados sin cierre, del más nuevo al más viejo); `diasSinAbrir(cliente, desde, hasta): Promise<string[]>`; `marcarSinAbrir(cliente, fecha, marcar): Promise<Resultado>`; `esquemaSinAbrir` (`{ fecha: string; marcar: boolean }`); `marcarSinAbrirDesdeElPanel(datos: unknown)`; `ESTADOS` suma `'no_abrio'` con nombre "No abrió".
- Mensajes de `marcarSinAbrir`: `PC307` "Ese día tiene un cierre cargado: no se puede marcar como que no abrió."; `PC308` "Ese día todavía no llegó."; `42501` "No tenés permiso para hacer esto."

- [ ] **Step 1: Tests puros:** `diasSinCierre` no cuenta los días de `sinAbrir`; `diasQueNoAbrio` devuelve los marcados sin cierre, ordenados, y deja afuera el que tiene cierre; `esquemaSinAbrir` rechaza una fecha inválida; `opcionesDeEstado()` incluye "No abrió".
- [ ] **Step 2: Test de servicio:** el admin marca y `diasSinAbrir` lo trae; deshace y ya no; un día con cierre devuelve el mensaje de `PC307`; `caja` recibe el de sin permiso y `diasSinAbrir` le da `[]`.
- [ ] **Step 3: e2e:** `marca un día pendiente como que no abrió y lo deshace`: con un cierre sembrado en un día libre y el rango hasta dos días después, "No abrió" en el día siguiente lo saca de "Días sin cierre" y lo pone en la lista "Días que no abrió"; el estado "No abrió" la muestra sola; "Deshacer" lo devuelve a pendiente.
- [ ] **Step 4:** correr los puros, el de servicio y el e2e en `computadora`: FAIL. **Step 5:** implementar. **Step 6:** PASS + `npm run tipos`. **Step 7:** commits `test:` y `feat:`.

### Task 4: La diferencia, por medio

**Files:**
- Create: `src/lib/caja/diferencias.ts`
- Modify: `src/lib/caja/resultado.ts`, `src/lib/caja/resultadoDeFila.ts`, `src/lib/caja/consultas.ts`, `src/lib/caja/titular.ts`, `src/lib/caja/pantalla.ts`, `src/app/admin/(panel)/caja/ListaDeCierres.tsx`, `src/app/admin/(panel)/caja/cierres/[id]/ResumenDelCierre.tsx`, `tests/cierres-de-prueba.ts` (semilla con `creditoCentavos`)
- Test: `src/lib/caja/diferencias.test.ts`, `resultado.test.ts`, `titular.test.ts`, `pantalla.test.ts`, `e2e/caja-control.spec.ts`

**Interfaces:**
- Produces: `ResultadoDeMedio` suma `fuera: boolean` (la diferencia pasa la tolerancia); `type DiferenciaDeMedio = { medio: Medio; centavos: number }`; `diferenciasPorMedio(medios: ResultadoDeMedio[]): DiferenciaDeMedio[]` (las distintas de cero, en el orden de `MEDIOS`); `textoDeDiferenciaDeMedio(d): string` ("Efectivo: faltan $5.000,00", "Tarjeta de crédito: sobran $5.000,00"); `FilaDeCierre` cambia `diferenciaTotalCentavos` por `diferencias: DiferenciaDeMedio[]`; `titularDelCierre(cierre: { estado; anulado }, medios: ResultadoDeMedio[]): string`.
- Titular con diferencia: un medio fuera → "Faltan $1.000,00 en efectivo" (los medios en frase: efectivo, tarjeta de crédito, tarjeta de débito, QR, transferencia); varios → "No cierra en 2 medios de pago".

- [ ] **Step 1: Tests puros:** `fuera` según la tolerancia; `diferenciasPorMedio` con un faltante de 500000 en efectivo y un sobrante de 500000 en crédito devuelve los dos; sus textos; los tres titulares; se va `diferenciaParaMostrar`.
- [ ] **Step 2: e2e:** `un faltante en efectivo y un sobrante igual en tarjeta no se compensan`: venta en efectivo de $15.000 y cierre con `creditoCentavos: 500000`; la fila dice "Efectivo: faltan $5.000,00" y "Tarjeta de crédito: sobran $5.000,00", sin "Sin diferencia"; el detalle dice "No cierra en 2 medios de pago".
- [ ] **Step 3:** FAIL. **Step 4:** implementar. **Step 5:** PASS + tipos. **Step 6:** commits.

### Task 5: Ayer sin cierre

**Files:**
- Modify: `src/lib/inicio/consultas.ts`
- Delete: `src/lib/inicio/ayer.ts`, `src/lib/inicio/ayer.test.ts`
- Test: `tests/servicios/inicio.base.test.ts`

**Interfaces:** `datosDelInicio` deja de devolver `ayer`. `ayerSinCierre` consulta además `diasSinAbrir(cliente, ayer, ayer)`.

- [ ] **Step 1: Tests de base:** `aunque ayer no tenga ventas cargadas, avisa que falta el cierre` (reemplaza al caso contrario); `si ayer está marcado como que no abrió, no avisa`; se va `trae las ventas de ayer y su cierre con diferencia`.
- [ ] **Step 2:** FAIL. **Step 3:** implementar y borrar lo que queda sin uso. **Step 4:** PASS, `npx vitest run --project puros src/lib/inicio` y tipos. **Step 5:** commits.

### Task 6: El aviso de pagos sale de Próximos pagos

**Files:**
- Create: `src/lib/inicio/pagos.ts`
- Modify: `src/lib/inicio/avisos.ts`, `src/lib/inicio/consultas.ts`, `src/lib/gastos/porPagar.ts`
- Delete: `src/lib/inicio/vencimientos.ts`, `src/lib/inicio/vencimientos.test.ts`
- Test: `src/lib/inicio/pagos.test.ts`, `src/lib/inicio/avisos.test.ts`, `src/lib/gastos/porPagar.test.ts`, `tests/servicios/inicio.base.test.ts`, `e2e/inicio-avisos.spec.ts` (nuevo)

**Interfaces:**
- Produces: `type PagosParaAvisar = { vencidos: number; estaSemana: number; unico: string | null }`; `pagosParaAvisar(items: { clave: string; fecha: string }[], hoy: string): PagosParaAvisar` (vencido: `fecha < hoy`; de la semana: de hoy a hoy + 6; `unico`: la clave si en total es uno); `DatosDeAvisos.pagos?: PagosParaAvisar` en lugar de `vencenEstaSemana` y `unVencimiento`; `pagosDelInicio(cliente, hoy): Promise<PagosParaAvisar>`; `esElPagoPedido(item, pagar)` acepta además `pagar === item.clave`.
- Textos: los del spec, punto 4. Enlace `/admin/gastos`, con `?pagar=<clave>` si `unico`.

- [ ] **Step 1: Tests puros:** `pagosParaAvisar` cuenta 1 vencido (ayer), 2 de la semana (hoy y hoy + 6) y deja afuera hoy + 7; `unico` con uno solo; los cinco textos del aviso; `esElPagoPedido` por clave de un por pagar anotado a mano.
- [ ] **Step 2: Test de base:** con `hoy = 2099-03-10`, sembrar un por pagar que venció el `2099-03-01` y otro que vence el `2099-03-12` sube `vencidos` y `estaSemana` en 1 cada uno; un fijo con primer vencimiento `2099-03-12`, generado su por pagar (`generarDelFijo`), sube `estaSemana` en 1 y no en 2.
- [ ] **Step 3: e2e:** `el aviso de pagos cuenta lo vencido y lleva a Gastos`: con un por pagar vencido ayer, Inicio muestra un aviso que dice "vencido", y al tocarlo se ve en Próximos pagos.
- [ ] **Step 4:** FAIL. **Step 5:** implementar. **Step 6:** PASS + tipos. **Step 7:** commits.

### Task 7: La semana, en plata

**Files:**
- Modify: `src/lib/inicio/semana.ts`, `src/lib/inicio/semanaAcumulada.ts`, `src/components/inicio/SemanaContraSemana.tsx`, `src/components/inicio/CartelDeSemana.tsx`
- Test: `src/lib/inicio/semana.test.ts`, `src/lib/inicio/semanaAcumulada.test.ts`, `e2e/inicio-admin.spec.ts`

**Interfaces:** `DiaDeLaSemana.actual` y `.anterior` pasan a ser centavos (de `monto_centavos`). `resumenDeLaSemana` da el título con `formatearPesosRedondeados` y la etiqueta con `pesosCortos`.

- [ ] **Step 1: Tests puros:** con 8.400.000 y 7.700.000 centavos: "Vas $7.000 arriba" y "▲ $84 k vs $77 k"; abajo e igual; `semanaContraSemana` toma `monto_centavos`.
- [ ] **Step 2: e2e:** el título `/^Vas (\$[\d.]+ (arriba|abajo)|igual que la semana pasada)$/`, la etiqueta `/^[▲▼=] \$.+ vs \$.+$/`, la descripción "Lo vendido sumado día a día, contra la semana pasada.", y en `celular` ninguna de las dos pastillas se sale de la tarjeta.
- [ ] **Step 3:** FAIL. **Step 4:** implementar (eje con `pesosCortos`; cartel con "Vendido ese día" y "Vendido hasta ese día"). **Step 5:** PASS + tipos. **Step 6:** commits.

### Task 8: Más vendidos y el Excel

**Files:**
- Create: `src/lib/inicio/masVendidos.ts`
- Modify: `src/lib/inicio/consultas.ts`, `src/components/inicio/MasVendidos.tsx`, `src/components/inicio/InicioAdmin.tsx`
- Test: `src/lib/inicio/masVendidos.test.ts`, `tests/servicios/inicio.base.test.ts`, `e2e/inicio-avisos.spec.ts`

**Interfaces:** `notaDeMasVendidos(productos: number, sinDetalle: number): string | null` con los tres textos del spec, punto 6; `datosDelInicio` devuelve `sinDetalle: number` (ventas del mes sin renglones, de `ventasSinDetalle`).

- [ ] **Step 1: Tests:** los cuatro casos de la nota; en base, una venta sin renglones del mes sube `sinDetalle` en 1.
- [ ] **Step 2: e2e:** con una venta sin productos de hoy, la tarjeta "Más vendidos" dice "Excel de Fudo".
- [ ] **Step 3:** FAIL. **Step 4:** implementar. **Step 5:** PASS + tipos. **Step 6:** commits.

### Task 9: "No abrió" en el reporte de Caja

**Files:**
- Modify: `src/lib/reportes/caja.ts`, `src/app/admin/(panel)/reportes/caja/page.tsx`
- Test: `src/lib/reportes/caja.test.ts`, `e2e/reportes.spec.ts`

**Interfaces:** `FilaDeCaja` suma `noAbrio: boolean`; `filasDeCaja(cierres, periodo, primero, hoy, sinAbrir: string[] = [])`.

- [ ] **Step 1: Tests:** un día marcado sale con `noAbrio: true` y `cierre: null`, y no como día sin cierre; e2e: la fila de ese día dice "No abrió".
- [ ] **Step 2:** FAIL. **Step 3:** implementar. **Step 4:** PASS + tipos. **Step 5:** commits.

### Task 10: Auditoría, ayudas, documentos y cierre

**Files:**
- Modify: `src/lib/auditoria/diccionario.ts`, `src/lib/auditoria/pantalla.ts`, `src/lib/auditoria/textos.ts`, `src/lib/panel/ayudasDeLaBase.ts`, `src/lib/panel/ayudasDelNegocio.ts`, `docs/modulos/04-gastos.md`, `06-cierres-de-caja.md`, `08-reportes.md`, `09-inicio.md`, `PEDIDOS.md`
- Test: `src/lib/auditoria/textos.test.ts`, `src/lib/auditoria/pantalla.test.ts`, `src/lib/panel/ayudas.test.ts`

- [ ] **Step 1: Tests:** el registro de `dias_sin_abrir` se lee "Día sin abrir" en el módulo Caja y lleva a `/admin/caja/control?estado=no_abrio`; las ayudas de Inicio, Caja y el control dicen lo nuevo (Caja no edita, "No abrió", pagos vencidos, semana en pesos, Más vendidos y el Excel) y ya no dicen que el aviso de ayer depende de las ventas.
- [ ] **Step 2:** FAIL. **Step 3:** implementar y poner al día los documentos. **Step 4:** PASS.
- [ ] **Step 5: Cierre:** `npm run verificar` por partes y `npm run e2e` entero en `computadora` y `celular`, por tandas y en primer plano. Capturas del control, de un cierre y de Inicio a 360 y 1440 px, abiertas y miradas.
- [ ] **Step 6:** `PEDIDOS.md`: el 85 con la fecha y cómo se verificó, y la migración solo en pruebas. Commit `docs:`, push y PR, sin mergear: la migración a la real y el merge los decide Santiago.
