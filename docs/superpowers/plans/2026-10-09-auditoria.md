# Auditoría: plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans.

**Spec:** `docs/superpowers/specs/2026-10-09-auditoria-design.md`. Sin migraciones: la
tabla y su RLS ya existen.

## Global Constraints

Las del spec. TDD estricto en cada tarea.

## Review Focus

1. Un registro de una tabla o columna que no está en el diccionario: se muestra igual, con
   el nombre técnico, sin romper la pantalla.
2. Un cambio de un gasto de caja hecho por Caja, y uno del sistema (usuario nulo).
3. Un código de categoría o proveedor que ya no existe o es de otro local: no se rompe.
4. Un retiro, un precio o una presentación: enlazan a la pantalla que los contiene.
5. Un id inválido en la URL del detalle: 404.

### Task 1: Textos y filtros (puros)
- `src/lib/auditoria/textos.test.ts` y `pantalla.test.ts`.

### Task 2: Consultas
- `tests/servicios/auditoria.base.test.ts`: lista con filtros (persona, sistema, módulo,
  acción, fechas), detalle, nombres resueltos, alta de un dato, Caja no ve nada.

### Task 3: Barra
- `estados.test.ts`, `marco.test.ts`, `e2e/acceso.spec.ts`.

### Task 4: Pantallas y fichas
- `e2e/auditoria.spec.ts`: el cambio de un gasto se ve con nombres y pesos, filtrar por
  módulo y acción, el detalle y su enlace, "Cargado por" en las fichas, Caja afuera,
  capturas.

### Task 5: Cierre
- `docs/modulos/07-auditoria.md`, `pre-finish`, revisión independiente de la rama,
  `PEDIDOS.md`, PR.
