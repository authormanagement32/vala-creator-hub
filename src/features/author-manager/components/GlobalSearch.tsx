import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useHasSession } from "@/hooks/use-has-session";

type Group = "authors" | "products" | "repos";

interface Suggestion {
  id: string;
  group: Group;
  label: string;
  meta: string;
  to: "/boss/author-manager/authors" | "/boss/author-manager/products" | "/boss/author-manager/source-code";
}

const GROUP_LABEL: Record<Group, string> = {
  authors: "Authors",
  products: "Products",
  repos: "Source repos",
};

interface Props {
  search: string;
  onSearch: (q: string) => void;
  onOpenPalette: () => void;
}

export function GlobalSearch({ search, onSearch, onOpenPalette }: Props) {
  const navigate = useNavigate();
  const hasSession = useHasSession();
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [debounced, setDebounced] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 200);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const { data, isFetching, isPending, isError, error, refetch } = useQuery({
    queryKey: ["author-manager", "global-search", debounced],
    enabled: hasSession === true && debounced.length >= 2,
    staleTime: 15_000,
    retry: false,
    queryFn: async () => {
      const { globalSearch } = await import("@/lib/author-manager.functions");
      return await globalSearch({ data: { q: debounced } });
    },
  });

  const suggestions = useMemo<Suggestion[]>(() => {
    if (!data) return [];
    return [
      ...data.authors.map((a) => ({
        id: `author-${a.id}`,
        group: "authors" as Group,
        label: a.name,
        meta: a.email,
        to: "/boss/author-manager/authors" as const,
      })),
      ...data.products.map((p) => ({
        id: `product-${p.id}`,
        group: "products" as Group,
        label: p.name,
        meta: p.status,
        to: "/boss/author-manager/products" as const,
      })),
      ...data.repos.map((r) => ({
        id: `repo-${r.id}`,
        group: "repos" as Group,
        label: r.name,
        meta: r.provider,
        to: "/boss/author-manager/source-code" as const,
      })),
    ];
  }, [data]);

  useEffect(() => setActive(0), [suggestions.length]);

  const query = search.trim();
  const showPanel = open && query.length > 0;
  const tooShort = query.length < 2;
  const loading = !tooShort && hasSession !== false && (isPending || (isFetching && !data));
  const empty = !tooShort && !loading && !isError && suggestions.length === 0;

  const statusMessage = tooShort
    ? "Type at least 2 characters to search"
    : loading
      ? "Searching…"
      : isError
        ? "Search failed"
        : empty
          ? "No matches found"
          : `${suggestions.length} result${suggestions.length === 1 ? "" : "s"} available`;

  const choose = (s: Suggestion | undefined) => {
    if (!s) {
      onOpenPalette();
      return;
    }
    setOpen(false);
    navigate({ to: s.to });
  };

  return (
    <div ref={wrapRef} className="relative min-w-0 flex-1 md:max-w-72 2xl:max-w-96">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          choose(suggestions[active]);
        }}
        className="flex min-w-0 items-center gap-2 rounded-full border border-border bg-surface py-1 pl-3 pr-1"
      >
        <label htmlFor="global-search" className="sr-only">
          Search authors, products, source repos
        </label>
        <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <input
          id="global-search"
          type="text"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showPanel && suggestions[active] ? `${listId}-${active}` : undefined}
          autoComplete="off"
          value={search}
          onChange={(e) => {
            onSearch(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
              setActive((i) => (suggestions.length ? (i + 1) % suggestions.length : 0));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((i) => (suggestions.length ? (i - 1 + suggestions.length) % suggestions.length : 0));
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
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

      {showPanel && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-xl border border-border bg-surface shadow-xl">
          <ul id={listId} role="listbox" aria-label="Search suggestions" className="max-h-80 overflow-auto p-1">
            {suggestions.map((s, i) => (
              <li
                key={s.id}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(s)}
                className={`flex cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm ${
                  i === active ? "bg-primary/15 text-foreground" : "hover:bg-surface-2"
                }`}
              >
                <span className="min-w-0 truncate">{s.label}</span>
                <span className="shrink-0 text-[11px] text-muted-foreground">
                  {GROUP_LABEL[s.group]} · {s.meta}
                </span>
              </li>
            ))}
            {tooShort && (
              <li className="px-3 py-3 text-center text-sm text-muted-foreground" role="presentation">
                Keep typing — at least 2 characters.
              </li>
            )}
            {loading && (
              <li className="space-y-2 px-3 py-3" role="presentation" aria-hidden="true">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="flex items-center justify-between gap-2">
                    <span className="h-3 w-1/2 animate-pulse rounded bg-muted-foreground/20" />
                    <span className="h-3 w-16 animate-pulse rounded bg-muted-foreground/10" />
                  </span>
                ))}
              </li>
            )}
            {isError && (
              <li className="px-3 py-3 text-center text-sm" role="presentation">
                <span className="block text-destructive">
                  {error instanceof Error && /unauthorized|forbidden/i.test(error.message)
                    ? "You don’t have access to search right now."
                    : "Search failed. Please try again."}
                </span>
                <button
                  type="button"
                  onClick={() => void refetch()}
                  className="mt-2 rounded-md border border-border px-2 py-1 text-xs hover:bg-surface-2"
                >
                  Retry
                </button>
              </li>
            )}
            {empty && (
              <li className="px-3 py-3 text-center text-sm text-muted-foreground" role="presentation">
                No matches for “{query}”.
              </li>
            )}
          </ul>
          <p aria-live="polite" aria-atomic="true" className="sr-only">
            {statusMessage}
          </p>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onOpenPalette();
            }}
            className="w-full border-t border-border px-3 py-2 text-left text-xs text-muted-foreground hover:bg-surface-2"
          >
            Open command palette (⌘K) for walls and actions
          </button>
        </div>
      )}
    </div>
  );
}
