---
name: verificacion-funcional
description: Usar cuando Santiago pide revisar a fondo un módulo ya hecho del Sistema Manteca, probar que algo funcione de punta a punta, buscar qué está roto o prepararlo para entregárselo al cliente.
---

# Verificación funcional (¿anda? y ¿tiene sentido?)

El método viene de una revisión real en otro proyecto que en cinco pasadas encontró 31
problemas, entre ellos un promedio 33% subestimado y un paginado que a escala perdía filas
en silencio. Todos se veían bien leyendo el código. Aparecieron **ejecutando y midiendo**.
Este sistema es casi todo números (ventas, costos, caja, márgenes): es el terreno donde
esa clase de bug más duele.

> **Reglas de oro.**
> 1. **Un bug no existe hasta que lo reproducís.** "Esto podría fallar" no es un hallazgo.
> 2. **Un módulo por corrida.** Poco y hasta el fondo, no todo por arriba.
> 3. **Un módulo no se cierra por cansancio.** Se cierra después de las seis lentes,
>    cuando una pasada entera —con lente declarada y evidencia de lo que ejercitó— no da
>    nada arriba de 🟡 (ver [Paso 8](#paso-8--loop-de-pasadas-hasta-agotar-el-módulo)).
>    Severidades: **🔴** roto de punta a punta · **🟠** falla en un caso real ·
>    **🟡** confunde · **🔵** consistencia.
> 4. **"Está todo bien" es un resultado, no un fracaso.** Si el módulo está sano, el
>    hallazgo es que está sano.

## Qué entrega esta skill, y qué NO

**Detecta y entrega. No arregla.** Los fixes los hace el usuario, después y por su cuenta.
El producto **no** es el bug encontrado, es **el bug reproducido y entregado de forma que
el usuario pueda arreglarlo y saber que lo arregló**. Por hallazgo se entrega:

1. el **síntoma** desde el usuario,
2. la **causa** con `archivo:línea`,
3. la **reproducción ejecutable** — el test en rojo o el SQL exacto, no la explicación,
4. el **número esperado vs el real** cuando hay números,
5. la **severidad**, y si es criterio de negocio, las opciones **sin decidir**.

Sin el punto 3 no es un hallazgo, es una opinión.

**Lo que NO hace:** no edita código de producción, no corre migraciones, no ejecuta SQL
de escritura contra datos reales, no abre PRs de fixes. El único commit del trabajo es el
documento de verificación y los tests de reproducción.

### Un módulo sin hallazgos es un buen resultado

**No hay ninguna cuota que cumplir.** Las tres formas de traicionar esto:

- **Inflar la severidad** — reportar como 🟠 algo que es 🔵 para que la pasada "rinda".
- **Convertir preferencia en bug.** Si funciona y simplemente lo harías distinto, es
  **mejora de diseño** o **criterio del usuario** — nunca bug.
- **Estirar el loop buscando algo.** Si las seis lentes salieron limpias, el módulo cierra
  en la seis.

**El contrapeso que lo hace creíble** es la [cláusula anti-trampa](#cláusula-anti-trampa):
"no encontré nada" vale **solo** con la evidencia de qué se ejercitó al lado.

## Cuándo usarla

- "Revisá bien el módulo X" / "probá que esto funcione".
- Antes de entregarle una fase al cliente, iterando módulo por módulo.
- Después de un refactor, para confirmar que ese módulo quedó entero.
- Aparece un síntoma suelto y conviene barrer ese módulo completo.

## Paso 0 · Elegir el módulo y armar su inventario

Un módulo es **una pantalla o un flujo**, no una superficie entera: "Cierre de caja →
cargar", "Vender en el mostrador → cobrar", "Gastos recurrentes". Si el usuario nombra algo
grande ("el panel"), **partilo y confirmá por cuál empezar.**

### Mapa de módulos

Sale de `PROPUESTA.md`. **Completar las columnas de componente y endpoints a medida que
exista el código**, para no re-derivarlo en cada corrida.

**Primera fase**

| Módulo | Propuesta | Componente | Endpoints |
|---|---|---|---|
| Usuarios y permisos | §1 | — | — |
| Proveedores | §2 | — | — |
| Gestión del menú digital (y el menú web público) | §9 | — | — |
| Catálogo mínimo de productos (nombre, variantes y precio) | §4, recortado | — | — |
| Ventas — vender en el mostrador | §10, sin Fudo | — | — |
| Ventas — carga a mano | §10 | — | — |
| Cierres de caja — carga | §11 | — | — |
| Cierres de caja — control desde administración | §11 | — | — |
| Gastos (únicos y recurrentes) | §12 | — | — |
| Dashboard general | §13 | — | — |
| Reportes | §14 | — | — |
| Auditoría | §17 | — | — |

**Segunda fase**: Materia prima (§3), Productos (§4), Compras (§5), Costos (§6),
Producción (§7), Stock (§8), Centro de avisos (§15), Notas (§16), Extras / IA (§18).
Agregar la fila cuando el módulo se implemente.

Antes de leer una línea de código, escribí el inventario del módulo:

| Qué | Ejemplos |
|---|---|
| **Acciones** | crear, editar, anular, desactivar, importar, exportar, marcar revisado |
| **Entradas** | filtros de fecha, selectores, buscadores, formularios, archivos |
| **Números** | totales, diferencias, promedios, porcentajes, contadores |
| **Estados** | vacío, cargando, error, sin permiso, un solo ítem, muchos, anulado |
| **Actores** | quién lo usa: caja, encargado, admin |

Ese inventario es el plan y la unidad de progreso. Nada se da por verificado sin haber
sido probado.

### Por dónde empezar, y qué hacer con lo que aparece de otro módulo

**El orden es por riesgo, no por el orden del menú**: arrancá por donde se mueve plata
(Cierres de caja, Vender en el mostrador, Ventas a mano, Gastos), seguí por los números que
salen de ahí (Dashboard, Reportes, Auditoría) y dejá la administración (Proveedores,
Menú, Usuarios) para el final. Usuarios es la excepción: su parte de permisos va primero.

Verificando Cierres va a aparecer algo que es de Ventas. **No lo persigas** —ahí se
desmadra la corrida—, pero **tampoco lo tires**. Anotalo en el índice contra el módulo
dueño, que vuelve a ⬜/⏳. Si es 🔴, avisale al usuario en el momento.

## Paso 1 · Seguir la cadena de cada acción

Por cada ítem del inventario, recorré:

```
componente → llamada → endpoint → validación → sesión/rol → DB → grant y policy RLS → auditoría
```

Preguntas que hay que poder contestar con el código a la vista:
- ¿El endpoint existe y acepta ese método?
- ¿El payload coincide **campo por campo** con lo que el servidor valida?
- ¿El rol que ve el botón es un rol que el endpoint acepta?
- Si el servidor responde 4xx/5xx, **¿el usuario lo ve?** (el silencio es un bug)
- ¿La acción dejó su registro de auditoría, con el valor anterior y el nuevo?

## Paso 2 · PROBAR, no suponer ← lo que separa esta skill de leer código

Leer te da la sospecha; **ejecutar te da el hallazgo**. Elegí el escalón más barato que
alcance:

**a) Consulta SQL de solo lectura.** Para números. Reproducí el cálculo del código en SQL
y compará con lo que muestra la pantalla. Es el escalón que más rinde en este sistema:
cada KPI del dashboard, cada diferencia de caja y cada total de un reporte se puede
recalcular a mano. Va contra la base de pruebas (`supabase-pruebas`), sobre datos que
sembró el test. Contra la real, solo lectura y solo con OK de Santiago.

> ⚠️ **Los datos son del negocio del cliente y el documento se commitea.** Las mediciones
> van **agregadas** o con `id`; no pegues nombres de empleados, emails ni teléfonos de
> proveedores en `docs/`, en un test ni en el informe.

**b) Prueba del endpoint contra la base de pruebas.** La más precisa para contratos:
llamás al handler real con una petición armada igual que la del componente.

**c) Navegador real con Playwright**, contra la base de pruebas. Para probar **qué manda**
la UI y todo lo visual o de interacción: un botón que no hace nada, un modal que no
cierra, una tabla que se desborda en el celular. En este proyecto no se simula la base ni
las llamadas (`CLAUDE.md`): si hay que ver qué envía una pantalla, se la usa de verdad y
se mira lo que quedó en la base.

**d) Bordes del mostrador.** La venta se prueba con los bordes: el doble toque en Cobrar,
un precio que cambia con el ticket armado, un producto desactivado en medio, dos medios que
no suman el total, la conexión que se corta al cobrar.

### Los comandos

```bash
npx vitest run <archivo>    # un archivo de tests, contra la base de pruebas
npm run e2e -- <archivo>    # una prueba de Playwright, sin abrir ventana
npm run sembrar:pruebas     # si faltan los usuarios de prueba
```

Los tests comparten la base de pruebas: nunca corras el mismo archivo dos veces en
paralelo. Si una trampa del entorno cuesta tiempo, anotala acá.

### Rojo primero — y el rojo queda

Escribí la prueba que falla con el código actual y **corréla y mirá el rojo**. Una prueba
que nunca falló no prueba nada. Acá el rojo no es el preámbulo de un fix: **es el
entregable**.

El test se **commitea junto al documento**, marcado con `.skip` y con el número de
hallazgo en el nombre, para que la suite siga verde hasta que el usuario lo arregle:

```ts
// HALLAZGO #7 — ver docs/verificacion-panel.md
// Sacar el .skip para verificar el fix.
it.skip('#7 · anular una importacion no revierte la caja esperada del turno', async () => {
```

Así el ciclo del usuario es: arreglar → sacar el `.skip` → correr **ese archivo** → verde.

**Un `.skip` que sobrevive al fix es un agujero silencioso**: en la fila del hallazgo va
siempre el archivo y el nombre del test, para poder barrerlos después.

## Paso 3 · Buscar desacuerdo entre capas ← la heurística más productiva

Los bugs caros casi nunca están dentro de una capa: están **entre dos** que no dicen lo
mismo. Cada una bien escrita, el conjunto roto. Buscá activamente:

- **Dos pantallas calculan lo mismo distinto.** El total de ventas del dashboard contra el
  del reporte contra lo esperado del cierre de caja. Si uno excluye lo anulado y otro no,
  no van a coincidir nunca y nadie va a saber cuál mirar.
- **La UI filtra por un criterio y el backend por otro.** "El día" según el navegador
  contra "el día" según la base (UTC) contra el turno.
- **La UI ofrece algo que el backend rechaza.** Un botón visible para un rol que el
  endpoint no acepta; el error llega al confirmar, con el formulario ya cerrado.
- **Un caller que no manda un parámetro obligatorio.** Cuatro pantallas filtran por local
  y la quinta no.
- **Backend sin UI / UI sin backend.** Un endpoint completo que ningún botón llama; un
  botón que no hace nada.

**Truco:** cuando encuentres un criterio (un filtro de anulado, un "activo", un rango de
fechas, una forma de redondear), buscá **todos** los lugares que deciden lo mismo y
comparalos. Si cinco consultas excluyen lo anulado y una no, esa es el hallazgo.

### Registro de criterios (lo que hace que iterar por módulos NO pierda esto)

Ir de a un módulo profundiza, pero por sí solo te haría perder justo esta clase de
hallazgo, que necesita comparar entre módulos. La solución es que la iteración
**acumule**. Cada vez que en un módulo aparece una decisión repetible, anotala:

```markdown
## Registro de criterios
| Criterio | Cómo lo resuelve | Visto en | Estado |
|---|---|---|---|
| Qué es "una venta" para sumar | excluye anuladas | Reporte de ventas, Cierre | — |
| Qué es "una venta" para sumar | **las incluye** | Dashboard | 🟠 #4 |
| Qué es "el día" | fecha operativa del turno | Cierre | — |
| Qué es "el día" | **fecha UTC de creación** | Reporte de caja | 🟠 #9 |
| Redondeo de montos | a 2 decimales, al final | Costos | — |
```

**Cómo se usa**: al entrar a un módulo nuevo, leé el registro primero. Cuando el módulo
toque un criterio ya anotado, comparalo — si resuelve distinto, o es un hallazgo o es una
diferencia deliberada que hay que documentar como tal. Si el criterio es nuevo, agregá la
fila.

Al terminar la iteración completa, **cada criterio debería tener una sola forma de
resolverse**, o una excepción escrita y justificada.

## Paso 4 · ¿Y lo que funciona, tiene sentido?

Que ande no es que esté bien pensado. Con el módulo ya probado, pasá por cada actor
(caja / encargado / admin) y preguntá:

- **¿Se entiende?** ¿El empleado sabe qué cargar en cada campo del cierre sin que se lo
  expliquen? ¿El dueño entiende de dónde sale cada número?
- **¿Se puede deshacer, y la vuelta atrás llega a todos lados?** Dos preguntas, no una.
  En este sistema nada se borra: todo se anula. Y una anulación **que no se propaga** es
  peor que no poder anular, porque no falla: deja los números sin cerrar y nadie se
  entera. Ver la lente 6.
- **¿El número significa algo ahí?** Un margen sobre un producto sin costo cargado, un
  ticket promedio sobre ventas cargadas a mano de a una por día, una diferencia de caja
  sobre ventas que no se cobraron en la caja.
- **¿El corte es del negocio o del código?** Un límite, un día, un filtro que quedó por
  cómo se implementó y no porque alguien lo decidió.
- **¿Hay asimetría entre actores?** Algo que uno ve y otro no, o que uno necesita y no puede.
- **¿El feedback llega?** Si la importación tarda o falla a la mitad, ¿el usuario se entera
  y sabe en qué estado quedó?

Marcá cada cosa como **bug lógico** (está mal), **mejora de diseño** (anda, hay forma
mejor) o **criterio del usuario** (depende del negocio → **no decidas vos, preguntá**).

## Paso 5 · Medir antes de priorizar

Convertí cada sospecha en un número. Cambia decisiones en las dos direcciones:

- **Sube**: "el dashboard muestra $40.000 más que el reporte en el mes" pesa distinto que
  "un filtro está mal".
- **Baja**: "hoy no hay ninguna venta anulada" convierte un 🔴 en un 🟡 latente.
- **Evita romper**: antes de proponer una corrección de datos, contá qué cuelga de eso.

## Paso 6 · Correr la suite y saber leerla

Un rojo no es automáticamente tuyo:

- Falla encadenado pero pasa aislado → los tests comparten datos; correr por archivo.
- Falla aislado → verificá con `git stash` si ya fallaba **antes** de tu rama.
- Nunca corras el mismo archivo dos veces en paralelo contra la misma base.

## Paso 7 · Reportar (y nada más)

Por hallazgo: **síntoma** desde el usuario (no desde el código) · **causa** con
`archivo:línea` · **la reproducción ejecutable** (archivo y nombre del test en rojo, o el
SQL) · **medición** si aplica · **severidad** · y si es **criterio**, las opciones sin
decidir.

**Acá termina el trabajo.** No arregles, ni siquiera lo que parece trivial de una línea:
un fix "obvio" metido de contrabando entra sin que nadie lo revise. Si ves el fix claro,
escribilo en la fila del hallazgo **como propuesta** — texto, no código aplicado.

Listá también **lo verificado que está bien**, para no re-mirarlo.

Antes de entregar, corré los archivos de reproducción que tocaste: tienen que quedar en
verde con los `.skip` puestos. No hay `build` ni `pre-finish` acá, porque no se tocó
código de producción.

### Lo que el usuario descarta también se escribe

Un hallazgo que el usuario decide **no** arreglar no vuelve a "pendiente": va a la tabla
**Descartado — NO re-proponer** del documento, con el motivo. Sin eso, el loop te lo va a
volver a traer con cara de hallazgo nuevo.

**Descartado ≠ pendiente.** Si creés que la razón del descarte ya no aplica, decilo
**citando la fila** y que decida el usuario; no lo re-abras por tu cuenta.

## Paso 8 · Loop de pasadas: hasta agotar el módulo

Una sola pasada nunca alcanza. Pero repetir el mismo recorrido con los mismos anteojos
converge al mismo punto ciego y da cero — y ese cero no significa que no haya nada. Por
eso el loop es **de lentes, no de repeticiones**. Cada pasada declara qué va a mirar
distinto antes de arrancar:

| # | Lente | Qué caza | Paso |
|---|---|---|---|
| 1 | **Cadena** | componente→endpoint→validación→rol→DB→RLS→auditoría de cada acción | 1 |
| 2 | **Ejecución** | probar de verdad cada acción, rojo primero | 2 |
| 3 | **Números y bordes** | cada número cruzado contra SQL; vacío / un ítem / error / sin permiso | 2, 5 |
| 4 | **Desacuerdo entre capas** | el registro de criterios contra **todos** los módulos ya verificados | 3 |
| 5 | **Lógica por actor + auto-revisión** | ¿tiene sentido? + ¿alguno de mis hallazgos es falso positivo? | 4 |
| 6 | **Reversa y propagación** | lo que se anula y no llega a todos lados | 4 |
| 7+ | **Lente nueva, declarada** | lo que se te ocurra mirar distinto | — |

Si para la pasada 7 no podés **nombrar** qué vas a mirar distinto, el módulo está cerrado.
"Otra vuelta más por las dudas" no es una lente.

### Lente 6 · Reversa y propagación

Merece anteojos propios porque **mira al revés que las otras cinco**: esas preguntan *qué
hace* la acción; esta pregunta *qué tendría que haber cambiado en otro lado y no cambió*.
En un sistema donde la regla es "nada se borra, se anula", es la lente más importante: la
operación devuelve OK, el dato queda perfecto, y los números de otra pantalla dejan de
cerrar en silencio.

Agarrá **cada acción del módulo que anula, revierte o desactiva** y seguí el efecto hasta
todos sus consumidores. La pregunta no es "¿anuló?", es **"¿quién más tendría que haberse
enterado?"**:

| Si se anula… | ¿lo refleja? |
|---|---|
| una **venta del mostrador** | caja esperada de ese día, dashboard, reportes, más vendidos |
| una **venta a mano** | stock, caja esperada si se cobró con la caja, reportes, ganancia por producto |
| un **cierre de caja** | reportes de diferencias, avisos de caja con diferencia, gastos pagados con la caja que colgaban de él |
| un **gasto** | resultado del mes, reportes por categoría; si era recurrente, los que se generaron y los que faltan generar |
| una **compra recibida** | stock, costo actual del insumo, costo de los productos que lo usan, saldo del proveedor |
| una **producción** | stock de insumos, stock de producto terminado, mermas |
| **cualquier cosa** | auditoría: quedó **quién**, **cuándo** y **por qué** |

Y al revés, que es el mismo bug espejado: **desactivar** algo (un producto, un insumo, un
proveedor, un usuario) también es un evento. Si cinco pantallas lo ocultan y la sexta lo
sigue ofreciendo, esa sexta es el hallazgo. Y el historial de lo desactivado tiene que
seguir intacto.

Esto **no se contesta leyendo**: se ejecuta el ciclo completo contra la base de pruebas
(hacer → anular) y se cruzan los números de cada consumidor contra SQL, antes y después.

### Criterio de parada: por calidad, no por cantidad

**Las lentes 1 a 6 son piso, no opción**: se corren todas, aunque la 3 no haya encontrado
nada. De la **7 en adelante**: **se sigue** mientras la última pasada completa haya dado
al menos un 🔴 o un 🟠, y **se cierra** cuando una pasada entera no da nada arriba de 🟡.

> **Por qué no "hasta que no encuentre nada".** Ese criterio invierte el incentivo: la
> forma más barata de terminar pasa a ser **no buscar bien**. Y en el otro extremo, empuja
> a inventar 🔵 cosméticos para justificar seguir.

### Cláusula anti-trampa

Una pasada **sin hallazgos** solo cuenta para cerrar el loop si deja **evidencia de qué
ejercitó**: los comandos que corriste, el SQL que tiraste, los tests que pasaron.
*"Miré y no vi nada"* no cierra nada. En el documento va así:

```markdown
### Cierres de caja · pasadas
| # | Lente | Qué ejercité | Hallazgos |
|---|---|---|---|
| 1 | Cadena | 6 acciones del inventario, componente→auditoría | 2 |
| 2 | Ejecución | `cierres.test.ts` (5 casos nuevos), carga del formulario con Playwright | — |
| 3 | Números y bordes | esperado y diferencia vs SQL en 3 turnos; día sin ventas; 403 forzado | 5 🟠 |
| 4 | Criterios | "venta" y "el día" vs Dashboard y Reportes | 9 🟠 |
| 5 | Lógica + auto-revisión | 3 actores; releí mis hallazgos (uno era falso positivo, lo bajé) | 11 🟡 |
| 6 | Reversa y propagación | anular un cierre con gastos de caja, contra la base de pruebas | — → **cierra** |
```

### Cuando el usuario arregla, el módulo vuelve a abrirse

Cuando los fixes del usuario entran a `main`, ese módulo vuelve a **⏳ parcial** y se le
corren de nuevo las lentes **2** (sacar los `.skip` de sus hallazgos y ver el verde) y
**6** (donde un fix suele arreglar una punta y dejar la otra). Un fix no verificado es un
hallazgo nuevo que todavía no sabés que tenés.

## Cuándo un módulo está VERIFICADO

Un módulo se marca verificado cuando **las seis** se cumplen:

- [ ] **Toda acción del inventario, probada.** Ejecutada, no leída. Si algo no se pudo
      probar, se anota por qué.
- [ ] **Todo número, cruzado contra SQL.** Cada total, diferencia, promedio y porcentaje
      que el módulo muestra, reproducido con una consulta y comparado.
- [ ] **Estados de borde recorridos.** Vacío, un solo ítem, error del servidor, sin
      permiso, con datos anulados.
- [ ] **Pasada lógica hecha por actor** (paso 4), con cada cosa marcada como bug / mejora /
      criterio.
- [ ] **Registro de criterios actualizado.**
- [ ] **Loop agotado** (paso 8): las **seis lentes** corridas, la última pasada completa
      sin nada arriba de 🟡, y la tabla de pasadas con qué ejercitó cada una.

Si alguna queda sin cumplir, el módulo va como ⏳ **parcial** con la nota de qué falta —
nunca ✅.

## Iterar por módulos

Llevá `docs/verificacion-<superficie>.md` con el índice arriba y los hallazgos abajo.

**Se escribe al cerrar cada pasada, nunca al final del módulo.** Si la sesión se corta en
la lente 4 con todo en la cabeza, se pierde el trabajo entero. Una pasada sin su fila en
la tabla es una pasada que no pasó.

```markdown
## Módulos
| Módulo | Estado | Pasadas | Hallazgos |
|---|---|---|---|
| Cierres de caja — carga | ✅ verificado 2026-11-03 | 6 (cerró en la 6) | 2, 5, 9, 11 |
| Proveedores | ✅ verificado 2026-11-04 — **sin hallazgos** | 6 | — |
| Vender en el mostrador | ⏳ parcial — faltan lentes 3 y 6 | 4 | 4, 7 |
| Gastos | ⬜ pendiente | — | — |

## Registro de criterios
<la tabla del paso 3>

## Hallazgos
- [ ] **7 · 🟠 <síntoma>** · `archivo:línea`
  repro: `<archivo de test>` → `it.skip('#7 · …')`
  <medición: esperado vs real> · <bug | mejora | criterio> · <fix propuesto, sin aplicar>

## Verificado y sano
<lo que se ejercitó y salió bien, por módulo>

## Descartado — NO re-proponer
| # | Qué se propuso | Por qué NO | Cuándo |
|---|---|---|---|

## <Módulo> · pasadas
<la tabla del paso 8>
```

Al terminar un módulo, ofrecé el siguiente.

### Re-pasada de cierre (el loop de la superficie entera)

El primer módulo se verifica con el registro de criterios vacío; el último, con el
registro completo. Por eso, cuando todos los módulos llegan a ✅, queda **una vuelta más,
acotada**: pasar de nuevo por los módulos verificados en la primera mitad, **solo con la
lente 4**, contra el registro ya terminado. Si al terminar quedan filas que se contradicen
sin explicación, la superficie **no** está cerrada.

## Si el arreglo toca datos reales

**No lo ejecutes** — esta skill no escribe sobre los datos del cliente. Lo que entregás es
el SQL listo para que lo corra el usuario:

1. **La medición** de qué cuelga de eso.
2. **El SQL en orden seguro**, con el porqué del orden escrito. Respetando la regla del
   sistema: se anula, no se borra.
3. **La foto del estado previo** con IDs exactos, y el **rollback**, en el documento.
4. **La verificación final** que prueba que los números cierran.

Un SQL sin rollback y sin conteo previo no se entrega.

## Principios

- **Reproducir antes de reportar.** El rojo se ve, no se supone.
- **El silencio es un bug.** Si el servidor rechaza y el usuario no se entera, está roto
  aunque el dato esté a salvo.
- **Los tests existentes son un interlocutor, no un obstáculo.** Si hay un test **verde**
  que cubre justo el comportamiento que estás por reportar como bug, preguntá *"¿qué
  estaba defendiendo?"* antes de escribir el hallazgo.
- **Revisá también tu propio trabajo.** La pasada siguiente tiene que releer tus hallazgos
  buscando **falsos positivos**, no solo buscar bugs nuevos.
- **Una pasada que no encontró nada no prueba que no haya nada** — prueba que miraste
  igual que la vez anterior. Cambiá la lente o cerrá el módulo.
- **No decidas lo que es criterio de negocio.** Distinguí bug de preferencia y preguntá.
- **No hay cuota de hallazgos.** Si una severidad miente, ninguna se puede creer.

## Relación con las otras skills

| Skill | Arranca de | Pregunta |
|---|---|---|
| `code-review` | un diff | ¿este cambio está bien? |
| `revision-logica` | un flujo de negocio | ¿debería funcionar distinto? (propone, no implementa) |
| **`verificacion-funcional`** | **un módulo concreto** | **¿anda? ¿y tiene sentido?** (prueba y reporta; **no arregla**) |

Se solapa a propósito con `revision-logica` en el paso 4: la diferencia es que acá la
pregunta lógica llega **después de haber probado**, sobre comportamiento verificado y no
sobre el código leído. Cuando el usuario decida arreglar, ahí sí corre `pre-finish`.
Todo texto de cara al usuario, en **español rioplatense**.
