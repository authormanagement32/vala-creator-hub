import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ExternalLink, GitBranch, Plus, RefreshCw, ShieldAlert, ShieldCheck, Upload } from "lucide-react";
import { WallShell } from "@/features/author-manager/components/WallShell";
import { FilterBar } from "@/features/author-manager/components/FilterBar";
import { StatusBadge } from "@/features/author-manager/components/StatusBadge";
import { RightActionPanel } from "@/features/author-manager/components/RightActionPanel";
import { AuditTimeline } from "@/features/author-manager/components/AuditTimeline";
import { EmptyState } from "@/features/author-manager/components/EmptyState";
import { ScanResultsPanel, type ScanFinding } from "@/features/author-manager/components/ScanResultsPanel";
import { fmtNumber, fmtDate } from "@/features/author-manager/format";
import { listRepos, createRepo, runSecurityScan, releaseRepo } from "@/lib/author-manager.functions";

export const Route = createFileRoute("/boss/author-manager/source-code")({
  head: () => ({ meta: [{ title: "Source Code — Author Manager" }] }),
  component: SourceCodeWall,
});

type Repo = {
  id: string;
  product_id: string | null;
  name: string;
  provider: string;
  url: string;
  default_branch: string;
  latest_version: string | null;
  build_status: string;
  last_build_at: string | null;
  dependency_count: number;
  outdated_dependencies: number;
  vuln_critical: number;
  vuln_high: number;
  vuln_medium: number;
  vuln_low: number;
  license_valid: boolean;
  last_scan_at: string | null;
};

function buildTone(s: string) {
  if (s === "passing") return "bg-success/15 text-success";
  if (s === "failing") return "bg-danger/15 text-danger";
  if (s === "pending") return "bg-warning/15 text-warning";
  return "bg-muted text-muted-foreground";
}

function SourceCodeWall() {
  const [search, setSearch] = useState("");
  const [build, setBuild] = useState("");
  const [provider, setProvider] = useState("");
  const [selected, setSelected] = useState<Repo | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const qc = useQueryClient();
  const list = useServerFn(listRepos);
  const create = useServerFn(createRepo);
  const scan = useServerFn(runSecurityScan);
  const release = useServerFn(releaseRepo);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: useMemo(() => ["repos", { search, build, provider }], [search, build, provider]),
    queryFn: () => list({ data: { search, build, provider, page: 1, pageSize: 50 } }),
    retry: false,
  });

  const rows: Repo[] = (data as any)?.rows ?? [];
  const total = (data as any)?.total ?? 0;
  const accessDenied = isError && /boss|forbidden|unauthorized/i.test((error as any)?.message ?? "");

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["repos"] });
    qc.invalidateQueries({ queryKey: ["audit"] });
    qc.invalidateQueries({ queryKey: ["notifications"] });
  };
  const createM = useMutation({
    mutationFn: (v: any) => create({ data: v }),
    onSuccess: (r: any) => { toast.success(`Linked "${r.name}"`); invalidate(); setCreateOpen(false); },
    onError: (e: any) => toast.error(e.message),
  });
  const scanM = useMutation({
    mutationFn: (id: string) => scan({ data: { id } }),
    onSuccess: (r: any) => { toast.success(`Scan completed on "${r.name}"`); invalidate(); },
    onError: (e: any) => toast.error(e.message),
  });
  const releaseM = useMutation({
    mutationFn: (v: { id: string; version: string }) => release({ data: { ...v, changelog: "" } }),
    onSuccess: (r: any) => { toast.success(`Released v${r.latest_version} on "${r.name}"`); invalidate(); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <WallShell
      title="Source Code"
      subtitle="Repository linking, release history, CI builds, dependency health, and security scans."
      count={total}
      actions={
        <button onClick={() => setCreateOpen(true)} className="flex h-9 items-center gap-1.5 rounded-md border border-hairline px-2.5 text-sm hover:bg-surface-2">
          <Plus className="h-3.5 w-3.5" /> Link repository
        </button>
      }
    >
      {accessDenied && (
        <div className="rounded-md border border-warning/40 bg-warning/5 p-3 text-xs text-warning">
          You need the boss role to manage repositories.
        </div>
      )}
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
        onCreate={() => setCreateOpen(true)}
        createLabel="Link repository"
        extras={
          <select value={provider} onChange={(e) => setProvider(e.target.value)} className="h-9 rounded-md border border-hairline bg-surface-2 px-2 text-sm outline-none focus:border-brand">
            <option value="">All providers</option>
            <option value="github">GitHub</option>
            <option value="gitlab">GitLab</option>
            <option value="bitbucket">Bitbucket</option>
            <option value="self-hosted">Self-hosted</option>
          </select>
        }
      />

      {isLoading ? (
        <div className="rounded-md border border-hairline p-6 text-center text-xs text-muted-foreground">Loading…</div>
      ) : rows.length === 0 ? (
        <EmptyState title="No repositories linked" description="Click Link repository to register the first one. Releases and security scans will appear in the audit and notification feeds." />
      ) : (
        <div className="space-y-1">
          {rows.map((r) => {
            const v = r.vuln_critical + r.vuln_high + r.vuln_medium + r.vuln_low;
            return (
              <button key={r.id} onClick={() => setSelected(r)} className="flex w-full items-center justify-between rounded-md border border-hairline bg-surface-2 px-3 py-2 text-left text-sm hover:bg-surface">
                <div className="flex flex-col">
                  <span className="font-medium">{r.name}</span>
                  <span className="text-[11px] text-muted-foreground">{r.provider} · {r.default_branch} · latest {r.latest_version ?? "—"}</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className={`inline-flex items-center rounded px-1.5 py-0.5 capitalize ${buildTone(r.build_status)}`}>{r.build_status}</span>
                  {v === 0 ? (
                    <span className="inline-flex items-center gap-1 text-success"><ShieldCheck className="h-3.5 w-3.5" /> clean</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-danger"><ShieldAlert className="h-3.5 w-3.5" /> {r.vuln_critical}C/{r.vuln_high}H</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      <RightActionPanel
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.name ?? ""}
        subtitle={selected ? `${selected.provider} · ${selected.default_branch}` : undefined}
      >
        {selected && (
          <RepoPanel
            repo={selected}
            busy={scanM.isPending || releaseM.isPending}
            onScan={() => scanM.mutate(selected.id)}
            onRelease={(version) => releaseM.mutate({ id: selected.id, version })}
          />
        )}
      </RightActionPanel>

      {createOpen && <LinkRepoDialog onClose={() => setCreateOpen(false)} onSubmit={(v) => createM.mutate(v)} busy={createM.isPending} />}
    </WallShell>
  );
}

function RepoPanel({ repo, onScan, onRelease, busy }: { repo: Repo; onScan: () => void; onRelease: (version: string) => void; busy: boolean }) {
  const [version, setVersion] = useState("");
  return (
    <div className="space-y-5 text-sm">
      <a href={repo.url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-brand hover:underline">
        <ExternalLink className="h-3.5 w-3.5" /> {repo.url}
      </a>

      <div>
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Security scan</div>
        <div className="grid grid-cols-4 gap-2 text-center">
          <Sev label="Critical" n={repo.vuln_critical} tone="text-danger" />
          <Sev label="High" n={repo.vuln_high} tone="text-danger" />
          <Sev label="Medium" n={repo.vuln_medium} tone="text-warning" />
          <Sev label="Low" n={repo.vuln_low} tone="text-muted-foreground" />
        </div>
        <div className="mt-2 text-[11px] text-muted-foreground">Last scan: {fmtDate(repo.last_scan_at)}</div>
        <button disabled={busy} onClick={onScan} className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-md bg-brand px-3 py-2 text-sm font-medium text-brand-foreground hover:opacity-90 disabled:opacity-50">
          <RefreshCw className="h-3.5 w-3.5" /> Run security scan
        </button>
      </div>

      <div>
        <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <GitBranch className="h-3.5 w-3.5" /> Release validation
        </div>
        <ul className="space-y-1 text-xs">
          <li className="flex items-center justify-between rounded-md border border-hairline p-2">
            <span>License header</span>
            <StatusBadge status={repo.license_valid ? "approved" : "rejected"} />
          </li>
          <li className="flex items-center justify-between rounded-md border border-hairline p-2">
            <span>CI build</span>
            <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium capitalize ${buildTone(repo.build_status)}`}>{repo.build_status}</span>
          </li>
          <li className="flex items-center justify-between rounded-md border border-hairline p-2">
            <span>Dependencies</span>
            <span className="text-[11px]">{fmtNumber(repo.dependency_count)} ({repo.outdated_dependencies} outdated)</span>
          </li>
        </ul>
        <div className="mt-2 flex items-center gap-2">
          <input value={version} onChange={(e) => setVersion(e.target.value)} placeholder="1.2.0" className="h-9 flex-1 rounded-md border border-hairline bg-surface-2 px-2 text-sm" />
          <button disabled={busy || !version} onClick={() => { onRelease(version); setVersion(""); }} className="flex h-9 items-center gap-1.5 rounded-md border border-hairline px-2.5 text-sm hover:bg-surface-2 disabled:opacity-50">
            <Upload className="h-3.5 w-3.5" /> Release
          </button>
        </div>
      </div>

      <div>
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Audit</div>
        <AuditTimeline entity="source-repo" entityId={repo.id} />
      </div>
    </div>
  );
}

function LinkRepoDialog({ onClose, onSubmit, busy }: { onClose: () => void; onSubmit: (v: any) => void; busy: boolean }) {
  const [name, setName] = useState("");
  const [provider, setProvider] = useState("github");
  const [url, setUrl] = useState("");
  const [branch, setBranch] = useState("main");
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-lg border border-hairline bg-surface p-5 shadow-xl">
        <div className="mb-3 text-sm font-semibold">Link repository</div>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit({ name, provider, url, default_branch: branch }); }} className="space-y-3 text-sm">
          <label className="block"><span className="text-xs text-muted-foreground">Name</span>
            <input required value={name} onChange={(e) => setName(e.target.value)} className="mt-1 h-9 w-full rounded-md border border-hairline bg-surface-2 px-2" /></label>
          <label className="block"><span className="text-xs text-muted-foreground">Provider</span>
            <select value={provider} onChange={(e) => setProvider(e.target.value)} className="mt-1 h-9 w-full rounded-md border border-hairline bg-surface-2 px-2">
              {["github","gitlab","bitbucket","self-hosted"].map((p) => <option key={p} value={p}>{p}</option>)}
            </select></label>
          <label className="block"><span className="text-xs text-muted-foreground">URL</span>
            <input required type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://github.com/org/repo" className="mt-1 h-9 w-full rounded-md border border-hairline bg-surface-2 px-2" /></label>
          <label className="block"><span className="text-xs text-muted-foreground">Default branch</span>
            <input value={branch} onChange={(e) => setBranch(e.target.value)} className="mt-1 h-9 w-full rounded-md border border-hairline bg-surface-2 px-2" /></label>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-md border border-hairline px-3 py-2 text-sm hover:bg-surface-2">Cancel</button>
            <button disabled={busy} type="submit" className="rounded-md bg-brand px-3 py-2 text-sm font-medium text-brand-foreground hover:opacity-90 disabled:opacity-50">{busy ? "Linking…" : "Link"}</button>
          </div>
        </form>
      </div>
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
