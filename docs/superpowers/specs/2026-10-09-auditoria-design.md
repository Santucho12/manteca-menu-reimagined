# Auditoría: diseño

Pedido 29. Parte de `docs/modulos/07-auditoria.md` y de lo decidido con Santiago el
2026-10-09 en la revisión de lógica. El mecanismo ya existe (tabla `auditoria`, trigger
`auditar()` en 14 tablas, lectura solo para el admin de su local): este pedido suma la
pantalla y lo que la hace legible.

Decisiones:

1. Lo guardado se traduce: la tabla a su módulo y su dato ("Gastos · Gasto"), cada columna a
   su nombre ("Monto"), la plata a pesos, sí/no, las fechas a día y hora de Argentina, y en
   vez del código, el nombre de la categoría, el proveedor o la persona. Las columnas
   internas (`id`, `local_id`, fechas técnicas, `estado` calculado) no se muestran.
2. Cada registro enlaza al dato, o a la pantalla que lo contiene (el retiro a su cierre, el
   precio a su producto, la tolerancia al control de cierres); si no hay ninguna, no enlaza.
3. Se muestran y se filtran "Reseteo de contraseña" y "Cambio de contraseña".
4. Al entrar, los últimos 7 días (hoy y los 6 anteriores, en Argentina).
5. Las fichas de gasto, proveedor y producto muestran "Cargado por {persona} el {día}",
   leído del registro de alta. El cierre ya lo muestra.
6. "Auditoría" va en la barra del admin antes de "Mi cuenta".

## Base

No cambia. Se lee `auditoria` con la sesión del admin; RLS ya deja solo su local.

## Lógica (`src/lib/auditoria/`)

- `textos.ts` (puro): `datoDe(tabla)` → módulo y dato; `nombreDeCampo(tabla, columna)`;
  `nombreDeAccion(accion)`; `cambiosDe(registro, nombres)` → lista de
  `{ campo, antes, despues }` ya en texto, sin columnas internas; `enlaceDe(registro)`;
  `MODULOS` (módulo → tablas) para el filtro.
- `pantalla.ts` (puro): `filtrosDeAuditoria(parametros, hoy)` y `enlaceDeAuditoria`. Persona
  puede ser un id o `sistema`.
- `consultas.ts` (base): `listarRegistros`, `registroPorId`, `nombresDe(registros)` (resuelve
  categorías de gasto y del menú, proveedores, productos y personas), `personasDeAuditoria`,
  `altaDe(tabla, id)`.

## Pantallas

| Ruta | Qué |
|---|---|
| `/admin/auditoria` | Filtros por fechas, persona (con "El sistema"), módulo y acción; lista paginada de a 25: cuándo, quién, qué y la acción, con los campos que cambiaron |
| `/admin/auditoria/[id]` | El registro completo: cada campo con su valor anterior y el nuevo; el motivo si es una anulación; el enlace al dato |

## Restricciones globales

- TDD estricto: test, verlo fallar, commit, código. Sin mocks: contra la base de pruebas.
- 20 líneas por función en `.ts`, 80 por componente, 300 por archivo. Lógica fuera de `.tsx`.
- Español; pantallas con voseo. Plata en centavos enteros, se muestra como `$1.234,50`.
- Solo el admin ve la auditoría; Caja, Encargado e invitado reciben rechazo.
- Solo Santiago autoriza la base real, el merge y publicar.
- Hecho es `npm run verificar` y `npm run e2e` en verde.
