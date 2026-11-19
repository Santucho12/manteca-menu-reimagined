# Cierre por tipo de venta: plan de implementación

> Sin superpowers en esta computadora: se ejecuta a mano, tarea por tarea, con TDD.

**Spec:** `docs/superpowers/specs/2026-11-19-cierre-por-tipo-design.md`

## Global Constraints

Las mismas del spec, sin cambios:
- tests sin mocks contra `mantecatest`, y la hora como parámetro;
- TDD, con el `test:` antes que el `feat:`;
- límites de 20, 80 y 300 líneas;
- español, y voseo en pantalla;
- centavos enteros;
- RLS y conteo a ciegas;
- nada se borra, y toda escritura deja auditoría;
- migraciones solo a `mantecatest`, avisando antes a la otra sesión;
- sin `git push`, y cada archivo con su ruta;
- el chequeo completo una vez, en la tarea 6.

## Review Focus

1. Una venta «Fuera de la caja» no cambia lo esperado de ningún medio de la Caja.
2. Una venta de un tipo controlado cargada en otro turno no cuenta en este cierre.
3. Prender un tipo después de guardar un cierre no cambia ese cierre.
4. Caja no ve lo cargado de ningún tipo antes de guardar.

### Task 1: Base

- Migración `20261119140000_cierre_por_tipo` y su reversa, con lo de «Parte técnica» del spec.
- Tests:
  - `tests/reglas/cierre-por-tipo.base.test.ts`: el tipo en el mostrador y `PV316`; «Fuera de la
    caja» fuera de lo esperado de la Caja; el turno de la venta a mano; los controles guardados y
    editados; `cierres_controles` por fecha y turno; los tipos fijos al guardar.
  - `tests/rls/controles-de-cierre.base.test.ts`.
- Ver los tests fallar, avisar a la otra sesión, aplicar, verlos pasar, probar la reversa,
  actualizar `schema.sql` y los tipos, y commitear.

### Task 2: Puros y esquemas

- `src/lib/caja/controles.ts`: la diferencia de cada sección y el estado combinado.
- Los esquemas del cierre, con `controles`; los de la venta del mostrador, con `canalId`; y
  `MEDIOS_DE_VENTA`, con `fuera_de_caja`, en Vender y en la venta a mano. La venta a mano lleva
  turno siempre.

### Task 3: Servidor

- Consultas y escrituras: `tiposParaVender`, `controlesDelCierre` y el guardado con controles.
- `tests/servicios/cierre-por-tipo.base.test.ts`.

### Task 4: Vender y venta a mano

- El selector de tipo y el medio «Fuera de la caja».
- En la venta a mano, el turno se ve siempre.
- La opción «Se controla en el cierre» en Tipos de venta.
- Su e2e.

### Task 5: El cierre

- Las secciones en `FormularioDeCierre` (cargar y editar).
- El detalle, el control y Mis cierres.
- Su e2e.

### Task 6: Ayudas, documentos y cierre

- Las ayudas de Vender, Caja y Control, y la auditoría.
- `docs/modulos/05-ventas.md` y `docs/modulos/06-cierres-de-caja.md`.
- `npm run verificar` y `npm run e2e`, con el OK de la otra sesión.
- `PEDIDOS.md`.
