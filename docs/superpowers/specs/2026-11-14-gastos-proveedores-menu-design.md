# Gastos, Proveedores, Menú y documentos (pedido 86)

De la revisión lógica del 2026-11-05. Diseño acordado con Santiago en el chat el 2026-11-14.
No toca la base: no hay migración.

1. **Gastos, medio:** "Efectivo" se muestra "Efectivo (fuera de la caja)". Solo el texto.
2. **Gastos, posible repetido:** al cargar un gasto, si hay otro sin anular con el mismo
   proveedor, monto y fecha, avisa "Ya hay un gasto igual" y ofrece "Cargar igual". No bloquea.
   Sin proveedor no avisa.
3. **Proveedores:** la ficha muestra "Por pagar" (lo pendiente de ese proveedor); la lista suma
   la columna "Por pagar"; desactivar con algo pendiente avisa "Tiene $X por pagar".
4. **Menú, aviso de Fudo:** "Los precios de acá no cambian los de Fudo: cambialos también allá."
   Sin la promesa de integración.
5. **Menú, después de un aumento:** el resultado muestra "Pasalos a Fudo", con cada producto, su
   precio anterior y el nuevo. No se guarda.
6. **Ventas, Excel:** un medio desconocido dice cuáles entran: efectivo, tarjeta de crédito,
   tarjeta de débito, QR y transferencia.
7. **Ventas, ayuda:** cargar una venta a mano es solo para lo que no pasó por Fudo.
8. **Documentos:** `docs/modulos/` de Ventas, Caja y Gastos al día.

## Global Constraints

- TDD estricto; tests sin mocks (`*.base.test.ts` contra pruebas, el resto puros).
- Largo: 20 líneas por función `.ts`, 80 por componente, 300 por archivo; lógica fuera de `.tsx`.
- Español, pantalla con voseo. Plata en centavos enteros, se muestra `$1.234,50`.
- Sesión del usuario y RLS; todo es solo admin. Publicar y excepciones: decide Santiago.
