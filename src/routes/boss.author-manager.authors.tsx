import { createFileRoute, Link } from "@tanstack/react-router";
import type { MouseEvent } from "react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { z } from "zod";
import { WallShell } from "@/features/author-manager/components/WallShell";
import { FilterBar } from "@/features/author-manager/components/FilterBar";
import { DataTable, type Column } from "@/features/author-manager/components/DataTable";
import { StatusBadge } from "@/features/author-manager/components/StatusBadge";
import { RightActionPanel } from "@/features/author-manager/components/RightActionPanel";
import { AuditTimeline } from "@/features/author-manager/components/AuditTimeline";
import { deriveState } from "@/features/author-manager/data";
import { fmtMoney, fmtNumber } from "@/features/author-manager/format";
import { useHasSession } from "@/hooks/use-has-session";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  listAuthors, createAuthor, updateAuthor, setAuthorVerification, deleteAuthor, bulkUpdateAuthors,
} from "@/lib/author-manager.functions";

export const Route = createFileRoute("/boss/author-manager/authors")({
  head: () => ({ meta: [{ title: "Authors — Author Manager" }] }),
  component: AuthorsWall,
});

type AuthorRow = {
  id: string; name: string; email: string; company: string | null; country: string | null;
  status: "verified" | "pending" | "suspended" | "rejected"; verified: boolean;
  products_count: number; rating: number | null; revenue: number; royalties: number;
  health_score: number; risk_score: number; joined_at: string;
};

const AuthorFormSchema = z.object({
  name: z.string().trim().min(1, "Name required").max(200),
  email: z.string().trim().email("Valid email required").max(255),
  company: z.string().trim().max(200).optional(),
  country: z.string().trim().max(80).optional(),
  status: z.enum(["verified", "pending", "suspended", "rejected"]),
});

const columns: Column<AuthorRow>[] = [
  {
    id: "name", header: "Author", width: "1.5", sortValue: (r) => r.name,
    cell: (r) => (
      <div className="flex items-center gap-2">
        <div className="grid h-6 w-6 place-items-center rounded-full bg-brand/15 text-[10px] font-semibold text-brand">
          {r.name.slice(0, 1).toUpperCase()}
        </div>
        <div>
          <Link
            to="/boss/author-manager/author/$authorId"
            params={{ authorId: r.id }}
            preload="intent"
            className="font-medium hover:underline"
            onClick={(e: MouseEvent) => e.stopPropagation()}
          >
            {r.name}
          </Link>
          <div className="text-[11px] text-muted-foreground">{r.email}</div>
        </div>
      </div>
    ),
  },
  { id: "company", header: "Company", cell: (r) => r.company ?? "—", sortValue: (r) => r.company },
  { id: "country", header: "Country", cell: (r) => r.country ?? "—", width: "0.6", sortValue: (r) => r.country },
  { id: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} />, width: "0.6", sortValue: (r) => r.status },
  { id: "products", header: "Products", cell: (r) => fmtNumber(r.products_count), width: "0.5", align: "right", sortValue: (r) => r.products_count },
  { id: "revenue", header: "Revenue", cell: (r) => fmtMoney(Number(r.revenue)), width: "0.7", align: "right", sortValue: (r) => Number(r.revenue) },
  { id: "royalties", header: "Royalties", cell: (r) => fmtMoney(Number(r.royalties)), width: "0.7", align: "right", sortValue: (r) => Number(r.royalties) },
  { id: "health", header: "Health", cell: (r) => fmtNumber(r.health_score), width: "0.4", align: "right", sortValue: (r) => r.health_score },
  { id: "risk", header: "Risk", cell: (r) => fmtNumber(r.risk_score), width: "0.4", align: "right", sortValue: (r) => r.risk_score },
];


function AuthorsWall() {
  const hasSession = useHasSession();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [selected, setSelected] = useState<AuthorRow | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const listFn = useServerFn(listAuthors);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["authors", { search, status }],
    queryFn: () => listFn({ data: { search, status, page: 1, pageSize: 100 } }),
    enabled: hasSession === true,
  });
  const state = deriveState(isLoading, isError, data as any);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["authors"] });
  const invalidateAudit = () => qc.invalidateQueries({ queryKey: ["audit", "author"] });

  const create = useMutation({
    mutationFn: useServerFn(createAuthor),
    onSuccess: () => { toast.success("Author created"); invalidate(); setShowCreate(false); },
    onError: (e: any) => toast.error(e?.message ?? "Failed to create author"),
  });
  const update = useMutation({
    mutationFn: useServerFn(updateAuthor),
    onSuccess: (row: any) => { toast.success("Author updated"); invalidate(); invalidateAudit(); setSelected(row); setShowEdit(false); },
    onError: (e: any) => toast.error(e?.message ?? "Update failed"),
  });
  const verify = useMutation({
    mutationFn: useServerFn(setAuthorVerification),
    onSuccess: (row: any) => { toast.success(`Status → ${row.status}`); invalidate(); invalidateAudit(); setSelected(row); },
    onError: (e: any) => toast.error(e?.message ?? "Status change failed"),
  });
  const remove = useMutation({
    mutationFn: useServerFn(deleteAuthor),
    onSuccess: () => { toast.success("Author deleted"); invalidate(); setSelected(null); },
    onError: (e: any) => toast.error(e?.message ?? "Delete failed"),
  });
  const bulk = useMutation({
    mutationFn: useServerFn(bulkUpdateAuthors),
    onSuccess: (r: any, v: any) => { toast.success(`Bulk ${v.data.action} on ${r.count} author(s)`); setSelectedIds(new Set()); invalidate(); invalidateAudit(); },
    onError: (e: any) => toast.error(e?.message ?? "Bulk action failed"),
  });
  const rows = (data?.rows ?? []) as AuthorRow[];
  const allSelected = rows.length > 0 && selectedIds.size === rows.length;

  return (
    <WallShell
      title="Authors"
      subtitle="Master directory of every software author, publisher, and creator."
      count={data?.total}
      actions={selectedIds.size > 0 ? (
        <>
          <span className="text-xs text-muted-foreground">{selectedIds.size} selected</span>
          <Button size="sm" variant="secondary" disabled={bulk.isPending}
            onClick={() => bulk.mutate({ data: { ids: [...selectedIds], action: "verify" } })}>Verify</Button>
          <Button size="sm" variant="outline" disabled={bulk.isPending}
            onClick={() => {
              const reason = window.prompt("Suspension reason (optional)?") ?? "";
              bulk.mutate({ data: { ids: [...selectedIds], action: "suspend", reason: reason || undefined } });
            }}>Suspend</Button>
          <Button size="sm" variant="destructive" disabled={bulk.isPending}
            onClick={() => {
              if (window.confirm(`Delete ${selectedIds.size} author(s)? Cannot be undone.`))
                bulk.mutate({ data: { ids: [...selectedIds], action: "delete" } });
            }}>Delete</Button>
          <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>Clear</Button>
        </>
      ) : null}
    >
      <FilterBar
        search={search}
        onSearch={setSearch}
        statusOptions={[
          { value: "verified", label: "Verified" },
          { value: "pending", label: "Pending" },
          { value: "suspended", label: "Suspended" },
          { value: "rejected", label: "Rejected" },
        ]}
        status={status}
        onStatusChange={setStatus}
        onCreate={() => setShowCreate(true)}
        createLabel="Add author"
      />
      {rows.length > 0 && (
        <label className="mb-1 flex items-center gap-1.5 px-1 text-[11px] text-muted-foreground">
          <input type="checkbox" checked={allSelected}
            onChange={(e) => setSelectedIds(e.target.checked ? new Set(rows.map((r) => r.id)) : new Set())} />
          Select all on page ({rows.length})
        </label>
      )}
      <DataTable
        columns={[{
          id: "select", header: "", width: "0.3",
          cell: (r: AuthorRow) => (
            <input
              type="checkbox"
              checked={selectedIds.has(r.id)}
              onClick={(e: MouseEvent) => e.stopPropagation()}
              onChange={(e) => {
                const next = new Set(selectedIds);
                if (e.currentTarget.checked) next.add(r.id); else next.delete(r.id);
                setSelectedIds(next);
              }}
            />
          ),
        }, ...columns]}
        rows={rows}
        state={state}
        rowKey={(r) => r.id}
        onRowClick={setSelected}
        emptyTitle="No authors yet"
        emptyDescription="Add an author manually or approve an application to populate this directory."
      />

      <RightActionPanel
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.name ?? ""}
        subtitle={selected?.email}
      >
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <Stat label="Status" value={<StatusBadge status={selected.status} />} />
              <Stat label="Verified" value={selected.verified ? "Yes" : "No"} />
              <Stat label="Products" value={fmtNumber(selected.products_count)} />
              <Stat label="Rating" value={selected.rating ?? "—"} />
              <Stat label="Revenue" value={fmtMoney(Number(selected.revenue))} />
              <Stat label="Royalties" value={fmtMoney(Number(selected.royalties))} />
              <Stat label="Health" value={fmtNumber(selected.health_score)} />
              <Stat label="Risk" value={fmtNumber(selected.risk_score)} />
            </div>

            <div>
              <div className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">Verification</div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" disabled={verify.isPending || selected.status === "verified"}
                  onClick={() => verify.mutate({ data: { id: selected.id, status: "verified" } })}>Verify</Button>
                <Button size="sm" variant="outline" disabled={verify.isPending || selected.status === "pending"}
                  onClick={() => verify.mutate({ data: { id: selected.id, status: "pending" } })}>Mark pending</Button>
                <Button size="sm" variant="outline" disabled={verify.isPending || selected.status === "suspended"}
                  onClick={() => {
                    const reason = window.prompt("Suspension reason?") ?? undefined;
                    if (reason === undefined) return;
                    verify.mutate({ data: { id: selected.id, status: "suspended", reason } });
                  }}>Suspend</Button>
                <Button size="sm" variant="destructive" disabled={verify.isPending}
                  onClick={() => {
                    const reason = window.prompt("Rejection reason?") ?? undefined;
                    if (reason === undefined) return;
                    verify.mutate({ data: { id: selected.id, status: "rejected", reason } });
                  }}>Reject</Button>
              </div>
            </div>

            <div>
              <div className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">Health & Risk</div>
              <HealthRiskEditor
                author={selected}
                pending={update.isPending}
                onSave={(patch) => update.mutate({ data: { id: selected.id, patch } })}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => setShowEdit(true)}>Edit profile</Button>
              <Button size="sm" variant="destructive"
                onClick={() => {
                  if (window.confirm(`Delete "${selected.name}"? This cannot be undone.`)) {
                    remove.mutate({ data: { id: selected.id } });
                  }
                }}>Delete</Button>
            </div>

            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Audit</div>
              <AuditTimeline entity="author" entityId={selected.id} />
            </div>
          </div>
        )}
      </RightActionPanel>

      <AuthorFormDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Add author"
        submitLabel="Create"
        pending={create.isPending}
        onSubmit={(v) => create.mutate({ data: v })}
      />
      <AuthorFormDialog
        key={selected?.id ?? "edit"}
        open={showEdit && !!selected}
        onClose={() => setShowEdit(false)}
        title="Edit author"
        submitLabel="Save"
        pending={update.isPending}
        initial={selected ? {
          name: selected.name, email: selected.email,
          company: selected.company ?? "", country: selected.country ?? "",
          status: selected.status,
        } : undefined}
        onSubmit={(v) => selected && update.mutate({ data: { id: selected.id, patch: v } })}
      />
    </WallShell>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-md border border-hairline p-2">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function HealthRiskEditor({
  author, pending, onSave,
}: {
  author: AuthorRow; pending: boolean;
  onSave: (patch: { health_score: number; risk_score: number }) => void;
}) {
  const [health, setHealth] = useState(author.health_score);
  const [risk, setRisk] = useState(author.risk_score);
  const dirty = health !== author.health_score || risk !== author.risk_score;
  const valid = health >= 0 && health <= 100 && risk >= 0 && risk <= 100;
  return (
    <div className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
      <div>
        <Label className="text-[10px]">Health 0–100</Label>
        <Input type="number" min={0} max={100} value={health}
          onChange={(e) => setHealth(Number(e.target.value))} />
      </div>
      <div>
        <Label className="text-[10px]">Risk 0–100</Label>
        <Input type="number" min={0} max={100} value={risk}
          onChange={(e) => setRisk(Number(e.target.value))} />
      </div>
      <Button size="sm" disabled={!dirty || !valid || pending}
        onClick={() => onSave({ health_score: health, risk_score: risk })}>
        Save
      </Button>
    </div>
  );
}

function AuthorFormDialog({
  open, onClose, title, submitLabel, pending, initial, onSubmit,
}: {
  open: boolean; onClose: () => void; title: string; submitLabel: string; pending: boolean;
  initial?: { name: string; email: string; company: string; country: string; status: AuthorRow["status"] };
  onSubmit: (v: z.infer<typeof AuthorFormSchema>) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [company, setCompany] = useState(initial?.company ?? "");
  const [country, setCountry] = useState(initial?.country ?? "");
  const [status, setStatus] = useState<AuthorRow["status"]>(initial?.status ?? "pending");
  const [errs, setErrs] = useState<Record<string, string>>({});

  function submit() {
    const parsed = AuthorFormSchema.safeParse({
      name, email,
      company: company || undefined,
      country: country || undefined,
      status,
    });
    if (!parsed.success) {
      const map: Record<string, string> = {};
      for (const i of parsed.error.issues) map[i.path[0] as string] = i.message;
      setErrs(map); return;
    }
    setErrs({});
    onSubmit(parsed.data);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <Field label="Name" error={errs.name}>
            <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={200} />
          </Field>
          <Field label="Email" error={errs.email}>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Company" error={errs.company}>
              <Input value={company} onChange={(e) => setCompany(e.target.value)} maxLength={200} />
            </Field>
            <Field label="Country" error={errs.country}>
              <Input value={country} onChange={(e) => setCountry(e.target.value)} maxLength={80} />
            </Field>
          </div>
          <Field label="Status" error={errs.status}>
            <select className="h-9 rounded-md border border-input bg-background px-2 text-sm"
              value={status} onChange={(e) => setStatus(e.target.value as AuthorRow["status"])}>
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="suspended">Suspended</option>
              <option value="rejected">Rejected</option>
            </select>
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={pending}>Cancel</Button>
          <Button onClick={submit} disabled={pending}>{submitLabel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <div className="mt-1">{children}</div>
      {error && <div className="mt-1 text-[11px] text-danger">{error}</div>}
    </div>
  );
}
