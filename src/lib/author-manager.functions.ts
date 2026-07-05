import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

// ---- helpers ----
async function ensureBoss(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "boss",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: boss role required");
}

async function logAudit(
  ctx: { supabase: any; userId: string; claims: any },
  args: {
    entity: string;
    entityId?: string | null;
    action: string;
    summary: string;
    metadata?: Record<string, unknown>;
    severity?: "info" | "warn" | "danger" | "success";
    notify?: boolean;
  },
) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin.from("audit_events").insert({
    actor_id: ctx.userId,
    actor_email: ctx.claims?.email ?? null,
    entity: args.entity,
    entity_id: args.entityId ?? null,
    action: args.action,
    summary: args.summary,
    metadata: (args.metadata ?? {}) as any,
    severity: args.severity ?? "info",
  });
  if (args.notify !== false) {
    await supabaseAdmin.from("notifications").insert({
      user_id: ctx.userId,
      title: args.summary,
      body: `${args.entity} · ${args.action}`,
      severity: args.severity ?? "info",
      link: args.entity === "product" ? "/boss/author-manager/products" :
            args.entity === "source-repo" ? "/boss/author-manager/source-code" : null,
    });
  }
}

// ---- Products ----
export const listProducts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { search?: string; status?: string; category?: string; page?: number; pageSize?: number }) => d)
  .handler(async ({ data, context }) => {
    await ensureBoss(context);
    const page = data.page ?? 1;
    const pageSize = data.pageSize ?? 50;
    let q = context.supabase.from("products").select("*", { count: "exact" })
      .order("updated_at", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);
    if (data.search) q = q.ilike("name", `%${data.search}%`);
    if (data.status) q = q.eq("status", data.status);
    if (data.category) q = q.eq("category", data.category);
    const { data: rows, count, error } = await q;
    if (error) throw new Error(error.message);
    return { rows: rows ?? [], total: count ?? 0 };
  });

export const createProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    name: z.string().min(1).max(200),
    category: z.string().default("software"),
    type: z.enum(["software","saas","apk","source","template","theme","plugin","ai"]).default("software"),
    version: z.string().default("1.0.0"),
    price: z.number().min(0).default(0),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureBoss(context);
    const { data: row, error } = await context.supabase.from("products").insert(data).select().single();
    if (error) throw new Error(error.message);
    await logAudit(context, { entity: "product", entityId: row.id, action: "create", summary: `Created product "${row.name}"`, severity: "success" });
    return row;
  });

export const updateProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    id: z.string().uuid(),
    patch: z.object({
      name: z.string().optional(),
      category: z.string().optional(),
      price: z.number().optional(),
      version: z.string().optional(),
      status: z.string().optional(),
    }),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureBoss(context);
    const { data: row, error } = await context.supabase.from("products").update(data.patch).eq("id", data.id).select().single();
    if (error) throw new Error(error.message);
    await logAudit(context, { entity: "product", entityId: row.id, action: "update", summary: `Updated "${row.name}"`, metadata: data.patch });
    return row;
  });

export const deleteProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureBoss(context);
    const { data: row } = await context.supabase.from("products").select("name").eq("id", data.id).single();
    const { error } = await context.supabase.from("products").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    await logAudit(context, { entity: "product", entityId: data.id, action: "delete", summary: `Deleted "${row?.name ?? data.id}"`, severity: "danger" });
    return { ok: true };
  });

export const bulkUpdateProducts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    ids: z.array(z.string().uuid()).min(1),
    action: z.enum(["publish","suspend","archive"]),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureBoss(context);
    const statusMap = { publish: "published", suspend: "draft", archive: "archived" } as const;
    const status = statusMap[data.action];
    const { data: rows, error } = await context.supabase.from("products").update({ status }).in("id", data.ids).select("id,name");
    if (error) throw new Error(error.message);
    await logAudit(context, {
      entity: "product",
      entityId: null,
      action: `bulk-${data.action}`,
      summary: `Bulk ${data.action} on ${rows?.length ?? 0} product(s)`,
      metadata: { ids: data.ids, status },
      severity: data.action === "archive" ? "danger" : data.action === "suspend" ? "warn" : "success",
    });
    return { count: rows?.length ?? 0 };
  });

// ---- Repos ----
export const listRepos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { search?: string; build?: string; provider?: string; page?: number; pageSize?: number }) => d)
  .handler(async ({ data, context }) => {
    await ensureBoss(context);
    const page = data.page ?? 1, pageSize = data.pageSize ?? 50;
    let q = context.supabase.from("source_repos").select("*", { count: "exact" })
      .order("updated_at", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);
    if (data.search) q = q.ilike("name", `%${data.search}%`);
    if (data.build) q = q.eq("build_status", data.build);
    if (data.provider) q = q.eq("provider", data.provider);
    const { data: rows, count, error } = await q;
    if (error) throw new Error(error.message);
    return { rows: rows ?? [], total: count ?? 0 };
  });

export const createRepo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    name: z.string().min(1),
    provider: z.enum(["github","gitlab","bitbucket","self-hosted"]).default("github"),
    url: z.string().url(),
    default_branch: z.string().default("main"),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureBoss(context);
    const { data: row, error } = await context.supabase.from("source_repos").insert(data).select().single();
    if (error) throw new Error(error.message);
    await logAudit(context, { entity: "source-repo", entityId: row.id, action: "link", summary: `Linked repository "${row.name}"`, severity: "success" });
    return row;
  });

export const runSecurityScan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureBoss(context);
    // Read existing findings (populated by an external scanner integration).
    const { data: cur, error: cerr } = await context.supabase
      .from("source_repos").select("scan_findings,name").eq("id", data.id).single();
    if (cerr) throw new Error(cerr.message);
    const findings: Array<{ severity: string; dependency?: string }> = Array.isArray(cur?.scan_findings) ? (cur!.scan_findings as any) : [];
    const count = (sev: string) => findings.filter((f) => (f.severity ?? "").toLowerCase() === sev).length;
    const critical = count("critical"), high = count("high"), medium = count("medium"), low = count("low");
    const patch = {
      last_scan_at: new Date().toISOString(),
      vuln_critical: critical, vuln_high: high, vuln_medium: medium, vuln_low: low,
    };
    const { data: row, error } = await context.supabase.from("source_repos").update(patch).eq("id", data.id).select().single();
    if (error) throw new Error(error.message);
    const total = critical + high + medium + low;
    await logAudit(context, {
      entity: "source-repo",
      entityId: row.id,
      action: "security-scan",
      summary: `Security scan run on "${row.name}" — ${total} finding(s)`,
      metadata: { critical, high, medium, low },
      severity: critical > 0 ? "danger" : total > 0 ? "warn" : "success",
    });
    return row;
  });


export const releaseRepo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    id: z.string().uuid(),
    version: z.string().min(1),
    changelog: z.string().default(""),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureBoss(context);
    const { data: repo, error: rerr } = await context.supabase.from("source_repos").update({
      latest_version: data.version,
      last_build_at: new Date().toISOString(),
      build_status: "passing",
    }).eq("id", data.id).select().single();
    if (rerr) throw new Error(rerr.message);

    if (repo.product_id) {
      const { data: pv } = await context.supabase.from("product_versions").insert({
        product_id: repo.product_id,
        version: data.version,
        changelog: data.changelog,
        status: "published",
      }).select().single();
      await logAudit(context, {
        entity: "product",
        entityId: repo.product_id,
        action: "release",
        summary: `Released v${data.version} for product`,
        metadata: { repo_id: repo.id, version_id: pv?.id },
        severity: "success",
      });
    }
    await logAudit(context, {
      entity: "source-repo",
      entityId: repo.id,
      action: "release",
      summary: `Released v${data.version} on "${repo.name}"`,
      metadata: { version: data.version },
      severity: "success",
    });
    return repo;
  });

// ---- Audit + Notifications ----
export const listAudit = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { entity?: string; entityId?: string; limit?: number }) => d)
  .handler(async ({ data, context }) => {
    await ensureBoss(context);
    let q = context.supabase.from("audit_events").select("*").order("created_at", { ascending: false }).limit(data.limit ?? 50);
    if (data.entity) q = q.eq("entity", data.entity);
    if (data.entityId) q = q.eq("entity_id", data.entityId);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const listNotifications = createServerFn({ method: "GET" })
  .handler(async () => {
    const { getRequestHeader } = await import("@tanstack/react-start/server");
    const auth = getRequestHeader("authorization");
    if (!auth) return [];
    const { createClient } = await import("@supabase/supabase-js");
    const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
      global: { headers: { Authorization: auth } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await sb
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) return [];
    return data ?? [];
  });

export const markNotificationRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---- CSV Export ----
function toCsv(rows: Array<Record<string, unknown>>, columns: string[]): string {
  const esc = (v: unknown) => {
    if (v === null || v === undefined) return "";
    const s = typeof v === "object" ? JSON.stringify(v) : String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = columns.join(",");
  const body = rows.map((r) => columns.map((c) => esc(r[c])).join(",")).join("\n");
  return header + "\n" + body;
}

function assertDateRange(from?: string, to?: string) {
  if (from && to && new Date(from).getTime() > new Date(to).getTime()) {
    throw new Error("Invalid date range: 'from' must be on or before 'to'.");
  }
}

export const exportAuditCsv = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    from: z.string().optional(),
    to: z.string().optional(),
    entity: z.string().optional(),
    entityId: z.string().uuid().optional(),
    actions: z.array(z.string()).optional(),
    severities: z.array(z.enum(["info","warn","danger","success"])).optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureBoss(context);
    assertDateRange(data.from, data.to);
    let q = context.supabase.from("audit_events").select("*").order("created_at", { ascending: false }).limit(10000);
    if (data.from) q = q.gte("created_at", data.from);
    if (data.to) q = q.lte("created_at", data.to);
    if (data.entity) q = q.eq("entity", data.entity);
    if (data.entityId) q = q.eq("entity_id", data.entityId);
    if (data.actions?.length) q = q.in("action", data.actions);
    if (data.severities?.length) q = q.in("severity", data.severities);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    const csv = toCsv(rows ?? [], ["created_at","actor_email","entity","entity_id","action","severity","summary","metadata"]);
    await logAudit(context, {
      entity: "audit-export",
      entityId: null,
      action: "export-csv",
      summary: `Exported ${rows?.length ?? 0} audit event(s) to CSV`,
      metadata: {
        source: "audit_events",
        from: data.from ?? null,
        to: data.to ?? null,
        entity: data.entity ?? null,
        entity_id: data.entityId ?? null,
        actions: data.actions ?? null,
        severities: data.severities ?? null,
        count: rows?.length ?? 0,
      },
      severity: "info",
      notify: false,
    });
    return { csv, count: rows?.length ?? 0 };
  });

export const exportNotificationsCsv = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    from: z.string().optional(),
    to: z.string().optional(),
    severities: z.array(z.enum(["info","warn","danger","success"])).optional(),
    unreadOnly: z.boolean().optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureBoss(context);
    assertDateRange(data.from, data.to);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin.from("notifications").select("*").order("created_at", { ascending: false }).limit(10000);
    if (data.from) q = q.gte("created_at", data.from);
    if (data.to) q = q.lte("created_at", data.to);
    if (data.severities?.length) q = q.in("severity", data.severities);
    if (data.unreadOnly) q = q.is("read_at", null);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    const csv = toCsv(rows ?? [], ["created_at","user_id","title","body","severity","link","read_at"]);
    await logAudit(context, {
      entity: "notification-export",
      entityId: null,
      action: "export-csv",
      summary: `Exported ${rows?.length ?? 0} notification(s) to CSV`,
      metadata: {
        source: "notifications",
        from: data.from ?? null,
        to: data.to ?? null,
        severities: data.severities ?? null,
        unread_only: !!data.unreadOnly,
        count: rows?.length ?? 0,
      },
      severity: "info",
      notify: false,
    });
    return { csv, count: rows?.length ?? 0 };
  });

// ---- Roles bootstrap ----
export const claimBossRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count } = await supabaseAdmin.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "boss");
    if ((count ?? 0) > 0) {
      const { data: mine } = await supabaseAdmin.from("user_roles").select("id").eq("user_id", context.userId).eq("role", "boss").maybeSingle();
      if (mine) return { claimed: true, alreadyHad: true };
      throw new Error("A boss already exists for this workspace.");
    }
    await supabaseAdmin.from("user_roles").insert({ user_id: context.userId, role: "boss" });
    return { claimed: true, alreadyHad: false };
  });


export const whoAmI = createServerFn({ method: "GET" }).handler(async () => {
  const { getRequestHeader } = await import("@tanstack/react-start/server");
  const auth = getRequestHeader("authorization");
  if (!auth) return { authed: false, userId: null, email: null, isBoss: false };
  const { createClient } = await import("@supabase/supabase-js");
  const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: auth } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userRes } = await sb.auth.getUser();
  if (!userRes?.user) return { authed: false, userId: null, email: null, isBoss: false };
  const { data } = await sb.rpc("has_role", { _user_id: userRes.user.id, _role: "boss" });
  return { authed: true, userId: userRes.user.id, email: userRes.user.email ?? null, isBoss: !!data };
});

// ---- Auth Gate Events (admin reporting) ----
const AuthGateFilter = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  states: z.array(z.enum(["signin", "forbidden", "rate_limited"])).optional(),
  wallRoute: z.string().optional(),
  statusCodes: z.array(z.number().int().min(100).max(599)).optional(),
});
type AuthGateFilterT = z.infer<typeof AuthGateFilter>;

function applyAuthGateFilters(q: any, f: AuthGateFilterT) {
  if (f.from) q = q.gte("occurred_at", f.from);
  if (f.to) q = q.lte("occurred_at", f.to);
  if (f.states?.length) q = q.in("state", f.states);
  if (f.wallRoute) q = q.eq("wall_route", f.wallRoute);
  if (f.statusCodes?.length) q = q.in("status_code", f.statusCodes);
  return q;
}

export const listAuthGateEvents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => AuthGateFilter.extend({
    limit: z.number().int().min(1).max(1000).optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureBoss(context);
    assertDateRange(data.from, data.to);
    let q = context.supabase.from("auth_gate_events").select("*", { count: "exact" })
      .order("occurred_at", { ascending: false })
      .limit(data.limit ?? 200);
    q = applyAuthGateFilters(q, data);
    const { data: rows, count, error } = await q;
    if (error) throw new Error(error.message);
    return { rows: rows ?? [], total: count ?? 0 };
  });

export const summarizeAuthGateEvents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => AuthGateFilter.parse(d))
  .handler(async ({ data, context }) => {
    await ensureBoss(context);
    assertDateRange(data.from, data.to);
    let q = context.supabase.from("auth_gate_events")
      .select("occurred_at,wall_route,state,status_code")
      .order("occurred_at", { ascending: false })
      .limit(10000);
    q = applyAuthGateFilters(q, data);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    type Row = { occurred_at: string; wall_route: string; state: string; status_code: number | null };
    const buckets = new Map<string, { day: string; wall_route: string; state: string; status_code: number | null; count: number }>();
    const byDay = new Map<string, number>();
    const byRoute = new Map<string, number>();
    const byStatus = new Map<string, number>();
    for (const r of (rows ?? []) as Row[]) {
      const day = (r.occurred_at ?? "").slice(0, 10);
      const status = r.status_code ?? null;
      const key = `${day}|${r.wall_route}|${r.state}|${status ?? ""}`;
      const b = buckets.get(key);
      if (b) b.count += 1;
      else buckets.set(key, { day, wall_route: r.wall_route, state: r.state, status_code: status, count: 1 });
      byDay.set(day, (byDay.get(day) ?? 0) + 1);
      byRoute.set(r.wall_route, (byRoute.get(r.wall_route) ?? 0) + 1);
      const sKey = String(status ?? "unknown");
      byStatus.set(sKey, (byStatus.get(sKey) ?? 0) + 1);
    }
    const rowsOut = Array.from(buckets.values()).sort((a, b) =>
      a.day === b.day
        ? a.wall_route.localeCompare(b.wall_route) || a.state.localeCompare(b.state)
        : b.day.localeCompare(a.day),
    );
    return {
      total: rows?.length ?? 0,
      rows: rowsOut,
      byDay: Array.from(byDay.entries()).map(([day, count]) => ({ day, count })).sort((a, b) => b.day.localeCompare(a.day)),
      byRoute: Array.from(byRoute.entries()).map(([wall_route, count]) => ({ wall_route, count })).sort((a, b) => b.count - a.count),
      byStatus: Array.from(byStatus.entries()).map(([status_code, count]) => ({ status_code, count })).sort((a, b) => b.count - a.count),
    };
  });

export const exportAuthGateEventsCsv = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => AuthGateFilter.parse(d))
  .handler(async ({ data, context }) => {
    await ensureBoss(context);
    assertDateRange(data.from, data.to);
    let q = context.supabase.from("auth_gate_events").select("*")
      .order("occurred_at", { ascending: false }).limit(10000);
    q = applyAuthGateFilters(q, data);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    const csv = toCsv(rows ?? [], [
      "occurred_at", "wall_route", "state", "status_code",
      "user_id", "email", "message", "user_agent", "ip",
    ]);
    await logAudit(context, {
      entity: "auth-gate-export",
      entityId: null,
      action: "export-csv",
      summary: `Exported ${rows?.length ?? 0} auth-gate event(s) to CSV`,
      metadata: {
        source: "auth_gate_events",
        from: data.from ?? null,
        to: data.to ?? null,
        states: data.states ?? null,
        wall_route: data.wallRoute ?? null,
        status_codes: data.statusCodes ?? null,
        count: rows?.length ?? 0,
      },
      severity: "info",
      notify: false,
    });
    return { csv, count: rows?.length ?? 0 };
  });


// ---- Authors ----
const AuthorPatch = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  email: z.string().trim().email().max(255).optional(),
  company: z.string().trim().max(200).nullable().optional(),
  country: z.string().trim().max(80).nullable().optional(),
  status: z.enum(["verified","pending","suspended","rejected"]).optional(),
  verified: z.boolean().optional(),
  rating: z.number().min(0).max(5).nullable().optional(),
  revenue: z.number().min(0).optional(),
  royalties: z.number().min(0).optional(),
  health_score: z.number().int().min(0).max(100).optional(),
  risk_score: z.number().int().min(0).max(100).optional(),
});

export const listAuthors = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { search?: string; status?: string; page?: number; pageSize?: number }) => d)
  .handler(async ({ data, context }) => {
    await ensureBoss(context);
    const page = data.page ?? 1, pageSize = Math.min(data.pageSize ?? 100, 500);
    let q = context.supabase.from("authors").select("*", { count: "exact" })
      .order("updated_at", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);
    if (data.search) q = q.or(`name.ilike.%${data.search}%,email.ilike.%${data.search}%,company.ilike.%${data.search}%`);
    if (data.status) q = q.eq("status", data.status as any);
    const { data: rows, count, error } = await q;
    if (error) throw new Error(error.message);
    return { rows: rows ?? [], total: count ?? 0 };
  });

export const createAuthor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    name: z.string().trim().min(1).max(200),
    email: z.string().trim().email().max(255),
    company: z.string().trim().max(200).optional().nullable(),
    country: z.string().trim().max(80).optional().nullable(),
    status: z.enum(["verified","pending","suspended","rejected"]).default("pending"),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureBoss(context);
    const { data: row, error } = await context.supabase.from("authors").insert({
      ...data,
      verified: data.status === "verified",
    }).select().single();
    if (error) throw new Error(error.message);
    await logAudit(context, { entity: "author", entityId: row.id, action: "create", summary: `Created author "${row.name}"`, severity: "success" });
    return row;
  });

export const updateAuthor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid(), patch: AuthorPatch }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureBoss(context);
    const patch: Record<string, unknown> = { ...data.patch };
    if (patch.status && patch.verified === undefined) patch.verified = patch.status === "verified";
    const { data: row, error } = await context.supabase.from("authors").update(patch as any).eq("id", data.id).select().single();
    if (error) throw new Error(error.message);
    await logAudit(context, { entity: "author", entityId: row.id, action: "update", summary: `Updated author "${row.name}"`, metadata: data.patch });
    return row;
  });

export const setAuthorVerification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    id: z.string().uuid(),
    status: z.enum(["verified","pending","suspended","rejected"]),
    reason: z.string().trim().max(500).optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureBoss(context);
    const { data: row, error } = await context.supabase.from("authors")
      .update({ status: data.status, verified: data.status === "verified" })
      .eq("id", data.id).select().single();
    if (error) throw new Error(error.message);
    const sev = data.status === "suspended" || data.status === "rejected" ? "danger"
      : data.status === "verified" ? "success" : "warn";
    await logAudit(context, {
      entity: "author", entityId: row.id, action: `verify:${data.status}`,
      summary: `Author "${row.name}" set to ${data.status}${data.reason ? ` — ${data.reason}` : ""}`,
      metadata: { reason: data.reason ?? null }, severity: sev,
    });
    return row;
  });

export const deleteAuthor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureBoss(context);
    const { data: row } = await context.supabase.from("authors").select("name").eq("id", data.id).single();
    const { error } = await context.supabase.from("authors").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    await logAudit(context, { entity: "author", entityId: data.id, action: "delete", summary: `Deleted author "${row?.name ?? data.id}"`, severity: "danger" });
    return { ok: true };
  });

// ---- Applications ----
export const listApplications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { search?: string; stage?: string; page?: number; pageSize?: number }) => d)
  .handler(async ({ data, context }) => {
    await ensureBoss(context);
    const page = data.page ?? 1, pageSize = Math.min(data.pageSize ?? 100, 500);
    let q = context.supabase.from("applications").select("*", { count: "exact" })
      .order("updated_at", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);
    if (data.search) q = q.or(`applicant_name.ilike.%${data.search}%,email.ilike.%${data.search}%`);
    if (data.stage) q = q.eq("stage", data.stage);
    const { data: rows, count, error } = await q;
    if (error) throw new Error(error.message);
    return { rows: rows ?? [], total: count ?? 0 };
  });

export const createApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    applicant_name: z.string().trim().min(1).max(200),
    email: z.string().trim().email().max(255),
    country: z.string().trim().max(80).optional().nullable(),
    stage: z.enum(["registration","identity","kyc","portfolio","interview","agreement","approved","rejected"]).default("registration"),
    reviewer_email: z.string().trim().email().max(255).optional().nullable(),
    notes: z.string().trim().max(2000).optional().nullable(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureBoss(context);
    const { data: row, error } = await context.supabase.from("applications").insert(data).select().single();
    if (error) throw new Error(error.message);
    await logAudit(context, {
      entity: "application", entityId: row.id, action: "invite",
      summary: `Invited "${row.applicant_name}" (${row.email})`, severity: "info",
    });
    return row;
  });

export const advanceApplicationStage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    id: z.string().uuid(),
    stage: z.enum(["registration","identity","kyc","portfolio","interview","agreement"]),
    notes: z.string().trim().max(2000).optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureBoss(context);
    const patch: Record<string, unknown> = { stage: data.stage };
    if (data.notes) patch.notes = data.notes;
    const { data: row, error } = await context.supabase.from("applications").update(patch).eq("id", data.id).select().single();
    if (error) throw new Error(error.message);
    await logAudit(context, {
      entity: "application", entityId: row.id, action: `stage:${data.stage}`,
      summary: `Advanced "${row.applicant_name}" to ${data.stage}`,
      metadata: { notes: data.notes ?? null }, severity: "info",
    });
    return row;
  });

export const approveApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    id: z.string().uuid(),
    notes: z.string().trim().max(2000).optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureBoss(context);
    const { data: app, error: aerr } = await context.supabase.from("applications").select("*").eq("id", data.id).single();
    if (aerr) throw new Error(aerr.message);
    if (app.stage === "approved") throw new Error("Application already approved.");
    if (app.stage === "rejected") throw new Error("Cannot approve a rejected application. Move it back to a prior stage first.");

    // Create or link author.
    let authorId = app.author_id as string | null;
    if (!authorId) {
      const { data: existing } = await context.supabase.from("authors").select("id").eq("email", app.email).maybeSingle();
      if (existing) {
        authorId = existing.id;
        await context.supabase.from("authors").update({ status: "verified", verified: true }).eq("id", authorId);
      } else {
        const { data: newAuthor, error: cerr } = await context.supabase.from("authors").insert({
          name: app.applicant_name, email: app.email, country: app.country,
          status: "verified", verified: true, joined_at: new Date().toISOString(),
        }).select("id").single();
        if (cerr) throw new Error(cerr.message);
        authorId = newAuthor.id;
      }
    }

    const { data: row, error } = await context.supabase.from("applications").update({
      stage: "approved", decided_at: new Date().toISOString(), author_id: authorId,
      notes: data.notes ?? app.notes,
    }).eq("id", data.id).select().single();
    if (error) throw new Error(error.message);

    await logAudit(context, {
      entity: "application", entityId: row.id, action: "approve",
      summary: `Approved "${row.applicant_name}" — author profile issued`,
      metadata: { author_id: authorId, notes: data.notes ?? null }, severity: "success",
    });
    await logAudit(context, {
      entity: "author", entityId: authorId!, action: "verify:verified",
      summary: `Author "${row.applicant_name}" verified via application approval`,
      severity: "success",
    });
    return row;
  });

export const rejectApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    id: z.string().uuid(),
    reason: z.string().trim().min(1, "Reason is required").max(2000),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureBoss(context);
    const { data: row, error } = await context.supabase.from("applications").update({
      stage: "rejected", decided_at: new Date().toISOString(), notes: data.reason,
    }).eq("id", data.id).select().single();
    if (error) throw new Error(error.message);
    await logAudit(context, {
      entity: "application", entityId: row.id, action: "reject",
      summary: `Rejected "${row.applicant_name}" — ${data.reason}`,
      metadata: { reason: data.reason }, severity: "danger",
    });
    return row;
  });

export const requestApplicationChanges = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    id: z.string().uuid(),
    message: z.string().trim().min(1).max(2000),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureBoss(context);
    const { data: row, error } = await context.supabase.from("applications").update({
      notes: data.message,
    }).eq("id", data.id).select().single();
    if (error) throw new Error(error.message);
    await logAudit(context, {
      entity: "application", entityId: row.id, action: "request-changes",
      summary: `Requested changes from "${row.applicant_name}"`,
      metadata: { message: data.message }, severity: "warn",
    });
    return row;
  });

export const deleteApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureBoss(context);
    const { data: row } = await context.supabase.from("applications").select("applicant_name").eq("id", data.id).single();
    const { error } = await context.supabase.from("applications").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    await logAudit(context, {
      entity: "application", entityId: data.id, action: "delete",
      summary: `Deleted application "${row?.applicant_name ?? data.id}"`, severity: "danger",
    });
    return { ok: true };
  });
