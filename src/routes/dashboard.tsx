import { createFileRoute, Outlet } from "@tanstack/react-router";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Forge" },
      { name: "description", content: "Your AI academic operating system." },
    ],
  }),
  component: DashboardLayout,
});

function DashboardLayout() {
  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <DashboardSidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <Outlet />
      </div>
      <Toaster theme="dark" position="top-right" />
    </div>
  );
}
