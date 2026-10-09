# Gastos

Fecha: 2026-10-08. Pedido 27 de `PEDIDOS.md`. Paso 5 del orden de construcción. Rama
`feat/gastos`.

Qué hace el módulo está en `docs/modulos/04-gastos.md`. Decisiones de Santiago del
2026-10-08, después de `revision-logica`:

1. Los recurrentes los genera un proceso diario de Supabase (pg_cron), sin depender de
   Vercel. Al abrir Gastos también se genera lo atrasado.
2. Un recurrente tiene la fecha del primer vencimiento y repite cada 1, 2 o 12 meses ese mismo
   día; si el día no existe en el mes, va el último día.
3. Cada categoría tiene la casilla "pide proveedor"; Mercadería la trae marcada.
4. Los gastos admiten centavos; se escriben con coma.
5. Entra lo que quedó de Proveedores: lo pagado en el mes en la lista, los gastos y los totales
   del mes y del año en la ficha, y el aviso de recurrentes activos al desactivar.

## Base

Tres tablas, todas con `local_id` por defecto `local_del_usuario()`, fechas, `marcar_actualizacion`
y `auditar`. El admin activo lee, carga y cambia las de su local por RLS, con permisos por
columna; nadie borra.

| Tabla | Columnas | Notas |
|---|---|---|
| `categorias_de_gasto` | `nombre`, `pide_proveedor`, `de_sistema`, `activo` | Nombre único por local sin importar mayúsculas. La migración carga las 7 de la definición y "Sin clasificar" (`de_sistema`) en cada local |
| `gastos_recurrentes` | `categoria_id`, `monto_centavos`, `descripcion`, `proveedor_id`, `medio_de_pago`, `frecuencia` (`mensual`, `bimestral`, `anual`), `primer_vencimiento`, `activo` | |
| `gastos` | `fecha`, `categoria_id`, `monto_centavos`, `descripcion`, `proveedor_id`, `medio_de_pago` (`efectivo_caja`, `transferencia`, `tarjeta`, `otro`), `comprobante`, `recurrente_id`, `vencimiento`, `anulado`, `motivo_anulacion`, `anulado_por`, `fecha_anulacion`, `creado_por` | Único `(recurrente_id, vencimiento)`: un recurrente no se genera dos veces para el mismo período, aunque se haya anulado |

Reglas en un trigger antes de escribir un gasto o un recurrente (códigos `PG2xx`):

- La categoría es del local, está activa y no es de sistema (`PG201`). Al editar, se puede
  dejar la que ya tenía.
- Si la categoría pide proveedor, el proveedor es obligatorio (`PG202`).
- El proveedor es del local y, si cambia o es nuevo, está activo (`PG203`).
- Un gasto anulado no se edita ni se desanula (`PG204`); anular pide motivo (`PG205`) y la
  base anota quién y cuándo.
- Una categoría de sistema no se renombra ni se desactiva (`PG206`).

`generar_gastos_recurrentes(hasta date)`: para cada recurrente activo, crea los gastos de cada
vencimiento hasta esa fecha que todavía no existan (`primer_vencimiento + k × meses`, que
Postgres ajusta al último día del mes). La ejecutan pg_cron (todos los días a las 3, con la
fecha de Argentina) y el servidor al abrir Gastos, con la clave secreta, después de comprobar
que pide un admin: es un proceso sin usuario y los gastos quedan a nombre del sistema.

## Servidor

`src/lib/gastos/`: `plata.ts` (pesos con coma a centavos), `vencimientos.ts` (próximo
vencimiento, puro), `esquemas.ts`, `pantalla.ts` (filtros de la URL), `consultas.ts` (lista
paginada con total, sin clasificar, gastos de un proveedor y totales, pagado en el mes por
proveedor, recurrentes, categorías), `escritura.ts` (gastos, anular, recurrentes, categorías) y
`generacion.ts`.

## Pantallas

| Ruta | Qué hay |
|---|---|
| `/admin/gastos` | Filtros por fechas (por defecto el mes en curso en Argentina), categoría y proveedor; total de lo filtrado sin anulados; lista paginada con los anulados marcados; arriba, los sin clasificar si hay; "Cargar gasto", "Recurrentes" y "Categorías" |
| `/admin/gastos/nuevo` y `/admin/gastos/[id]` | Formulario: fecha (hoy), categoría, monto, descripción, proveedor, medio de pago y comprobante. En la edición, "Anular" con motivo |
| `/admin/gastos/recurrentes` | Plantillas con frecuencia, monto y próximo vencimiento; alta, edición, desactivar y reactivar |
| `/admin/gastos/categorias` | Sumar, renombrar, marcar "pide proveedor", desactivar y reactivar |
| `/admin/proveedores` y su ficha | Lo pagado en el mes; en la ficha, los gastos y los totales del mes y del año; aviso si tiene recurrentes activos |

La barra suma "Gastos" después de "Proveedores".

## Pruebas

RLS de las tres tablas; reglas del trigger; generación (atrasados, último día del mes, no
duplica, anulado no vuelve, desactivado no genera, edición no toca lo generado); puros
(plata, vencimientos, esquemas, filtros); servicios; Playwright de cada pantalla, en los dos
tamaños.

## Restricciones globales

Las de `CLAUDE.md`: Santiago decide base real, merge y publicación; TDD; sin mocks; 20/80/300;
español y voseo; sesión y RLS; nada se borra, se anula con motivo; auditoría; plata en
centavos enteros (`bigint`, `_centavos`), nunca punto flotante; fechas: el día es el de
Argentina; la clave secreta solo para el proceso automático; migraciones con
`supabase-pruebas`.
