ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS difficulty text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarded_at timestamptz;