---
name: revision-logica
description: Usar cuando Santiago pide analizar, cuestionar o razonar la lógica de una funcionalidad del Sistema Manteca, antes de diseñar un módulo de PROPUESTA.md, o cuando algo anda pero se siente raro.
---

# Revisión Lógica (cuestionar y proponer)

Esta skill captura la forma de razonar que al usuario le sirve: en vez de aceptar
que algo "funciona porque compila y los tests pasan", **cuestionar si la lógica es
la correcta** y proponer cómo funcionaría mejor — desde la mirada de quien usa el
sistema, no de quien lo escribió.

> Regla de oro: **primero pensar y proponer, después implementar.** Esta skill
> termina en una lista de sugerencias priorizadas y una pregunta al usuario sobre
> cuáles aplicar. No se escribe código hasta que el usuario elige.

## Cuándo usarla

- El usuario pide analizar/razonar/cuestionar una funcionalidad.
- Terminaste de implementar algo y querés validar que la lógica cierre (no solo que compile).
- Aparece un comportamiento que "técnicamente anda" pero se siente raro.
- Antes de dar por cerrada una feature de cara al usuario final.
- Antes de implementar un módulo de `PROPUESTA.md`, para encontrar los huecos de la
  definición mientras todavía es barato resolverlos.

## El método (5 pasos)

### 0. Partir de lo ya definido
Antes de razonar desde cero, leer lo que ya está decidido en `PROPUESTA.md`. Muchas
reglas ya tienen su razón escrita, y varias son fáciles de violar sin darse cuenta:
nada se borra, se anula; el precio del menú es el mismo con el que se calcula la ganancia;
el invitado no ve nada; el sistema no reemplaza a Fudo. Si la implementación contradice el
documento, eso ya es un hallazgo.

Leer también `docs/producto.md`: delimita la primera fase y dice dónde se aparta de la
propuesta (la compra de mercadería se carga como gasto; Caja solo carga su cierre;
Encargado queda afuera).

Y al revés: hay cosas **explícitamente sin definir**, listadas en "Sin decidir" de
`docs/producto.md` y de cada `docs/modulos/`. Eso no se resuelve suponiendo.

### 1. Entender el flujo REAL, no el ideal
Leé el código que gobierna el comportamiento (servicios, rutas, base de datos,
pantallas) y reconstruí qué pasa de verdad, paso a paso. No te quedes con el nombre
de la función ni con el comentario: seguí los datos.
- ¿Qué estados existen y cómo se transiciona entre ellos?
- ¿Qué se le muestra a cada actor y qué se le oculta?
- ¿Qué pasa en los bordes? Subir dos veces el mismo Excel de Fudo, o dos archivos con
  períodos que se pisan; anular una importación cuando ya hay cierres de caja hechos
  sobre esas ventas; un producto de Fudo sin vincular; una venta de algo que nadie
  registró como producido (stock negativo); un turno que cruza la medianoche; un cierre
  cargado dos veces o un día sin cierre; un gasto recurrente en un mes que ya se generó;
  una compra pagada con la caja; un insumo que cambia de precio con productos ya
  vendidos; un producto desactivado que sigue apareciendo en ventas viejas; un empleado
  desactivado con cierres a su nombre; el doble clic en guardar.

### 2. Mirar desde CADA actor
La misma feature se vive distinto según quién esté del otro lado. Recorré, una por una:
- **Empleado de caja:** ¿puede cargar el cierre rápido, al final del turno y cansado?
  ¿Entiende qué es cada campo? ¿Sabe qué hacer si se equivocó? ¿Ve algo que no debería
  (lo esperado antes de declarar, por ejemplo)?
- **Encargado:** ¿tiene lo que necesita para operar el día sin pedirle todo al dueño?
- **Admin / dueño:** ¿puede entender por qué no cierra una caja con lo que ve? ¿Los
  números del dashboard le dicen algo accionable? ¿El trabajo manual que implica esta
  feature (subir el Excel, vincular productos, revisar cierres) es sostenible todos los
  días?
- **Cliente del local** (solo en el menú web): ¿ve el precio correcto y solo lo que
  está disponible?

La mayoría de los huecos aparecen en la asimetría: algo que un actor ve y otro no,
o que uno puede hacer y otro necesita pero no puede.

### 3. Cuestionar con "¿por qué así y no asá?"
Para cada decisión de diseño, preguntá:
- ¿Esto es **intencional** o es un efecto colateral de cómo se implementó?
- ¿El comportamiento **coincide con la expectativa** del actor, o lo sorprende?
- ¿Hay un **corte arbitrario** (un límite, un plazo, un filtro, qué es "el día") que no
  representa la intención real del negocio?
- ¿Mostramos un dato que **no significa nada** en ese contexto?
- ¿Hay una acción que **no se puede deshacer** y debería? ¿Y la que sí se deshace,
  **revierte todo lo que generó**? Anular es un evento con consumidores: stock, caja
  esperada, dashboard, reportes, avisos.
- ¿Un aviso **no llega a quien debería**, **no lleva a ningún lado**, o se genera tantas
  veces que termina ignorado?
- ¿Queda **plata sin explicar**? Es el rubro más sensible: diferencias de caja, gastos
  contados dos veces, costos que no reflejan el último precio, ganancia calculada con
  un precio distinto al del menú.
- ¿Queda **rastro**? ¿Se puede saber quién lo hizo y qué valor había antes?
- ¿Un empleado puede **tapar un faltante** con lo que el sistema le deja hacer?

### 4. Separar lo que está bien de lo que conviene cambiar
Sé honesto en las dos direcciones:
- Listá explícitamente **lo que SÍ cierra** (para no re-tocar lo que funciona y para
  dejar registro de que se revisó).
- Para lo que no cierra, distinguí **bug lógico** (está mal) de **mejora de diseño**
  (funciona, pero hay una forma mejor) y de **decisión del usuario** (depende de su
  criterio de negocio o del cliente — ahí no decidas vos, preguntá).

### 5. Presentar priorizado y pedir decisión
Entregá las sugerencias ordenadas por impacto, cada una con:
- **Qué no cierra** (el síntoma concreto, desde qué actor se nota).
- **Por qué** (el razonamiento).
- **Cómo funcionaría mejor** (la propuesta, sin sobre-diseñar).
- Una marca: 🔴 conviene corregir / 🟡 es de criterio (tu decisión).

Cerrá con una recomendación de por dónde empezar y **una pregunta**: ¿cuáles aplico?
No arranques a implementar hasta tener la respuesta.

## Formato de salida sugerido

```
## 🔴 Las que conviene corregir
**1. <título corto>.** <síntoma desde el actor>. <por qué>. <propuesta>.
**2. ...**

## 🟡 De criterio (te las planteo)
**4. ...** <opciones + tradeoff, sin decidir por el usuario>

## ✅ Lo que quedó coherente
<lista breve de lo revisado que sí cierra>

Mi prioridad sería empezar por X e Y. ¿Cuáles querés que aplique?
```

## Principios

- **Cuestionar el "porqué", no solo el "cómo".** Que compile no es que esté bien pensado.
- **El usuario final manda.** La lógica se evalúa contra la expectativa del empleado,
  el encargado y el dueño, no contra la elegancia del código.
- **Honestidad en ambas direcciones.** Decí qué está bien y qué no; no infles problemas
  ni escondas huecos.
- **No decidir por el usuario en lo que es criterio de negocio.** Distinguir bug de
  preferencia y preguntar.
- **YAGNI en las propuestas.** Proponé la mejora mínima que resuelve, no un rediseño.
  El sistema se entrega por fases: no proponer para la fase 1 lo que es de la fase 2.
- **Pensar antes de tocar.** Esta skill produce un análisis y una decisión, no un diff.
- **Si el hallazgo es de definición y no de código**, se resuelve en `PROPUESTA.md` con
  el usuario, no por las nuestras dentro del código. Y como ese documento lo lee el
  cliente, nada de lo que se le agregue menciona que el sistema viene preparado para
  varios locales.

## Después de la revisión

Cuando el usuario elige qué aplicar, pasá a `superpowers:brainstorming` con lo decidido
acá como punto de partida: lo que ya se resolvió no se vuelve a preguntar. Después siguen
`superpowers:writing-plans` y la ejecución (`superpowers:subagent-driven-development` o
`superpowers:executing-plans`).

Cerrá con la skill `pre-finish`. Los textos de cara al usuario van en **español
rioplatense (voseo)**.
