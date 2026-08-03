import { Link } from "@tanstack/react-router";
import { Bell, ChevronDown, Crown, LifeBuoy, Menu, Search, Settings } from "lucide-react";
import { NotificationCenter } from "./NotificationCenter";

interface Props {
  onSearch: (q: string) => void;
  search: string;
  onOpenPalette: () => void;
  onOpenMenu?: () => void;
}

export function TopBar({ onSearch, search, onOpenPalette, onOpenMenu }: Props) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-4 lg:px-6">
        <button
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border lg:hidden"
          onClick={onOpenMenu}
          aria-label="Open menu"
        >
          <Menu className="h-4 w-4" />
        </button>

        <Link to="/boss/author-manager/dashboard" className="flex shrink-0 items-center gap-2 lg:hidden">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary-glow font-bold text-primary-foreground">
            SV
          </span>
        </Link>

        <div className="hidden w-56 items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 md:flex lg:w-72 2xl:w-96">
          <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search authors, products, licenses…"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <button
            onClick={onOpenPalette}
            className="hidden rounded border border-border px-1.5 text-[10px] text-muted-foreground hover:text-foreground 2xl:inline"
            aria-label="Open command palette"
          >
            ⌘K
          </button>
        </div>

        <div className="flex-1" />

        <Link
          to="/boss/author-manager/support"
          className="hidden h-9 w-9 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground lg:grid"
          aria-label="Support"
        >
          <LifeBuoy className="h-4 w-4" />
        </Link>

        <div className="relative">
          <NotificationCenter />
        </div>

        <Link
          to="/boss/author-manager/settings"
          className="hidden h-9 w-9 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground lg:grid"
          aria-label="Settings"
        >
          <Settings className="h-4 w-4" />
        </Link>

        <div className="group flex shrink-0 items-center gap-2.5 rounded-full border border-border bg-surface py-1 pl-1 pr-2 shadow-sm transition-all duration-200 hover:border-primary/40 hover:shadow-md sm:pr-3">
          <span className="relative shrink-0">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-accent-pink via-primary to-primary-glow text-[11px] font-bold text-primary-foreground ring-1 ring-white/10">
              BV
            </span>
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-accent-emerald ring-2 ring-background" />
          </span>
          <span className="hidden min-w-0 flex-col items-start leading-tight sm:flex">
            <span className="max-w-[120px] truncate text-xs font-semibold">Boss Vala</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-primary">
              <Crown className="h-2.5 w-2.5" /> Founder
            </span>
          </span>
          <ChevronDown className="hidden h-3.5 w-3.5 text-muted-foreground sm:block" />
        </div>
      </div>
    </header>
  );
}

export { Bell };
