import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { WALLS } from "../nav";

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  useEffect(() => {
    if (!open) setQ("");
  }, [open]);
  if (!open) return null;
  const results = WALLS.filter((w) => w.label.toLowerCase().includes(q.toLowerCase()));
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-24"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg overflow-hidden rounded-lg border border-hairline bg-surface shadow-xl"
      >
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Jump to wall, action, author…"
          className="h-12 w-full border-b border-hairline bg-transparent px-4 text-sm outline-none"
        />
        <ul className="max-h-80 overflow-auto p-1">
          {results.map((r) => (
            <li key={r.to}>
              <button
                onClick={() => {
                  navigate({ to: r.to });
                  onClose();
                }}
                className="flex w-full items-center justify-between rounded px-3 py-2 text-left text-sm hover:bg-surface-2"
              >
                <span>{r.label}</span>
                <span className="text-[11px] text-muted-foreground">{r.group}</span>
              </button>
            </li>
          ))}
          {results.length === 0 && (
            <li className="p-4 text-center text-sm text-muted-foreground">No matches</li>
          )}
        </ul>
      </div>
    </div>
  );
}
