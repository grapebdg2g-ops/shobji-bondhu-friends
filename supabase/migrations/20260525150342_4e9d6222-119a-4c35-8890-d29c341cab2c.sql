CREATE TABLE public.disease_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  crop_type TEXT NOT NULL,
  disease_name TEXT NOT NULL,
  severity TEXT NOT NULL,
  result_json JSONB NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.disease_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own disease history"
  ON public.disease_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own disease history"
  ON public.disease_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own disease history"
  ON public.disease_history FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_disease_history_user_created ON public.disease_history(user_id, created_at DESC);