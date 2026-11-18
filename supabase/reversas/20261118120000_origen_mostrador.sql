-- Reversa del origen mostrador (pedido 89). Postgres no saca un valor de un enum: se rehace el
-- tipo sin el. Falla si quedan ventas del mostrador, que no se borran: en ese caso el valor se
-- queda. Va despues de la reversa de 20261118120100.

alter table public.ventas alter column origen drop default;
create type public.origen_de_venta_sin_mostrador as enum ('manual', 'fudo');
alter table public.ventas
  alter column origen type public.origen_de_venta_sin_mostrador
  using origen::text::public.origen_de_venta_sin_mostrador;
drop type public.origen_de_venta;
alter type public.origen_de_venta_sin_mostrador rename to origen_de_venta;
alter table public.ventas alter column origen set default 'manual';
