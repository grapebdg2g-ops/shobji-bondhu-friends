
CREATE TABLE public.user_crop_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  crop_type TEXT NOT NULL,
  planting_date DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX user_crop_plans_user_idx ON public.user_crop_plans(user_id, is_active);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_crop_plans TO authenticated;
GRANT ALL ON public.user_crop_plans TO service_role;
ALTER TABLE public.user_crop_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own crop plans" ON public.user_crop_plans FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.crop_task_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.user_crop_plans(id) ON DELETE CASCADE,
  task_id TEXT NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (plan_id, task_id)
);
CREATE INDEX crop_task_completions_plan_idx ON public.crop_task_completions(plan_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crop_task_completions TO authenticated;
GRANT ALL ON public.crop_task_completions TO service_role;
ALTER TABLE public.crop_task_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own task completions" ON public.crop_task_completions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
