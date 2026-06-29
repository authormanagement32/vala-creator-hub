import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ExternalLink, GitBranch, RefreshCw, ShieldCheck, ShieldAlert } from "lucide-react";
import { WallShell } from "@/features/author-manager/components/WallShell";
import { FilterBar } from "@/features/author-manager/components/FilterBar";
import { DataTable, type Column } from "@/features/author-manager/components/DataTable";
import { StatusBadge } from "@/features/author-manager/components/StatusBadge";
import { RightActionPanel } from "@/features/author-manager/components/RightActionPanel";
import { AuditTimeline } from "@/features/author-manager/components/AuditTimeline";
import { useSourceRepos, deriveState } from "@/features/author-manager/data";
import { fmtNumber, fmtDate } from "@/features/author-manager/format";
import type { SourceRepo } from "@/features/author-manager/types";

export const Route = createFileRoute("/boss/author-manager/source-code")({
  head: () => ({ meta: [{ title: "Source Code — Author Manager" }] }),
  component: SourceCodeWall,
});

function buildTone(s: SourceRepo["buildStatus"]) {
  if (s === "passing") return "bg-success/15 text-success";
  if (s === "failing") return "bg-danger/15 text-danger";
  if (s === "pending") return "bg-warning/15 text-warning";
  return "bg-muted text-muted-foreground";
}

const columns: Column<SourceRepo>[] = [
  {
    id: "name",
    header: "Repository",
    cell: (r) => (
      <div className="flex flex-col">
        <span className="font-medium">{r.name}</span>
        <span className="text-[11px] text-muted-foreground">{r.provider} · {r.defaultBranch}</span>
      </div>
    ),
    width: "1.4",
  },
  { id: "version", header: "Latest", cell: (r) => <span className="font-mono text-[11px]">{r.latestVersion ?? "—"}</span>, width: "0.6" },
  {
    id: "build",
    header: "Build",
    cell: (r) => (
      <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium capitalize ${buildTone(r.buildStatus)}`}>
        {r.buildStatus}
      </span>
    ),
    width: "0.6",
  },
  {
    id: "deps",
    header: "Dependencies",
    cell: (r) => (
      <span className="text-[12px]">
        {fmtNumber(r.dependencyCount)}{" "}
        {r.outdatedDependencies > 0 && (
          <span className="text-warning">({r.outdatedDependencies} outdated)</span>
        )}
      </span>
    ),
    width: "0.9",
  },
  {
    id: "vuln",
    header: "Vulnerabilities",
    cell: (r) => {
      const v = r.vulnerabilities;
      const total = v.critical + v.high + v.medium + v.low;
      if (total === 0) return <span className="inline-flex items-center gap-1 text-success"><ShieldCheck className="h-3.5 w-3.5" /> Clean</span>;
      return (
        <span className="inline-flex items-center gap-1 text-danger">
          <ShieldAlert className="h-3.5 w-3.5" /> {v.critical}C / {v.high}H / {v.medium}M
        </span>
      );
    },
    width: "1",
  },
  {
    id: "license",
    header: "License",
    cell: (r) => <StatusBadge status={r.licenseValid ? "approved" : "rejected"} />,
    width: "0.6",
  },
  { id: "lastBuild", header: "Last build", cell: (r) => fmtDate(r.lastBuildAt), width: "0.7" },
];

function SourceCodeWall() {
  const [search, setSearch] = useState("");
  const [build, setBuild] = useState("");
  const [provider, setProvider] = useState("");
  const [selected, setSelected] = useState<SourceRepo | null>(null);

  const q = useMemo(
    () => ({ page: 1, pageSize: 50, search, filters: { build, provider } }),
    [search, build, provider],
  );
  const { data, isLoading, isError } = useSourceRepos(q);
  const state = deriveState(isLoading, isError, data);

  return (
    <WallShell
      title="Source Code"
      subtitle="Repository linking, release history, CI builds, dependency health, and security scans."
      count={data?.total}
      actions={
        <button className="flex h-9 items-center gap-1.5 rounded-md border border-hairline px-2.5 text-sm hover:bg-surface-2">
          <RefreshCw className="h-3.5 w-3.5" /> Rescan all
        </button>
      }
    >
      <FilterBar
        search={search}
        onSearch={setSearch}
        statusOptions={[
          { value: "passing", label: "Passing" },
          { value: "failing", label: "Failing" },
          { value: "pending", label: "Pending" },
          { value: "unknown", label: "Unknown" },
        ]}
        status={build}
        onStatusChange={setBuild}
        onCreate={() => {}}
        createLabel="Link repository"
        extras={
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className="h-9 rounded-md border border-hairline bg-surface-2 px-2 text-sm outline-none focus:border-brand"
          >
            <option value="">All providers</option>
            <option value="github">GitHub</option>
            <option value="gitlab">GitLab</option>
            <option value="bitbucket">Bitbucket</option>
            <option value="self-hosted">Self-hosted</option>
          </select>
        }
      />
      <DataTable
        columns={columns}
        rows={data?.rows ?? []}
        state={state}
        rowKey={(r) => r.id}
        onRowClick={setSelected}
        emptyTitle="No repositories linked"
        emptyDescription="Connect GitHub, GitLab, or Bitbucket to mirror releases, builds, dependency scans, and license validation here."
      />
      <RightActionPanel
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.name ?? ""}
        subtitle={selected ? `${selected.provider} · ${selected.defaultBranch}` : undefined}
      >
        {selected && <RepoPanel repo={selected} />}
      </RightActionPanel>
    </WallShell>
  );
}

function RepoPanel({ repo }: { repo: SourceRepo }) {
  const v = repo.vulnerabilities;
  return (
    <div className="space-y-5 text-sm">
      <a
        href={repo.url}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-1.5 text-xs text-brand hover:underline"
      >
        <ExternalLink className="h-3.5 w-3.5" /> {repo.url}
      </a>

      <div className="grid grid-cols-2 gap-2">
        <Stat label="Latest version" value={<span className="font-mono">{repo.latestVersion ?? "—"}</span>} />
        <Stat label="Build" value={<span className="capitalize">{repo.buildStatus}</span>} />
        <Stat label="Dependencies" value={fmtNumber(repo.dependencyCount)} />
        <Stat label="Outdated" value={<span className={repo.outdatedDependencies > 0 ? "text-warning" : ""}>{fmtNumber(repo.outdatedDependencies)}</span>} />
      </div>

      <div>
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Security scan</div>
        <div className="grid grid-cols-4 gap-2 text-center">
          <Sev label="Critical" n={v.critical} tone="text-danger" />
          <Sev label="High" n={v.high} tone="text-danger" />
          <Sev label="Medium" n={v.medium} tone="text-warning" />
          <Sev label="Low" n={v.low} tone="text-muted-foreground" />
        </div>
        <div className="mt-2 text-[11px] text-muted-foreground">Last scan: {fmtDate(repo.lastScanAt)}</div>
      </div>

      <div>
        <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <GitBranch className="h-3.5 w-3.5" /> Release validation
        </div>
        <ul className="space-y-1 text-xs">
          <li className="flex items-center justify-between rounded-md border border-hairline p-2">
            <span>License header</span>
            <StatusBadge status={repo.licenseValid ? "approved" : "rejected"} />
          </li>
          <li className="flex items-center justify-between rounded-md border border-hairline p-2">
            <span>CI build</span>
            <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium capitalize ${buildTone(repo.buildStatus)}`}>
              {repo.buildStatus}
            </span>
          </li>
          <li className="flex items-center justify-between rounded-md border border-hairline p-2">
            <span>Dependency policy</span>
            <StatusBadge status={repo.outdatedDependencies === 0 ? "approved" : "pending"} />
          </li>
        </ul>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button className="rounded-md bg-brand px-3 py-2 text-sm font-medium text-brand-foreground hover:opacity-90">
          Rescan now
        </button>
        <button className="rounded-md border border-hairline px-3 py-2 text-sm hover:bg-surface-2">
          Sync releases
        </button>
      </div>

      <div>
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Audit</div>
        <AuditTimeline entity="source-repo" entityId={repo.id} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-md border border-hairline bg-surface-2 p-2">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-medium">{value}</div>
    </div>
  );
}

function Sev({ label, n, tone }: { label: string; n: number; tone: string }) {
  return (
    <div className="rounded-md border border-hairline bg-surface-2 p-2">
      <div className={`text-base font-semibold ${tone}`}>{n}</div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}
