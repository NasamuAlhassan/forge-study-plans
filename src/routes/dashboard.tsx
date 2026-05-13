import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { Toaster } from "@/components/ui/sonner";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles } from "lucide-react";

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
  const { session, user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/login" });
  }, [loading, session, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("onboarded_at").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => {
        if (data && !data.onboarded_at) navigate({ to: "/onboarding" });
      });
  }, [user, navigate]);

  if (loading || !session) {
    return (
      <div className="min-h-screen grid place-items-center bg-background text-muted-foreground">
        <div className="flex items-center gap-2 text-sm">
          <Sparkles className="h-4 w-4 animate-pulse text-primary" />
          Loading your workspace…
        </div>
      </div>
    );
  }

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
