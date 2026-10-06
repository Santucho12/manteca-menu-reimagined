# Pedidos

Registro de todo lo que se pidió para el Sistema Manteca. Las reglas de cómo se mantiene
este archivo están en `CLAUDE.md`.

Un pedido pasa a **Completados** solo cuando se hizo, corrieron todos los tests y se probó
en el navegador con Playwright. Los pedidos sin código (documentación, configuración) se
completan cuando se verificó el resultado, y se anota cómo.

## Todos los pedidos

### 1. Repositorio privado en GitHub
Armar un repo privado de GitHub para el proyecto.

### 2. Base de datos
Crear la base de datos del sistema. Tiene que haber dos: la real y una de pruebas.

### 3. Comparar skills con otros proyectos
Revisar La Pasamos Bien y App repuestos de auto para ver qué skills tienen que acá falten.

### 4. Traer seis skills
Sumar a este proyecto `migracion-supabase`, `pre-finish`, `revision-logica`,
`verificacion-funcional`, `endpoint-staff` y `tests-rls`.

### 5. Reglas de código escritas
Dejar escrito que las funciones no superen las 20 líneas (si no, refactorizar), que los
archivos no sean largos, y que los comentarios y la base de datos estén en español.

### 6. Tests reales contra la base de pruebas
Todos los tests tienen que correr contra la base de datos de pruebas, sin simularla.

### 7. Guía de estilos dentro de la aplicación
Que la aplicación tenga desde el principio una guía de estilos (colores, tipografía,
componentes) con previsualización, que toda la aplicación la use y que se actualice con
cada cambio estético.

### 8. Prueba con Playwright en el chequeo de cierre
Agregar al chequeo de cierre abrir la aplicación con Playwright y probar de verdad lo que
se hizo, tocando los botones. Recién ahí un ítem se da por hecho.

### 9. Registro de pedidos
Tener este archivo con cada pedido (título y resumen), separado en completados y pendientes.

### 10. Que todo esto sea el flujo de trabajo habitual
Que las reglas, la prueba con Playwright y el registro de pedidos se apliquen siempre, sin
tener que pedirlo cada vez.

### 11. Análisis de preparación para empezar
Analizar en detalle la propuesta y todas las skills para determinar si estamos listos para
empezar, si las buenas prácticas están definidas, si falta alguna skill y si hay que pulir
alguna.

### 12. Dejar las skills listas para comenzar
Ajustar las skills con lo definido: usar siempre superpowers, desarrollar con TDD (los
tests van antes), nada de bases simuladas ni mocks, límites de líneas a criterio de Claude,
"hecho" significa probado en local, y `revision-logica` sigue apuntando a `PROPUESTA.md`.
No se agregan skills nuevas.

### 13. Sugerir el stack
Analizar el proyecto y sugerir el stack que convenga.

### 14. Descargar y configurar Playwright, en vivo
Dejar Playwright descargado y configurado para probar la aplicación en el navegador. Las
pruebas se corren en vivo, con la ventana a la vista, para poder verlas.

### 15. Análisis en profundidad de todas las skills
Analizar en detalle absolutamente todas las skills y el proyecto: si estamos listos para
empezar a desarrollar, si las skills van de la mano o se pisan entre sí, y mejorar,
corregir o eliminar lo que haga falta.

### 16. Commitear y pushear lo de hoy
Subir al repo privado, en un commit en `main`, todo lo trabajado hoy: `CLAUDE.md`,
`PEDIDOS.md`, las seis skills y `.mcp.json`. De acá en adelante, los cambios entran por PR
con merge commit.

### 17. Dos reglas nuevas en `CLAUDE.md` y nota en `tests-rls`
Agregar a `CLAUDE.md` que todo spec y todo plan lleven las reglas que les apliquen, y que
la rama se cree antes del spec. Reponer en `tests-rls` la nota de que sus ejemplos todavía
no corrieron contra una base real.

### 18. Enumerar las skills y el `CLAUDE.md`
Listar todas las skills y lo que contiene `CLAUDE.md`.

## Pendientes

| # | Pedido | Qué falta |
|---|---|---|
| 14 | Descargar y configurar Playwright, en vivo | Descargado y probado en vivo (abrió el menú de Manteca y tocó un producto). Creado `.mcp.json` con el servidor de Playwright. La configuración quedó definida en `CLAUDE.md` (navegador a la vista, 300 ms entre acciones, un navegador a la vez). Falta instalar `@playwright/test` dentro del proyecto, al armarlo |
| 2 | Base de datos | Santiago crea las dos bases (pruebas y real) desde el panel de Supabase y pasa los dos identificadores de proyecto. Con eso se fija cada una en su servidor de `.mcp.json` (`supabase-pruebas` y `supabase-real`) y se arma `.env.local` con la de pruebas |
| 6 | Tests reales contra la base de pruebas | La regla está escrita en `CLAUDE.md` y en `pre-finish`. Falta que exista la base de pruebas y la primera suite corriendo contra ella |
| 7 | Guía de estilos dentro de la aplicación | La regla está escrita en `CLAUDE.md` y en `pre-finish`. Falta construir la página, que se hace junto con el inicio de la aplicación |

## Completados

Ninguno de estos tiene código de aplicación, así que no hubo tests ni Playwright que
correr: se anota cómo se verificó cada uno.

| # | Pedido | Fecha | Cómo se verificó |
|---|---|---|---|
| 1 | Repositorio privado en GitHub | 2026-10-06 | `gh repo view` confirma `Santucho12/sistema-manteca` como privado, con `main` sincronizada |
| 3 | Comparar skills con otros proyectos | 2026-10-06 | Se listaron las skills de los dos proyectos y se entregó la comparación |
| 4 | Traer seis skills | 2026-10-06 | Las seis están en `.claude/skills/` y Claude Code las carga |
| 5 | Reglas de código escritas | 2026-10-06 | Están en `CLAUDE.md` y en el paso 4 de `pre-finish` |
| 8 | Prueba con Playwright en el chequeo de cierre | 2026-10-06 | Es el paso 3 de `pre-finish`, obligatorio para dar un ítem por hecho |
| 9 | Registro de pedidos | 2026-10-06 | Este archivo, con su regla en `CLAUDE.md` |
| 10 | Que todo esto sea el flujo de trabajo habitual | 2026-10-06 | Sección "Flujo de trabajo habitual" de `CLAUDE.md`, que se carga en cada sesión |
| 11 | Análisis de preparación para empezar | 2026-10-06 | Análisis entregado en la conversación. No se modificó ninguna skill: las decisiones y los ajustes que surgieron quedan a definir |
| 12 | Dejar las skills listas para comenzar | 2026-10-06 | Cambios en `CLAUDE.md` y en las seis skills, verificados con siete pruebas de presión con subagentes: tres sobre el texto anterior, tres sobre el nuevo y una extra. Todas eligieron lo correcto; los huecos que marcaron se corrigieron. Encabezados de las skills validados |
| 13 | Sugerir el stack | 2026-10-06 | Sugerido y aprobado; quedó escrito en `CLAUDE.md`, sección "Stack", con los comandos del proyecto |
| 15 | Análisis en profundidad de todas las skills | 2026-10-06 | Análisis entregado en la conversación y correcciones aplicadas en `CLAUDE.md` y en las skills. La regla nueva sobre qué manda cuando otra skill o un plugin dice otra cosa se verificó con una prueba de presión: el subagente no creó las bases por el Marketplace de Vercel ni en una organización ajena |
| 16 | Commitear y pushear lo de hoy | 2026-10-06 | Un commit en `main` con `CLAUDE.md`, `PEDIDOS.md`, las seis skills y `.mcp.json`, subido al repo privado. Verificado con `git status` y con el commit visible en GitHub |
| 17 | Dos reglas nuevas en `CLAUDE.md` y nota en `tests-rls` | 2026-10-06 | Las dos reglas quedaron en `CLAUDE.md` ("Flujo de trabajo" y "Git") y la nota en `tests-rls`. Skills validadas y referencias cruzadas sin errores. Entra a `main` por PR |
| 18 | Enumerar las skills y el `CLAUDE.md` | 2026-10-06 | Enumeración entregada en la conversación |
