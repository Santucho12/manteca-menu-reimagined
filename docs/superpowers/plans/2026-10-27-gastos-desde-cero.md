# Gastos desde cero: plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Pasos con `- [ ]`.

**Goal:** Gastos en una sola pantalla (Pagados por mes, Próximos pagos, Para clasificar), un solo
formulario de carga con "¿Se repite?", gastos fijos, categorías en una ventana y calendario propio.

**Architecture:** En la base y en `src/lib` se sigue diciendo "recurrente" (la tabla es
`gastos_recurrentes`); en rutas, pantallas y textos se dice "fijo". La lógica pura va en
`src/lib/gastos/*.ts` con tests `puros`; consultas y escrituras con la sesión del admin y tests
`base`; cada pantalla con su Playwright antes.

**Tech Stack:** Next.js 16, React 19, Supabase, Zod, React Hook Form, Tailwind 4, Radix
(`radix-ui`), `react-day-picker` 10.0.2, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-27-gastos-desde-cero-design.md`

## Global Constraints

- Sin mocks: `*.base.test.ts` contra la base de pruebas; `*.test.ts` puros. Hoy entra como parámetro.
- TDD: test, verlo fallar, código. Función `.ts` ≤ 20 líneas, componente ≤ 80, archivo ≤ 300.
- Español rioplatense con voseo. Plata en centavos enteros, `$1.234,50`.
- Sesión del usuario y RLS; la clave secreta solo para generar los fijos.
- Solo Admin; caja e invitado rechazados (Playwright lo prueba en cada ruta nueva).
- Estética: skill `estetica-panel`; componentes a mano.
- Migración: pruebas sí; real, solo con OK de Santiago.
- Cada tarea: sus tests nuevos (Playwright solo `--project=computadora`) y `npm run tipos`.

## Review Focus

1. Un fijo editado con la misma fecha no cambia su serie (un 31 sigue en 31).
2. Cambiar de categoría a una que no pide proveedor guarda sin proveedor.
3. Mes inválido o futuro en la URL vuelve al de hoy.
4. Un gasto de caja: fecha, monto y medio siguen sin poder cambiarse.
5. Doble toque al cargar un fijo no crea dos.

---

### Task 1: Base

**Files:** Create `supabase/migrations/20261027210000_gastos_fijos.sql`,
`supabase/reversas/20261027210000_gastos_fijos.sql`. Modify `supabase/schema.sql`,
`src/lib/supabase/tipos.ts`, `src/lib/gastos/escritura.ts` (mensaje `PG208`),
`tests/reglas/gastos-recurrentes.base.test.ts`, `tests/rls/gastos.base.test.ts`.

- [ ] Tests (fallan): cambiar `primer_vencimiento` a hoy+3 en un mensual que ya generó 4 meses no
  vuelve a cargar esos meses (`generar(hoy+3)` deja los 4 viejos y uno nuevo); fecha nueva = hoy →
  `PG208`; cambiar solo `frecuencia` con la fecha vieja → `PG208`; reactivar no pisa un
  `generar_desde` futuro; la misma `clave` dos veces → `23505`; `gastos_total` con
  `el_tipo: 'fijos'` suma solo lo generado. RLS: el admin inserta un recurrente con `clave`, caja no.
- [ ] Migración: `clave uuid unique` + `grant insert (clave)`; `reglas_de_recurrentes()` con
  `PG208` y `generar_desde := primer_vencimiento` al cambiar fecha o frecuencia, y
  `greatest(generar_desde, hoy)` al reactivar; `gastos_total(..., el_tipo text default null)`
  (`'fijos'` = `recurrente_id` no nulo, `'caja'` = `cierre_id` no nulo), borrando la firma vieja.
- [ ] Aplicar en `supabase-pruebas`, probar reversa y reaplicar con `execute_sql`, regenerar tipos.
- [ ] Tests en verde, `npm run tipos`, commit.

### Task 2: Lógica pura

**Files:** Create `src/lib/gastos/meses.ts`, `filas.ts`, `fijos.ts`, `proveedor.ts` y sus
`*.test.ts`. Modify `src/lib/gastos/pantalla.ts` (+test).

**Produces:**
- `meses.ts`: `mesDeLaUrl(texto?: string, hoy): string` ('AAAA-MM'; inválido o futuro → el de hoy),
  `mesAnterior(mes)`, `mesSiguiente(mes)`, `rangoDelMes(mes): {desde, hasta}`,
  `nombreDelMes(mes)` ('octubre 2026'), `esElMesDeHoy(mes, hoy)`.
- `pantalla.ts`: `TipoDeGasto = 'fijos' | 'caja'`; `FiltrosDeGastos = { mes, desde, hasta, tipo:
  TipoDeGasto | null, categoriaId: string | null, pagina }`; `filtrosDeGastos(parametros, hoy)`;
  `enlaceDeGastos(filtros, hoy)` (sin `mes` si es el de hoy, sin `pagina` si es 1).
- `filas.ts`: `nombreDelGasto({descripcion, categoria})`, `detalleDelGasto({descripcion,
  categoria, proveedor, medio_de_pago})` ("Mercadería · Granja El Nido · Transferencia"),
  `marcasDelGasto({frecuencia, cierre_id, anulado}): string[]` ("Fijo · Todos los meses",
  "De caja", "Anulado"), `fechaCorta(fecha): {dia, mes}` ('5', 'nov').
- `fijos.ts`: `proximoPago({primer_vencimiento, frecuencia, generar_desde}, hoy)` (primero > hoy y
  ≥ `generar_desde`), `cuandoVence(fecha, hoy)` ('Mañana', 'En N días' hasta 30, si no `null`),
  `proximosPagos(recurrentes, hoy): ProximoPago[]` (activos, por fecha y nombre),
  `faltaPagarEsteMes(proximos, hoy): number`, `resumenDeRepeticion(fecha, frecuencia, hoy)` (las
  frases exactas del spec), `cambiaLaSerie(actual, {proximoPago, frecuencia}, hoy): boolean`.
- `proveedor.ts`: `muestraProveedor(categorias, categoriaId, inicial: {categoriaId, proveedorId})`.

- [ ] Tests de cada función (casos del spec: cruce de año, 31, generar_desde, fecha pasada, 29–31).
- [ ] Implementar, verde, `npm run tipos`, commit.

### Task 3: Esquemas y servicios

**Files:** Modify `src/lib/gastos/esquemas.ts`, `consultas.ts`, `escritura.ts` (+ tests en
`esquemas.test.ts` y `tests/servicios/gastos.base.test.ts`).

**Produces:**
- `REPETICIONES = ['no', 'mensual', 'bimestral', 'anual']`; `esquemaCarga(hoy)` (gasto + `seRepite`;
  sin repetición, fecha ≤ hoy con "Un gasto que todavía no pagaste no se carga. Si se repite, elegí
  cada cuánto."); `esquemaDeGasto(hoy)` (edición, fecha ≤ hoy); `esquemaFijo(hoy)` (campos +
  `frecuencia` + `proximoPago` > hoy, "El próximo pago tiene que ser después de hoy.");
  `esquemaClasificacion` (`id`, `categoriaId`, `proveedorId`).
- `listarGastos(cliente, consulta: {desde, hasta, tipo?, categoriaId?, proveedorId?, pagina})` con
  `frecuencia` del fijo en cada fila; `paraClasificar(cliente)` (lista, más viejo primero);
  `listarRecurrentes` con `medio_de_pago` y `generar_desde`; `pagosDelRecurrente(cliente, id)` (6).
- `cargarGasto(cliente, datos)` → `{id, fijo}`; `crearRecurrente` con `clave` idempotente;
  `editarRecurrente(cliente, id, datos, hoy)` (fecha y frecuencia solo si `cambiaLaSerie`);
  `clasificarGasto(cliente, datos)`.

- [ ] Tests (fallan), código, verde, `npm run tipos`, commit.

### Task 4: Formulario único (Cargar gasto y Gasto)

**Files:** Create `src/components/formularios/CampoDeFecha.tsx`, `calendario.ts`,
`src/components/formularios/OpcionesQueSeTocan.tsx`, `e2e/gastos-carga.spec.ts`. Modify
`gastos/FormularioDeGasto.tsx`, `CamposDelGasto.tsx`, `nuevo/page.tsx`, `[id]/page.tsx`,
`acciones.ts`; `package.json` (`react-day-picker` 10.0.2 exacta).

- [ ] Playwright (falla): carga con "Ayer"; "¿Se repite?" muestra el resumen y esconde el
  comprobante; el proveedor aparece con una categoría que lo pide y desaparece con otra; un día
  futuro está deshabilitado sin repetición; un fijo de hoy aparece en Pagados con "Fijo"; el
  gasto de un fijo muestra la franja con su enlace; caja e invitado no entran.
- [ ] Código, verde en computadora, `npm run tipos`, commit.

### Task 5: Pantalla Gastos

**Files:** Create `src/components/panel/PanelDeLista.tsx`, `gastos/ProximosPagos.tsx`,
`Pagados.tsx`, `FiltrosDePagados.tsx`, `FilaDeGasto.tsx`, `BaldosaDeFecha.tsx`,
`ParaClasificar.tsx`, `FilaParaClasificar.tsx`. Modify `gastos/page.tsx`, `acciones.ts`,
`proveedores/[id]/PagosDelProveedor.tsx`, `e2e/gastos.spec.ts`, `e2e/caja-control.spec.ts`,
`e2e/inicio-admin.spec.ts`. Delete `gastos/ListaDeGastos.tsx`.

- [ ] Playwright (falla): flechas del mes (sin "Mes siguiente" en el de hoy), pastillas Fijos y De
  caja, categoría que se aplica sola, Próximos ordenado con "Falta pagar este mes", Para
  clasificar con "Listo" (y el proveedor si la categoría lo pide), capturas.
- [ ] Código, verde, `npm run tipos`, commit.

### Task 6: Ventana de categorías

**Files:** Create `gastos/VentanaDeCategorias.tsx`, `FilaDeCategoria.tsx`; move
`categorias/FormularioDeCategoria.tsx` a `gastos/`. Delete `gastos/categorias/`. Rewrite
`e2e/gastos-categorias.spec.ts`.

- [ ] Playwright (falla): sumar con "Pide proveedor", nombre repetido, renombrar, desactivar y
  reactivar, "Sin clasificar" sin acciones. Código, verde, tipos, commit.

### Task 7: Gasto fijo

**Files:** Create `gastos/fijos/[id]/page.tsx`, `fijos/FormularioDeFijo.tsx`,
`fijos/PagosDelFijo.tsx`, `e2e/gastos-fijos.spec.ts`. Modify `BotonDeEstado.tsx` (textos).
Delete `gastos/recurrentes/`, `e2e/gastos-recurrentes.spec.ts`.

- [ ] Playwright (falla): editar el monto, cambiar el próximo pago con el calendario y verlo en
  Próximos, pausar y reactivar, "Ya se cargaron". Código, verde, tipos, commit.

### Task 8: Afuera de Gastos

**Files:** `src/lib/inicio/avisos.ts` (+test), `src/lib/auditoria/diccionario.ts`, `textos.ts`,
`consultas.ts`, `proveedores/[id]/page.tsx`, `e2e/proveedores.spec.ts`,
`src/lib/panel/ayudasDeLaBase.ts` (+ `ayudas.test.ts`: claves `gastos` y `fijos`),
`e2e/pantallas.ts`, `docs/modulos/04-gastos.md`, `09-inicio.md`.

- [ ] Tests (fallan), código, verde, tipos, commit.

### Task 9: Cierre

- [ ] `npm run verificar` por partes y `npm run e2e` por proyecto, en primer plano.
- [ ] Capturas revisadas, `PEDIDOS.md`, `pre-finish`.
