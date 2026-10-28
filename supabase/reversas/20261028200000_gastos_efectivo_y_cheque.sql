-- Reversa de 20261028200000_gastos_efectivo_y_cheque. Postgres no saca un valor de un tipo
-- enumerado: si no hay gastos con esos medios, se recrea el tipo sin ellos; si los hay, se
-- pasan antes a 'otro'.
update public.gastos set medio_de_pago = 'otro' where medio_de_pago in ('efectivo', 'cheque');
update public.gastos_por_pagar set medio_de_pago = 'otro' where medio_de_pago in ('efectivo', 'cheque');
update public.gastos_recurrentes set medio_de_pago = 'otro' where medio_de_pago in ('efectivo', 'cheque');
alter type public.medio_de_pago rename to medio_de_pago_viejo;
create type public.medio_de_pago as enum ('efectivo_caja', 'transferencia', 'tarjeta', 'otro');
alter table public.gastos alter column medio_de_pago type public.medio_de_pago using medio_de_pago::text::public.medio_de_pago;
alter table public.gastos_por_pagar alter column medio_de_pago type public.medio_de_pago using medio_de_pago::text::public.medio_de_pago;
alter table public.gastos_recurrentes alter column medio_de_pago type public.medio_de_pago using medio_de_pago::text::public.medio_de_pago;
drop type public.medio_de_pago_viejo;
