import { X } from "lucide-react";
import type { ReactNode } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function RightActionPanel({ open, onClose, title, subtitle, children }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="flex-1 bg-black/30" onClick={onClose} />
      <aside className="flex h-full w-full max-w-md flex-col border-l border-hairline bg-surface shadow-xl">
        <header className="flex items-start justify-between border-b border-hairline p-4">
          <div>
            <div className="text-sm font-semibold">{title}</div>
            {subtitle && <div className="mt-0.5 text-xs text-muted-foreground">{subtitle}</div>}
          </div>
          <button onClick={onClose} className="rounded p-1 hover:bg-surface-2">
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="scrollbar-thin flex-1 overflow-auto p-4">{children}</div>
      </aside>
    </div>
  );
}
