# Cierres de caja por turno, con traba a la hora del cierre (pedido 98)

Pedido de Santiago, 2026-11-19. Salió de una revisión lógica en el chat:
- Santiago decidió que hay dos turnos y que cada uno corta a una hora fija y configurable.
- También decidió que a esa hora la app se traba hasta cargar el cierre, con «Postergar 10 min»
  sin límite.
- Para el resto dijo «resolvé todo de la mejor forma que consideres». Lo que decidió quien
  construye está marcado **(decisión al construir)**, para que Santiago lo revise.

La sección de PedidosYa dentro del cierre (cantidad de pedidos y total contra lo cargado) **no
entra acá**: va con el pedido 91, porque hoy Caja no carga pedidos de PedidosYa.

## Por qué

Manteca hace dos cierres por día, uno al mediodía y otro a la noche. Hoy el sistema acepta un
cierre por día y compara lo contado con todo lo vendido en el día: el cierre del mediodía da
faltantes y sobrantes falsos.

## Global Constraints

- **Tests sin mocks:** nada de `vi.mock`, `vi.fn`, `page.route` ni objetos falsos. Lo que toca
  datos se prueba contra `mantecatest`, la base de esta computadora (`CLAUDE.local.md`). Los
  cálculos puros se prueban llamándolos directo, en el grupo `puros`.
- **La hora entra como parámetro:** donde algo depende de la hora, entra como parámetro. No se
  congela el reloj. En SQL, las funciones de cálculo reciben el momento; las que usa la app
  pasan `now()`.
- **Largo:** función en `.ts` hasta 20 líneas, componente `.tsx` hasta 80 y archivo hasta 300.
  Lo controla ESLint, y si falla se divide el código, no se apaga la regla.
- **Español:** nombres, comentarios, base y mensajes en español; textos de pantalla en
  rioplatense, con voseo.
- **Plata en centavos enteros:** `bigint` en la base y `number` entero en TypeScript, con
  nombres terminados en `_centavos`.
- **Datos y seguridad:**
  - Todo se lee y se escribe con la sesión, y la base decide con RLS.
  - La traba la decide el servidor, no la pantalla.
  - Caja no ve lo vendido: el estado del turno le dice si está trabado, nunca un monto.
- **Nada se borra:** una postergación es una fila nueva. Toda escritura deja auditoría.
- **TDD:** primero el test, verlo fallar y después el código.
- **Quién decide:** Santiago. Por excepción suya, este pedido va en el worktree
  `orca/manteca-cierres-por-turno`, rama `feat/cierres-por-turno`:
  - nunca `git push`;
  - al terminar entra al `main` local con merge commit;
  - la migración se aplica solo a `mantecatest`;
  - no se corre `npm run e2e` a la vez que la otra sesión.
- **Hecho** es `npm run verificar` y `npm run e2e` en verde, contra `mantecatest`.

## Decisiones

### Turnos y horas

1. **Dos turnos por día: Mediodía (1) y Noche (2).** Cada uno tiene su hora de cierre en
   `configuracion_de_caja`, y el admin las cambia en Control de cierres, junto a la tolerancia.
   - **Valores iniciales: 16:00 y 23:00.** No se sabe a qué hora cierra Manteca, así que son
     solo un punto de partida **(decisión al construir)**.
2. **Las horas van dentro del mismo día.** La del mediodía va antes que la de la noche, y la de
   la noche no pasa de las 23:59. Así se respeta que el día de una venta es el día en Argentina.
   - **Es un supuesto:** si alguna vez cierran después de medianoche, se agrega aparte
     **(decisión al construir)**.

### A qué turno va cada venta

3. **Cada venta guarda su turno, y lo pone el servidor al cobrarla** (columna `ventas.turno`).
   - Una venta del mostrador va al Mediodía si el Mediodía de hoy no tiene cierre. Si lo tiene,
     va a la Noche.
   - Lo vendido mientras se posterga queda en el Mediodía, que es el cajón que se va a contar.
   - Guardar la venta con su turno, y no calcularlo por la hora, hace que anular y volver a
     cargar un cierre no cambie qué ventas le tocan **(decisión al construir)**.
4. **Turno sin ventas = no abrió.** Si pasa la hora del Mediodía sin ninguna venta cobrada en la
   caja en ese turno, no hay traba: las ventas siguientes van directo a la Noche y el Mediodía
   no queda pendiente.
   - Un día que abre solo a la noche no pide un cierre en cero **(decisión al construir)**.
5. **Venta a mano con «Se cobró en la caja del local» marcada:** aparece «Turno», con Mediodía
   y Noche.
   - Si la fecha es hoy, viene elegido el turno abierto. Si es un día anterior, viene Noche.
   - Sin la casilla marcada, el turno no se muestra y la venta queda en Noche, como dato sin
     uso.

### La traba

6. **Cuándo está trabado el mostrador.** Hay tres casos, y el servidor rechaza la venta en los
   tres:
   - **Llegó la hora:** pasó la hora del turno abierto, ese turno tiene ventas en la caja, no
     tiene cierre y no hay una postergación vigente. Código `PV303`: «Es hora del cierre del
     mediodía» o «… de la noche».
   - **Quedó una caja anterior sin cerrar:** el último turno con ventas de un día anterior no
     tiene cierre.
     - Pasa, por ejemplo, si a la noche se fueron sin cerrar: a la mañana la caja tiene todavía
       la plata de anoche. Se carga ese cierre o se posterga. Código `PV303`, con el día y el
       turno **(decisión al construir)**.
     - Solo cuenta el último turno con ventas. Un turno más viejo sin cierre sigue pendiente en
       el control, pero no traba.
     - Un día marcado «No abrió» no traba.
   - **Ya se cerró la Noche de hoy:** no se vende hasta mañana. Código `PV304`: «La caja de hoy
     ya cerró». Si hace falta seguir vendiendo, el admin anula el cierre de la noche y la caja
     se reabre **(decisión al construir)**.
7. **Postergar.** «Postergar 10 min» da 10 minutos más desde el momento del toque, sin límite de
   veces.
   - Cada toque es una fila de `postergaciones_de_cierre` (quién, qué turno, desde y hasta), con
     auditoría.
   - La postergación no pasa de las 23:59 del día. Después de medianoche, la Noche anterior sin
     cierre traba igual por la regla 6, y se posterga de nuevo.
   - Pueden postergar Caja y el admin.
8. **A quién traba** **(decisión al construir)**:
   - **Vender** muestra la ventana encima del mostrador, para Caja y para el admin.
   - **Caja** la ve además en todas sus pantallas, salvo **Cargar cierre**, que tiene que poder
     usar.
   - **Al admin** no se le traba nada más. Gastos, Reportes, Menú y lo demás no tocan la caja.
9. **La ventana** dice, por ejemplo, «Son las 16:00: es hora del cierre del mediodía». Tiene dos
   botones: «Hacer el cierre», que lleva a Cargar cierre con el turno elegido, y
   «Postergar 10 min».
   - Con una postergación vigente, el mostrador muestra arriba «Cierre del mediodía postergado
     hasta las 16:20».
   - El ticket armado no se pierde: la ventana va encima y, al postergar, se cobra.
10. **La pantalla se entera sola.**
    - Al entrar, el servidor manda el estado del turno: el turno abierto, si está trabado y por
      qué, hasta cuándo está postergado y la próxima hora de corte.
    - La pantalla vuelve a preguntar cuando llega esa hora o cuando vence la postergación, y
      además cada minuto.
    - Si una venta se rechaza con `PV303` o `PV304`, la ventana aparece en el momento.

### Cargar el cierre

11. **Un cierre por turno.** El índice único pasa a `(local_id, fecha, turno)` entre los no
    anulados. El segundo cierre del mismo turno se rechaza (`PC302`) con «Ya hay un cierre
    cargado para ese turno. Si está mal, lo corrige un administrador desde el control de
    cierres.».
12. **El turno viene elegido.**
    - Cargar cierre trae el turno abierto de hoy: el primero sin cierre que tiene ventas o que
      todavía no llegó a su hora.
    - Cuando un día anterior quedó sin cerrar, como en la regla 6, trae ese día y ese turno.
    - La pantalla muestra «Cierre del mediodía» o «Cierre de la noche» arriba de la fecha, y se
      puede cambiar con dos botones.
13. **Rechazos al guardar:**
    - un turno de hoy cuya hora no llegó se puede cerrar antes (cierran temprano);
    - la Noche de hoy no se carga si el Mediodía tiene ventas en la caja y no tiene cierre
      (`PC307`: «Primero cargá el cierre del mediodía»);
    - un día futuro sigue rechazado (`PC301`).
14. **El fondo inicial** viene precargado con lo que quedó en el cierre anterior, contando el
    turno:
    - la Noche, con lo que dejó el Mediodía del mismo día;
    - el Mediodía, con lo que dejó la última Noche.
    - «Fondo distinto» sigue avisando como hoy.
15. **Lo esperado de un cierre** son las ventas de su fecha y de su turno cobradas en la caja.
    Lo demás no cambia.
16. **El turno de un cierre no se edita:** se anula y se carga de nuevo. Anular un cierre libera
    su turno.

### Ver los cierres

17. **Control de cierres:**
    - Una fila por cierre, con la columna «Turno».
    - Los pendientes pasan a ser **turnos pendientes**: un turno con ventas en la caja, sin
      cierre, de un día que no está marcado «No abrió», y cuya hora ya pasó.
      - Cada uno tiene «Cargar cierre», que lleva a la carga con ese día y ese turno.
      - Un día sin ventas ya no queda pendiente, porque ahora las ventas se cargan al cobrar
        **(decisión al construir)**.
    - «No abrió» sigue marcando el día entero.
    - El detalle de un cierre muestra sus postergaciones: «Se postergó 3 veces (30 min), la
      primera a las 16:00».
18. **Mis cierres (Caja):** la columna «Turno».
19. **Inicio:**
    - El aviso pasa a «Ayer quedó sin cargar el cierre de la noche» (o del mediodía, o de los dos
      turnos).
    - La diferencia de ayer suma las de sus turnos, medio por medio, sin compensar un faltante
      con un sobrante.
20. **Reporte de Caja:** una fila por cierre, con su turno. Los días sin cierre pasan a ser los
    turnos pendientes de la regla 17.

### Lo que ya existe

21. **Las ventas y los cierres anteriores quedan como turno Noche.** Un día viejo sigue cerrando
    igual que antes, y no aparecen mediodías pendientes hacia atrás.

## Parte técnica

### Base (migración `20261119130000_cierres_por_turno`, con su reversa)

- **`configuracion_de_caja`:** columnas nuevas.
  - `hora_cierre_mediodia time not null default '16:00'` y
    `hora_cierre_noche time not null default '23:00'`.
  - Un check: el mediodía va antes que la noche.
  - Las cambia solo el admin activo, como la tolerancia, con auditoría.
- **`ventas.turno`** y **`cierres_de_caja.turno`:**
  - `smallint not null default 2 check (turno in (1, 2))`;
  - el índice `cierres_de_caja_un_dia` pasa a `cierres_de_caja_un_turno (local_id, fecha, turno)
    where not anulado`.
- **`postergaciones_de_cierre`** (`id`, `local_id`, `fecha`, `turno`, `postergado_por`,
  `desde`, `hasta`, `fecha_creacion`):
  - RLS: el admin activo ve las de su local, y Caja activa las suyas;
  - nadie inserta directo, ni actualiza ni borra;
  - trigger `auditar`.
- **Funciones nuevas** (`security definer`, `search_path = ''`, solo `authenticated`):
  - `caja_estado_del_turno(momento timestamptz)` es el cálculo: el turno abierto, `trabado`,
    `motivo` (`hora`, `anterior` o `cerrada`), `postergado_hasta` y `proxima_hora`, sin montos.
    `caja_estado_del_mostrador()` lo llama con `now()` y es la que usa la app.
  - `caja_postergar_cierre()` inserta la postergación del turno que traba. Si no hay traba, la
    rechaza (`PC308`: «No hay ningún cierre para postergar»).
  - `cierres_turnos_pendientes(desde, hasta)`, solo para el admin: la lista de `(fecha, turno)`
    de la regla 17.
- **Funciones que cambian:**
  - `ventas_guardar_mostrador`: el turno y la traba (`PV303` y `PV304`), con la clave repetida
    respondiendo como antes.
  - `ventas_guardar_manual`: el turno elegido.
  - `cierres_guardar`: el turno y `PC307`.
  - `cierres_con_resultado`: devuelve `turno` y filtra las ventas por turno.
  - `cierres_fondo_sugerido` y `cierres_fecha_del_fondo`: reciben el turno.
  - `cierres_fondos_anteriores`: ordena por fecha y turno.
- Después se actualizan `supabase/schema.sql` y los tipos (`src/lib/supabase/tipos.ts`).

### Servidor y pantallas

- **Cálculos puros**, con sus tests en el grupo `puros`:
  - en `src/lib/caja/turnos.ts`: el nombre del turno, el texto de la ventana y el de
    «postergado hasta», y cuándo volver a preguntar;
  - en `src/lib/caja/dias.ts`: los pendientes por turno.
- **Mostrador:**
  - `src/lib/vender/` lee el estado y posterga, con las acciones en `vender/acciones.ts`;
  - `VentanaDelCierre.tsx` es la ventana, con las piezas de `estetica-panel`;
  - un hook se ocupa de volver a preguntar.
- **Caja:** la ventana va en el layout del panel para el rol Caja, salvo en `/admin/caja`.
- **Cargar cierre:**
  - el turno entra por la URL (`?fecha=…&turno=…`) y en el esquema Zod compartido;
  - la elección del turno va en `FormularioDeCierre`.
- **Control, detalle, Mis cierres, Inicio y Reporte de Caja:** la columna Turno, los pendientes
  por turno y las postergaciones.
- **Venta a mano:** el campo Turno, que se muestra con la casilla marcada.
- **Ayudas y Auditoría:**
  - las ayudas de Vender, Caja y Control se ponen al día;
  - Auditoría suma «Postergación del cierre» y los campos nuevos de configuración.

### Pruebas

- **Base** (`tests/reglas/cierres-por-turno.base.test.ts` y `tests/rls/…`):
  - a qué turno va cada venta;
  - la traba por hora, la de una caja anterior sin cerrar y la de la caja ya cerrada;
  - postergar y que se venza;
  - un Mediodía sin ventas que no traba;
  - lo esperado por turno, el fondo por turno y `PC302`, `PC307` y `PC308`;
  - los pendientes por turno;
  - RLS de las postergaciones: invitado, caja y encargado reciben rechazo fuera de lo suyo.
- Las horas se prueban **cambiando la hora de cierre configurada** respecto de `now()`, no el
  reloj. Por ejemplo, para «ya pasó la hora» se pone la del Mediodía un minuto antes de ahora.
  La función de cálculo recibe el momento como parámetro, para los bordes.
- **Playwright:**
  - `e2e/caja-turnos.spec.ts`: la ventana aparece en Vender, se posterga, se cobra con el
    ticket armado, se carga el cierre y se vuelve a vender en la Noche;
  - más la columna Turno en el control y la configuración de las horas.

## Fuera de alcance

- La sección de PedidosYa y otras plataformas en el cierre: pedido 91.
- Más de dos turnos, o una cantidad de turnos distinta según el día.
- Un turno que cruza la medianoche.
- Postergaciones con otra duración que no sea 10 minutos.
