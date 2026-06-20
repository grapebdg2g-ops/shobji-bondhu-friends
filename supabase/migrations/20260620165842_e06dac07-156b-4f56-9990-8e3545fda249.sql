
ALTER TABLE public.price_predictions
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS was_correct boolean,
  ADD COLUMN IF NOT EXISTS actual_price numeric,
  ADD COLUMN IF NOT EXISTS checked_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_pp_user_created ON public.price_predictions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pp_unchecked ON public.price_predictions(created_at) WHERE checked_at IS NULL;
