import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const Payload = z.object({
  wall_route: z.string().min(1).max(300),
  state: z.enum(["signin", "forbidden", "rate_limited"]),
  status_code: z.number().int().min(100).max(599).nullable().optional(),
  message: z.string().max(500).nullable().optional(),
  user_id: z.string().uuid().nullable().optional(),
  email: z.string().email().nullable().optional(),
});

export const Route = createFileRoute("/api/public/auth-gate-events")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }
        const parsed = Payload.safeParse(body);
        if (!parsed.success) {
          return new Response("Invalid payload", { status: 400 });
        }
        const ua = request.headers.get("user-agent") ?? null;
        const ip =
          request.headers.get("cf-connecting-ip") ??
          request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
          null;
        const { supabaseAdmin } = await import(
          "@/integrations/supabase/client.server"
        );
        const { error } = await supabaseAdmin.from("auth_gate_events").insert({
          wall_route: parsed.data.wall_route,
          state: parsed.data.state,
          status_code: parsed.data.status_code ?? null,
          message: parsed.data.message ?? null,
          user_id: parsed.data.user_id ?? null,
          email: parsed.data.email ?? null,
          user_agent: ua,
          ip,
        });
        if (error) return new Response(error.message, { status: 500 });
        return Response.json({ ok: true });
      },
    },
  },
});
