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
    const findings: Array<{ severity: string; dependency?: string }> = Array.isArray(cur?.scan_findings) ? cur!.scan_findings : [];
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
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
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

export const whoAmI = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "boss" });
    return { userId: context.userId, email: context.claims?.email ?? null, isBoss: !!data };
  });
