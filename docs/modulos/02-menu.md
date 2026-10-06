# Menú y productos

Módulo 9 de `PROPUESTA.md`, con el catálogo mínimo de productos del módulo 4. Tercer paso
del orden de construcción.

Este archivo tiene dos partes. La definición funcional dice qué hace el módulo y se acordó
con Santiago el 2026-10-06. La parte técnica se escribe al construirlo.

## Para qué

Que el dueño cambie el menú él mismo, en menos de un minuto y sin llamar a nadie, y que el
cliente del local vea siempre el precio correcto.

## Quién lo usa

| Quién | Qué hace acá |
|---|---|
| Cliente del local | Lee el menú público desde el QR, sin cuenta |
| Admin | Administra categorías, productos y precios |

Caja no entra a este módulo.

## Cómo está armado

### Categorías

Cada categoría tiene nombre, subtítulo, foto, ícono (elegido de una lista), orden y
visibilidad.

La categoría define sus **presentaciones**: las formas en que se vende lo que tiene adentro.

| Categoría de hoy | Presentaciones |
|---|---|
| Facturas | Docena, Media docena, Unidad |
| Laminados, Panes, Extras | Unidad |
| Clásicos | Por cuarto |
| Cafetería | Mediano, Grande |

### Productos

Cada producto tiene nombre, descripción, etiqueta opcional, orden dentro de su categoría y
la casilla "se muestra en el menú". No tiene foto propia: la foto es de la categoría.

Todos los productos viven en una sola lista. Los que se venden en Fudo pero no van en el
menú (una botella de agua) existen igual, con la casilla sin marcar.

### Precios

El precio puede estar en dos lugares.

- **En el producto:** carga el precio de las presentaciones de su categoría que ofrece. Un
  café puede tener solo Grande.
- **En la categoría (precio compartido):** la categoría fija el precio de sus presentaciones
  y lo heredan todos sus productos que no tengan precio propio. Es el caso de Facturas.

La pantalla dice siempre de dónde sale el precio que se está viendo.

### Etiquetas

Lista fija, una por producto: **Más vendido**, **Artesanal** y **Nuevo**. La elige el admin
a mano. "Más vendido" reemplaza a la etiqueta "Popular" de la página actual.

## Pantallas

### Menú público (`/`)

- Es la página actual de Manteca, con el mismo aspecto, leyendo de la base.
- Muestra las categorías visibles, en su orden, con sus productos visibles.
- De cada producto muestra nombre, descripción, etiqueta y precio. Nada más sale al público.
- En una categoría con precio compartido, el subtítulo con los precios se arma solo.
- La portada, el bloque final y el botón de WhatsApp son fijos: no se editan desde el panel.

### Menú (`/admin/menu`), solo admin

- Lista de categorías con sus productos, en el orden del menú.
- Crear y editar categorías: nombre, subtítulo, foto, ícono, presentaciones y precio
  compartido.
- Crear y editar productos: nombre, descripción, etiqueta, categoría, precios y la casilla
  "se muestra en el menú".
- Mostrar u ocultar un producto o una categoría entera.
- Ordenar con flechas de subir y bajar.
- Desactivar un producto o una categoría que ya no se usa.

### Aumento masivo

- Se aplica a todo el menú o a una categoría.
- Pide un porcentaje, que puede ser negativo.
- Pide el redondeo: a $10, $50, $100 o $500, al más cercano. Viene marcado $100.
- Antes de aplicar muestra la lista con el precio actual y el nuevo de cada uno.
- Se aplica recién al confirmar. No tiene "deshacer": un error se corrige con otro cambio.

## Reglas

1. Todo cambio se publica al guardar. No hay borrador.
2. Un producto sin precio propio ni de su categoría no puede estar visible.
3. Ocultar y desactivar son cosas distintas. Lo oculto sigue activo y no sale en el menú. Lo
   desactivado ya no se usa: no aparece para cargar datos nuevos y conserva su historial.
4. Nada se borra.
5. Una categoría oculta no muestra ninguno de sus productos.
6. Sacarle una presentación a una categoría no borra los precios que ya tenía: dejan de
   mostrarse.
7. Los precios son en pesos enteros para el público y se guardan en centavos.

## Casos de borde

- Un producto pasa de una categoría a otra con presentaciones distintas: queda sin precio y
  se oculta hasta que le carguen uno.
- Un aumento masivo sobre una categoría con precio compartido cambia el precio compartido,
  no el de cada producto.
- Un aumento que deja dos presentaciones con el mismo precio después de redondear: se
  muestra en la vista previa tal cual, sin corregirlo solo.
- Dos admins editan el mismo precio a la vez: queda el último, y los dos cambios figuran en
  la auditoría.
- Se oculta el último producto visible de una categoría: la categoría no sale en el menú.

## Qué queda en la auditoría

- Cada alta, cambio y desactivación de categoría o de producto.
- Cada cambio de precio, con el valor anterior y el nuevo.
- Cada aumento masivo: quién, cuándo, el porcentaje, el redondeo y el alcance.
- Cada cambio de visibilidad.

## Carga inicial

Los 35 productos, las 6 categorías y las fotos de la página actual se cargan al construir el
módulo. El dueño arranca con el menú de hoy.

## Fuera de alcance

- Foto por producto.
- Estado "agotado".
- Borrador, publicación programada y deshacer un aumento.
- Editar la portada, los textos fijos o el número de WhatsApp.
- Etiquetas de texto libre o calculadas con las ventas.
- Composición, costo y ganancia de cada producto.

## Dónde se aparta de la propuesta

| Propuesta | Acá | Por qué |
|---|---|---|
| Foto por producto | Foto solo por categoría | Decisión de Santiago: es como está la página hoy |
| Variantes por producto | Presentaciones de la categoría, con precio compartido cuando hace falta | En Facturas el precio es de la categoría |

Falta reflejar lo de la foto en `PROPUESTA.md`, con el texto que defina Santiago.

## Decisiones tomadas

| Tema | Decisión |
|---|---|
| Dónde vive el precio | En el producto, o compartido en la categoría |
| Publicación | Al instante |
| Presentaciones | Las define la categoría |
| Redondeo del aumento | Se elige en cada aumento; $100 por defecto |
| Deshacer un aumento | No; hay vista previa antes de aplicar |
| Fotos | Solo por categoría |
| Agotado | No existe; se oculta |
| Etiquetas | Lista fija: Más vendido, Artesanal, Nuevo |
| Qué se edita de la página | Solo categorías y productos |
| Productos fuera del menú | Una sola lista, con la casilla "se muestra en el menú" |

## Sin decidir

| Qué | De qué depende |
|---|---|
| Cómo se vinculan las facturas con Fudo | De si Fudo vende "docena de facturas" o cada factura por separado. Se ve con el archivo real, al definir Ventas |

## Parte técnica

Se escribe al construir el módulo: tablas, permisos, acciones de servidor y pruebas.
