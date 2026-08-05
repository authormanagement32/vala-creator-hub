import { Link } from "@tanstack/react-router";
import { Bell, ChevronDown, Command, Crown, LifeBuoy, Menu, Search, Settings } from "lucide-react";
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
      <div className="flex h-16 items-center gap-2 px-3 sm:gap-3 lg:px-6">
        <button
          className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-border lg:hidden"
          onClick={onOpenMenu}
          aria-label="Open menu"
        >
          <Menu className="h-4 w-4" />
        </button>

        <Link to="/boss/author-manager/dashboard" className="hidden shrink-0 items-center gap-2 sm:flex lg:hidden">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary-glow font-bold text-primary-foreground">
            SV
          </span>
        </Link>

        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            onOpenPalette();
          }}
          className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-border bg-surface pl-3 pr-1 py-1 md:max-w-72 2xl:max-w-96"
        >
          <label htmlFor="global-search" className="sr-only">
            Search authors, products, licenses
          </label>
          <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <input
            id="global-search"
            type="search"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search authors, products…"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            className="grid h-9 min-h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/15 text-primary transition-colors hover:bg-primary/25"
            aria-label="Search"
          >
            <Search className="h-4 w-4" />
          </button>
        </form>

        <button
          type="button"
          onClick={onOpenPalette}
          className="flex h-11 min-h-11 shrink-0 items-center gap-1.5 rounded-full border border-border px-2.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground sm:h-9 sm:min-h-9"
          aria-label="Open command palette (Ctrl or Command + K)"
          title="Command palette — ⌘K / Ctrl+K"
        >
          <Command className="h-4 w-4" aria-hidden="true" />
          <span className="hidden lg:inline">⌘K</span>
        </button>

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

        <div className="group hidden shrink-0 items-center gap-2.5 rounded-full border border-border bg-surface py-1 pl-1 pr-2 shadow-sm transition-all duration-200 hover:border-primary/40 hover:shadow-md sm:flex sm:pr-3">
          <span className="relative shrink-0">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-accent-pink via-primary to-primary-glow text-[11px] font-bold text-primary-foreground ring-1 ring-white/10">
              BV
            </span>
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-accent-emerald ring-2 ring-background" />
          </span>
          <span className="hidden min-w-0 flex-col items-start leading-tight md:flex">
            <span className="max-w-[120px] truncate text-xs font-semibold">Boss Vala</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-primary">
              <Crown className="h-2.5 w-2.5" /> Founder
            </span>
          </span>
          <ChevronDown className="hidden h-3.5 w-3.5 text-muted-foreground md:block" />
        </div>
      </div>
    </header>
  );
}

export { Bell };
