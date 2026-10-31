# Cambiar de sección más rápido (pedidos 73 y 74)

## Por qué

Santiago (2026-10-29): al pasar de una sección a otra del panel, por ejemplo de Inicio a Caja,
"tarda muchísimo en cargar todo". Medido ese día en su máquina, con la sesión del admin de pruebas:

- Cada consulta a Supabase tarda unos 250 ms, aunque sea mínima. Supabase la procesa en 6 a 12 ms
  (sus registros: `x_envoy_upstream_service_time`); el resto es el viaje hasta Oregón
  (`us-west-2`), donde están las dos bases. Mudarlas es el pedido 75, postergado.
- Cada pantalla espera varias tandas de consultas, una detrás de otra:
  - Control de Caja: perfil → 5 consultas → fondos anteriores. Entre 0,9 y 1,25 s solo de base.
  - Inicio: perfil → 16 consultas. Entre 0,6 y 1,1 s.
  - Gastos: perfil → generar lo vencido → 8 consultas.
  - Detalle de un cierre: perfil → el cierre → su cuenta → el fondo anterior.
- En el navegador, con `npm run dev`: Inicio → Caja entre 1,5 y 1,6 s, y Caja → Inicio entre 1,8 y
  2,5 s. Con `npm run local`: entre 1,42 y 1,45 s, y entre 0,91 y 1,48 s.
- Juntar las tandas, medido contra la base: el control baja de 0,9–1,25 s a 0,27–0,36 s, e Inicio
  de 0,6–1,1 s a 0,35–0,7 s.

## Objetivos

1. Cada pantalla del panel pide sus datos al mismo tiempo que controla el acceso.
2. Las tandas que dependen de otra se juntan donde la regla lo permite: los fondos anteriores del
   control y el fondo anterior del detalle de un cierre.
3. Volver a una sección vista hace menos de 30 segundos la muestra al instante, sin pedírsela de
   nuevo al servidor (pedido 74).

## Fuera de alcance

- Mudar las bases o elegir la región de Vercel (pedido 75).
- Cambiar qué muestra una pantalla o quién la puede ver.
- Cambiar la base: no hay migraciones.
- El marco (`layout.tsx` del panel): se arma al entrar o al recargar, no al cambiar de sección.
- La segunda tanda de Auditoría (`nombresDe`), que depende de la lista. Auditoría hoy figura como
  "Próximamente" en la navegación.

## Lo que no puede pasar

- Que alguien sin permiso vea datos, o vea un error en lugar de ir a la pantalla que le toca.
- Que, después de guardar algo, una sección muestre lo de antes.
- Que un gasto vencido que se genera al abrir Gastos no aparezca en esa misma apertura.

## Diseño

### 1. Acceso y datos a la vez

`src/lib/acceso/enParalelo.ts`, puro, sin base:

- `accesoYLectura(acceso, leer)`: llama a `leer` sin esperar el acceso, en la microtarea siguiente
  (así un `leer` que lanza no se adelanta a la redirección). Espera el acceso y devuelve
  `{ ...acceso, lectura }`, con la lectura todavía en curso.
- `accesoYDatos(acceso, leer)`: lo mismo, pero espera la lectura y devuelve `{ ...acceso, datos }`.
- Sin acceso, gana el error del acceso (la redirección de Next) aunque la lectura también falle, y el
  error de la lectura no queda sin atender.
- Con acceso, si la lectura falla, falla con el error de la lectura, como hoy.

`src/lib/acceso/servidor.ts`:

- `clienteActual`, con `cache` de React: el cliente con la sesión, sin viajar a la base.
  `accesoActual` lo reutiliza, así el layout, la página y la acción de un mismo pedido comparten
  cliente y perfil.
- `exigirPaginaYLeer(pagina, leer)`: `{ cliente, perfil, estado, datos }`. `leer` recibe el cliente.
- `exigirPaginaConLectura(pagina, leer)`: `{ cliente, perfil, estado, lectura }`, para la pantalla
  que decide según el rol si usa los datos (Inicio).

Es seguro porque cada consulta va con la sesión del usuario y la base decide con RLS: quien no
tiene permiso no recibe nada que no pueda ver, y la página igual lo manda a su pantalla antes de
mostrar algo.

### 2. Inicio

Usa `exigirPaginaConLectura('panel', …)`: las consultas de Inicio salen junto con el acceso y solo
el admin las espera. Para Caja o un invitado se descartan.

### 3. Control de cierres

Los fondos anteriores salen en la primera tanda:

- `fondosAnterioresDe(cierres, antesDelRango)`, puro: a cada cierre le corresponde lo que quedó en
  la caja en el último cierre no anulado de una fecha anterior. Es la regla de
  `cierres_fondos_anteriores`. Si no hay uno en el rango, vale lo que quedó antes del rango.
- `fondosDelRango(cliente, desde, hasta)`: lee a la vez los cierres del rango, de todas las
  personas (`cierres_con_resultado` sin persona), y lo que quedó antes del rango
  (`cierres_fondo_sugerido(desde)`). Un test contra la base de pruebas compara su resultado con el
  de `cierres_fondos_anteriores`.

### 4. Detalle de un cierre

Con la fecha del cierre, su cuenta y el fondo anterior salen a la vez: para un solo cierre, el
fondo anterior es `cierres_fondo_sugerido(fecha)`. Solo el admin lo ve, como hoy.

### 5. Gastos

Las listas salen junto con el acceso. Generar lo vencido sigue después del acceso, porque usa la
clave secreta y solo corre para un admin. Si generó algo, las listas se vuelven a leer. Lo común es
que no genere nada, porque pg_cron lo hace a la madrugada.

### 6. Mis cierres

La lista necesita el id de quien entra. Sale de la sesión (`getClaims`, sin viajar a la base), así
la lectura no espera al perfil.

### 7. El resto de las pantallas

Cambian `await exigirPagina(...)` más la lectura por `exigirPaginaYLeer`. Las que no leen nada, o
solo el perfil, siguen con `exigirPagina`.

Un test puro recorre las `page.tsx` del panel y falla si alguna espera el acceso para recién
después leer con el cliente (`const { cliente ... } = await exigirPagina(`).

### 8. El navegador recuerda cada sección 30 segundos (pedido 74)

- `next.config.ts`: `experimental.staleTimes.dynamic = 30`.
- Las acciones ya llaman a `revalidatePath('/admin', 'layout')`, que vacía esa memoria del
  navegador: después de guardar, cada sección se vuelve a pedir.
- Prueba de Playwright: volver a Inicio después de pasar por Caja no hace un pedido nuevo al
  servidor; después de guardar algo, sí.

## Restricciones globales (CLAUDE.md)

- TDD: primero el test, verlo fallar, después el código. El código escrito antes que su test se
  borra y se rehace desde el test.
- Tests sin mocks: nada de `vi.mock`, `vi.fn` como reemplazo, `page.route` ni clientes falsos. Los
  puros usan promesas y temporizadores reales; los `*.base.test.ts`, la base de pruebas con la
  sesión de cada usuario de prueba; cada test siembra y limpia lo suyo.
- Largo: funciones de `.ts` hasta 20 líneas, componentes de `.tsx` hasta 80, archivos hasta 300. Si
  ESLint falla por largo, se divide el código; la regla no se desactiva.
- Español en nombres, comentarios y mensajes; textos de pantalla con voseo.
- Plata en centavos enteros (`number` entero, nombres terminados en `Centavos` o `_centavos`).
- Datos: cada operación con la sesión del usuario y RLS. La clave secreta, solo para generar los
  gastos recurrentes de un admin, como hoy.
- Quién decide: Santiago. Este pedido no toca la base real ni publica.
- Hecho: `npm run verificar` y `npm run e2e` en los dos tamaños, con la aplicación apuntando a la
  base de pruebas. Mientras se construye, cada tarea corre solo sus tests y `npm run tipos`.

## Cómo se verifica que es más rápido

Se repite la medición del 2026-10-29 (scripts de medición fuera del repo) contra `npm run local`
armado con la rama: Inicio → Caja → Inicio, tres vueltas, y los tiempos de cada tanda contra la
base. Los números van a `PEDIDOS.md`.
