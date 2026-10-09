-- Reversa: Caja deja de ver los gastos de sus cierres.
drop policy if exists "gastos: caja ve los de sus cierres" on public.gastos;
