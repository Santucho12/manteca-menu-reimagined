type Props = { titulo: string; detalle?: string };

/**
 * Lo que salio bien, escrito en la pantalla: la franja de resultado de Plan Reminder Pro. Es un
 * estado y no una alerta: no interrumpe al lector de pantalla.
 */
export function AvisoDeExito({ titulo, detalle }: Props) {
  return (
    <div
      role="status"
      className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
    >
      <div>
        <p className="text-sm font-bold text-emerald-900">{titulo}</p>
        {detalle ? <p className="text-xs text-emerald-800/80">{detalle}</p> : null}
      </div>
    </div>
  );
}
