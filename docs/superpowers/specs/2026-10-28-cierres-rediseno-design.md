# Cierres de caja: dos estados, editables y comparados con las ventas del día

Pedido 66. Decidido con Santiago el 2026-10-28. Reemplaza lo de `docs/modulos/06-cierres-de-caja.md`
que lo contradiga (cierre que no se edita, «Esperando ventas», «Revisado»).

## Para qué

Que Caja cargue lo que contó al cerrar y el sistema diga, sin más vueltas, si coincide con lo
vendido ese día. Si coincide, **Cierra**. Si no, **Con diferencia**. Si todavía no se cargó el
cierre de un día, **Pendiente**.

## Qué se decidió (Santiago)

| # | Tema | Decisión |
|---|---|---|
| 1 | Estados | Cierra, Con diferencia y Pendiente. Pendiente es un día sin cierre cargado |
| 2 | Tolerancia | Se mantiene (arranca en $500, se cambia con la tuerca): hasta ese monto, por medio, cuenta como «Cierra» |
| 3 | Comparación | Cada medio por separado: efectivo, crédito, débito, QR y transferencia |
| 4 | Efectivo esperado | Fondo inicial + ventas en efectivo − retiros − gastos pagados con la caja |
| 5 | Editar | Caja edita sus cierres y el admin cualquiera; cada cambio queda en la auditoría con el valor anterior y el nuevo |
| 6 | Anular | Se mantiene, solo el admin y con motivo: nada se borra |
| 7 | Lo esperado | Se calcula siempre al mostrar, con las ventas del momento. No se guarda ni se recalcula |
| 8 | Revisado | Se saca todo: marcar, comentario de revisión, estado y avisos |

## Metas, no metas y antimetas

- **Metas:** dos estados claros; editar un cierre sin anularlo; que el resultado siempre esté al
  día con las ventas, sin procesos de recálculo.
- **No metas:** más de un cierre por día; pedir contraseña al guardar; cambiar el formulario de
  carga más allá de lo que haga falta para editar; traer el medio de pago desde la API de Fudo.
- **Antimetas:** que un cierre quede «Cierra» sin comparar con ventas reales; que Caja vea las
  ventas del local (solo ve el resultado de sus cierres, como hoy).

## Cómo se calcula

Para un cierre no anulado, de un local y una fecha:

- **Ventas del día por medio:** suma de `pagos_de_venta.monto_centavos` de las ventas de ese
  local y ese día (el día en Argentina) que no estén anuladas ni canceladas. Las ventas sin
  medio de pago y las canceladas no suman a ningún esperado (igual que hoy).
- **Esperado de efectivo:** fondo inicial + ventas en efectivo − suma de retiros − suma de gastos
  de caja no anulados del cierre. **Esperado de los otros medios:** sus ventas.
- **Diferencia de un medio:** declarado − esperado. Negativa es faltante; positiva, sobrante.
- **Estado:** `cierra` si ningún medio supera la tolerancia en valor absoluto; si no,
  `con_diferencia`. **Diferencia total:** suma de las diferencias de los cinco medios.
- **Sin ventas ese día** el esperado de cada medio de venta es $0 (el de efectivo es el fondo
  menos retiros y gastos): un cierre con plata declarada queda «Con diferencia». No hay estado
  «esperando ventas».
- **Pendiente:** un día entre el primer cierre del local y hoy **sin** cierre no anulado (como
  hoy en `dias.ts`: hoy cuenta). El aviso de Inicio de «con diferencia» mira la última semana,
  porque sin «Revisado» no habría cómo apagarlo (decisión mía).

`resultadoDelCierre` (`src/lib/caja/resultado.ts`) sigue siendo la única regla de la cuenta;
la base trae los insumos ya sumados.

## Base

Una migración nueva (reversa en `supabase/reversas/`), solo a la base de pruebas hasta que
Santiago diga lo contrario.

1. **Sacar lo que sobra** de `cierres_de_caja`: `estado`, las cinco `esperado_*`, `revisado`,
   `revisado_por`, `fecha_revision`, `comentario_revision`; y el tipo `estado_de_cierre`. Sacar de
   `reglas_de_cierres` la rama de revisar y del `grant update` las columnas de revisión. La
   auditoría de esas columnas queda en el historial viejo.
2. **Función `cierres_con_resultado(...)`** (`security definer`, `search_path = ''`, comprueba
   que quien llama es admin del local o Caja dueña del cierre): devuelve por cada cierre visible
   los cinco declarados, los cinco esperados y la tolerancia, sumando las ventas del día.
   Es lo que usan la lista, el detalle y el filtro por estado. Caja recibe solo sus cierres.
   _Decisión mía:_ función en vez de vista, para que el acceso se compruebe adentro y Caja no
   necesite leer `ventas` ni `pagos_de_venta`.
3. **`cierres_editar(id, datos)`** (`security definer`): mismo contrato que `cierres_guardar` pero
   sobre un cierre existente no anulado. Quien puede: el admin del local, o Caja si el cierre es
   suyo. No cambia la fecha ni quién lo cargó. Reemplaza los retiros y los gastos de caja
   (anula con motivo «Se editó el cierre de caja» los gastos anteriores y crea los nuevos, como
   hoy: un gasto de caja no se edita suelto). Deja la auditoría del cierre con valor anterior y
   nuevo.
4. **Retiros:** como `retiros_de_caja` no tiene anulación, al editar se reemplazan y el cambio
   queda dicho en la auditoría del cierre (el valor anterior y nuevo de los retiros va en el
   registro). _Decisión mía_, para no sumar una columna `anulado` solo para esto.
5. RLS y grants: `cierres_editar` y `cierres_con_resultado` con `revoke ... from public, anon` y
   `grant execute ... to authenticated`. Tests de `tests-rls` para invitado, caja ajena y
   encargado.

## Servidor y pantallas

- `src/lib/caja/escritura.ts`: se saca `revisarCierre`; entra `editarCierre`. Se mantiene
  `anularCierre`. Los mensajes de error de revisar se sacan.
- `src/lib/caja/consultas.ts`: la lista, `misCierres` y `cierrePorId` leen de
  `cierres_con_resultado`; sale `diferenciaTotalDe` sobre columnas guardadas.
- `src/lib/caja/pantalla.ts`: `EstadoDeCierre` pasa a `'cierra' | 'con_diferencia' | 'pendiente'`;
  `anulado` es una marca aparte, no un estado. Se sacan `revisado` y `esperando_ventas`.
- **Cargar el cierre (`/admin/caja`)**: el mismo formulario. Si hoy ya hay cierre, en vez del
  rechazo de «Ya hay un cierre de ese día» se ofrece **Editar**. Al guardar o editar, Caja ve su
  resultado (cierra, o cuánto falta o sobra por medio).
- **Detalle (`/admin/caja/cierres/[id]`)**: declarado, esperado y diferencia por medio; retiros y
  gastos de caja; botones **Editar** (quien puede) y **Anular** (admin). Sin «Marcar como
  revisado».
- **Control (`/admin/caja/control`)**: la lista muestra Cierra / Con diferencia; el filtro de
  estado tiene Cierra, Con diferencia y Pendiente. **Pendiente** lista los días sin cierre del
  rango (sin paginar). El aviso «N días sin cierre» pasa a llamarse «N días pendientes». Los
  anulados quedan fuera salvo «Ver anulados» (la forma de «Ver desactivados» de Usuarios).
  _Decisión mía._
- Textos de ayuda (`ayudasDelNegocio.ts`), diccionario de auditoría, Inicio («Ayer»),
  Reportes (caja) y `docs/modulos/06`, `05`, `09`: se actualizan y se sacan las referencias
  a «revisado» y «esperando ventas».

## Global Constraints (de `CLAUDE.md`)

- **Tests sin mocks.** Lo que toca datos va contra la base de pruebas (`*.base.test.ts`); un
  cálculo puro (`resultadoDelCierre`, `pantalla.ts`) se prueba directo. TDD: el test primero y
  verlo fallar. Código escrito antes que su test se borra.
- **Largo:** función de `.ts` hasta 20 líneas; componente de `.tsx` hasta 80; archivo hasta 300
  (sin blancos ni comentarios). La lógica sale a `.ts`.
- **Español:** nombres, comentarios, mensajes y base; textos de pantalla con voseo.
- **Plata en centavos enteros** (`_centavos`); se muestra como `$1.234,50`.
- **Fechas en UTC;** «el día» de un cierre o una venta es el día en Argentina.
- **Nada se borra, se anula** con motivo, y toda escritura deja auditoría (usuario, fecha y, si
  modifica, valor anterior y nuevo). Cada operación usa la sesión del usuario y RLS decide.
- **Caja** carga y edita solo los cierres propios y no ve ventas; **encargado** no accede.
  Los tests comprueban que invitado, caja ajena y encargado reciben rechazo.
- **Quién decide:** aplicar la migración a la base **real** y publicar los decide solo Santiago.
- **Estética:** skill `estetica-panel`, sin modo oscuro ni esqueletos.
- Cierre: `npm run verificar` y `npm run e2e` en los dos tamaños, con las capturas.

## Riesgos que Santiago ya aceptó

- Caja puede editar su cierre después de ver la diferencia y acomodar los números hasta que
  cierre. La auditoría deja cada versión, y el control del admin lo puede ver. Si preocupa,
  una salida es que Caja edite solo el mismo día; no está decidido.
- Los cierres viejos que estaban «Revisado» pasan a mostrarse como Cierra o Con diferencia según
  su cuenta con las ventas de hoy.
- Los cierres sembrados en la base de pruebas dejan de tener su estado fijo: algunos van a
  mostrar diferencia donde antes mostraban «Cierra», porque ahora se compara con las ventas reales.

## Lo que queda a cargo de quien construya

Nombres de funciones y archivos, el orden de las tareas, y cómo se arma el SQL de la suma por
medio (con el día en Argentina), siempre dentro de lo de arriba.
