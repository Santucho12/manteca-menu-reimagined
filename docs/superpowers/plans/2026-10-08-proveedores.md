# Proveedores: plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Lista, ficha, alta, edición, desactivar y reactivar proveedores, con WhatsApp.

**Architecture:** Una tabla con RLS por local; escrituras directas con la sesión del admin (una fila por acción); lógica pura en `src/lib/proveedores/`; pantallas en `src/app/admin/(panel)/proveedores/`.

**Spec:** `docs/superpowers/specs/2026-10-08-proveedores-design.md`.

Santiago pidió ir lo más rápido posible: este plan lista los tests y las interfaces de cada tarea y el código se escribe en la tarea, siguiendo los mismos patrones del módulo de menú (`src/lib/menu/`, `tests/menu-de-prueba.ts`, `e2e/menu-panel.spec.ts`).

## Global Constraints

Las de `CLAUDE.md` copiadas en el spec. TDD estricto: test, verlo fallar, commit; código, verlo pasar, commit.

## Review Focus

1. Un teléfono con espacios, guiones, `+`, `0` adelante o el 15: se normaliza o se explica (Task 2).
2. Dos proveedores con el mismo nombre en distinta mayúscula: avisa (Task 3).
3. Un admin que intenta cargar un proveedor en otro local mandando `local_id` (Task 1).
4. Una búsqueda con `%`, `_` o comas (Task 3).
5. Desactivar y volver a ver la lista: no aparece salvo en "Ver desactivados" (Task 4).

### Task 1: Tabla y RLS
- Test `tests/rls/proveedores.base.test.ts`: el admin ve los de su local y no los del local B; inserta sin `local_id` y queda en su local; mandar `local_id` da `42501`; cambia nombre y `activo`; nadie borra (`42501`); invitado, caja, encargado, desactivado y admin del otro local ven `[]` y sus cambios no aplican; el visitante recibe `42501`.
- Siembra `tests/proveedores-de-prueba.ts`: `sembrarProveedor({ otroLocal?, activo?, nombre?, telefono? })`, `borrarProveedores(ids)`.
- Migración `supabase/migrations/20261008130000_proveedores.sql` y su reversa; `schema.sql`; tipos regenerados.

### Task 2: Teléfono y esquema (puros)
- `src/lib/proveedores/telefono.test.ts`: `normalizarTelefono` con `'11 2345-6789'`, `'011 2345 6789'`, `'+54 9 11 2345 6789'`, `'54 11 2345 6789'`, `'5491123456789'` → `'5491123456789'`; `''` → `null`; `'123'`, `'11 15 2345 6789'` → `undefined`. `urlDeWhatsApp('5491123456789')` → `'https://wa.me/5491123456789'`. `telefonoParaMostrar` → `'+54 9 11 2345-6789'`.
- `src/lib/proveedores/esquemas.test.ts`: nombre obligatorio; teléfono inválido con el mensaje "Escribí el número con la característica y sin el 15, por ejemplo 11 2345 6789."; `proveedorParaLaBase` recorta y pasa vacíos a `null`.

### Task 3: Servicios
- `tests/servicios/proveedores.base.test.ts`: crear devuelve "confirmar" con un nombre repetido en otra mayúscula y crea con `confirmar`; buscar por parte del nombre; `_` no es comodín; paginado de 20; desactivados solo con el filtro; editar y desactivar quedan en la auditoría a nombre del admin; caja recibe el mensaje de permiso.

### Task 4: Pantallas y navegación
- `src/lib/acceso/estados.test.ts`, `marco.test.ts` y `e2e/acceso.spec.ts`: el admin ve Inicio, Menú, Proveedores, Usuarios y Mi cuenta.
- `e2e/proveedores.spec.ts`: alta y ficha; aviso de repetido y "Cargar igual"; búsqueda; el enlace de WhatsApp apunta a `https://wa.me/549…` y no aparece sin teléfono; teléfono inválido explicado; edición; desactivar (sale de la lista) y reactivar desde "Ver desactivados"; caja e invitado van a `/admin`; capturas de la lista y la ficha.

### Task 5: Cierre
- `docs/modulos/03-proveedores.md`: parte técnica y nota de lo que entra con Gastos.
- `pre-finish` completo, revisión de la rama, `PEDIDOS.md`, PR.
