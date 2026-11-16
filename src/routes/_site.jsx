import { Outlet, createFileRoute } from "@tanstack/react-router";
import AppShell from "@/components/musify/AppShell";

export const Route = createFileRoute("/_site")({
  component: SiteLayout,
});

function SiteLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}