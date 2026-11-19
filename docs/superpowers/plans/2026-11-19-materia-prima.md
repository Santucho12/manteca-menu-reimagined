# Plan: Materia prima (pedido 94)

Definición: `docs/modulos/10-materia-prima.md`. Diseño: `docs/superpowers/specs/2026-11-19-costos-y-compras-design.md`.
Rama `feat/costos-y-compras`.

## Global Constraints

- TDD: test primero, verlo fallar, después el código. Código antes que su test se borra.
- Sin mocks: nada de `vi.mock`, `vi.fn` como reemplazo, `page.route` ni clientes falsos. Datos
  contra mantecatest (`.env.local`) en `*.base.test.ts`; cálculo puro en `*.test.ts`.
- Cada test siembra y limpia lo suyo, con el cliente secreto de `tests/clientes.ts`.
- 20 líneas por función en `.ts`, 80 por componente, 300 por archivo. Lógica fuera de `.tsx`.
- Español; voseo en pantalla. Plata en centavos enteros (`_centavos`); el costo por unidad de
  uso en `numeric` en la base.
- Sesión del usuario y RLS; solo Admin activo de su local; nada para `anon`; nadie borra.
- Auditoría con `public.auditar()`. Migración con reversa, `schema.sql` al día, aplicada solo a
  mantecatest. Sin push ni producción (`CLAUDE.local.md`). Decide Santiago.
- Mientras se construye: cada tarea corre sus tests y `npm run tipos`. Al cerrar: `npm run
  verificar` y `npm run e2e` enteros.

## Tareas

1. **Base.** Tests `tests/rls/materia-prima.base.test.ts` (admin ve/carga/cambia lo de su
   local; invitado, caja, encargado, desactivado, admin de otro local y `anon`, nada; nadie
   borra) y `tests/reglas/materia-prima.base.test.ts` (forma de compra con insumo o proveedor
   de otro local: `PI301`; forma nueva de un insumo inactivo: `PI302`; `costo_de_insumos()`
   da la referencia de la forma cambiada por última vez, o nulo; la auditoría registra el
   alta). Verlos fallar. Migración `20261119120000_materia_prima.sql`, reversa, `schema.sql`,
   aplicar a mantecatest, tipos en `src/lib/supabase/tipos.ts`. Verlos pasar.
2. **Cálculo y esquemas.** `src/lib/materia-prima/costo.test.ts` y `esquemas.test.ts`: costo
   para mostrar (por kg, litro o unidad), texto del origen, validación de insumo y de forma
   de compra (contenido con coma, precio en pesos). Después `costo.ts` y `esquemas.ts`.
3. **Servicio.** `tests/servicios/materia-prima.base.test.ts`: listar con búsqueda y
   desactivados y su costo; ficha con formas de compra; crear (avisa nombre repetido),
   editar, desactivar y reactivar insumo y forma. Después `consultas.ts` y `escritura.ts`.
4. **Pantallas.** `e2e/materia-prima.spec.ts`: el admin carga un insumo con una forma de
   compra, ve su costo por kilo en la lista, lo edita y lo desactiva; caja e invitado no
   entran. Después `/admin/materia-prima` (lista, `nuevo`, `[id]`, `[id]/editar`), la entrada
   en la barra (`estados.ts`, ícono), su ayuda, `loading.tsx` y la auditoría
   (`pantalla.ts`, `textos.ts`, `consultas.ts`). Con `estetica-panel`.
5. **Cierre.** Documentos (`docs/producto.md`, `CLAUDE.md`, parte técnica del módulo),
   `pre-finish`, `npm run verificar`, `npm run e2e`, `PEDIDOS.md`.
