CREATE TABLE public.app_installs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT,
  user_agent TEXT,
  installed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.app_installs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can record their own install"
ON public.app_installs FOR INSERT
WITH CHECK (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Users can view their own installs"
ON public.app_installs FOR SELECT
USING (auth.uid() = user_id);

CREATE INDEX idx_app_installs_user_id ON public.app_installs(user_id);
CREATE INDEX idx_app_installs_installed_at ON public.app_installs(installed_at DESC);