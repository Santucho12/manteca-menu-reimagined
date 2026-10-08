import type { PerfilDeAcceso } from '@/lib/acceso/estados';
import { nombreDeRol } from '@/lib/usuarios/presentacion';

/** Nombre, email y rol, para leer: nombre y email los corrige un admin. */
export function DatosDeLaCuenta({ perfil }: { perfil: PerfilDeAcceso }) {
  const datos = [
    ['Nombre', perfil.nombre],
    ['Email', perfil.email],
    ['Rol', nombreDeRol(perfil.rol)],
  ] as const;
  return (
    <dl className="space-y-3">
      {datos.map(([termino, valor]) => (
        <div key={termino}>
          <dt className="text-muted-foreground text-sm">{termino}</dt>
          <dd className="break-all">{valor}</dd>
        </div>
      ))}
    </dl>
  );
}
