
-- Notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  ref_id uuid,
  ref_type text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user_created ON public.notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id) WHERE is_read = false;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users update own notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own notifications"
  ON public.notifications FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Like trigger
CREATE OR REPLACE FUNCTION public.notify_post_like()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_owner uuid;
  v_name text;
BEGIN
  SELECT user_id INTO v_owner FROM public.posts WHERE id = NEW.post_id;
  IF v_owner IS NULL OR v_owner = NEW.user_id THEN RETURN NEW; END IF;
  SELECT COALESCE(name, 'একজন কৃষক') INTO v_name FROM public.profiles WHERE id = NEW.user_id;
  INSERT INTO public.notifications (user_id, type, title, body, ref_id, ref_type)
  VALUES (v_owner, 'like', 'নতুন প্রতিক্রিয়া', COALESCE(v_name, 'একজন কৃষক') || ' আপনার পোস্টে উপকারী দিয়েছেন', NEW.post_id, 'post');
  RETURN NEW;
END $$;

CREATE TRIGGER trg_notify_post_like
  AFTER INSERT ON public.post_likes
  FOR EACH ROW EXECUTE FUNCTION public.notify_post_like();

-- Comment trigger
CREATE OR REPLACE FUNCTION public.notify_post_comment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_owner uuid;
  v_snippet text;
BEGIN
  SELECT user_id INTO v_owner FROM public.posts WHERE id = NEW.post_id;
  IF v_owner IS NULL OR v_owner = NEW.user_id THEN RETURN NEW; END IF;
  v_snippet := LEFT(NEW.content, 30);
  INSERT INTO public.notifications (user_id, type, title, body, ref_id, ref_type)
  VALUES (v_owner, 'comment', 'নতুন মন্তব্য', COALESCE(NEW.user_name, 'একজন কৃষক') || ': ' || v_snippet, NEW.post_id, 'post');
  RETURN NEW;
END $$;

CREATE TRIGGER trg_notify_post_comment
  AFTER INSERT ON public.post_comments
  FOR EACH ROW EXECUTE FUNCTION public.notify_post_comment();

-- Price drop trigger (>10%)
CREATE OR REPLACE FUNCTION public.notify_price_drop()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_drop numeric;
  v_user record;
BEGIN
  IF NEW.previous_price IS NULL OR NEW.previous_price <= 0 OR NEW.price >= NEW.previous_price THEN
    RETURN NEW;
  END IF;
  v_drop := ROUND(((NEW.previous_price - NEW.price) / NEW.previous_price) * 100);
  IF v_drop < 10 THEN RETURN NEW; END IF;

  FOR v_user IN
    SELECT id FROM public.profiles WHERE NEW.product_name = ANY(crops) AND id <> NEW.user_id
  LOOP
    INSERT INTO public.notifications (user_id, type, title, body, ref_id, ref_type)
    VALUES (v_user.id, 'price_alert', 'দাম কমেছে ⚠️',
            NEW.product_name || ' এর দাম কমেছে ' || v_drop::text || '% — এখনই দেখুন',
            NEW.id, 'price');
  END LOOP;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_notify_price_drop
  AFTER INSERT ON public.prices
  FOR EACH ROW EXECUTE FUNCTION public.notify_price_drop();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER TABLE public.posts REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
