# Cierres de caja por turno: plan de implementación

> Sin superpowers instalado en esta computadora: el plan se ejecuta a mano, tarea por tarea, con
> TDD. Los pasos usan casillas (`- [ ]`).

**Goal:** dos cierres por día (Mediodía y Noche). Cada venta guarda su turno. A la hora de cierre
configurada, Vender se traba hasta cargar el cierre, con «Postergar 10 min».

**Architecture:**
- **Base:** tres migraciones chicas. La primera pone el turno en ventas y cierres. La segunda
  arma la traba y las postergaciones. La tercera da los turnos pendientes y las horas
  configurables.
- **Cálculos:** el texto y la cuenta de cuándo volver a preguntar son puros y viven en
  `src/lib/caja/turnos.ts`.
- **Traba:** la decide siempre la base. La pantalla solo la muestra.

**Tech Stack:** Next.js 16 (App Router), Supabase (Postgres y RLS), Zod, Vitest (puros y base) y
Playwright.

**Spec:** `docs/superpowers/specs/2026-11-19-cierres-por-turno-design.md`

## Global Constraints

- **TDD estricto:** primero el test, verlo fallar y después el código. El código escrito antes
  que su test se borra y se rehace.
- **Tests reales, sin mocks:** nada de `vi.mock`, `vi.fn`, `page.route` ni clientes falsos.
  - `*.base.test.ts` corre contra `mantecatest`, y los puros aparte.
  - La hora entra como parámetro: se prueba cambiando la hora de cierre configurada respecto de
    `now()`, o pasando `momento` a `caja_estado_del_turno`.
  - Cada test siembra lo suyo y lo limpia. El que cambia las horas las restaura en `afterEach`.
- **Largo:** función de `.ts` hasta 20 líneas, componente `.tsx` hasta 80 y archivo hasta 300.
  La lógica no vive en los `.tsx`.
- **Idioma:** español en nombres, base y mensajes, y la pantalla en rioplatense con voseo.
- **Plata y fechas:** centavos enteros (`bigint` y `number` entero, con `_centavos`). «El día» y
  la hora de corte se miden en Argentina (`America/Argentina/Buenos_Aires`).
- **Sesión y datos:**
  - Se usa la sesión del usuario con RLS. La clave secreta, solo para sembrar y limpiar.
  - Caja no ve montos de ventas: el estado del turno no los devuelve.
  - Nada se borra, y toda escritura deja auditoría.
- **Migraciones:** se aplican **solo a `mantecatest`**, con `apply_migration` de
  `supabase-notebook`. Antes de aplicar, se le avisa a la sesión de Materia prima
  (`manteca-menu-reimagined-cc`). Cada migración lleva su reversa.
- **Skills:** el panel con `estetica-panel`; la base con `migracion-supabase` y `tests-rls`; el
  servidor con `endpoint-staff`; el cierre con `pre-finish`.
- **Pruebas mientras se construye:** cada tarea corre solo sus tests y `npm run tipos`. Las
  pantallas, con su archivo de Playwright en `--project=computadora`.
  - El chequeo completo va una vez, en la tarea 10, con el OK de la otra sesión para el e2e:
    `npm run verificar`, más `npm run e2e` en los dos tamaños.
- **Git:**
  - Worktree `orca/manteca-cierres-por-turno`, rama `feat/cierres-por-turno`.
  - Commits chicos en español, el `test:` antes que su `feat:`.
  - Cada archivo con su ruta, nunca `git add -A`.
  - **Nunca `git push`.** Al final se une al `main` local con `--no-ff`, solo con el OK de
    Santiago.
- **Tipos:** `src/lib/supabase/tipos.ts` se regenera desde `mantecatest`, que ya tiene las tablas
  de Materia prima. Se dejan. Al unir las dos ramas se regenera de nuevo.

## Review Focus

1. Dos toques de Cobrar a la vez justo cuando se guarda el cierre del mediodía: cada venta queda
   en un solo turno, y la clave repetida devuelve la misma venta sin volver a pasar por la traba
   (tareas 1 y 2).
2. Un Mediodía sin ventas pasada su hora: no traba, y la venta va a la Noche (tarea 2).
3. Una postergación que se pide cuando ya hay otra vigente: suma 10 minutos desde ahora, sin
   duplicar el turno (tarea 2).
4. Anular el cierre del mediodía con la noche ya vendiendo: las ventas de la noche no vuelven al
   Mediodía, y el Mediodía queda pendiente para volver a cargarlo (tareas 1 y 3).
5. Caja con Vender abierto desde antes de la hora: al cobrar recibe el rechazo, la ventana
   aparece y el ticket sigue armado (tarea 6).

---

### Task 1: Base — el turno en ventas y cierres

**Files:**
- Create: `supabase/migrations/20261119130000_cierres_por_turno.sql` y su reversa en
  `supabase/reversas/`.
- Modify:
  - `supabase/schema.sql` y `src/lib/supabase/tipos.ts`;
  - `tests/cierres-de-prueba.ts` y `tests/ventas-de-prueba.ts`;
  - `scripts/sembrar-pruebas.ts`.
- Test:
  - `tests/reglas/cierres-por-turno.base.test.ts`;
  - `tests/reglas/cierres.base.test.ts` y `tests/servicios/caja-con-el-mostrador.base.test.ts`
    (modificar).

**Interfaces:**
- **Columnas nuevas:**
  - `ventas.turno` y `cierres_de_caja.turno`: `smallint not null default 2`, con
    `check in (1, 2)`;
  - `configuracion_de_caja.hora_cierre_mediodia` y `hora_cierre_noche`: `time`, con valores
    iniciales `'16:00'` y `'23:00'` y `check (hora_cierre_mediodia < hora_cierre_noche)`.
- **Índice:** `cierres_de_caja_un_turno (local_id, fecha, turno) where not anulado` reemplaza a
  `cierres_de_caja_un_dia`.
- **Funciones que cambian:**
  - `cierres_guardar(datos)` lee `datos.turno` (1 o 2, sin él da 2) y rechaza `PC309` en la
    Noche de hoy si el Mediodía tiene ventas en la caja y no tiene cierre;
  - `cierres_con_resultado` devuelve `turno` y suma las ventas de su fecha y su turno;
  - `cierres_fondo_sugerido(la_fecha date, el_turno smallint)` y
    `cierres_fecha_del_fondo(la_fecha date, el_turno smallint)` toman el último cierre anterior
    por `(fecha, turno)`;
  - `cierres_fondos_anteriores` ordena por fecha y turno.
- **Ventas:**
  - `ventas_guardar_mostrador` pone `turno = 1` si el Mediodía de hoy no tiene cierre sin
    anular, y si no `2`. La traba es la tarea 2;
  - `ventas_guardar_manual` lee `datos.turno` (sin él da 2).
- **Ayudas de prueba:**
  - `datosDeCierre(fecha, cambios)` acepta `turno`, y `sembrarCierre` lo pasa;
  - `sembrarVentaConPago` acepta `turno`;
  - `horasDeCierre(mediodia, noche)` y `restaurarHorasDeCierre()` cambian y devuelven las horas
    del local principal con la clave secreta.
- **`sembrar:pruebas`:** deja las horas del local principal en `23:58` y `23:59`.

- [ ] **Step 1: tests de reglas.**
  - Dos cierres del mismo día en turnos distintos se guardan, y el segundo del mismo turno da
    `PC302`.
  - Lo esperado del Mediodía cuenta solo las ventas de turno 1, y el de la Noche solo las de
    turno 2.
  - El fondo sugerido de la Noche es lo que dejó el Mediodía del mismo día, y el del Mediodía es
    lo que dejó la Noche anterior.
  - `PC309`: Noche de hoy con Mediodía con ventas y sin cierre. Sin ventas, la Noche se guarda.
  - La venta del mostrador va a turno 1, y con el Mediodía cerrado va a turno 2.
  - Anular el cierre del mediodía no cambia el turno de las ventas.
  - La venta a mano guarda el turno pedido.
- [ ] **Step 2:** `npx vitest run --project base tests/reglas/cierres-por-turno.base.test.ts`
  tiene que dar FAIL.
- [ ] **Step 3:** escribir la migración y la reversa (cabecera sin tildes, `security definer`,
  `search_path = ''` y los mismos grants que hoy). Avisar a la otra sesión y aplicarla a
  `mantecatest`.
- [ ] **Step 4:** volver a correr los tests nuevos y los modificados: PASS. Revisar columnas e
  índice por consulta, y `get_advisors` sin nada nuevo sin explicar. Probar la reversa dentro de
  un `do` que se deshace.
- [ ] **Step 5:** pasar la migración a `schema.sql`, regenerar los tipos y correr
  `npm run tipos`. Ajustar `scripts/sembrar-pruebas.ts` y correrlo.
- [ ] **Step 6:** commits `test:` y `feat:`.

### Task 2: Base — la traba y las postergaciones

**Files:**
- Create: `supabase/migrations/20261119130100_traba_del_cierre.sql` y su reversa.
- Modify: `supabase/schema.sql`, `src/lib/supabase/tipos.ts` y `tests/cierres-de-prueba.ts`.
- Test: `tests/reglas/traba-del-cierre.base.test.ts` y `tests/rls/postergaciones.base.test.ts`.

**Interfaces:**
- **Tabla `postergaciones_de_cierre`**:
  - columnas `id`, `local_id`, `fecha date`, `turno smallint`, `postergado_por uuid`,
    `desde timestamptz`, `hasta timestamptz` y `fecha_creacion`;
  - trigger `auditar`;
  - RLS: el admin activo ve las de su local, y Caja activa las suyas;
  - se revocan insert, update y delete.
- **`caja_estado_del_turno(momento timestamptz)`**, solo para Caja activa o admin activo.
  Devuelve una fila:
  - `fecha date`, `turno smallint` (el turno al que iría una venta ahora);
  - `trabado boolean`, `motivo text` (`'hora'`, `'ayer'`, `'cerrada'` o null);
  - `fecha_trabada date` y `turno_trabado smallint` (el cierre que falta);
  - `postergado_hasta timestamptz`, `proxima_hora timestamptz` y `hora_de_corte time`.
  - Las reglas son las 4, 6 y 7 del spec. No devuelve montos.
- **`caja_estado_del_mostrador()`** = `caja_estado_del_turno(now())`.
- **`caja_postergar_cierre()`**:
  - inserta `hasta = least(now() + 10 min, 23:59:59 de hoy)` para el cierre que traba;
  - sin traba, da `PC310`;
  - devuelve `hasta`.
- **`ventas_guardar_mostrador`:**
  - responde primero a la clave repetida, como hoy;
  - después mira el estado: `motivo in ('hora', 'ayer')` sin postergación vigente da `PV314`,
    y `'cerrada'` da `PV315`;
  - el turno sale del estado.
- **Ayuda de prueba:** `borrarPostergaciones(fechas)`.

- [ ] **Step 1: tests de reglas** (las horas, con `horasDeCierre` relativas a ahora).
  - **Hora pasada:**
    - hora del Mediodía pasada, con ventas en turno 1 y sin cierre: `PV314`;
    - con una postergación, se vende y la venta va a turno 1;
    - cuando la postergación vence (`caja_estado_del_turno(now() + 11 min)`), trabado;
    - hora pasada sin ventas en turno 1: no traba y la venta va a turno 2.
  - **Ayer:**
    - última venta de ayer sin cierre: `motivo = 'ayer'` y `PV314`;
    - con el cierre de ayer cargado, o con ayer marcado «No abrió», no traba.
  - **Noche:** con la Noche cerrada, `PV315`.
  - **Postergar:**
    - sin traba da `PC310`;
    - postergar dos veces deja dos filas y `hasta` sale del último toque;
    - no pasa de las 23:59:59.
  - **Datos que no se ven:** el estado no tiene ninguna columna `_centavos`.
  - **Clave repetida:** con la traba puesta, devuelve la venta ya guardada.
- [ ] **Step 2: tests de RLS.**
  - El admin ve las postergaciones de su local y no las del otro.
  - Caja ve solo las suyas.
  - Invitado, encargado y desactivado leen `[]`, y el visitante recibe `42501`.
  - Insertar, cambiar y borrar directo da `42501`.
  - Invitado, encargado y desactivado reciben `42501` en `caja_postergar_cierre` y en
    `caja_estado_del_mostrador`.
- [ ] **Step 3:** FAIL.
- [ ] **Step 4:** escribir la migración y la reversa, avisar a la otra sesión y aplicarla.
- [ ] **Step 5:** PASS, más las mismas revisiones que en la tarea 1.
- [ ] **Step 6:** pasar a `schema.sql`, regenerar los tipos y correr `npm run tipos`. Commits
  `test:` y `feat:`.

### Task 3: Base — turnos pendientes y horas configurables

**Files:**
- Create: `supabase/migrations/20261119130200_turnos_pendientes.sql` y su reversa.
- Modify: `supabase/schema.sql` y `src/lib/supabase/tipos.ts`.
- Test: `tests/reglas/turnos-pendientes.base.test.ts` y `tests/rls/cierres.base.test.ts`
  (modificar).

**Interfaces:**
- **`cierres_turnos_pendientes(desde date, hasta date, momento timestamptz default now())`**,
  solo para el admin activo. Devuelve `(fecha date, turno smallint)`: los turnos con ventas en la
  caja, sin cierre sin anular, de un día no marcado en `dias_sin_abrir` y con la hora ya pasada a
  ese `momento`.
- **Horas:** `grant update (hora_cierre_mediodia, hora_cierre_noche)` sobre
  `configuracion_de_caja`, con la misma policy del admin. El check rechaza el mediodía después de
  la noche, y la auditoría guarda el valor anterior y el nuevo.

- [ ] **Step 1: tests.**
  - Un turno con ventas y sin cierre aparece, y con cierre no.
  - Un turno sin ventas no aparece, ni un día marcado «No abrió».
  - El Mediodía de hoy antes de su hora no aparece, y después sí (con `momento`).
  - Caja recibe `42501`.
  - El admin cambia las horas y queda la auditoría. Caja no las cambia. Con el mediodía después
    de la noche, la base lo rechaza.
- [ ] **Step 2:** FAIL. **Step 3:** escribir la migración, avisar y aplicarla. **Step 4:** PASS
  y las revisiones. **Step 5:** pasar a `schema.sql`, regenerar los tipos y commits.

### Task 4: Cálculos puros y esquemas

**Files:**
- Create: `src/lib/caja/turnos.ts` y `src/lib/caja/turnos.test.ts`.
- Modify:
  - `src/lib/caja/esquemas.ts` y su test: el cierre con `turno` y el esquema de horas;
  - `src/lib/ventas/esquemas.ts` y su test: `turno` en la venta a mano;
  - `src/lib/caja/dias.ts` y su test: los pendientes por turno.

**Interfaces:**
- `type Turno = 1 | 2`.
- `nombreDelTurno(turno)` da `'Mediodía'` o `'Noche'`, y `cierreDelTurno(turno)` da
  `'cierre del mediodía'` o `'cierre de la noche'`.
- `textoDeLaTraba(estado, ahora)`:
  - motivo `hora`: «Son las 16:05: es hora del cierre del mediodía.»;
  - motivo `ayer`: «Quedó sin cargar el cierre de la noche de ayer.»;
  - motivo `cerrada`: «La caja de hoy ya cerró.».
- `textoDePostergado(hasta)` da «Cierre del mediodía postergado hasta las 16:20».
- `msHastaLaProximaConsulta(estado, ahora)` da el mínimo entre la próxima hora, el vencimiento
  de la postergación y 60 000 ms.
- `esquemaDeHoras`: `HH:MM`, el mediodía antes que la noche, y la noche hasta 23:59.
- `turnosPendientesDeAyer(pendientes, ayer)` arma el texto del aviso de Inicio:
  «…de la noche», «…del mediodía» o «…de los dos turnos».

- [ ] **Step 1:** escribir los tests puros. **Step 2:** `npx vitest run --project puros src/lib/caja src/lib/ventas`
  tiene que dar FAIL. **Step 3:** escribir el código. **Step 4:** PASS y `npm run tipos`.
  **Step 5:** commits.

### Task 5: Servidor

**Files:**
- Modify:
  - `src/lib/caja/consultas.ts`: el turno en la fila, `turnosPendientes`, `horasDeCierre`,
    `postergacionesDelCierre` y el fondo por turno;
  - `src/lib/caja/escritura.ts`: los mensajes `PC302` por turno, `PC309` y `PC310`, y
    `cambiarHorasDeCierre`;
  - `src/lib/vender/consultas.ts` y `escritura.ts`: `estadoDelMostrador` y `postergarCierre`,
    con los mensajes `PV314` y `PV315`;
  - `src/app/admin/(panel)/vender/acciones.ts` y `caja/acciones.ts`.
- Test: `tests/servicios/cierres-por-turno.base.test.ts`.

**Interfaces:**
- `estadoDelMostrador(cliente): Promise<EstadoDelTurno>`.
- `postergarCierre(cliente): Promise<Resultado<{ hasta: string }>>`.
- Una venta rechazada por la traba devuelve `fallo(mensaje, { traba: true })`, para que la
  pantalla abra la ventana. Hay que ver si `Resultado` ya admite un dato extra. Si no lo admite,
  se usa un código en el texto del fallo.
- `postergacionesDelCierre(cliente, id)` da `{ veces, minutos, primera }`.

- [ ] **Step 1:** tests de servicio contra la base: los mensajes, el estado leído por Caja y la
  postergación por la acción. **Step 2:** FAIL. **Step 3:** escribir el código. **Step 4:** PASS
  y `npm run tipos`. **Step 5:** commits.

### Task 6: Pantalla — la ventana en Vender

**Files:**
- Create:
  - `src/app/admin/(panel)/vender/VentanaDelCierre.tsx`;
  - `src/app/admin/(panel)/vender/AvisoDePostergado.tsx`;
  - `src/lib/vender/useEstadoDelTurno.ts`.
- Modify: `vender/page.tsx` (lee el estado junto con el catálogo) y `vender/Mostrador.tsx`.
- Test: `e2e/caja-turnos.spec.ts`.

- [ ] **Step 1: e2e.**
  - Con la hora del Mediodía un minuto antes de ahora, y una venta sembrada de turno 1, Caja
    entra a Vender y ve la ventana.
  - «Postergar 10 min» muestra el aviso «postergado hasta».
  - Un ticket armado antes de que aparezca la ventana se cobra.
  - «Hacer el cierre» lleva a `/admin/caja?fecha=…&turno=1`.
  - Después de guardar el cierre, Vender vende sin ventana.
  - Si la venta se rechaza con Vender abierto desde antes, la ventana aparece y el ticket sigue.
- [ ] **Step 2:** `npm run e2e -- e2e/caja-turnos.spec.ts --project=computadora` tiene que dar
  FAIL.
- [ ] **Step 3:** escribir el código con `estetica-panel`. La ventana es modal, sin cerrar con
  Escape ni tocando afuera, y con el foco en «Hacer el cierre».
- [ ] **Step 4:** PASS y `npm run tipos`. **Step 5:** commits.

### Task 7: Pantalla — Caja trabada en sus otras pantallas

**Files:**
- Modify: `src/app/admin/(panel)/layout.tsx`, o la pieza que arma el panel para Caja.
- Test: `e2e/caja-turnos.spec.ts`.

- [ ] **Step 1:** e2e:
  - con la traba puesta, Caja en Mis cierres ve la ventana y en Cargar cierre no;
  - el admin en Gastos no la ve.
- [ ] **Step 2:** FAIL. **Step 3:** escribir el código, leyendo el estado solo para el rol Caja
  y en la misma tanda del layout. **Step 4:** PASS. **Step 5:** commits.

### Task 8: Pantallas de Caja — cargar por turno, el control y las horas

**Files:**
- Modify:
  - `caja/page.tsx`: el turno por la URL o el turno abierto, y el fondo por turno;
  - `caja/FormularioDeCierre.tsx`: «Cierre del mediodía» o «Cierre de la noche», con dos
    botones;
  - `caja/ListaDeCierres.tsx`: la columna Turno;
  - `caja/control/page.tsx`: los pendientes por turno y las horas junto a la tolerancia;
  - `caja/cierres/[id]/page.tsx`: el turno y las postergaciones;
  - `caja/mis-cierres`.
- Create: `caja/control/FormularioDeHoras.tsx`.
- Test: `e2e/caja.spec.ts` y `e2e/caja-control.spec.ts`.

- [ ] **Step 1:** e2e:
  - cargar el Mediodía y después la Noche del mismo día;
  - el control muestra las dos filas con su turno, y un turno pendiente con «Cargar cierre»;
  - el detalle muestra «Se postergó 1 vez (10 min)»;
  - el admin cambia las horas y ve el aviso de guardado;
  - el mediodía después de la noche muestra el error.
- [ ] **Step 2:** FAIL. **Step 3:** escribir el código. **Step 4:** PASS. **Step 5:** commits.

### Task 9: Venta a mano, Inicio y Reporte de Caja

**Files:**
- Modify:
  - `ventas/nueva/FormularioDeVenta.tsx`: el campo Turno con la casilla marcada;
  - `src/lib/inicio/consultas.ts` y su aviso: lo de ayer por turno;
  - `src/lib/reportes/caja.ts` y `reportes/caja/page.tsx`: una fila por cierre con su turno, y
    los pendientes por turno.
- Test:
  - `e2e/ventas.spec.ts`, `e2e/inicio*.spec.ts` y `e2e/reportes.spec.ts`;
  - `tests/servicios/inicio.base.test.ts` y `tests/servicios/reportes.base.test.ts`.

- [ ] **Step 1:** escribir los tests. **Step 2:** FAIL. **Step 3:** escribir el código.
  **Step 4:** PASS. **Step 5:** commits.

### Task 10: Ayudas, auditoría, documentos y cierre

- [ ] **Ayudas:** las de Vender, Caja y Control al día (`src/lib/panel/ayudas*.ts`, con su
  test).
- [ ] **Auditoría:** «Postergación del cierre» y las horas de cierre en
  `src/lib/auditoria/diccionario.ts`, con su test.
- [ ] **Documentos:**
  - `docs/modulos/06-cierres-de-caja.md`: pantallas, estados, reglas y parte técnica, y lo que
    todavía dice «un cierre por día»;
  - `docs/modulos/05-ventas.md`: el turno de la venta y la traba en las reglas del mostrador.
- [ ] **Datos de ejemplo:** `scripts/ejemplos/`, con dos turnos por día en los días inventados.
  Si se hace aparte, se anota como pendiente.
- [ ] **Cierre con `pre-finish`:**
  - pedirle el OK a la otra sesión para el e2e;
  - `npm run verificar`;
  - `npm run e2e` en los dos tamaños, en primer plano y por partes, con las capturas.
- [ ] **`PEDIDOS.md`:** el 98 a Completados, con fecha y cómo se verificó, y la nota de que se
  probó contra `mantecatest`.
- [ ] **Al terminar:** preguntarle a Santiago si se une al `main` local con
  `git merge --no-ff`, sin push, y después se borran la rama y el worktree.
