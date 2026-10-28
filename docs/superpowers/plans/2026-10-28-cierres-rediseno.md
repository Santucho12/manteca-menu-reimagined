# Cierres de caja rediseñados: plan

> **Para quien ejecuta:** usar `superpowers:executing-plans`. Los pasos llevan casillas (`- [ ]`).

**Meta:** dos estados (Cierra, Con diferencia) más Pendiente, cierre editable y lo esperado calculado al mostrar contra las ventas del día.

**Arquitectura:** la cuenta sigue en `resultadoDelCierre` (puro). Una función SQL suma las ventas del día por medio y entrega los insumos de cada cierre visible; el servidor arma el estado con esa cuenta. Se saca lo guardado (`estado`, `esperado_*`) y todo lo de revisar.

**Spec:** `docs/superpowers/specs/2026-10-28-cierres-rediseno-design.md`

## Global Constraints

- Tests sin mocks: base de pruebas en `*.base.test.ts`; lo puro, directo. TDD: test primero, verlo fallar.
- Función de `.ts` ≤ 20 líneas, componente `.tsx` ≤ 80, archivo ≤ 300 (sin blancos ni comentarios).
- Español, voseo en pantalla. Plata en centavos (`_centavos`). El día es el de Argentina.
- Nada se borra, se anula; toda escritura audita. RLS decide con la sesión del usuario.
- Caja carga/edita solo sus cierres y no lee ventas. Migración solo a la base de pruebas; a la real, solo con OK de Santiago.
- Estética: skill `estetica-panel`. Cierre: `npm run verificar` + `npm run e2e` (computadora y celular).

## Review Focus

- Día sin ventas con plata declarada → «Con diferencia», no error ni «Cierra».
- Venta anulada, cancelada o de otro día/local no suma al esperado.
- Caja ajena, invitado y encargado no pueden editar ni ver el cierre de otra persona.
- Editar dos veces seguidas no duplica gastos de caja ni retiros.
- Diferencias de signo contrario dentro de la tolerancia en medios distintos → «Cierra» (la total muestra la neta).

---

### Task 1: Estados y cuenta (puro)

**Files:** Modify `src/lib/caja/pantalla.ts`, `src/lib/caja/resultado.ts`; Test `src/lib/caja/pantalla.test.ts`, `src/lib/caja/resultado.test.ts`.

**Produces:** `EstadoDeCierre = 'cierra' | 'con_diferencia' | 'pendiente'`; `ESTADOS` con esos tres; `nombreDeEstado`; `resultadoDelCierre(declarado, ventas: PorMedio, tolerancia)` sin rama de «esperando» (devuelve `'cierra' | 'con_diferencia'`); `mediosDelCierre` y `diferenciaTotalDe` reciben los esperados ya calculados (no nulos).

- [ ] Tests: sin ventas (`ventas` todo en 0) con $1.000 declarados en QR → `con_diferencia`; efectivo $400 de más y QR $400 de menos con tolerancia $500 → `cierra` y `diferenciaTotalCentavos` 0; `nombreDeEstado('pendiente')` = «Pendiente»; `opcionesDeEstado()` da Cierra, Con diferencia, Pendiente.
- [ ] Verlos fallar: `npx vitest run --project puros src/lib/caja`.
- [ ] Implementar y verlos pasar; `npm run tipos`.
- [ ] Commit.

### Task 2: Migración y reglas de base

**Files:** Create `supabase/migrations/20261028190000_cierres_rediseno.sql`, `supabase/reversas/20261028190000_cierres_rediseno.sql`; Modify `tests/reglas/cierres.base.test.ts`, `tests/rls/cierres.base.test.ts`, `tests/servicios/cierres.base.test.ts`, `src/lib/supabase/tipos.ts` (regenerar), `supabase/schema.sql`.

**Produces (SQL):** `cierres_con_resultado(desde date, hasta date, persona uuid default null)` → por cierre: `id, fecha, cargado_por, persona, anulado, declarados (5), fondo_inicial_centavos, retiros_centavos, gastos_centavos, ventas_efectivo/credito/debito/qr/transferencia_centavos, tolerancia_centavos`; `cierres_editar(el_id uuid, datos jsonb) returns void`.

- [ ] Tests de base (fallan antes de la migración): la función suma solo pagos de ventas no anuladas, no canceladas, del local y del día (Argentina); Caja ve solo los suyos y el admin todos; invitado y encargado rechazados (`42501`); `cierres_editar` cambia lo declarado, reemplaza retiros y gastos (los viejos quedan anulados con motivo) y deja auditoría con valor anterior y nuevo; editar un cierre anulado da `PC303`; Caja ajena rechazada; dos ediciones seguidas no duplican gastos activos.
- [ ] Migración: sacar `estado`, `esperado_*`, `revisado*`, `comentario_revision` y el tipo `estado_de_cierre`; sacar la rama de revisar de `reglas_de_cierres` y esas columnas del `grant update`; crear las dos funciones (`security definer`, `search_path = ''`, `revoke ... from public, anon`, `grant execute ... to authenticated`).
- [ ] Aplicar a la base de pruebas (`supabase-pruebas`), regenerar tipos, correr `npx vitest run --project base tests/*/cierres.base.test.ts` hasta verde. Verificar la reversa.
- [ ] Commit.

### Task 3: Servidor

**Files:** Modify `src/lib/caja/{consultas,escritura,esquemas}.ts`, `src/app/admin/(panel)/caja/acciones.ts`, `src/lib/auditoria/diccionario.ts`; Test `src/lib/caja/esquemas.test.ts`, `tests/servicios/cierres.base.test.ts`.

**Produces:** `editarCierre(cliente, id, datos: DatosDeCierre): Promise<Resultado>`; `editarCierreDesdeElPanel(datos: unknown)` (rol `caja`); `esquemaEdicion = esquemaCierre.extend({ id: z.uuid() })`; `listarCierres` y `misCierres` y `cierrePorId` leen de `cierres_con_resultado` y devuelven `FilaDeCierre.estado` calculado; `diasPendientes(cliente, desde, hasta): Promise<string[]>` (sin cierre no anulado, desde el primer cierre hasta ayer). Se sacan `revisarCierre`, `esquemaRevision`, `revisarCierreDesdeElPanel` y los textos de revisión.

- [ ] Tests primero (fallan): servicio edita un cierre propio y rechaza el ajeno; `listarCierres` filtra por `estado` `cierra`/`con_diferencia`; `diasPendientes` no cuenta hoy ni días con cierre anulado; `esquemaEdicion` exige `id`.
- [ ] Implementar, verde, `npm run tipos`. Commit.

### Task 4: Pantallas

**Files:** Modify `src/app/admin/(panel)/caja/{page,FormularioDeCierre,ListaDeCierres}.tsx`, `caja/cierres/[id]/{page,DetalleDelCierre}.tsx`, `caja/control/{page,FiltrosDelControl}.tsx`, `caja/mis-cierres/page.tsx`; Delete `caja/cierres/[id]/BotonDeRevisar.tsx`; Test `e2e/caja.spec.ts`, `e2e/caja-control.spec.ts`.

- [ ] e2e primero (fallan): cargar un cierre del día que cierra contra ventas sembradas (3 en efectivo de $25.000 y 1 QR de $15.000; declarar $75.000 y $15.000 → «Cierra»); declarar $70.000 → «Con diferencia» con «Faltan $5.000,00» en efectivo; Caja edita el suyo desde el detalle y el estado cambia; el admin no ve «Marcar como revisado»; el filtro «Pendiente» lista días sin cierre; «Ver anulados».
- [ ] Implementar: detalle con Editar (quien puede) y Anular (admin); el formulario precargado para editar; aviso «N días pendientes»; filtro Pendiente; anulados detrás de «Ver anulados»; insignias de dos estados.
- [ ] e2e en computadora y celular, verde. Commit.

### Task 5: Inicio, Reportes, ayudas y documentos

**Files:** Modify `src/lib/inicio/consultas.ts` (la cuenta de «Con diferencia» sale de `cierres_con_resultado`), `src/lib/reportes/consultas.ts`, `src/lib/panel/ayudasDelNegocio.ts`, `docs/modulos/{05-ventas,06-cierres-de-caja,09-inicio}.md`; Test `tests/servicios/inicio.base.test.ts`, `tests/servicios/reportes.base.test.ts`, `src/lib/inicio/ayer.test.ts`.

- [ ] Ajustar tests a la nueva forma (fallan), implementar, verde. Commit.

### Task 6: Cierre del pedido

- [ ] `npm run verificar`, `npm run e2e` (computadora y celular) y capturas de Caja contra `referencias/`.
- [ ] Anotar en `PEDIDOS.md` cómo se verificó y qué queda (OK de Santiago para la base real). Mover el 66 a Completados solo si todo pasó.
