-- Crop Diary and in-app Smart Reminder foundation
CREATE TABLE IF NOT EXISTS public.crop_diary_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id uuid REFERENCES public.user_crop_plans(id) ON DELETE SET NULL,
  crop_type text NOT NULL,
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'ভালো' CHECK (status IN ('ভালো', 'সতর্কতা', 'সমস্যা')),
  notes text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS crop_diary_entries_user_date_idx
  ON public.crop_diary_entries(user_id, entry_date DESC, created_at DESC);

ALTER TABLE public.crop_diary_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own crop diary entries"
  ON public.crop_diary_entries FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crop_diary_entries TO authenticated;
GRANT ALL ON public.crop_diary_entries TO service_role;

CREATE TABLE IF NOT EXISTS public.crop_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id uuid REFERENCES public.user_crop_plans(id) ON DELETE SET NULL,
  crop_type text NOT NULL,
  title text NOT NULL,
  note text,
  reminder_date date NOT NULL,
  is_done boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  last_notified_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS crop_reminders_user_date_idx
  ON public.crop_reminders(user_id, reminder_date, is_done, is_active);

ALTER TABLE public.crop_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own crop reminders"
  ON public.crop_reminders FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crop_reminders TO authenticated;
GRANT ALL ON public.crop_reminders TO service_role;

CREATE OR REPLACE FUNCTION public.set_crop_reminders_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_crop_reminders_updated_at ON public.crop_reminders;
CREATE TRIGGER trg_crop_reminders_updated_at
  BEFORE UPDATE ON public.crop_reminders
  FOR EACH ROW EXECUTE FUNCTION public.set_crop_reminders_updated_at();