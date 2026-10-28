-- Dos medios de pago mas para un gasto: efectivo (el que no sale de la caja) y cheque.
alter type public.medio_de_pago add value if not exists 'efectivo';
alter type public.medio_de_pago add value if not exists 'cheque';
