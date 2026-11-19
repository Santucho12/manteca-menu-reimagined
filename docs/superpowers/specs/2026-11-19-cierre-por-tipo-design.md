# Cierre por tipo de venta (pedido 99)

Pedido de Santiago, 2026-11-19: «necesito poder hacer un cierre por tipo de venta, no solo
PedidosYa». Lo que sigue es lo que sugirió quien construye y Santiago aprobó («oka dale»). Lo que
no se sabe de cómo trabaja Manteca está marcado **(supuesto)**.

## Por qué

El cierre de turno (pedido 98) controla solo el cajón. Las ventas de PedidosYa, de un mayorista o
de cualquier otro tipo no tienen control: si una no se carga, nadie se entera.

## Global Constraints

- **Tests:** sin mocks (ni `vi.mock`, ni `vi.fn`, ni `page.route`, ni clientes falsos). Contra
  `mantecatest` (`CLAUDE.local.md`), los puros aparte, y la fecha y la hora como parámetro.
- **TDD:** primero el test, verlo fallar y después el código.
- **Largo:** función de `.ts` hasta 20 líneas, componente `.tsx` hasta 80, archivo hasta 300.
- **Idioma:** español, y voseo en pantalla.
- **Plata:** centavos enteros, con `_centavos`.
- **Sesión y RLS:**
  - Caja cuenta a ciegas: no ve lo cargado de ningún tipo antes de guardar.
  - Nada se borra. Toda escritura deja auditoría.
- **Quién decide:** Santiago. Worktree `orca/manteca-cierres-por-turno`, rama
  `feat/cierre-por-tipo`, sin `git push`. Las migraciones van solo a `mantecatest`, y antes de
  aplicarlas se avisa a la sesión de Materia prima. No se corre nada contra la base mientras esa
  sesión corre su prueba en vivo.
- **Hecho:** `npm run verificar` y `npm run e2e`.

## Decisiones

### Qué se controla

1. Cada tipo de venta tiene «Se controla en el cierre»
   (`canales_de_venta.se_controla_en_el_cierre`), que el admin cambia en Tipos de venta.
   - Local no la tiene, porque es la caja.
   - Todos arrancan apagados, porque hoy no hay ninguna plataforma cargada. Al crear PedidosYa, el
     admin la prende **(supuesto)**.

### Vender

2. Vender suma un selector «Tipo de venta»: viene Local y muestra los tipos activos.
   - Caja lo puede usar.
   - La base valida que el tipo sea del local y esté activo (`PV316`).
3. Un medio de pago nuevo, **«Fuera de la caja»** (`fuera_de_caja`), para lo que no entra al
   cajón: PedidosYa pagado online o la transferencia de un mayorista a otra cuenta.
   - Está en Vender y en la venta a mano.
   - No suma a lo esperado de ningún medio de la Caja.
   - Si el repartidor paga en efectivo, se elige Efectivo.

### Ventas a mano

4. La venta a mano lleva turno siempre, no solo cuando se cobró en la caja. Viene elegido según la
   fecha: hoy, el turno abierto; un día anterior, la noche.

### El cierre

5. El cierre de cada turno tiene, después de la Caja, una sección por cada tipo que se controla,
   con «Cantidad de ventas» y «Total». Esos datos se anotan según la app o el registro de ese tipo.
   - Si un tipo no tuvo ventas, se deja en cero.
   - Los dos datos son obligatorios en cada sección, aunque sea con cero.
6. Lo esperado de cada sección es lo cargado de ese tipo en la fecha y el turno del cierre: las
   ventas cerradas y sin anular, con cualquier medio de pago.
7. Diferencia de cada sección:
   - **Total:** lo anotado menos lo cargado.
   - **Cantidad:** la de ventas, también como diferencia.
   - Si el total supera la tolerancia o la cantidad no coincide, la sección queda «Con
     diferencia».
   - El cierre queda «Con diferencia» si la Caja o alguna sección lo está.
8. A ciegas: igual que la Caja, lo cargado se ve recién al guardar.
9. Los tipos se fijan al guardar. Si después se prende o se apaga «Se controla en el cierre», los
   cierres ya guardados no cambian: cada sección queda guardada con su tipo.
10. El admin edita las secciones al editar el cierre, como lo demás, con auditoría.

### Lo que se ve

11. El detalle del cierre muestra cada sección con lo anotado, lo cargado y la diferencia.
12. El control y Mis cierres usan el estado del punto 7. Una diferencia de una sección aparece en la
    lista con el nombre del tipo, como un medio más.

## Parte técnica

- **Migración `20261119140000_cierre_por_tipo`, con su reversa:**
  - `alter type medio_de_caja add value 'fuera_de_caja'`;
  - la columna `se_controla_en_el_cierre boolean not null default false` en `canales_de_venta`,
    con `grant update` para el admin;
  - la tabla `controles_de_cierre` (`cierre_id`, `canal_id`, `cantidad`, `total_centavos`), única
    por `(cierre_id, canal_id)`. RLS: el admin ve las de su local y Caja las de sus cierres. Nadie
    escribe directo: se escribe por `cierres_guardar` y `cierres_editar`. Lleva auditoría.
  - `ventas_guardar_mostrador` lee `datos.canal_id`: sin él va Local; un tipo de otro local o
    inactivo da `PV316`.
  - `ventas_guardar_manual` toma `datos.turno` siempre.
  - `cierres_guardar` y `cierres_editar` leen `datos.controles`: `[{ canal_id, cantidad,
    total_centavos }]`.
  - `cierres_controles(desde, hasta)` devuelve por cierre y por tipo lo anotado y lo cargado. La
    usan el admin y Caja, que solo ve los suyos.
  - `caja_tipos_para_vender()` devuelve los tipos activos para Vender, con
    `se_controla_en_el_cierre`, sin montos.
- **Cálculo puro:** `src/lib/caja/controles.ts` arma la diferencia de cada sección y el estado
  combinado con la Caja, con su test.
- **Pantallas:**
  - el selector de tipo en Vender;
  - el medio «Fuera de la caja» en Vender y en la venta a mano;
  - las secciones en `FormularioDeCierre`;
  - el detalle;
  - el control y Mis cierres;
  - la opción en Tipos de venta.
- **Pruebas:**
  - reglas y RLS de `controles_de_cierre`;
  - servicio;
  - puros;
  - `e2e/cierre-por-tipo.spec.ts`: el admin prende un tipo; Caja vende uno de ese tipo «Fuera de
    la caja»; carga el cierre con su sección y ve el resultado; la Caja no cuenta esa venta.

## Fuera de alcance

- Subir el reporte de PedidosYa (pedido 91, hace falta uno real).
- La comisión y lo depositado (pedido 92).
- Un precio distinto por tipo de venta: en el mostrador rige el precio del menú.
