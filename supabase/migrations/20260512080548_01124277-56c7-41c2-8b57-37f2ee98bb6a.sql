
CREATE TABLE public.study_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  subject_id UUID,
  event_id UUID,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  duration_min INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own sessions" ON public.study_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own sessions" ON public.study_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own sessions" ON public.study_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own sessions" ON public.study_sessions FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_study_sessions_user_started ON public.study_sessions(user_id, started_at DESC);
