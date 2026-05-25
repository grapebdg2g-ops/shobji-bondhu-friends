
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT,
  name TEXT NOT NULL DEFAULT '',
  district TEXT,
  upazila TEXT,
  crops TEXT[] NOT NULL DEFAULT '{}',
  role TEXT NOT NULL DEFAULT 'farmer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, phone, name)
  VALUES (
    NEW.id,
    NEW.phone,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
ALTER FUNCTION public.set_updated_at() SET search_path = public;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;

CREATE TABLE public.prices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  unit TEXT NOT NULL DEFAULT 'কেজি',
  market_name TEXT NOT NULL,
  district TEXT NOT NULL,
  upazila TEXT,
  category TEXT NOT NULL DEFAULT 'অন্যান্য',
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL DEFAULT '',
  previous_price NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read prices" ON public.prices FOR SELECT USING (true);
CREATE POLICY "Users can insert own prices" ON public.prices FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own prices" ON public.prices FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own prices" ON public.prices FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX idx_prices_district_created ON public.prices(district, created_at DESC);
CREATE INDEX idx_prices_category ON public.prices(category);
ALTER PUBLICATION supabase_realtime ADD TABLE public.prices;
ALTER TABLE public.prices REPLICA IDENTITY FULL;

CREATE TABLE public.exchanges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'seed',
  is_free BOOLEAN NOT NULL DEFAULT false,
  price NUMERIC,
  unit TEXT,
  image_url TEXT,
  district TEXT NOT NULL,
  upazila TEXT,
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL DEFAULT '',
  user_phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.exchanges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active exchanges" ON public.exchanges FOR SELECT USING (is_active = true);
CREATE POLICY "Auth users insert own exchanges" ON public.exchanges FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own exchanges" ON public.exchanges FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own exchanges" ON public.exchanges FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX idx_exchanges_district_created ON public.exchanges (district, created_at DESC);
CREATE INDEX idx_exchanges_type ON public.exchanges (type);
ALTER PUBLICATION supabase_realtime ADD TABLE public.exchanges;
