# Estética de Plan Reminder Pro en Inicio, Menú y Ventas: plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que el cuerpo de Inicio (admin), Menú y Ventas tenga la estética de FiestaCobra con los colores y la tipografía de Manteca, sin cambiar qué hace ninguna pantalla.

**Architecture:** Unas piezas visuales comunes en `src/components/panel/` (panel con cabecera, etiqueta, píldora, ícono en cuadrado, botón grande) que usan las tres pantallas. Los dos cálculos nuevos (la porción del resultado y el precio destacado de un producto) van a `.ts` puros con su test. Cada pantalla se rehace sobre esas piezas, conservando nombres accesibles y textos para que las pruebas de hoy sigan valiendo.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind 4, lucide-react, Vitest (grupo `puros`), Playwright.

**Spec:** `docs/superpowers/specs/2026-10-19-estetica-de-pantallas-design.md`

## Global Constraints

- Colores solo de `globals.css` (`background`, `card`, `foreground`, `muted-foreground`, `secondary`, `border`, `accent` = `primary`). Nada de `slate-*`, `emerald-*` ni `#hex`. El dorado no va como color de letra sobre crema: solo fondos tenues, bordes, íconos y barras; sobre el bloque oscuro sí.
- Neufile Grotesk en todo; títulos `font-bold` (no hay 800). Íconos de `lucide-react`.
- Tests sin mocks: nada de `vi.mock`, `vi.fn`, `page.route`. Los cálculos puros en `*.test.ts` (grupo `puros`); las pantallas con Playwright en `e2e/`.
- TDD: primero el test, verlo fallar, después el código. Código escrito antes que su test se borra.
- Largo: función de `.ts` hasta 20 líneas, componente `.tsx` hasta 80, archivo hasta 300 (sin blancos ni comentarios). Si ESLint falla por largo, se divide; la regla no se desactiva.
- Nombres, comentarios y textos en español (rioplatense con voseo en pantalla). Un comentario explica el porqué.
- Plata en centavos enteros (`number` entero, nombres en `Centavos`), mostrada con `formatearPesos` o `formatearPesosEnteros`.
- Botones y controles de al menos 44 px (`size-11`).
- Mientras se construye, cada tarea corre solo sus tests nuevos (Playwright en `--project=computadora`) y `npm run tipos`. `npm run verificar` y `npm run e2e` enteros, en los dos tamaños, se corren una vez al cerrar (tarea 5), por partes y en primer plano: la máquina tiene poca memoria.
- Si el puerto 3210 está ocupado, se cierra ese servidor antes de correr Playwright.
- Commits chicos, conventional commits en español, cada archivo con su ruta (nunca `git add -A`), con `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Publicar en producción (merge a `main`, que publica solo) y cualquier excepción a estas reglas las decide solo Santiago.

## Review Focus

1. Un monto de 8 cifras ($29.999.997,00) en el bloque oscuro de Inicio y en las tarjetas, en el celular: no desborda la pantalla. Cubierto por la prueba de hoy ("un monto de 8 cifras entra…"), que ya revisa el ancho de toda la página; la tarea 2 la deja pasando con el número enorme.
2. Inicio sin avisos: el panel "Para atender" no aparece y los otros dos ocupan el ancho, sin hueco. Test en la tarea 2 (puro de la grilla).
3. Resultado "Sin calcular" o ventas en cero: el bloque oscuro no muestra barra ni un porcentaje inventado. Tests puros en la tarea 1.
4. Producto con varias presentaciones o sin precio: no aparece un precio grande engañoso a la derecha. Tests puros en la tarea 4.
5. Lista de ventas vacía y venta anulada: se sigue viendo "No hay ventas para mostrar." y el total tachado con su píldora "Anulada". Prueba en vivo en la tarea 3.

---

### Task 1: Piezas comunes y la porción del resultado

**Files:**
- Create: `src/components/panel/Piezas.tsx`
- Create: `src/lib/inicio/bloqueDelMes.ts`
- Test: `src/lib/inicio/bloqueDelMes.test.ts`

**Interfaces:**
- Produces (`Piezas.tsx`, componentes de servidor, sin lógica):
  - `Panel({ etiqueta?: ReactNode; extra?: ReactNode; titulo?: string; className?: string; children })`: `<section>` `bg-card border rounded-3xl overflow-hidden`. Si hay `etiqueta`, cabecera `px-6 py-5 border-b flex items-center justify-between gap-3` con la etiqueta a la izquierda y `extra` a la derecha. Con `titulo`, la sección lleva `aria-label={titulo}`.
  - `Etiqueta({ children, as?: 'span' | 'h2' | 'dt'; id? })`: `text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground`.
  - `Pildora({ children, tono?: 'neutro' | 'marca' })`: `rounded-full px-3 py-1 text-xs font-bold tracking-wider`; neutro `bg-secondary`, marca `bg-accent/10 ring-1 ring-accent/40`.
  - `IconoEnCuadrado({ icono: LucideIcon; grande?: boolean })`: `size-10 rounded-xl` (`size-13 rounded-2xl` si grande) `bg-accent/15 grid place-items-center`, ícono 20 `aria-hidden`.
  - `AccionesDelHero({ children })`: contenedor `flex flex-col gap-3 sm:flex-row` para los botones.
  - `BotonDelHero({ href, children, principal?: boolean })`: `Link` con `rounded-2xl px-6 py-3.5 font-bold uppercase tracking-[0.12em] text-sm min-h-11 inline-flex items-center justify-center gap-2`; principal `bg-accent text-foreground shadow-lg shadow-accent/30`, si no `bg-card border`.
- Produces (`bloqueDelMes.ts`):
  - `porcionDelResultado(resultado: ResultadoDelPeriodo): number | null`: el resultado sobre las ventas, en porcentaje entero redondeado, entre 0 y 100. `null` si `resultadoCentavos` es `null` o `ventasCentavos` es 0. Negativo → 0.
  - `textoDeLaPorcion(porcion: number | null): string`: `'Lo que queda de cada peso vendido: 55%'`, o `'Sin calcular'` si es `null`.
  - `textoDeVentasDelMes(cantidad: number): string`: `'Del 1 a hoy · 1 venta'` / `'Del 1 a hoy · 569 ventas'`.

- [ ] **Step 1: Escribir los tests de `bloqueDelMes.test.ts`**

```ts
describe('porcionDelResultado', () => {
  it('es el resultado sobre las ventas, redondeado', () =>
    expect(porcionDelResultado(r(1000000, 450000, 550000))).toBe(55));
  it('sin resultado calculado no hay porcion', () =>
    expect(porcionDelResultado(r(1000000, 0, null))).toBeNull());
  it('sin ventas no hay porcion', () => expect(porcionDelResultado(r(0, 100, -100))).toBeNull());
  it('con perdida queda en cero', () => expect(porcionDelResultado(r(1000, 3000, -2000))).toBe(0));
});
// textoDeLaPorcion(55) → 'Lo que queda de cada peso vendido: 55%'; textoDeLaPorcion(null) → 'Sin calcular'
// textoDeVentasDelMes(1) → 'Del 1 a hoy · 1 venta'; textoDeVentasDelMes(569) → 'Del 1 a hoy · 569 ventas'
```
(`r(ventas, gastos, resultado)` arma un `ResultadoDelPeriodo` con `categorias: []`.)

- [ ] **Step 2: Correrlos y verlos fallar** — `npx vitest run --project puros src/lib/inicio/bloqueDelMes.test.ts` → FAIL (no existe el módulo).
- [ ] **Step 3: Escribir `bloqueDelMes.ts`** y `Piezas.tsx` con las firmas de arriba.
- [ ] **Step 4: Verlos pasar** — mismo comando → PASS; `npm run tipos` sin errores.
- [ ] **Step 5: Commit** — test primero, después el código (`test: ...`, `feat: ...`).

### Task 2: Inicio

**Files:**
- Modify: `src/components/inicio/InicioAdmin.tsx`, `Avisos.tsx`, `MasVendidos.tsx`
- Create: `src/components/inicio/TarjetasDelMes.tsx`, `src/components/inicio/BloqueDelMes.tsx`
- Modify: `src/lib/inicio/bloqueDelMes.ts` (suma `columnasDeAbajo`) y su test
- Modify: `src/lib/inicio/consultas.ts` solo si `datosDelInicio` no devuelve ya `actual.ventas` (sí lo devuelve: `numerosDelMes` lo usa).
- Test: `e2e/inicio-admin.spec.ts`

**Interfaces:**
- Consumes: Tarea 1 (`Panel`, `Etiqueta`, `Pildora`, `IconoEnCuadrado`, `porcionDelResultado`, `textoDeLaPorcion`, `textoDeVentasDelMes`); `numerosDelMes`, `totalesDeVentas`, `formatearPesos`, `GraficoPorMes`.
- Produces: `columnasDeAbajo(hayAvisos: boolean): string` en `bloqueDelMes.ts`: `'lg:grid-cols-3'` con avisos, `'lg:grid-cols-2'` sin.

- [ ] **Step 1: Tests.** Puro: `columnasDeAbajo(true)` → `'lg:grid-cols-3'`, `(false)` → `'lg:grid-cols-2'`. En vivo, en `e2e/inicio-admin.spec.ts`:

```ts
test('el bloque de ventas del mes muestra el monto y cuantas ventas van', async ({ page }) => {
  await page.goto('/admin');
  const bloque = page.getByRole('region', { name: 'Ventas del mes' });
  await expect(bloque).toContainText(/Del 1 a hoy · \d+ ventas?/);
  await expect(bloque).toContainText('$29.999.997,00');
  await expect(bloque).toContainText('Gastos');
  await expect(bloque).toContainText('Resultado');
});
```
- [ ] **Step 2: Verlos fallar** — `npx vitest run --project puros src/lib/inicio/bloqueDelMes.test.ts` y `npx playwright test e2e/inicio-admin.spec.ts -g "bloque de ventas" --project=computadora` → FAIL.
- [ ] **Step 3: Implementar.**
  - `TarjetasDelMes({ items: NumeroDelMes[] })`: `<dl>` con la grilla `grid gap-4 sm:grid-cols-2 lg:grid-cols-4`; cada tarjeta `bg-card border rounded-3xl p-6`: arriba `Etiqueta as="dt"` con la etiqueta e `IconoEnCuadrado` (Ventas `ShoppingBag`, Gastos `Receipt`, Resultado `TrendingUp`, Ticket promedio `Ticket`), el valor en `<dd className="text-2xl md:text-3xl font-bold mt-2 mb-4 break-words">`, y el pie en otro `<dd>` con `border-t pt-3 text-[11px] font-bold uppercase text-muted-foreground flex justify-between` con `textoDeVariacion(variacion)` y un punto `size-1.5 rounded-full bg-accent`. Mantener `dt`/`dd`: la prueba de hoy busca `term` y `definition`.
  - `BloqueDelMes({ resultado: ResultadoDelPeriodo; cantidad: number })`: `<section aria-label="Ventas del mes" className="bg-foreground text-background rounded-3xl p-6 md:p-8 flex flex-col lg:flex-row gap-6 lg:items-center lg:justify-between">`. Izquierda: etiqueta "Ventas del mes" en `text-background/70` (no `Etiqueta`: sobre oscuro), `textoDeVentasDelMes(cantidad)` en `opacity-75`, y el monto `text-4xl md:text-6xl font-bold tracking-tight break-words`. Derecha: recuadro `rounded-2xl border border-background/15 bg-background/5 p-5 lg:w-96` con Gastos y Resultado (`formatearPesos`; resultado `null` → `'Sin calcular'`), la barra (`h-1.5 rounded-full bg-background/15` con el relleno `bg-accent` de ancho `${porcion}%`, solo si `porcion !== null`) y `textoDeLaPorcion(porcion)` en `text-xs opacity-60`.
  - `InicioAdmin`: hero, `TarjetasDelMes` dentro de la sección "Este mes" (conserva `aria-labelledby="este-mes"`; el `h2` "Este mes" y la línea "Del 1 a hoy, contra los mismos días del mes anterior." pasan a `sr-only`), `BloqueDelMes` con `datos.actual.resultado` y `totalesDeVentas(datos.actual.ventas).ventas`, y abajo `grid gap-4 ${columnasDeAbajo(datos.avisos.length > 0)}` con Avisos, "Mes a mes" y Más vendidos, cada uno como `Panel` con `Etiqueta as="h2"` y su `id` de hoy (`avisos`, `mes-a-mes`, `mas-vendidos`) para que las secciones conserven su nombre. Avisos lleva `extra={<Pildora>{avisos.length}</Pildora>}`. Las filas: `px-6 py-4 border-b last:border-b-0`.
- [ ] **Step 4: Verlos pasar** — los dos comandos del paso 2 → PASS; además `npx playwright test e2e/inicio-admin.spec.ts --project=computadora` entero → PASS (las pruebas de hoy siguen valiendo). `npm run tipos`.
- [ ] **Step 5: Mirar la captura** `e2e/capturas/inicio-admin-computadora.png` contra la maqueta y commitear (test, después código).

### Task 3: Ventas

**Files:**
- Modify: `src/app/admin/(panel)/ventas/page.tsx`, `src/app/admin/(panel)/ventas/ListaDeVentas.tsx`
- Test: `e2e/ventas.spec.ts`

**Interfaces:**
- Consumes: Tarea 1 (`Panel`, `Etiqueta`, `Pildora`, `AccionesDelHero`, `BotonDelHero`); `lineasDelResumen`, `estadoDeVenta`, `nombreDeOrigen`, `nombreDeMedio`, `fechaParaMostrar`, `formatearPesos`.
- La lista sigue siendo `<ul aria-label="Ventas">` con un `<li>` por venta (la prueba de hoy cuenta `listitem`): en la computadora se ve como tabla con una grilla de columnas, no con `<table>`.

- [ ] **Step 1: Test** en `e2e/ventas.spec.ts`:

```ts
test('la lista va en un panel con su cantidad y el estado de cada venta', async ({ page }) => {
  const dia = diaLibre();
  await venta({ fecha: dia });
  const anulada = await venta({ fecha: dia });
  await anularDePrueba(anulada); // si no hay ayuda, anularla por la pantalla como en 'anula una venta a mano con motivo'
  await page.goto(`/admin/ventas?desde=${dia}&hasta=${dia}`);
  const panel = page.getByRole('region', { name: 'Ventas' });
  await expect(panel.getByText('2 ventas', { exact: true })).toBeVisible();
  await expect(panel.getByRole('listitem').filter({ hasText: 'Anulada' })).toHaveCount(1);
  await expect(panel.getByRole('listitem').filter({ hasText: 'Cerrada' })).toHaveCount(1);
  await expect(page.getByRole('link', { name: 'Cargar venta' })).toBeVisible();
});
```
Y un caso: con un día sin ventas, se ve "No hay ventas para mostrar." dentro del panel.
- [ ] **Step 2: Verlo fallar** — `npx playwright test e2e/ventas.spec.ts -g "panel con su cantidad|No hay ventas" --project=computadora` → FAIL.
- [ ] **Step 3: Implementar.**
  - Hero: `flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between` con `TituloDePagina` y `AccionesDelHero` ("Canales" y "Cargar venta" principal).
  - Filtros dentro de un `Panel` sin cabecera con `p-4`; mismos campos y `name`; "Filtrar" sigue siendo botón.
  - `Panel titulo="Ventas"` con `etiqueta={<Etiqueta>{lineas[0]}</Etiqueta>}` y `extra={<Pildora>{n} {n === 1 ? 'venta' : 'ventas'}</Pildora>}` con `n = lista.total`; la segunda línea del resumen, si hay, en `px-6 pt-3 text-sm text-muted-foreground`. La prueba de hoy busca `getByText('Cobrado: $3.000,00 en 3 ventas')`: la etiqueta mantiene el texto exacto (el `uppercase` es CSS).
  - `ListaDeVentas`: en `lg`, una fila de encabezado `aria-hidden` (Fecha, Origen, Medios, Total, Estado) con `Etiqueta` y `grid lg:grid-cols-[1.2fr_1fr_1fr_auto_auto]`; cada `<li>` con la misma grilla, `px-6 py-4 border-b last:border-b-0`. La fecha con un círculo `size-8 rounded-full bg-accent/15` con el día del mes. El estado en `Pildora tono="marca"` con `estadoDeVenta(venta)` en todas las filas; lo que no cuenta, total tachado y gris como hoy. En el celular, cada `<li>` se ve como hoy (fecha y detalle a la izquierda, total y píldora a la derecha). Vacía: "No hay ventas para mostrar." en `px-6 py-10 text-center`.
- [ ] **Step 4: Verlo pasar** — comando del paso 2 → PASS; `npx playwright test e2e/ventas.spec.ts --project=computadora` entero → PASS. `npm run tipos`.
- [ ] **Step 5: Mirar** `e2e/capturas/ventas-computadora.png` y commitear.

### Task 4: Menú

**Files:**
- Modify: `src/app/admin/(panel)/menu/page.tsx`, `TarjetaDeCategoria.tsx`, `FilaDeProducto.tsx`, `BotonesDeElemento.tsx`
- Modify: `src/lib/menu/pantalla.ts` y `src/lib/menu/pantalla.test.ts`
- Test: `e2e/menu-panel.spec.ts`

**Interfaces:**
- Consumes: Tarea 1 (`Panel`, `Pildora`, `AccionesDelHero`, `BotonDelHero`). El ícono de la categoría es un emoji: va en un `span` con las clases del cuadrado grande, no en `IconoEnCuadrado` (que recibe un ícono de lucide).
- Produces (`pantalla.ts`):
  - `precioDestacado(precios: PrecioVigente[]): string | null`: con una sola presentación con monto, `formatearPesosEnteros(monto)`; con cero, varias o sin monto, `null`.
  - `textoDeCantidad(n: number): string`: `'1 producto'` / `'9 productos'`.

- [ ] **Step 1: Tests.** Puros: `precioDestacado([p('Unidad', 400000)])` → `'$4.000'`; con dos presentaciones → `null`; con `montoCentavos: null` → `null`; `[]` → `null`. `textoDeCantidad(1)`, `(9)`. En vivo, en `e2e/menu-panel.spec.ts`:

```ts
test('las acciones son iconos con su nombre y el precio va grande', async ({ page }) => {
  await page.goto('/admin/menu');
  const editar = page.getByRole('link', { name: `Editar ${nombreDeUnProducto}` });
  await expect(editar).toHaveAttribute('title', `Editar ${nombreDeUnProducto}`);
  await expect(page.getByRole('button', { name: `Ocultar ${nombreDeUnProducto}` })).toHaveText('');
  await expect(page.getByRole('link', { name: 'Nuevo producto' })).toBeVisible();
});
```
(`nombreDeUnProducto`: el producto que la prueba ya siembra en su `beforeAll`.)
- [ ] **Step 2: Verlos fallar** — `npx vitest run --project puros src/lib/menu/pantalla.test.ts` y `npx playwright test e2e/menu-panel.spec.ts -g "acciones son iconos" --project=computadora` → FAIL.
- [ ] **Step 3: Implementar.**
  - Página: hero con `AccionesDelHero` ("Aumento de precios", "Nueva categoría", "Nuevo producto" principal); luego `AvisoDeFudo`, las categorías y "Ver desactivados".
  - `TarjetaDeCategoria`: `Panel` (`aria-labelledby` del `h2` de hoy, conservando el id `categoria-${id}`); cabecera con el emoji en `size-13 rounded-2xl bg-accent/15 grid place-items-center text-2xl`, el nombre `text-xl font-bold`, debajo `[subtitulo, textoDeCantidad(n)]` unidos con " · " en `text-sm text-muted-foreground`, "Oculta" en `Pildora` si aplica, y a la derecha las acciones.
  - `FilaDeProducto`: `px-6 py-4 border-b last:border-b-0 flex flex-col gap-2 md:flex-row md:items-center md:justify-between`. Izquierda: nombre `font-bold` + etiqueta en `Pildora tono="marca"` + "Oculto" en `Pildora`; debajo `textoDePrecios(...)` como hoy (la prueba de hoy lo busca). Derecha: `precioDestacado` en `text-lg font-bold` si no es `null`, y las acciones.
  - `BotonesDeElemento`: cada botón `variant="ghost"` `size-11 rounded-xl text-muted-foreground hover:bg-secondary` con su ícono (`ArrowUp`, `ArrowDown`, `EyeOff`/`Eye`, `Pencil`, `Ban`, tamaño 18, `aria-hidden`), sin texto visible; `aria-label` igual que hoy y `title` igual al `aria-label`. La confirmación de desactivar no cambia. Si el componente pasa de 80 líneas, la fila de botones sale a `IconosDeAcciones.tsx`.
- [ ] **Step 4: Verlos pasar** — comandos del paso 2 → PASS; `npx playwright test e2e/menu-panel.spec.ts --project=computadora` entero → PASS. `npm run tipos`.
- [ ] **Step 5: Mirar** `e2e/capturas/menu-panel-computadora.png` y commitear.

### Task 5: Skill y cierre

**Files:**
- Modify: `.claude/skills/estetica-panel/SKILL.md` (y la descripción del frontmatter: también al armar el cuerpo de una pantalla)
- Modify: `PEDIDOS.md`

- [ ] **Step 1:** Sumar a la skill una sección "Cuerpo de las pantallas" con las piezas de `Piezas.tsx` y sus clases (copiadas de la tarea 1), el bloque oscuro y la regla de acciones como íconos con `aria-label` y `title`. Buscar en las demás skills y en `CLAUDE.md` si algo la contradice (`pre-finish`, paso 7).
- [ ] **Step 2:** `npm run verificar` por partes en primer plano: `npm run lint`, `npm run tipos`, `npx vitest run --project puros`, `npx vitest run --project base` (si la memoria no alcanza, por carpetas), `npm run build`. Todo en verde.
- [ ] **Step 3:** `npm run e2e` entero en computadora y en celular, por grupos en primer plano. Todo en verde.
- [ ] **Step 4:** Mirar las capturas de Inicio, Menú y Ventas en los dos tamaños: nada desbordado ni tapado por las barras fijas.
- [ ] **Step 5:** Con la skill `pre-finish`, mover el pedido 38 a Completados con la fecha y cómo se verificó (y el 37, cuyo cierre queda cubierto por estas mismas corridas). Commit. Crear el PR con `superpowers:finishing-a-development-branch`; el merge (que publica) lo decide Santiago.
