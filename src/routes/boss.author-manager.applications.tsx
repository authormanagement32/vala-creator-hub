import { createFileRoute } from "@tanstack/react-router";
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
import { fmtDate } from "@/features/author-manager/format";
import { useHasSession } from "@/hooks/use-has-session";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  listApplications, createApplication, advanceApplicationStage,
  approveApplication, rejectApplication, requestApplicationChanges, deleteApplication,
  bulkUpdateApplications,
} from "@/lib/author-manager.functions";

export const Route = createFileRoute("/boss/author-manager/applications")({
  head: () => ({ meta: [{ title: "Applications — Author Manager" }] }),
  component: ApplicationsWall,
});

const STAGES = ["registration","identity","kyc","portfolio","interview","agreement","approved","rejected"] as const;
type Stage = typeof STAGES[number];
type AppRow = {
  id: string; applicant_name: string; email: string; country: string | null;
  stage: Stage; reviewer_email: string | null; notes: string | null;
  author_id: string | null; submitted_at: string; decided_at: string | null; updated_at: string;
};

const InviteSchema = z.object({
  applicant_name: z.string().trim().min(1, "Name required").max(200),
  email: z.string().trim().email("Valid email required").max(255),
  country: z.string().trim().max(80).optional(),
  reviewer_email: z.string().trim().email().max(255).optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional(),
});

const columns: Column<AppRow>[] = [
  { id: "name", header: "Applicant", cell: (r) => <span className="font-medium">{r.applicant_name}</span> },
  { id: "email", header: "Email", cell: (r) => <span className="text-muted-foreground">{r.email}</span> },
  { id: "country", header: "Country", cell: (r) => r.country ?? "—", width: "0.6" },
  { id: "stage", header: "Stage", cell: (r) => <StatusBadge status={r.stage} />, width: "0.7" },
  { id: "submitted", header: "Submitted", cell: (r) => fmtDate(r.submitted_at), width: "0.7" },
  { id: "reviewer", header: "Reviewer", cell: (r) => r.reviewer_email ?? "—", width: "0.9" },
];

function ApplicationsWall() {
  const hasSession = useHasSession();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [stage, setStage] = useState("");
  const [selected, setSelected] = useState<AppRow | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [dialog, setDialog] = useState<null | "approve" | "reject" | "changes">(null);

  const listFn = useServerFn(listApplications);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["applications", { search, stage }],
    queryFn: () => listFn({ data: { search, stage, page: 1, pageSize: 100 } }),
    enabled: hasSession === true,
  });
  const state = deriveState(isLoading, isError, data as any);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["applications"] });
    qc.invalidateQueries({ queryKey: ["audit", "application"] });
    qc.invalidateQueries({ queryKey: ["notifications"] });
  };

  const invite = useMutation({
    mutationFn: useServerFn(createApplication),
    onSuccess: () => { toast.success("Invitation sent"); invalidate(); setShowInvite(false); },
    onError: (e: any) => toast.error(e?.message ?? "Failed to invite"),
  });
  const advance = useMutation({
    mutationFn: useServerFn(advanceApplicationStage),
    onSuccess: (row: any) => { toast.success(`Moved to ${row.stage}`); invalidate(); setSelected(row); },
    onError: (e: any) => toast.error(e?.message ?? "Stage change failed"),
  });
  const approve = useMutation({
    mutationFn: useServerFn(approveApplication),
    onSuccess: (row: any) => { toast.success("Application approved — author verified"); invalidate(); setSelected(row); setDialog(null); },
    onError: (e: any) => toast.error(e?.message ?? "Approval failed"),
  });
  const reject = useMutation({
    mutationFn: useServerFn(rejectApplication),
    onSuccess: (row: any) => { toast.success("Application rejected"); invalidate(); setSelected(row); setDialog(null); },
    onError: (e: any) => toast.error(e?.message ?? "Rejection failed"),
  });
  const requestChanges = useMutation({
    mutationFn: useServerFn(requestApplicationChanges),
    onSuccess: (row: any) => { toast.success("Changes requested"); invalidate(); setSelected(row); setDialog(null); },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });
  const remove = useMutation({
    mutationFn: useServerFn(deleteApplication),
    onSuccess: () => { toast.success("Application deleted"); invalidate(); setSelected(null); },
    onError: (e: any) => toast.error(e?.message ?? "Delete failed"),
  });

  const isDecided = selected?.stage === "approved" || selected?.stage === "rejected";

  return (
    <WallShell
      title="Applications"
      subtitle="Author onboarding pipeline — registration through agreement."
      count={data?.total}
    >
      <FilterBar
        search={search}
        onSearch={setSearch}
        statusOptions={STAGES.map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))}
        status={stage}
        onStatusChange={setStage}
        onCreate={() => setShowInvite(true)}
        createLabel="Invite author"
      />
      <DataTable
        columns={columns}
        rows={(data?.rows ?? []) as AppRow[]}
        state={state}
        rowKey={(r) => r.id}
        onRowClick={setSelected}
        emptyTitle="No applications in the pipeline"
        emptyDescription="Invite an author to start the onboarding process."
      />

      <RightActionPanel
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.applicant_name ?? ""}
        subtitle={selected ? `${selected.email} · Stage: ${selected.stage}` : undefined}
      >
        {selected && (
          <div className="space-y-4 text-sm">
            <StageTimeline stage={selected.stage} decidedAt={selected.decided_at} submittedAt={selected.submitted_at} />

            {!isDecided && (
              <div>
                <div className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">Advance stage</div>
                <div className="flex flex-wrap gap-1.5">
                  {(["registration","identity","kyc","portfolio","interview","agreement"] as const).map((s) => (
                    <Button key={s} size="sm" variant={s === selected.stage ? "secondary" : "outline"}
                      disabled={advance.isPending || s === selected.stage}
                      onClick={() => advance.mutate({ data: { id: selected.id, stage: s } })}>
                      {s}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Button className="w-full" disabled={isDecided || approve.isPending}
                onClick={() => setDialog("approve")}>
                Approve &amp; issue author profile
              </Button>
              <Button variant="outline" className="w-full" disabled={isDecided || requestChanges.isPending}
                onClick={() => setDialog("changes")}>
                Request changes
              </Button>
              <Button variant="destructive" className="w-full" disabled={selected.stage === "rejected" || reject.isPending}
                onClick={() => setDialog("reject")}>
                Reject
              </Button>
              <Button variant="ghost" size="sm" className="w-full text-danger"
                onClick={() => {
                  if (window.confirm("Delete this application?")) remove.mutate({ data: { id: selected.id } });
                }}>
                Delete application
              </Button>
            </div>

            {selected.notes && (
              <div className="rounded-md border border-hairline bg-surface-2 p-2 text-xs">
                <div className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">Latest note</div>
                {selected.notes}
              </div>
            )}

            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Audit &amp; timeline</div>
              <AuditTimeline entity="application" entityId={selected.id} />
            </div>
          </div>
        )}
      </RightActionPanel>

      <InviteDialog open={showInvite} onClose={() => setShowInvite(false)} pending={invite.isPending}
        onSubmit={(v) => invite.mutate({ data: {
          applicant_name: v.applicant_name, email: v.email,
          country: v.country || null,
          reviewer_email: v.reviewer_email || null,
          notes: v.notes || null,
        } })} />

      <ReasonDialog
        open={dialog === "approve"} onClose={() => setDialog(null)}
        title="Approve application" label="Approval note (optional)" submitLabel="Approve" required={false}
        pending={approve.isPending}
        onSubmit={(text) => selected && approve.mutate({ data: { id: selected.id, notes: text || undefined } })}
      />
      <ReasonDialog
        open={dialog === "reject"} onClose={() => setDialog(null)}
        title="Reject application" label="Rejection reason" submitLabel="Reject" required
        pending={reject.isPending} destructive
        onSubmit={(text) => selected && reject.mutate({ data: { id: selected.id, reason: text } })}
      />
      <ReasonDialog
        open={dialog === "changes"} onClose={() => setDialog(null)}
        title="Request changes" label="Message to applicant" submitLabel="Send" required
        pending={requestChanges.isPending}
        onSubmit={(text) => selected && requestChanges.mutate({ data: { id: selected.id, message: text } })}
      />
    </WallShell>
  );
}

function StageTimeline({ stage, decidedAt, submittedAt }: { stage: Stage; decidedAt: string | null; submittedAt: string }) {
  const order: Stage[] = ["registration","identity","kyc","portfolio","interview","agreement","approved"];
  const rejected = stage === "rejected";
  const currentIdx = rejected ? -1 : order.indexOf(stage);
  return (
    <div className="rounded-md border border-hairline p-3">
      <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-wide text-muted-foreground">
        <span>Pipeline</span>
        <span>{decidedAt ? `Decided ${fmtDate(decidedAt)}` : `Submitted ${fmtDate(submittedAt)}`}</span>
      </div>
      <ol className="space-y-1">
        {order.map((s, i) => {
          const done = i < currentIdx;
          const active = i === currentIdx;
          return (
            <li key={s} className="flex items-center gap-2 text-xs">
              <span className={`h-2 w-2 rounded-full ${done ? "bg-success" : active ? "bg-brand" : "bg-muted"}`} />
              <span className={active ? "font-semibold" : done ? "text-muted-foreground line-through" : "text-muted-foreground"}>
                {s}
              </span>
            </li>
          );
        })}
        {rejected && (
          <li className="flex items-center gap-2 text-xs">
            <span className="h-2 w-2 rounded-full bg-danger" />
            <span className="font-semibold text-danger">rejected</span>
          </li>
        )}
      </ol>
    </div>
  );
}

function InviteDialog({
  open, onClose, pending, onSubmit,
}: { open: boolean; onClose: () => void; pending: boolean; onSubmit: (v: z.infer<typeof InviteSchema>) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");
  const [reviewer, setReviewer] = useState("");
  const [notes, setNotes] = useState("");
  const [errs, setErrs] = useState<Record<string, string>>({});

  function submit() {
    const parsed = InviteSchema.safeParse({
      applicant_name: name, email, country: country || undefined,
      reviewer_email: reviewer || undefined, notes: notes || undefined,
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
        <DialogHeader><DialogTitle>Invite author</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <FieldRow label="Applicant name" error={errs.applicant_name}>
            <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={200} />
          </FieldRow>
          <FieldRow label="Email" error={errs.email}>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} />
          </FieldRow>
          <div className="grid grid-cols-2 gap-3">
            <FieldRow label="Country" error={errs.country}>
              <Input value={country} onChange={(e) => setCountry(e.target.value)} maxLength={80} />
            </FieldRow>
            <FieldRow label="Reviewer email" error={errs.reviewer_email}>
              <Input type="email" value={reviewer} onChange={(e) => setReviewer(e.target.value)} maxLength={255} />
            </FieldRow>
          </div>
          <FieldRow label="Notes" error={errs.notes}>
            <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={2000} />
          </FieldRow>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={pending}>Cancel</Button>
          <Button onClick={submit} disabled={pending}>Send invitation</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReasonDialog({
  open, onClose, title, label, submitLabel, required, pending, destructive, onSubmit,
}: {
  open: boolean; onClose: () => void; title: string; label: string; submitLabel: string;
  required: boolean; pending: boolean; destructive?: boolean;
  onSubmit: (text: string) => void;
}) {
  const [text, setText] = useState("");
  const [err, setErr] = useState<string | null>(null);
  function submit() {
    if (required && text.trim().length === 0) { setErr(`${label} is required.`); return; }
    if (text.length > 2000) { setErr("Max 2000 characters."); return; }
    setErr(null);
    onSubmit(text.trim());
  }
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { setText(""); setErr(null); onClose(); } }}>
      <DialogContent>
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <FieldRow label={label} error={err ?? undefined}>
          <Textarea rows={4} value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} />
        </FieldRow>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={pending}>Cancel</Button>
          <Button variant={destructive ? "destructive" : "default"} onClick={submit} disabled={pending}>{submitLabel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FieldRow({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <div className="mt-1">{children}</div>
      {error && <div className="mt-1 text-[11px] text-danger">{error}</div>}
    </div>
  );
}
