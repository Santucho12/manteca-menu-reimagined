# Materia prima

Módulo 3 de `PROPUESTA.md`, sin stock. Santiago lo suma junto con Costos y Compras el
2026-11-19 (pedido 94), como excepción a "lo de la segunda fase no se construye por
adelantado". Lo que sigue lo definió Claude con su OK ("lo que creas mejor").

Este archivo tiene dos partes. La definición funcional dice qué hace el módulo. La parte
técnica está en `docs/superpowers/specs/2026-11-19-costos-y-compras-design.md`.

## Para qué

Tener la lista de insumos con lo que cuestan hoy, para que Costos calcule cada producto y
Compras actualice los precios al recibir la mercadería.

## Quién lo usa

Solo Admin. Caja no entra, y nada de esto llega al menú público.

## Datos

### Insumo

| Dato | Detalle |
|---|---|
| Nombre | Obligatorio, por ejemplo "Harina 000" |
| Unidad de uso | Gramos, mililitros o unidades: en qué se mide en una receta |
| Observaciones | Texto libre, opcional |

### Cómo se compra (una por proveedor y presentación)

Un mismo insumo se compra de distintas formas y a distintos proveedores: la bolsa de 25 kg a
uno y la de 50 kg a otro, o los huevos por maple o por cajón.

| Dato | Detalle |
|---|---|
| Proveedor | Opcional: uno de Proveedores |
| Cómo se compra | Texto, por ejemplo "Bolsa de 25 kg" |
| Contenido | Cuánto trae, en la unidad de uso del insumo: 25.000 g |
| Precio de referencia | Lo que sale, en pesos, cargado a mano. Sirve hasta que haya una compra |

Los productos de reventa (una botella de agua) son un insumo más, en unidades: su receta
lleva una unidad de ese insumo.

## Lo que cuesta un insumo hoy

1. Si tiene alguna compra recibida y no anulada, el precio por unidad de uso de **la más
   reciente**, de cualquier proveedor: si la harina se compró por última vez a $32.000 la
   bolsa de 25 kg, cuesta $1,28 el gramo.
2. Si no tiene compras, el precio de referencia de la forma de compra que se cambió por
   última vez.
3. Si no tiene ninguna de las dos, no tiene costo, y las recetas que lo usan lo dicen.

No se guarda: se calcula cada vez. Si se anula la última compra, vuelve solo el precio de la
anterior.

## Pantallas

### Materia prima (`/admin/materia-prima`)

- Lista con nombre, unidad de uso, costo hoy (por kilo, litro o unidad, que se lee mejor que
  por gramo), de dónde sale ("Compra del 12/11" o "Precio de referencia") y en cuántas
  recetas está.
- Buscar por nombre; los desactivados, solo si se pide.
- Alta, edición, desactivación y reactivación.

### Ficha de un insumo

- Sus formas de compra, con el proveedor, el precio de referencia y el último precio pagado
  a cada uno: así se compara a quién conviene comprarle.
- Las últimas compras que lo trajeron.
- Los productos cuya receta lo usa.

## Reglas

1. Nada se borra: un insumo y una forma de compra se desactivan.
2. Un insumo desactivado no se elige en una receta ni en una compra nueva. Las recetas que
   ya lo tenían lo siguen usando y lo muestran marcado.
3. La unidad de uso no se cambia si el insumo ya está en una receta o en una compra:
   cambiaría el sentido de todas sus cantidades.
4. Al crear un insumo con un nombre que ya existe, el sistema avisa y deja seguir.
5. Cada alta, cambio y desactivación queda en la auditoría, con el valor anterior.

## Fuera de alcance

Stock, stock mínimo y movimientos; preparaciones (una masa o una crema que se usa dentro de
otras recetas).

## Parte técnica (pedido 94)

- Base: `supabase/migrations/20261119120000_materia_prima.sql`. Tablas `insumos` y
  `formas_de_compra`; solo el admin activo de su local las ve y las cambia, nadie borra. El
  trigger `formas_de_compra_reglas` rechaza un insumo o un proveedor de otro local (`PI301`) y
  una forma nueva de un insumo desactivado (`PI302`).
- `costo_de_insumos()` (`security invoker`) da por insumo el costo en centavos por unidad de
  uso, con seis decimales, y su origen. Por ahora mira solo la referencia de la forma activa
  cambiada por última vez; Compras (pedido 96) le suma la última compra.
- La regla 3 (la unidad de uso no cambia si el insumo está en una receta o una compra) se
  agrega con los pedidos 95 y 96: hoy no hay recetas ni compras.
- Servidor: `src/lib/materia-prima/` (`consultas.ts`, `escritura.ts`, `esquemas.ts`,
  `costo.ts`, `pantalla.ts`). Pantallas en `src/app/admin/(panel)/materia-prima/`: lista,
  `nuevo`, `[id]` (ficha), `[id]/editar`, `[id]/formas/nueva` y `[id]/formas/[forma]`.
- La ficha todavía no muestra el último precio pagado, las últimas compras ni las recetas que
  lo usan: llegan con los pedidos 95 y 96.
