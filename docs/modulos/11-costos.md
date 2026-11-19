# Costos

Módulo 6 de `PROPUESTA.md`, con la composición del módulo 4 (la receta de cada producto).
Reemplaza el diseño del pedido 87. Santiago lo suma el 2026-11-19 (pedido 95), como
excepción a "lo de la segunda fase no se construye por adelantado"; lo que sigue lo definió
Claude con su OK ("lo que creas mejor"), partiendo de lo decidido el 2026-11-05 y 06.

Este archivo tiene dos partes. La definición funcional dice qué hace el módulo. La parte
técnica está en `docs/superpowers/specs/2026-11-19-costos-y-compras-design.md`.

## Para qué

Saber cuánto cuesta hacer cada producto, cuánto deja con el precio del menú y cuáles quedaron
debajo de lo que el dueño quiere ganar, para subir el precio a tiempo.

## Quién lo usa

Solo Admin. Caja no entra, y los costos nunca llegan al menú público.

## La receta de un producto

- **Receta del producto:** los insumos que lleva, con su cantidad en la unidad de uso, y
  **cuánto rinde** (una masa de 40 medialunas). Por defecto rinde 1.
- **Desperdicio:** un porcentaje que se suma al costo de los insumos, de 0 a 50 %.
- **Receta propia de una presentación**, opcional: para lo que no es un múltiplo de la
  unidad. Un café Grande lleva más café y más leche que el Mediano, pero no el doble.

Costo de una unidad = suma de (cantidad × lo que cuesta hoy el insumo), más el desperdicio,
dividido lo que rinde.

## Presentaciones

Las presentaciones son las del Menú y son de la categoría. Para Costos, cada una lleva:

- **Unidades:** cuántas unidades del producto lleva (unidad 1, media docena 6, docena 12).
- **Agregado:** un monto fijo que se suma (la caja de la docena). Por defecto, $0.

Costo de una presentación:

- con receta propia: el costo de esa receta, más el agregado;
- si no: costo de una unidad × unidades, más el agregado.

Se redondea al centavo una sola vez, al final.

## Márgenes

Dos porcentajes del local, que cambia el admin:

- **Margen objetivo** (por defecto 65 %): da el precio sugerido.
- **Margen mínimo** (por defecto 50 %): debajo de este, el producto se marca y avisa en Inicio.

## Cálculos

Para cada producto activo y cada presentación con precio en el menú:

- **Precio:** el del menú: el propio del producto o, si no tiene, el de la categoría.
- **Ganancia:** precio − costo, en pesos, y en porcentaje del precio.
- **Precio sugerido:** costo / (1 − margen objetivo), redondeado hacia arriba a $100.
- **Debajo del mínimo:** el porcentaje de ganancia es menor que el margen mínimo.

Sin números, con el motivo: "Falta la receta", "Faltan las unidades", "Sin precio en el
menú" o "Un insumo no tiene precio".

## El costo de lo vendido

Al vender en el mostrador, cada renglón guarda **el costo de ese momento**. Así la ganancia de
octubre sale con la harina de octubre y no con la de hoy. Un renglón vendido cuando el
producto no tenía costo queda sin costo, y los totales lo dicen ("12 ventas sin costo").

## Pantallas

### Costos (`/admin/costos`)

- Una fila por producto activo, con su categoría, y por cada presentación: costo, precio,
  ganancia en pesos y en porcentaje, y precio sugerido.
- Orden por porcentaje de ganancia, de menor a mayor (el ranking), o por nombre.
- Filtros: todos, debajo del mínimo, sin receta.
- La fila abre la receta del producto. Arriba, el acceso a Ajustes.

### Receta de un producto (`/admin/costos/productos/[id]`)

- Los insumos, cada uno con su cantidad, lo que cuesta hoy y lo que aporta. Se agregan desde
  un buscador de insumos activos.
- Rinde y desperdicio.
- Por presentación, "Usa la receta del producto" o "Tiene su propia receta".
- Abajo, la tabla del producto por presentación, que se actualiza al guardar.

### Ajustes (`/admin/costos/ajustes`)

- Margen objetivo y margen mínimo.
- Por categoría, sus presentaciones con unidades y agregado. Cambiar una afecta a todos los
  productos de esa categoría, y la pantalla lo dice.

### Reportes: Ganancia por producto

Para el período elegido: unidades vendidas, ventas, costo y ganancia de cada producto, en
pesos y en porcentaje, ordenado por la plata que dejó (el ranking por plata). Usa el costo
guardado en cada venta.

### Inicio

Aviso "N productos debajo del margen mínimo", que lleva a Costos con ese filtro. No aparece
si no hay ninguno.

## Reglas

- Nada se borra: sacar un insumo de una receta lo desactiva en ella.
- Cada cambio de receta, presentación y margen queda en la auditoría, con el valor anterior.
- Los costos no se leen sin sesión ni con otro rol que no sea Admin. Caja vende y su venta
  guarda el costo, pero no lo ve.
- El costo de la pantalla no se guarda: se calcula cada vez con lo que cuestan hoy los
  insumos. El de lo vendido sí se guarda, en la venta.
- Anular una venta no cambia su costo: deja de contar entero.

## Fuera de alcance

Stock, producción, preparaciones dentro de otras recetas y el centro de avisos.

## Parte técnica (pedido 95)

- Base: `supabase/migrations/20261119140000_recetas_y_costos.sql`. Tablas `recetas`,
  `renglones_de_receta`, `costos_de_presentacion` y `configuracion_de_costos`, solo para el
  admin activo de su local. Recetas y renglones se escriben solo con `recetas_guardar(datos)`
  (`PK300` sin permiso, `PK301` algo de otro local o de otra categoría, `PK302` un insumo
  desactivado nuevo, `PK303` repetidos, `PK304` sin insumos). Unidades y márgenes se escriben
  directo, con RLS. La unidad de uso de un insumo que está en una receta no cambia (`PI303`).
- El costo se calcula en un solo lugar: `costos_de_productos_del_local(local)` (sin acceso
  directo) y `costos_de_productos()`, que lo da solo al admin activo de su local. Redondea al
  centavo una vez, la mitad hacia arriba. La venta (pedido 97) va a usar la primera.
- La ganancia, el porcentaje, el sugerido y "debajo del mínimo" son TypeScript puro, en
  `src/lib/costos/calculo.ts`. Lista, receta y ajustes en `src/lib/costos/`; pantallas en
  `src/app/admin/(panel)/costos/`. El aviso de Inicio sale de `cuantosDebajoDelMinimo`.
- Queda sin hacer: volver una presentación a "usa la receta del producto" una vez que tiene la
  suya, y el buscador de insumos (hoy es una lista para elegir).

### El costo de lo vendido (pedido 97)

- `supabase/migrations/20261119170000_costo_de_lo_vendido.sql`: la columna
  `renglones_de_venta.costo_unitario_centavos` y el disparador `costo_al_vender`, que la
  completa al cargar el renglón con `costos_de_productos_del_local` (sin costo calculable,
  queda nula). Caja no lee la columna: no ve las ventas.
- `ganancia_por_producto(desde, hasta)`: unidades, ventas, costo, ganancia (sobre lo que tiene
  costo) y cuántos renglones no lo tienen. El reporte está en `/admin/reportes/ganancia`.
