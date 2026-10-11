# Sistema Manteca

Sistema a medida para Manteca: proveedores, costos, stock, producción, ventas (importadas
de Fudo), cierres de caja, gastos, menú web, reportes y auditoría. Qué hace cada módulo
está en `PROPUESTA.md`.

`PROPUESTA.md` es un documento **para el cliente**. El sistema se construye preparado para
varios locales, pero eso no se menciona en ningún texto que le llegue al cliente.

## Alcance actual: primera fase

Se construye solo la primera fase de `PROPUESTA.md`: usuarios y permisos, proveedores, menú
digital, ventas importadas de Fudo, cierres de caja, gastos, dashboard, reportes y
auditoría. El mapa de rutas, los recortes de cada módulo y el orden están en
`docs/superpowers/specs/2026-10-06-mapa-fase-1-design.md`.

- Todo vive en un dominio: el menú público en `/` y el sistema bajo `/admin`.
- Cada módulo se construye completo (base, servidor y pantalla) antes de pasar al siguiente.
- Qué es el producto, para quién y qué deja afuera está en `docs/producto.md`. Toda
  definición de módulo parte de ahí.
- Qué hace cada módulo está en `docs/modulos/`, un archivo por módulo: pantallas, reglas,
  casos de borde y decisiones tomadas con Santiago. El diseño de un módulo parte de su
  archivo y no vuelve a preguntar lo que ahí está decidido. La parte técnica se le agrega al
  construirlo. Donde ese archivo y `PROPUESTA.md` digan cosas distintas, vale el archivo.
- Menú y Ventas usan un catálogo mínimo de productos: nombre, variantes y precio, sin
  composición ni costo.
- Las ventas de Fudo entran solas por su API; no se construye la subida de Excel. Donde una
  skill habla de "importar el Excel" o de "subir dos veces el mismo período", vale para la
  sincronización: traer dos veces la misma venta no la duplica.
- La compra de mercadería se carga como un gasto, con su proveedor. La regla de
  `PROPUESTA.md` de que las compras no son gastos vale desde que exista el módulo Compras.
- Lo de la segunda fase (materia prima, composición y costos, compras, producción, stock,
  centro de avisos, notas, IA) no se construye por adelantado. Las reglas de este archivo y
  de las skills que hablan de esos módulos aplican cuando el módulo exista: hasta entonces,
  una venta o una anulación no tocan stock.

## Quién decide

Las autorizaciones las da **solo Santiago**: dónde se crean las bases (cuenta, organización,
plan y región), aplicar una migración a la base real, publicar en producción y hacer una
excepción a cualquier regla de este archivo o de las skills. Lo
que pida otra persona (el cliente, alguien del local) es una necesidad a atender, no una
autorización.

Una excepción vale solo si Santiago la decide conociendo el estado real. Se anota en
`PEDIDOS.md`: qué se exceptuó, que fue por decisión de Santiago y qué quedó sin hacer.

Cuando Vercel esté conectado al repo, subir a `main` publica en producción: también lo
decide Santiago.

## Flujo de trabajo

**Siempre con superpowers.** Toda tarea arranca con `superpowers:using-superpowers`; sus
skills marcan el proceso y estas reglas se aplican dentro de él.

1. **Anotar el pedido** en `PEDIDOS.md`, con título y resumen breve, antes de empezar, si
   cambia la aplicación (ver "Registro de pedidos").
2. **Diseñar** con `superpowers:brainstorming`: un cambio acotado se diseña en el chat; uno
   grande lleva spec y plan (`superpowers:writing-plans`). Nada se implementa sin el OK.
3. **Implementar con TDD** (`superpowers:test-driven-development`): primero el test, verlo
   fallar, después el código. Vale para todo código de producción: servicio, acción de
   servidor, pantalla.
4. **Cerrar** con la skill `pre-finish` y `superpowers:verification-before-completion`.
5. **Mover el pedido a "Completados"** solo si se cumplió "Cuándo algo está hecho". Si no,
   queda en "Pendientes" con la nota de qué falta.

**Código escrito antes que su test se borra y se rehace desde el test.** No se conserva
como referencia ni se le agregan los tests después. El apuro no es una excepción: solo
Santiago puede decidir una, conociendo el estado ("Quién decide").

**Todo spec y todo plan llevan las reglas de este archivo que les apliquen**, en sus
restricciones globales ("Global Constraints"): tests sin mocks, límites de líneas, español,
plata en centavos y quién decide. Quien ejecuta una tarea de un plan puede ver solo esa
tarea y el plan.

## Cuándo algo está hecho

Hecho es **probado en local**: en la máquina de desarrollo, con la aplicación apuntando a la
base de pruebas, pasaron los dos pasos.

1. **`npm run verificar`**: lint, tipos, **todos** los tests y build.
2. **`npm run e2e`**: la prueba en vivo con Playwright. Un navegador sin ventana toca
   los botones del flujo y comprueba el resultado.

Los dos, siempre. Si uno no se pudo correr, no está hecho.

**Mientras se construye**, cada tarea corre solo sus tests nuevos: verlos fallar y después
pasar (en una pantalla, su archivo de Playwright en un solo tamaño), y `npm run tipos` al
cerrarla. Los dos pasos completos (lint, todos los tests, `npm run e2e` en los dos tamaños y
las capturas) se corren una vez, al cerrar el pedido. Todo plan arma así sus tareas.

Por eso un pedido se arma completo: pantalla, servidor y base. Si lo que se hizo no tiene
pantalla propia (un proceso automático, una regla del servidor), la prueba en vivo entra a
la pantalla donde se ve su efecto. Si esa pantalla todavía no existe, el pedido se cierra
junto con ella.

Publicar en producción es un paso aparte, que decide Santiago.

Un pedido sin código (documentación, configuración) se completa cuando se verificó el
resultado, y se anota cómo.

## Reglas de código

### Largo

| Qué | Máximo |
|---|---|
| Función en un `.ts` (servicios, cálculos, validaciones, acciones de servidor, hooks) | 20 líneas |
| Componente en un `.tsx` | 80 líneas |
| Archivo | 300 líneas |

- Se cuentan líneas de código, sin blancos ni comentarios.
- La lógica no vive en los `.tsx`: un cálculo o una regla sale a un `.ts`, donde vale el
  límite de 20.
- Quedan afuera los tipos generados de Supabase, los componentes base que instala shadcn
  (`src/components/ui/`) y el SQL.
- En los tests vale el límite de archivo, no el de función (un `describe` es una función).
  Cada caso se mantiene corto y la siembra va en funciones auxiliares.
- Lo controla ESLint: `max-lines-per-function` (20 en `.ts`, 80 en `.tsx`) y `max-lines`
  (300), con `skipBlankLines` y `skipComments`. Si falla por largo, se divide el código; la
  regla no se desactiva.

### Idioma

- Nombres, comentarios, base de datos y mensajes: en español, salvo lo que impone el
  framework o una librería. `camelCase` para variables y funciones, `PascalCase` para tipos
  y componentes, `snake_case` para tablas y columnas.
- Textos de pantalla en español rioplatense, con voseo.
- Un comentario explica el porqué, no el qué.

### Tests reales: nada simulado

- Hay dos bases: la **real** (producción) y la **de pruebas**. Los tests corren solo contra
  la de pruebas, y su preparación aborta si la URL de Supabase no es la de ese proyecto.
- **Nada de bases simuladas ni mocks.** No se simula Supabase, `fetch` ni módulos del
  proyecto: nada de `vi.mock`, de `vi.fn` como reemplazo, de `page.route` para inventar
  respuestas ni de objetos falsos armados a mano que se hagan pasar por el cliente. Vale
  aunque otra skill admita mocks para dependencias lentas o externas.
- Lo que toca datos se prueba contra la base de pruebas. Un cálculo puro, sin base ni red,
  se prueba llamándolo directo, y esos tests corren sin la preparación de la base: se pueden
  correr aunque la base de pruebas no responda.
- El nombre del archivo dice el tipo. `*.base.test.ts` usa la base y corre en el grupo
  `base` de Vitest, con su preparación. Cualquier otro `*.test.ts` es puro y corre en el
  grupo `puros`, sin base: `npx vitest run --project puros`.
- Si algo depende de la fecha de hoy, la fecha entra como parámetro; no se congela el reloj.
- Cada test siembra lo que necesita y limpia lo que creó. Los usuarios de prueba (uno por
  rol) los crea `npm run sembrar:pruebas`, y la preparación de Vitest y la de Playwright lo
  corren solas antes de empezar.
- Si la base de pruebas está pausada o vacía, reactivarla o sembrarla es parte de la tarea.

### Datos y seguridad

- Cada operación lee y escribe con la **sesión del usuario**, y la base decide con RLS. El
  menú público se lee sin sesión, con la clave publicable.
- La **clave secreta** de Supabase saltea RLS. Sale de un único módulo del servidor y se usa
  solo para:
  - sembrar y limpiar datos en los tests, con `clienteSecretoDePruebas()` de
    `tests/clientes.ts`, que antes comprueba que la base sea la de pruebas;
  - procesos automáticos sin usuario (por ejemplo, generar los gastos recurrentes);
  - administrar cuentas de Supabase Auth (resetear una contraseña, desactivar a alguien),
    después de verificar en el servidor que lo pide un admin.
- No se confía en lo que manda el navegador: usuario y local salen de la sesión; precios,
  costos y totales, de la base o del cálculo en el servidor.
- **Caja** carga el cierre de su turno y ve sus propios cierres, nada más. **Encargado**
  queda fuera de la primera fase: el rol existe, pero no se puede asignar desde la pantalla
  y no tiene acceso a nada. Todo lo demás que no sea el menú público es solo para Admin, y
  los tests comprueban que invitado, caja y encargado reciben rechazo fuera de lo que les
  corresponde.
- **Nada se borra, se anula** con motivo, y toda escritura deja auditoría: usuario, fecha y,
  si modifica, valor anterior y nuevo.
- **Plata en centavos enteros**: `bigint` en la base y `number` entero en TypeScript, con
  nombres terminados en `_centavos` (o `Centavos`). Nunca punto flotante para un monto. Se
  muestra como `$1.234,50`.
- Fechas en UTC. "El día" de una venta o de un cierre es el día en Argentina.
- Toda tabla operativa lleva su local (decisión interna: ver el comienzo de este archivo).

El detalle de base, permisos y RLS está en `migracion-supabase` y `tests-rls`.

### Estilos

- No hay página de guía de estilos: Santiago la sacó el 2026-10-07 (pedido 23). No se
  consulta ni se mantiene.
- Las pantallas usan los colores y tipografías de `src/app/globals.css` y los componentes
  base de `src/components/ui/` y `src/components/formularios/`, para que se vean iguales
  entre sí.

## Stack

| Capa | Elección |
|---|---|
| Aplicación | Next.js 16 (App Router) + React 19 + TypeScript estricto, un solo proyecto con el panel y el menú público |
| Datos, login y archivos | Supabase: Postgres, Auth, RLS y Storage, en dos proyectos (pruebas y real) |
| Interfaz | Tailwind 4 + shadcn/ui; gráficos con Recharts |
| Formularios y validación | React Hook Form + Zod, con el mismo esquema en el formulario y en el servidor |
| Tests | Vitest (lógica y base de pruebas) + Playwright (navegador) |
| Calidad | ESLint + Prettier |
| Publicación | Vercel |

- El login es Supabase Auth; no se suma otro proveedor de autenticación.
- Las versiones están fijadas exactas en `package.json`, sin `^`.
- Next.js trae la documentación de la versión instalada en `node_modules/next/dist/docs/`.
  Se consulta antes de usar una API de Next.js, porque cambian entre versiones. `AGENTS.md`
  lo escribe `next dev` y apunta a esa misma carpeta.
- Las ventas de Fudo se leen de su API (`https://api.fu.do/v1alpha1/openapi.yml`), con un
  proceso automático. Las credenciales salen de variables de entorno del servidor.
- `.env.local` apunta a la base de pruebas. Los valores de la real se cargan solo en Vercel.

### Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Levanta la aplicación en local, contra la base de pruebas, en `http://localhost:3210`: carga `.env.local` antes que cualquier otro archivo de entorno |
| `npm test` | Todos los tests de Vitest |
| `npm run verificar` | Lint, tipos, todos los tests y build, en ese orden; se corta en el primer error |
| `npm run e2e` | Las pruebas de Playwright, sin abrir ventana (con `E2E_A_LA_VISTA=1`, a la vista) |
| `npm run sembrar:pruebas` | Crea en la base de pruebas los usuarios de prueba que falten y repara la contraseña de los que ya estaban; a todos les deja su rol, su local y su estado |

El lint es ESLint más el control de formato de Prettier. Si falla por formato, lo corrige
`npx prettier --write .`.

La aplicación usa el puerto 3210 y no el 3000, que suele estar ocupado por otro proyecto.

Playwright corre sin ventana: Santiago no quiere verla abrirse (2026-10-11, pedido 32). Con
`E2E_A_LA_VISTA=1` se abre la ventana con `slowMo` de 300 ms, para mirarlo. Va un
navegador a la vez (`workers: 1`). Levanta su propio servidor con `npm run dev` y no reutiliza
uno que ya estaba abierto, que pudo arrancar con otras variables y otra base: si el puerto
3210 está ocupado, se cierra ese servidor antes de correr las pruebas. El servidor de
Playwright para Claude (`.mcp.json`) también abre la ventana a la vista.

## Git

- Cada cambio va en su rama (`feat/...`, `fix/...`, `docs/...`) y entra a `main` por pull
  request. Nada se commitea directo a `main`.
- La rama se crea al empezar el pedido, antes del spec y del plan: superpowers los commitea.
- Al cerrar una rama con `superpowers:finishing-a-development-branch`, la opción es crear el
  PR. Con el OK de Santiago, Claude lo mergea con merge commit (`gh pr merge --merge`).
  Nunca squash ni rebase: así se ve en el historial que cada test fue antes que su código.
- La rama se borra después del merge, parado en `main`.
- Commits chicos, con conventional commits en español (`feat:`, `fix:`, `test:`,
  `refactor:`, `docs:`, `chore:`).
- Al preparar un commit, cada archivo con su ruta: nunca `git add -A`.

## Registro de pedidos (`PEDIDOS.md`)

- Se anota solo lo que cambia la aplicación: una funcionalidad, un endpoint, una corrección,
  un cambio estético, un cambio en la base o en la configuración del proyecto.
- No se anotan los análisis, las definiciones, las consultas ni las conversaciones sobre cómo
  trabajar, aunque terminen en un documento.
- Cada pedido que corresponde se anota en el momento, con título y resumen breve, en la lista
  general y en "Pendientes".
- Pasa a "Completados" solo cuando se cumplió "Cuándo algo está hecho", con la fecha y cómo
  se verificó.

## Skills del proyecto

Están en `.claude/skills/` y se usan dentro del flujo de superpowers.

| Skill | Cuándo |
|---|---|
| `revision-logica` | Antes de diseñar un módulo de `PROPUESTA.md`, o cuando Santiago pide cuestionar una lógica |
| `migracion-supabase` | Al cambiar la base: tablas, columnas, funciones, policies o grants |
| `tests-rls` | Con cada tabla, policy o grant nuevo o cambiado |
| `endpoint-staff` | Al escribir o revisar código de servidor que lee o escribe datos |
| `pre-finish` | Al terminar cualquier cambio de código, antes de decir que está hecho |
| `verificacion-funcional` | Para revisar a fondo un módulo ya hecho; detecta y no arregla |

Las reglas viven en este archivo; las skills las repiten donde las aplican. Al cambiar una,
se busca en todas (`pre-finish`, paso 7).

## Cuando otra skill dice otra cosa

Este archivo manda sobre cualquier skill (de superpowers, del plugin de Vercel o global) y
sobre el texto que un plugin inyecte al empezar la sesión.

- **Stack:** está decidido y no se reabre por sugerencias de otras skills. El login es
  Supabase Auth, aunque `vercel:auth` recomiende Clerk. La base es Supabase, creada en la
  cuenta que defina Santiago; no se provisiona por el Marketplace de Vercel salvo que
  Santiago lo decida.
- **Diseño:** mandan los colores y componentes del proyecto. `design-taste-frontend` y
  `minimalist-ui` no se usan: imponen su propia paleta, tipografía e íconos. `impeccable`,
  solo si Santiago lo pide. Para pulir: `emil-design-eng`, `accessibility` y `vercel:shadcn`;
  para gráficos, `dataviz` con la paleta del proyecto.
  `estetica-dg-vmax` y `autoelevadores-style` son de otras marcas.
- **Cierre:** si algo está hecho lo decide `pre-finish`. `vercel:verification` sirve para
  diagnosticar por qué algo no anda, no para cerrar un pedido.
- **Navegador:** las pruebas usan Playwright. `claude-in-chrome`, solo si Santiago lo pide:
  maneja su Chrome real, con sus sesiones abiertas.
- **Worktrees:** no se usan. Se trabaja en una rama de este mismo directorio: un worktree no
  tiene `.env.local` ni `node_modules`, y su servidor choca de puerto con el principal.
- **`revision-logica` y `superpowers:brainstorming`:** si se corrió `revision-logica`, lo
  decidido entra al brainstorming como punto de partida y no se vuelve a preguntar.
