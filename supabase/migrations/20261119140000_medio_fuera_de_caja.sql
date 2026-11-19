-- Cierre por tipo de venta (pedido 99), primera parte: el medio de pago de lo que no entra al
-- cajon (PedidosYa pagado online, una transferencia a otra cuenta). Va solo: un valor nuevo de un
-- enum no se puede usar en la misma transaccion en que se agrega.
alter type public.medio_de_caja add value if not exists 'fuera_de_caja';
