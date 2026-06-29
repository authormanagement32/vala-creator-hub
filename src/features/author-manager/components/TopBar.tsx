import { Link, useRouterState } from "@tanstack/react-router";
import { Command, Search } from "lucide-react";
import { NotificationCenter } from "./NotificationCenter";
import { WALLS } from "../nav";

interface Props {
  onSearch: (q: string) => void;
  search: string;
  onOpenPalette: () => void;
}

export function TopBar({ onSearch, search, onOpenPalette }: Props) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <header className="sticky top-0 z-30 border-b border-hairline bg-surface text-foreground">
      <div className="flex h-14 items-center gap-3 px-4">
        <Link
          to="/boss/author-manager/dashboard"
          className="flex items-center gap-2 pr-3 text-sm font-semibold tracking-tight"
        >
          <span className="grid h-7 w-7 place-items-center rounded-md bg-brand text-brand-foreground">
            SV
          </span>
          <span className="hidden sm:inline">Author Manager</span>
        </Link>
        <div className="hidden h-6 w-px bg-hairline md:block" />
        <div className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search authors, products, licenses…"
            className="h-9 w-full rounded-md border border-hairline bg-surface-2 pl-8 pr-16 text-sm outline-none placeholder:text-muted-foreground focus:border-brand"
          />
          <button
            onClick={onOpenPalette}
            className="absolute right-1.5 top-1/2 flex h-6 -translate-y-1/2 items-center gap-1 rounded border border-hairline px-1.5 text-[10px] font-medium text-muted-foreground hover:text-foreground"
          >
            <Command className="h-3 w-3" />K
          </button>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <NotificationCenter />
          <div className="grid h-9 w-9 place-items-center rounded-full bg-brand text-xs font-semibold text-brand-foreground">
            B
          </div>
        </div>
      </div>
      <nav className="scrollbar-thin flex h-10 items-center gap-0.5 overflow-x-auto border-t border-hairline px-2">
        {WALLS.map((w) => {
          const active = pathname.startsWith(w.to);
          return (
            <Link
              key={w.to}
              to={w.to}
              className={
                "shrink-0 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors " +
                (active
                  ? "bg-brand/10 text-brand"
                  : "text-muted-foreground hover:bg-surface-2 hover:text-foreground")
              }
            >
              {w.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
