type Props = { valor: string; cambiar: (texto: string) => void };

/** Si se cambió algún precio a mano, el cobro pide por qué (pedido 102). */
export function MotivoDelPrecio({ valor, cambiar }: Props) {
  return (
    <label className="block space-y-1.5 rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
      <span className="text-[11px] font-bold uppercase tracking-widest text-amber-800">
        Motivo del precio cambiado
      </span>
      <input
        value={valor}
        onChange={(e) => cambiar(e.target.value)}
        maxLength={300}
        placeholder="Ej: promo de medialunas, precio de Pedidos Ya"
        className="h-11 w-full rounded-xl border border-amber-200 bg-white px-3 text-sm font-semibold outline-none focus:border-foreground"
      />
    </label>
  );
}
