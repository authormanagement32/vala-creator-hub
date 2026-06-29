import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/boss/author-manager/")({
  beforeLoad: () => {
    throw redirect({ to: "/boss/author-manager/dashboard" });
  },
});
