import type { ReactNode } from "react";
import { Activity, Award, Sparkles, Star } from "lucide-react";

interface HeroStat {
  label: string;
  value: ReactNode;
}

interface Props {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
  live?: boolean;
  liveLabel?: string;
  panelTitle: string;
  panelSubtitle: string;
  stats: HeroStat[];
}

/**
 * Hero banner — same composition as the Creator's Launchpad hero surface:
 * gradient hero-surface, two blurred orbs, left copy column with pill +
 * headline + actions + live chip, right glass profile card with 3 stat tiles.
 */
export function WallHero({
  eyebrow,
  title,
  description,
  actions,
  live = false,
  liveLabel,
  panelTitle,
  panelSubtitle,
  stats,
}: Props) {
  return (
    <section className="hero-surface relative overflow-hidden p-6 md:p-10">
      <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute -bottom-24 -left-10 h-64 w-64 rounded-full bg-accent-pink/40 blur-3xl" />

      <div className="relative grid items-start gap-8 lg:grid-cols-2">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" /> {eyebrow}
          </div>
          <h1 className="mt-5 text-4xl font-bold tracking-tight md:text-6xl">{title}</h1>
          <p className="mt-3 max-w-md text-white/80">{description}</p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {actions}
            <span
              className={
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-medium " +
                (live
                  ? "border-accent-emerald/40 bg-accent-emerald/15 text-accent-emerald"
                  : "border-white/20 bg-white/10 text-white/80")
              }
            >
              <Activity className="h-3 w-3" />
              {live ? `Live · ${liveLabel ?? "database"}` : "Awaiting live signals"}
            </span>
          </div>
        </div>

        <div className="w-full max-w-sm lg:justify-self-end">
          <div className="rounded-2xl border border-white/15 bg-black/25 p-5 backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="relative">
                <span className="block h-14 w-14 rounded-full bg-gradient-to-br from-accent-pink to-primary-glow" />
                <span className="absolute -right-1 -top-1 grid h-6 w-6 place-items-center rounded-full bg-accent-amber text-black">
                  <Star className="h-3.5 w-3.5" />
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate font-semibold">{panelTitle}</p>
                  <Award className="h-4 w-4 text-accent-amber" />
                </div>
                <p className="text-xs text-white/70">{panelSubtitle}</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              {stats.slice(0, 3).map((s) => (
                <div key={s.label} className="rounded-xl border border-white/15 bg-white/10 py-2">
                  <p className="text-[10px] uppercase tracking-wider text-white/60">{s.label}</p>
                  <p className="text-sm font-semibold">{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
