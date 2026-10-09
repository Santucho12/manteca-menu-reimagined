# Cierres de caja: plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans.

**Spec:** `docs/superpowers/specs/2026-10-09-cierres-de-caja-design.md`. Santiago pidió ir
rápido: el plan lista tests e interfaces; el código sigue los patrones de Gastos.

## Global Constraints

Las del spec. TDD estricto en cada tarea.

## Review Focus

1. Dos cierres del mismo día, también con doble toque y con uno anulado en el medio.
2. Un cierre de un día futuro, o cargado pasada la medianoche.
3. Caja que intenta ver, anular o revisar un cierre ajeno, o escribir en Gastos.
4. Anular un cierre: sus gastos se anulan; un gasto de cierre no se anula ni se corrige suelto.
5. Montos con coma y centavos, cero en todos los medios, retiros y gastos vacíos.

### Task 1: Tablas, funciones y RLS
- Tests `tests/rls/cierres.base.test.ts` y `tests/reglas/cierres.base.test.ts`; siembra
  `tests/cierres-de-prueba.ts`.
- Migración `20261009120000_cierres_de_caja.sql` y reversa; `schema.sql`; tipos.

### Task 2: Lógica pura
- `src/lib/caja/resultado.test.ts`, `dias.test.ts`, `esquemas.test.ts`, `pantalla.test.ts`.

### Task 3: Servicios
- `tests/servicios/cierres.base.test.ts`.

### Task 4: Acceso y barra
- `estados.test.ts`, `marco.test.ts`, `e2e/acceso.spec.ts`.

### Task 5: Pantallas
- `e2e/caja.spec.ts` (Caja carga y ve los suyos, a ciegas, sin ajenos) y
  `e2e/caja-control.spec.ts` (control, filtros, días sin cierre, revisar, anular, tolerancia,
  el gasto en Gastos).

### Task 6: Cierre
- `docs/modulos/06-cierres-de-caja.md`, `04-gastos.md`, `pre-finish`, `PEDIDOS.md`, PR.
