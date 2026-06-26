import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/aurora/DashboardShell";

export const Route = createFileRoute("/portfolio")({
  component: Portfolio,
});

function Portfolio() {
  return <DashboardShell defaultActive="portfolio" />;
}
