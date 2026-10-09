-- Caja ve los gastos que declaro en sus propios cierres, para leer su cierre completo. No
-- ve ningun otro gasto ni puede escribir en Gastos.

drop policy if exists "gastos: caja ve los de sus cierres" on public.gastos;
create policy "gastos: caja ve los de sus cierres" on public.gastos
  for select to authenticated
  using (
    cierre_id is not null
    and (select public.es_caja_activa())
    and exists (
      select 1 from public.cierres_de_caja c
       where c.id = cierre_id and c.cargado_por = (select auth.uid())
    )
  );
