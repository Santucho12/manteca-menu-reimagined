-- Pedido 89: Manteca deja Fudo y vende en el mostrador. Una venta puede venir del mostrador.
-- Va en su propia migracion: un valor nuevo de un enum no se usa en la transaccion que lo agrega.
alter type public.origen_de_venta add value if not exists 'mostrador';
