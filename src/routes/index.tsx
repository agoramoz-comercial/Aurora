import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/aurora/DashboardShell";

export const Route = createFileRoute("/")(
  {
    component: Index,
  },
);

function Index() {
  return <DashboardShell />;
}
