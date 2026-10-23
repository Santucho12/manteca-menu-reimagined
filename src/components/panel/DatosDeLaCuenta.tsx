import type { PerfilDeAcceso } from '@/lib/acceso/estados';
import { nombreDeRol } from '@/lib/usuarios/presentacion';

/** Nombre, email y rol en los mosaicos de la ficha de Plan Reminder Pro: para leer, no editar. */
export function DatosDeLaCuenta({ perfil }: { perfil: PerfilDeAcceso }) {
  const datos = [
    ['Nombre', perfil.nombre],
    ['Email', perfil.email],
    ['Rol', nombreDeRol(perfil.rol)],
  ] as const;
  return (
    <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
      {datos.map(([termino, valor]) => (
        <div key={termino} className="rounded-xl bg-secondary/40 p-3">
          <dt className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            {termino}
          </dt>
          <dd className="font-semibold break-all">{valor}</dd>
        </div>
      ))}
    </dl>
  );
}
