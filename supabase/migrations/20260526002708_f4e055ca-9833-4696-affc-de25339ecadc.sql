CREATE INDEX IF NOT EXISTS idx_prices_district_date ON public.prices(district, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_district_date ON public.posts(district, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_exchanges_type_district_active ON public.exchanges(type, district, is_active);
CREATE INDEX IF NOT EXISTS idx_disease_user_date ON public.disease_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read, created_at DESC);