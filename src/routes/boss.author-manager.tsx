import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { TopBar } from "@/features/author-manager/components/TopBar";
import { CommandPalette } from "@/features/author-manager/components/CommandPalette";

export const Route = createFileRoute("/boss/author-manager")({
  head: () => ({
    meta: [
      { title: "Author Manager — Software Vala Boss Panel" },
      {
        name: "description",
        content:
          "Global control center for managing software authors, source code publishers, template creators, plugin developers, and AI creators across Software Vala.",
      },
    ],
  }),
  component: AuthorManagerLayout,
});

function AuthorManagerLayout() {
  const [search, setSearch] = useState("");
  const [paletteOpen, setPaletteOpen] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      } else if (e.key === "Escape") {
        setPaletteOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopBar search={search} onSearch={setSearch} onOpenPalette={() => setPaletteOpen(true)} />
      <main>
        <Outlet />
      </main>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
