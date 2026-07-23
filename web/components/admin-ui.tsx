"use client";

export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-amber-400/15 text-amber-300 border-amber-400/40",
    delivered: "bg-volt/15 text-volt border-volt/40",
    cancelled: "bg-red-400/15 text-red-300 border-red-400/40",
    draft: "bg-sky-400/15 text-sky-300 border-sky-400/40",
    live: "bg-volt/15 text-volt border-volt/40",
    archived: "bg-slate-500/15 text-slate-400 border-slate-500/40",
    paid: "bg-volt/15 text-volt border-volt/40",
    unpaid: "bg-amber-400/15 text-amber-300 border-amber-400/40",
    failed: "bg-red-400/15 text-red-300 border-red-400/40",
  };
  return (
    <span className={`hud-label inline-block border px-2 py-0.5 text-[10px] font-bold ${styles[status] ?? ""}`}>
      {status}
    </span>
  );
}

/** Screenshot gallery used to pick images for game art, skins and events. */
export function ImagePicker({
  images,
  assetUrl,
  onPick,
}: {
  images: string[];
  assetUrl: (p: string) => string;
  onPick: (path: string) => void;
}) {
  if (images.length === 0) {
    return <p className="text-xs text-slate-500">No synced screenshots — run a sync from Settings.</p>;
  }
  return (
    <div className="flex flex-wrap gap-2">
      {images.map((img) => (
        <button
          key={img}
          type="button"
          onClick={() => onPick(img)}
          title={img}
          className="clip-btn overflow-hidden border border-edge transition hover:border-neon"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={assetUrl(img)} alt={img} className="h-16 w-28 object-cover" />
        </button>
      ))}
    </div>
  );
}
