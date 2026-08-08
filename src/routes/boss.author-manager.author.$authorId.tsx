import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { z } from "zod";
import {
  Activity, ArrowLeft, BadgeCheck, Coins, Download, FileText, Gauge, Megaphone,
  Network, NotebookPen, Pencil, ShieldAlert, Star, Wallet,
} from "lucide-react";
import { WallShell } from "@/features/author-manager/components/WallShell";
import { KpiCard } from "@/features/author-manager/components/KpiCard";
import { StatusBadge } from "@/features/author-manager/components/StatusBadge";
import { EmptyState } from "@/features/author-manager/components/EmptyState";
import { AuditTimeline } from "@/features/author-manager/components/AuditTimeline";
import { fmtMoney, fmtNumber, fmtDate, fmtDateTime, fmtPercent, isoAttr } from "@/features/author-manager/format";
import { useHasSession } from "@/hooks/use-has-session";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  getAuthorProfile, setAuthorVerification, updateAuthor, exportAuthorCommissionsCsv,
} from "@/lib/author-manager.functions";


export const Route = createFileRoute("/boss/author-manager/author/$authorId")({
  head: () => ({
    meta: [
      { title: "Author Profile — Author Manager" },
      { name: "description", content: "Full author profile: overview, personal info, referral network, commissions, wallet, documents, notes, performance, campaigns and audit history." },
      { property: "og:title", content: "Author Profile — Author Manager" },
      { property: "og:description", content: "Aggregated author record across commissions, wallet, performance and audit history." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthorProfilePage,
  errorComponent: ({ error }) => (
    <div role="alert" className="p-8 text-sm text-danger">{error.message}</div>
  ),
  notFoundComponent: () => <div className="p-8 text-sm text-muted-foreground">Author not found.</div>,
});

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "personal", label: "Personal Info" },
  { id: "referrals", label: "Referral Network" },
  { id: "commissions", label: "Commission History" },
  { id: "wallet", label: "Wallet" },
  { id: "documents", label: "Documents" },
  { id: "notes", label: "Notes" },
  { id: "activity", label: "Activity" },
  { id: "performance", label: "Performance" },
  { id: "campaigns", label: "Campaigns" },
  { id: "audit", label: "Audit history" },
] as const;

function Panel({ title, subtitle, children, icon: Icon }: {
  title: string; subtitle?: string; icon?: any; children: React.ReactNode;
}) {
  return (
    <section className="bento-card">
      <header className="mb-4 flex items-start gap-2">
        {Icon && <Icon className="mt-0.5 h-4 w-4 text-primary-glow" aria-hidden />}
        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      </header>
      {children}
    </section>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-hairline p-3">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-medium">{value ?? "—"}</div>
    </div>
  );
}

function AuthorProfilePage() {
  const { authorId } = Route.useParams();
  const hasSession = useHasSession();
  const fetchProfile = useServerFn(getAuthorProfile);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["author-profile", authorId],
    queryFn: () => fetchProfile({ data: { id: authorId } }),
    enabled: hasSession === true,
  });

  if (hasSession === false) {
    return (
      <WallShell title="Author Profile">
        <EmptyState title="Sign in required" description="Sign in as boss to view the full author profile." />
      </WallShell>
    );
  }
  if (isLoading || hasSession === null) {
    return <WallShell title="Author Profile"><div className="bento-card text-sm text-muted-foreground">Loading profile…</div></WallShell>;
  }
  if (isError || !data) {
    return (
      <WallShell title="Author Profile">
        <EmptyState title="Could not load profile" description={(error as any)?.message ?? "Unknown error"} />
      </WallShell>
    );
  }

  const { author, applications, referrals, products, commissions, wallet, metrics, audit } = data as any;
  const recent = [
    ...audit.map((a: any) => ({ at: a.created_at, text: a.summary, kind: a.action })),
    ...applications.map((a: any) => ({ at: a.submitted_at, text: `Application · ${a.stage}`, kind: "application" })),
  ].sort((a, b) => (a.at < b.at ? 1 : -1)).slice(0, 12);

  return (
    <WallShell
      title={author.name}
      subtitle={`${author.email}${author.company ? ` · ${author.company}` : ""}${author.country ? ` · ${author.country}` : ""}`}
      actions={
        <>
          <Button asChild variant="outline" size="sm">
            <Link to="/boss/author-manager/authors"><ArrowLeft className="mr-1 h-3.5 w-3.5" /> Directory</Link>
          </Button>
          <StatusBadge status={author.status} />
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Revenue" value={fmtMoney(metrics.revenue, "USD", { compact: true })} icon={Coins} hint="Lifetime gross" />
        <KpiCard label="Royalties" value={fmtMoney(metrics.royalties, "USD", { compact: true })} icon={Wallet} tone="success" hint="Paid to author" />
        <KpiCard label="Health" value={fmtNumber(metrics.health_score)} icon={Gauge} tone="info" hint="0–100 composite" />
        <KpiCard label="Risk" value={fmtNumber(metrics.risk_score)} icon={ShieldAlert} tone="danger" hint="Lower is better" />
      </div>

      <Tabs defaultValue="overview" className="mt-6">
        <TabsList className="flex h-auto flex-wrap justify-start gap-1">
          {SECTIONS.map((s) => (
            <TabsTrigger key={s.id} value={s.id} className="text-xs">{s.label}</TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="mt-4 grid gap-4 lg:grid-cols-2">
          <Panel title="Snapshot" subtitle="Key attributes of this author record" icon={BadgeCheck}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Status" value={<StatusBadge status={author.status} />} />
              <Field label="Verified" value={author.verified ? "Yes" : "No"} />
              <Field label="Products" value={fmtNumber(metrics.products_count)} />
              <Field label="Rating" value={metrics.rating == null ? "—" : `${metrics.rating} / 5`} />
              <Field label="Joined" value={<time dateTime={isoAttr(author.joined_at)}>{fmtDate(author.joined_at)}</time>} />
              <Field label="Commission rate" value={fmtPercent(wallet.commission_rate)} />
            </div>
          </Panel>
          <Panel title="Recent activity" subtitle="Latest 12 events across audit and applications" icon={Activity}>
            {recent.length === 0 ? <EmptyState title="No recent activity" description="Actions on this author will show up here." /> : (
              <ol className="space-y-3">
                {recent.map((r, i) => (
                  <li key={i} className="flex items-start gap-3 border-b border-hairline pb-3 last:border-0">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <div className="min-w-0">
                      <div className="truncate text-sm">{r.text}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {r.kind} · <time dateTime={isoAttr(r.at)}>{fmtDateTime(r.at)}</time>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Panel>
        </TabsContent>

        <TabsContent value="personal" className="mt-4">
          <Panel title="Personal information" subtitle="Contact and identity fields on record">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Full name" value={author.name} />
              <Field label="Email" value={author.email} />
              <Field label="Company" value={author.company} />
              <Field label="Country" value={author.country} />
              <Field label="Author ID" value={<span className="font-mono text-[11px]">{author.id}</span>} />
              <Field label="Last updated" value={<time dateTime={isoAttr(author.updated_at)}>{fmtDateTime(author.updated_at)}</time>} />
            </div>
          </Panel>
        </TabsContent>

        <TabsContent value="referrals" className="mt-4">
          <Panel title="Referral network" subtitle="Related authors in the same region" icon={Network}>
            {referrals.length === 0 ? <EmptyState title="No referral links" description="No connected authors found for this record." /> : (
              <div className="divide-y divide-hairline">
                {referrals.map((r: any) => (
                  <div key={r.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <Link to="/boss/author-manager/author/$authorId" params={{ authorId: r.id }} className="truncate text-sm font-medium hover:underline">
                        {r.name}
                      </Link>
                      <div className="text-[11px] text-muted-foreground">{r.email}</div>
                    </div>
                    <div className="flex items-center gap-3 text-xs tabular-nums">
                      <StatusBadge status={r.status} />
                      <span>{fmtMoney(Number(r.revenue))}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </TabsContent>

        <TabsContent value="commissions" className="mt-4">
          <Panel title="Commission history" subtitle="Last 6 periods, derived from recorded revenue and royalties" icon={Coins}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-hairline text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                    <th className="py-2">Period</th>
                    <th className="py-2 text-right">Gross</th>
                    <th className="py-2 text-right">Commission</th>
                    <th className="py-2">Status</th>
                    <th className="py-2">Paid</th>
                  </tr>
                </thead>
                <tbody>
                  {commissions.map((c: any) => (
                    <tr key={c.period} className="border-b border-hairline last:border-0">
                      <td className="py-2">{c.period}</td>
                      <td className="py-2 text-right tabular-nums">{fmtMoney(c.gross)}</td>
                      <td className="py-2 text-right tabular-nums">{fmtMoney(c.commission)}</td>
                      <td className="py-2"><StatusBadge status={c.status} /></td>
                      <td className="py-2 text-xs text-muted-foreground">
                        {c.paid_at ? <time dateTime={isoAttr(c.paid_at)}>{fmtDate(c.paid_at)}</time> : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </TabsContent>

        <TabsContent value="wallet" className="mt-4">
          <Panel title="Wallet" subtitle="Payout balances for this author" icon={Wallet}>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard label="Available" value={fmtMoney(wallet.available)} tone="success" hint="Ready for payout" />
              <KpiCard label="Lifetime earned" value={fmtMoney(wallet.lifetime)} hint="All periods" />
              <KpiCard label="Withheld" value={fmtMoney(wallet.withheld)} tone="warning" hint="Tax / holds" />
              <KpiCard label="Rate" value={fmtPercent(wallet.commission_rate)} tone="info" hint="Royalty share" />
            </div>
          </Panel>
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <Panel title="Documents" subtitle="Agreements, tax and compliance files" icon={FileText}>
            <EmptyState
              title="No documents attached"
              description="Legal, compliance and financial documents uploaded for this author will appear here."
              action={<Button asChild size="sm" variant="outline"><Link to="/boss/author-manager/documents">Open Documents wall</Link></Button>}
            />
          </Panel>
        </TabsContent>

        <TabsContent value="notes" className="mt-4">
          <Panel title="Notes" subtitle="Reviewer notes captured on applications" icon={NotebookPen}>
            {applications.filter((a: any) => a.notes).length === 0 ? (
              <EmptyState title="No notes" description="Reviewer notes from the applications pipeline will appear here." />
            ) : (
              <ul className="space-y-3">
                {applications.filter((a: any) => a.notes).map((a: any) => (
                  <li key={a.id} className="rounded-lg border border-hairline p-3">
                    <div className="text-sm">{a.notes}</div>
                    <div className="mt-1 text-[11px] text-muted-foreground">
                      {a.reviewer_email ?? "system"} · <time dateTime={isoAttr(a.updated_at)}>{fmtDateTime(a.updated_at)}</time>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <Panel title="Activity" subtitle="Application pipeline movements" icon={Activity}>
            {applications.length === 0 ? <EmptyState title="No applications" description="This author has no application records." /> : (
              <div className="divide-y divide-hairline">
                {applications.map((a: any) => (
                  <div key={a.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <div className="min-w-0">
                      <div className="truncate font-medium">{a.applicant_name}</div>
                      <div className="text-[11px] text-muted-foreground">
                        <time dateTime={isoAttr(a.submitted_at)}>{fmtDateTime(a.submitted_at)}</time>
                      </div>
                    </div>
                    <StatusBadge status={a.stage} />
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </TabsContent>

        <TabsContent value="performance" className="mt-4">
          <Panel title="Performance" subtitle="Catalog signals attributed to this author" icon={Star}>
            {products.length === 0 ? <EmptyState title="No catalog data" description="Published products will surface performance metrics here." /> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-hairline text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                      <th className="py-2">Product</th>
                      <th className="py-2">Category</th>
                      <th className="py-2 text-right">Price</th>
                      <th className="py-2 text-right">Downloads</th>
                      <th className="py-2 text-right">Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p: any) => (
                      <tr key={p.id} className="border-b border-hairline last:border-0">
                        <td className="py-2">{p.name}</td>
                        <td className="py-2 text-xs text-muted-foreground">{p.category ?? "—"}</td>
                        <td className="py-2 text-right tabular-nums">{fmtMoney(Number(p.price))}</td>
                        <td className="py-2 text-right tabular-nums">{fmtNumber(Number(p.downloads))}</td>
                        <td className="py-2 text-right tabular-nums">{p.rating ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </TabsContent>

        <TabsContent value="campaigns" className="mt-4">
          <Panel title="Campaigns" subtitle="Promotions and marketing pushes for this author" icon={Megaphone}>
            <EmptyState
              title="No campaigns yet"
              description="Co-marketing campaigns and promo placements linked to this author will be listed here."
            />
          </Panel>
        </TabsContent>

        <TabsContent value="audit" className="mt-4">
          <Panel title="Audit history" subtitle="Every recorded change to this author" icon={ShieldAlert}>
            <AuditTimeline entity="author" entityId={author.id} />
          </Panel>
        </TabsContent>
      </Tabs>
    </WallShell>
  );
}
