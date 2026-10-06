# Mapa y flujo de la primera fase

Fecha: 2026-10-06. Decidido con Santiago en conversación.

Este documento es interno. Fija qué pantallas tiene la primera fase, en qué orden se
construyen y cómo se trabaja cada módulo. No diseña ningún módulo: cada uno lleva su propio
spec y su propio plan.

## Objetivo

Tener un mapa único de la aplicación para la primera fase de `PROPUESTA.md`, comprobar que
cubre los nueve módulos prometidos y acordar el orden de construcción.

## Alcance de la primera fase

Entran: usuarios y permisos, proveedores, gestión del menú digital, ventas e ingresos
importados de Fudo, cierres de caja, gastos, dashboard general, reportes y auditoría.

Quedan para la segunda fase: materia prima, productos (composición y costo), compras,
gestión de costos, producción, stock, centro de avisos, notas e IA.

### Recortes que impone ese alcance

Varios módulos de la primera fase se apoyan en módulos de la segunda. Los recortes salen de
`docs/producto.md`, que delimita el producto.

| Módulo | Qué depende de la segunda fase | Cómo queda en la primera |
|---|---|---|
| Menú digital y Ventas | Se vinculan a "productos del sistema" | Catálogo mínimo de productos: nombre, variantes y precio, sin composición ni costo |
| Proveedores | Materias primas con precio, orden por WhatsApp, cuenta corriente | Contacto, observaciones y los gastos que se le pagaron |
| Gastos | Las compras de materia prima van al módulo Compras | La compra de mercadería se carga como gasto, en su categoría y con su proveedor |
| Dashboard | Margen, más rentables, mermas, valor del stock, stock bajo, margen bajo | Ventas, gastos, resultado (ventas menos gastos), ticket promedio, más vendidos y cajas con diferencia |
| Cierres de caja | Compras pagadas con la caja, aviso de diferencia | La compra pagada con la caja es un gasto más; la diferencia se ve en Inicio y en el control de cierres |
| Ventas | Descuento de stock | La venta suma a reportes y a la caja esperada |

El centro de avisos es de la segunda fase. Los tres avisos que la primera necesita se
muestran en Inicio: cajas con diferencia, invitados sin rol y productos de Fudo sin vincular.

## Mapa de rutas

Todo vive en un solo dominio, `mantecabakeryar.com`. El menú público está en la raíz y el
sistema bajo `/admin`. "Admin" es el nombre de la ruta, no del rol: Caja también entra por
ahí y ve solo la carga de su cierre.

| Ruta | Contenido | Módulo de la propuesta |
|---|---|---|
| `/` | Menú público, leído de la base, sin sesión | 9. Menú digital |
| `/admin/ingresar`, `/admin/registro` | Login y alta de cuenta | 1. Usuarios |
| `/admin` | Inicio: KPIs del mes, comparativo mes a mes, más vendidos y los tres avisos. El invitado sin rol ve la pantalla de espera | 13. Dashboard |
| `/admin/ventas` | Importaciones de Fudo (subir, duplicados, anular), vinculación de productos, ventas manuales | 10. Ventas |
| `/admin/caja` | Cargar cierre; control de cierres (esperado contra declarado, revisado con comentario) | 11. Cierres de caja |
| `/admin/gastos` | Gastos, recurrentes y categorías | 12. Gastos |
| `/admin/menu` | Categorías, productos, variantes, visibilidad, precios y actualización masiva | 9. Menú digital y catálogo mínimo |
| `/admin/proveedores` | Listado y ficha | 2. Proveedores |
| `/admin/reportes` | Ventas, gastos y caja, con filtros por fecha y comparación entre meses | 14. Reportes |
| `/admin/usuarios` | Roles, desactivar, resetear contraseña | 1. Usuarios |
| `/admin/auditoria` | Quién creó, modificó o anuló cada dato, con valor anterior y nuevo | 17. Auditoría |
| `/admin/guia-de-estilos` | Guía de estilos, interna | — |

Todo `/admin` exige sesión, salvo ingresar y registro, y queda fuera de los buscadores.

Los nueve módulos de la primera fase tienen pantalla en este mapa.

## Flujo de trabajo

Se descartó hacer primero todo el servidor y después todas las pantallas: ningún pedido
podría cerrarse, porque "hecho" exige la prueba en vivo, y las acciones de servidor toman su
forma del formulario que las usa.

Cada módulo se construye completo antes de pasar al siguiente:

1. `revision-logica` sobre el módulo de `PROPUESTA.md`.
2. Diseño con `superpowers:brainstorming`, spec y plan.
3. Base: migración y tests de RLS (`migracion-supabase`, `tests-rls`).
4. Servidor: servicio y acción, con su test primero (`endpoint-staff`).
5. Pantalla, con su test primero.
6. Cierre con `pre-finish`: `npm run verificar` y `npm run e2e`.

Dentro de cada módulo los datos se piensan antes que la pantalla, y ese es el orden de los
pasos 3 a 5.

## Orden de los módulos

Por dependencia y por riesgo.

1. Base técnica y guía de estilos.
2. Usuarios y permisos, con el mecanismo de auditoría y la navegación de `/admin`.
3. Catálogo mínimo de productos y menú digital, con la página pública. Va primero porque es
   independiente, se ve y no depende de Fudo.
4. Proveedores. Es un ABM simple, y Gastos lo necesita.
5. Gastos.
6. Ventas: entrada de las ventas de Fudo, vinculación y ventas manuales.
7. Cierres de caja. Necesita Ventas y Gastos.
8. Reportes.
9. Inicio (dashboard).
10. Pantalla de auditoría. El mecanismo existe desde el paso 2.

## Menú público

La página actual está en otro repo (`manteca-menu-reimagined`, TanStack Start) y tiene el
menú escrito en el código. Se porta a este proyecto en el paso 3; no se copia tal cual.

- Los colores, tipografías y radios de su `styles.css` son la base de la guía de estilos, en
  el paso 1.
- Las fuentes se copian al proyecto. Las fotos van a Supabase Storage.
- Portada, navegación de categorías, bloque emocional y botón de WhatsApp se reescriben en
  Next.js con el mismo aspecto, cada uno con su test primero.
- Los 35 productos y las 6 categorías de hoy se cargan como dato inicial.
- No hay etapa intermedia con la página estática: va directo a leer de la base.

El menú de hoy no es uniforme, y el modelo de datos del paso 3 tiene que cubrir estos casos:

- Facturas: el precio es de la categoría (docena, media docena, unidad) y los productos no
  tienen precio propio.
- Cafetería: mediano y grande, con productos que existen en un solo tamaño.
- Clásicos: se venden por cuarto.
- Laminados, Panes y Extras: un precio por unidad.
- Hay etiqueta "Popular", ícono y foto por categoría. No hay foto por producto, y la
  propuesta la promete.

## Dominio

El QR del local apunta a `mantecabakeryar.com`. La página actual sigue publicada mientras se
desarrolla, y el sistema vive en la URL de Vercel del proyecto nuevo. Mover el dominio es
publicar en producción: lo decide Santiago cuando el menú nuevo esté verificado.

## Decisiones abiertas

Cada una frena un módulo y se resuelve antes de diseñarlo.

| Decisión | Frena |
|---|---|
| Si las ventas entran por la API de Fudo o por el Excel, y qué detalle traen | 6. Ventas, 7. Cierres de caja y el modelo de variantes del paso 3 |

## Restricciones globales

Reglas de `CLAUDE.md` que valen para todo spec y plan que salga de este mapa.

- **Quién decide:** solo Santiago autoriza dónde se crean las bases, aplicar una migración a
  la base real, publicar en producción y cualquier excepción a las reglas.
- **TDD:** primero el test, verlo fallar, después el código. Código escrito antes que su
  test se borra y se rehace.
- **Tests sin mocks:** contra la base de pruebas. Nada de `vi.mock`, `vi.fn` como reemplazo,
  `page.route` ni clientes falsos. La fecha de hoy entra como parámetro.
- **Hecho es probado en local:** `npm run verificar` y `npm run e2e`, los dos.
- **Largo:** 20 líneas por función en `.ts`, 80 por componente en `.tsx`, 300 por archivo. La
  lógica no vive en los `.tsx`.
- **Idioma:** nombres, comentarios, base y mensajes en español; pantallas en rioplatense con
  voseo.
- **Plata en centavos enteros:** `bigint` en la base, `number` entero en TypeScript, nombres
  terminados en `_centavos` o `Centavos`.
- **Permisos:** Caja carga el cierre de su turno y ve los suyos; Encargado no accede a nada
  en esta fase. Todo lo demás que no sea el menú público es solo para Admin, y los tests
  comprueban el rechazo a invitado, caja y encargado fuera de lo que les corresponde.
- **Datos:** sesión del usuario y RLS; nada se borra, se anula con motivo; toda escritura
  deja auditoría; fechas en UTC y "el día" es el de Argentina; toda tabla operativa lleva su
  local.
- **Guía de estilos:** ninguna pantalla define colores, tipografías ni medidas sueltas.
- **Git:** cada cambio en su rama, a `main` por pull request con merge commit.

## Fuera de alcance

- El diseño de cada módulo.
- Los módulos de la segunda fase.
- El cambio de dominio y la publicación en producción.
