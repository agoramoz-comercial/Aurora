import { Suspense, lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/aurora/DashboardShell";

const DesignLab = lazy(() =>
  import("@/components/aurora/cockpit/DesignLab").then((m) => ({ default: m.DesignLab })),
);

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  // Reference screen for the Cockpit Aurora design system (gate G2): ?lab=cockpit
  if (
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("lab") === "cockpit"
  )
    return (
      <Suspense fallback={null}>
        <DesignLab />
      </Suspense>
    );
  return <DashboardShell />;
}
