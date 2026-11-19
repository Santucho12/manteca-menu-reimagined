# Plan: Recetas y Costos (pedido 95)

Definición: `docs/modulos/11-costos.md`. Diseño: `docs/superpowers/specs/2026-11-19-costos-y-compras-design.md`.
Rama `feat/costos-y-compras`, sobre el pedido 94.

## Global Constraints

- TDD: test primero, verlo fallar, después el código. Código antes que su test se borra.
- Sin mocks: nada de `vi.mock`, `vi.fn` como reemplazo, `page.route` ni clientes falsos. Datos
  contra mantecatest en `*.base.test.ts`; cálculo puro en `*.test.ts`.
- Cada test siembra y limpia lo suyo, con el cliente secreto de `tests/clientes.ts`.
- 20 líneas por función en `.ts`, 80 por componente, 300 por archivo. Lógica fuera de `.tsx`.
- Español; voseo en pantalla. Plata en centavos enteros; cantidades y costo por unidad en
  `numeric`; el costo se redondea al centavo una sola vez, al final, en la base.
- Sesión del usuario y RLS; solo Admin activo de su local; nada para `anon`; nadie borra.
- Auditoría con `public.auditar()`. Migración con reversa, `schema.sql` al día, aplicada solo a
  mantecatest. Sin push ni producción. Decide Santiago.
- Mientras se construye: cada tarea corre sus tests y `npm run tipos`. Al cerrar: `npm run
  verificar`; `npm run e2e` entero quedó postergado por Santiago (2026-11-19).

## Tareas

1. **Base.** Tests de RLS (`tests/rls/costos.base.test.ts`) y de reglas
   (`tests/reglas/costos.base.test.ts`): `recetas_guardar` crea, actualiza, reactiva y
   desactiva renglones, y rechaza lo ajeno (`PK301`), un insumo inactivo nuevo (`PK302`),
   repetidos (`PK303`) y la lista vacía (`PK304`); `costos_de_productos()` da el costo con
   desperdicio, rinde, unidades y agregado, la receta propia de una presentación y cada
   estado; la unidad de uso de un insumo en una receta no cambia (`PI303`). Migración
   `20261119140000_recetas_y_costos.sql`, reversa, `schema.sql`, tipos.
2. **Cálculo y esquemas.** `src/lib/costos/calculo.test.ts` (ganancia, porcentaje, sugerido
   redondeado a $100 hacia arriba, debajo del mínimo, motivo) y `esquemas.test.ts`.
3. **Servicio.** `tests/servicios/costos.base.test.ts`: la lista con precio del menú y
   filtros, la receta de un producto, guardar receta, unidades y márgenes.
4. **Pantallas.** `/admin/costos` (sale de Próximamente), `/admin/costos/productos/[id]`,
   `/admin/costos/ajustes`, el aviso en Inicio, la ayuda y la auditoría. Con `estetica-panel`.
   Prueba en vivo `e2e/costos.spec.ts`, escrita; se corre cuando Santiago lo diga.
5. **Cierre.** Documentos, `npm run verificar`, `PEDIDOS.md`.
