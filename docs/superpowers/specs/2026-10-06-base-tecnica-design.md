# Base técnica y guía de estilos

Fecha: 2026-10-06. Pedido 19 de `PEDIDOS.md`. Primer paso del orden de construcción
(`2026-10-06-mapa-fase-1-design.md`). Rama `feat/base-tecnica`.

## Objetivo

Dejar el proyecto armado para que cada módulo arranque directo en su lógica: aplicación
creada, reglas de código controladas por el lint, los tres tipos de test andando contra la
base de pruebas, y la guía de estilos con la identidad de Manteca.

No tiene pantallas del negocio.

## Qué se construye

### 1. Proyecto

- Next.js 16 con App Router, React 19 y TypeScript estricto, en la raíz del repo, con el
  código en `src/`.
- Tailwind 4 y shadcn/ui.
- Las versiones se fijan exactas en `package.json`, sin `^`. Se parte de la última estable
  de cada paquete. Si una versión mayor nueva no es compatible con Next.js 16, se usa la más
  alta que sí lo sea y el plan anota cuál y por qué.
- `.gitignore` con `.env.local`, `node_modules`, `.next` y los resultados de Playwright.

### 2. Calidad

- ESLint con `max-lines-per-function` (20 en `.ts`, 80 en `.tsx`) y `max-lines` (300), los
  dos con `skipBlankLines` y `skipComments`.
- Quedan afuera de esas reglas `src/components/ui/` y los tipos generados de Supabase.
- En los archivos de test vale `max-lines` y no `max-lines-per-function`.
- Prettier.

### 3. Comandos

| Comando | Qué corre |
|---|---|
| `npm run dev` | La aplicación en local, contra la base de pruebas |
| `npm test` | Todos los tests de Vitest |
| `npm run verificar` | Lint, tipos, todos los tests de Vitest y build, en ese orden; se corta en el primer error |
| `npm run e2e` | Playwright, con el navegador a la vista |
| `npm run sembrar:pruebas` | Crea en la base de pruebas las cuentas de prueba que falten |

### 4. Tests

Tres tipos. Ninguno simula nada.

| Tipo | Herramienta | Qué prueba | Necesita la base |
|---|---|---|---|
| Puro | Vitest, grupo `puros` | Cálculos y reglas sin base ni red: plata, fechas, validaciones | No |
| Contra la base | Vitest, grupo `base` | Lo que lee o escribe datos: RLS, servicios, acciones de servidor | Sí, la de pruebas |
| En vivo | Playwright | El flujo completo en el navegador, tocando botones | Sí, la de pruebas |

- Los puros son archivos `*.test.ts`. Los que usan la base, `*.base.test.ts`.
- El grupo `puros` corre sin preparación, aunque la base no responda.
- La preparación del grupo `base` y la de Playwright hacen dos cosas antes de empezar:
  comprueban que la URL de Supabase sea la del proyecto de pruebas, y abortan si no lo es; y
  corren `sembrar:pruebas`.
- Una pantalla se prueba con Playwright: su prueba se escribe primero y se la ve fallar. La
  lógica de una pantalla vive en un `.ts` y se prueba con Vitest. No se suma una librería
  para probar componentes sueltos.
- Playwright: `headless: false`, `slowMo` de 300 ms, `workers: 1`, y levanta la aplicación
  solo. Dos tamaños de pantalla: computadora y celular.

### 5. Entorno y Supabase

Variables, con `.env.example` en el repo:

| Variable | Qué es | Sensible |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto | No |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Clave publicable | No |
| `SUPABASE_SECRET_KEY` | Clave secreta; saltea RLS | Sí |
| `SUPABASE_REF_PRUEBAS` | Identificador del proyecto de pruebas, para la comprobación | No |
| `CONTRASENA_USUARIOS_PRUEBA` | Contraseña de las cuentas de prueba | Sí |

- Las variables se validan con Zod al leerlas. Si falta una, el error dice cuál.
- Las públicas y las del servidor se leen en módulos separados.
- En este paso se construye un solo cliente de Supabase: el de la clave secreta, que usa la
  siembra. Los tests usan además un cliente firmado como cada cuenta de prueba.
- El cliente del navegador y el del servidor con la sesión del usuario llegan en el paso 2,
  con el login: acá no habría nada que los use ni un test que los pida.
- La clave secreta se usa en un único módulo. Nada más la lee.
- `.env.local` apunta a la base de pruebas. Claude carga la URL, la clave publicable, el
  identificador y una contraseña generada. La clave secreta la carga Santiago.

### 6. Cuentas de prueba

`sembrar:pruebas` crea en Supabase Auth, si faltan, seis cuentas
`prueba.<rol>@manteca.test`: `invitado`, `caja`, `encargado`, `admin`, `adminOtroLocal` y
`desactivado`.

En este paso son solo cuentas: todavía no existe la tabla de usuarios. El rol, el local y el
estado se les asignan en el paso 2.

Antes de crear nada comprueba que la base sea la de pruebas.

### 7. Guía de estilos

**Tokens**, tomados de `styles.css` de la página actual de Manteca:

- Colores: fondo crema, texto y primario marrón, secundario, apagado, acento dorado
  `#BFA042`, destructivo, borde.
- Tipografías: Manic para títulos y Neufile Grotesk para texto. Los archivos se copian a
  `public/fonts/`, sin los duplicados.
- Radio base de 0,75 rem, con su escala.
- Sombras y espaciados: se definen acá, porque la página actual no los tiene como tokens.

No se traen de esa página los estilos del menú público (tarjeta de producto, portada,
animaciones): llegan con el menú, en el paso 3.

**Componentes base**, de shadcn/ui sobre esos tokens: botón, campo con su etiqueta, tarjeta,
tabla, aviso y etiqueta.

**Página `/admin/guia-de-estilos`**: muestra cada color con su nombre, las dos tipografías
en sus tamaños, los radios, las sombras, los espaciados y cada componente en sus variantes,
tal como se ven.

En este paso la página queda abierta. El paso 2 la pone detrás del login.

### 8. Utilidades

| Función | Qué hace |
|---|---|
| Mostrar plata | De centavos enteros a `$1.234,50` |
| Día en Argentina | De una fecha en UTC al día calendario en Argentina |

Las dos reciben todo por parámetro: ninguna lee el reloj.

### 9. Página de inicio provisoria

`/` muestra el nombre de Manteca y nada más. El menú público la reemplaza en el paso 3.

## Estructura de carpetas

```
src/app/                    rutas
src/app/admin/guia-de-estilos/
src/components/ui/          componentes de shadcn
src/components/guia/        secciones de la página de la guía
src/lib/plata.ts
src/lib/fechas.ts
src/lib/entorno/            lectura y validación de variables
src/lib/supabase/           el cliente de la clave secreta
scripts/sembrar-pruebas.ts
tests/                      preparación del grupo base y auxiliares
e2e/                        pruebas de Playwright y su preparación
public/fonts/
```

Los tests puros van al lado del archivo que prueban.

## Pruebas de este paso

| Qué | Tipo | Comprueba |
|---|---|---|
| Mostrar plata | Puro | Cero, centavos sueltos, miles, millones y negativos |
| Día en Argentina | Puro | Una venta de las 23:30 y otra de las 00:30 de Argentina caen en días distintos |
| Validación de variables | Puro | Con una variable faltante, el error la nombra |
| Comprobación de la base | Puro | Acepta la URL del proyecto de pruebas y rechaza cualquier otra |
| Cuentas de prueba | Contra la base | Cada una de las seis puede iniciar sesión con la clave publicable |
| Sembrar dos veces | Contra la base | La segunda corrida no crea cuentas ni falla |
| Guía de estilos | En vivo | La página abre, muestra cada sección y cada componente, en computadora y en celular, con capturas revisadas |
| Inicio provisorio | En vivo | `/` abre y muestra el nombre |

## Cuándo está hecho

Pasaron `npm run verificar` y `npm run e2e` en local, contra la base de pruebas.

Al cerrar se actualiza `PEDIDOS.md`: el 19, y los que dependían de este paso (2, 6, 7 y 14).

## Qué hace falta de Santiago

- La clave secreta del proyecto de pruebas, cargada por él en `.env.local`. Sin ella no
  corren las cuentas de prueba ni, por lo tanto, `verificar` ni `e2e`.

## Fuera de alcance

- Login, registro, sesión y protección de rutas.
- Cualquier tabla, migración o policy.
- El menú público y la navegación de `/admin`.
- Gráficos.
- Conectar Vercel y publicar.
- Integración continua en GitHub.

## Cambios durante la implementación

Lo que se resolvió distinto de lo escrito arriba, y por qué.

| Tema | Cómo quedó | Por qué |
|---|---|---|
| Puerto | La aplicación usa el 3210, en `npm run dev` y en Playwright | El 3000 lo ocupaba otro proyecto, y Playwright prueba contra lo que encuentre escuchando |
| Versiones | ESLint 9.39.5 y TypeScript 6.0.3 | Son las más altas que acepta `eslint-config-next` 16.4.0 |
| Lint | `npm run lint` corre ESLint y el control de formato de Prettier | Sin control, el formato se desordena |
| Clave secreta | Se lee y se usa en `src/lib/supabase/secreto.ts`; no hay un módulo general de variables del servidor | Un test exige que un solo módulo la nombre |
| Guía | Suma una muestra con acentos y eñe, los botones en tres tamaños y un aviso informativo | El spec pide cada componente en sus variantes |
| Indicador de Next.js | Oculto (`devIndicators: false`) | Tapaba contenido en la captura de celular |
| `AGENTS.md` | Se commitea | Lo genera `next dev` y apunta a la documentación de la versión instalada |
| Dependencias | `shadcn` y `tw-animate-css` van en `devDependencies` | Solo aportan estilos al compilar |
| Espera de Playwright | Por el puerto y no por una URL | Una ruta que todavía no existe responde 404, y Playwright no la da por lista |
| Tipos de Node | `@types/node` 24, no 26 | El proyecto corre en Node 24 |
| Estilo de shadcn | Base radix con el preset nova, que trae el paquete `cn` en lugar de `clsx` y `tailwind-merge` | Su instalador cambió las opciones |
| Entorno de los tests | El grupo `base` no carga variables por su cuenta: hereda las que cargó y comprobó la preparación. Además, cada cliente de los tests (`clienteComo`, `clienteSecretoDePruebas`) vuelve a comprobar la base | La revisión encontró que un `.env.test.local` podía cambiar la base después de la comprobación |
| `.gitignore` | Ignora todos los `.env*`, salvo `.env.example` | Un `.env` con la clave secreta podía terminar en el repo |
| Colores con contraste | El texto sobre el dorado pasa a marrón oscuro; el rojo de error, el anillo de foco y el borde de los campos, un poco más oscuros. Los componentes pintan el anillo entero, no al 50 %. `tests/contraste.test.ts` lo controla | Contraste de accesibilidad: 4,5 a 1 para texto y 3 a 1 para controles (pedido 21) |

Dos hallazgos que quedan para decidir con las primeras pantallas del panel:

- **Manic no dibuja acentos ni la eñe.** El archivo de la fuente manda cada vocal acentuada
  y la eñe al glifo sin tilde, y no tiene `¿` ni `¡`. Todo título en Manic los pierde:
  «Cafetería» se ve «Cafeteria». La guía lo muestra. La propuesta es usar Neufile Grotesk
  para los títulos del panel y dejar Manic para la marca.
- **Tamaño táctil.** El botón y el campo miden 32 px de alto, y el botón grande 36 px. Para
  las pantallas que se usan desde el celular conviene llevarlos a 44 px en pantallas
  táctiles. El login es la primera.

## Restricciones globales

Reglas de `CLAUDE.md` que valen para este spec y su plan.

- **Quién decide:** solo Santiago autoriza dónde se crean las bases, aplicar una migración a
  la base real, publicar en producción y cualquier excepción a las reglas.
- **TDD:** primero el test, verlo fallar, después el código. Código escrito antes que su
  test se borra y se rehace. Vale para las utilidades, el script de siembra y la página.
- **Tests sin mocks:** nada de `vi.mock`, `vi.fn` como reemplazo, `page.route` ni clientes
  falsos. La fecha entra como parámetro; no se congela el reloj.
- **Hecho es probado en local:** `npm run verificar` y `npm run e2e`, los dos.
- **Largo:** 20 líneas por función en `.ts`, 80 por componente en `.tsx`, 300 por archivo. La
  lógica no vive en los `.tsx`. Si el lint falla por largo, se divide el código.
- **Idioma:** nombres, comentarios y mensajes en español; pantallas en rioplatense con voseo.
  Un comentario explica el porqué.
- **Plata en centavos enteros:** `number` entero en TypeScript, nombres terminados en
  `Centavos`. Nunca punto flotante para un monto.
- **Clave secreta:** en un único módulo del servidor, solo para sembrar y limpiar en tests,
  procesos automáticos y administrar cuentas.
- **Bases:** los tests corren solo contra la de pruebas. Nunca se usa el servidor MCP
  `supabase` general: solo `supabase-pruebas` y `supabase-real`.
- **Guía de estilos:** ninguna pantalla define colores, tipografías ni medidas sueltas.
- **Worktrees:** no se usan. Se trabaja en la rama `feat/base-tecnica` de este directorio.
- **Git:** commits chicos con conventional commits en español, cada archivo con su ruta;
  nunca `git add -A`. A `main` por pull request con merge commit, con el OK de Santiago.
