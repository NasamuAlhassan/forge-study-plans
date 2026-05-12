import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

/** Real consecutive-day study streak based on study_sessions. */
export function useStreak() {
  const { user } = useAuth();
  const [streak, setStreak] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!user) {
        setStreak(0);
        setTotalSessions(0);
        setLoading(false);
        return;
      }
      setLoading(true);
      const { data } = await supabase
        .from("study_sessions")
        .select("started_at, completed")
        .eq("user_id", user.id)
        .eq("completed", true)
        .order("started_at", { ascending: false })
        .limit(365);
      if (cancelled) return;
      const sessions = data ?? [];
      setTotalSessions(sessions.length);

      // Build a set of YYYY-MM-DD strings the user studied
      const days = new Set(
        sessions.map((s) => new Date(s.started_at).toISOString().slice(0, 10))
      );

      // Walk backwards from today
      let count = 0;
      const cursor = new Date();
      // If today not present, allow yesterday to still count (give grace until end of day)
      const today = cursor.toISOString().slice(0, 10);
      if (!days.has(today)) {
        cursor.setDate(cursor.getDate() - 1);
      }
      while (days.has(cursor.toISOString().slice(0, 10))) {
        count++;
        cursor.setDate(cursor.getDate() - 1);
      }
      setStreak(count);
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [user]);

  return { streak, totalSessions, loading };
}
