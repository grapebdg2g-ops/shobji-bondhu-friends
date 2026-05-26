
CREATE TABLE public.pro_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  plan text NOT NULL DEFAULT 'pro',
  status text NOT NULL DEFAULT 'active',
  started_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'BDT',
  payment_ref text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pro_subscriptions_status_chk CHECK (status IN ('active','expired','canceled','pending'))
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pro_subscriptions TO authenticated;
GRANT ALL ON public.pro_subscriptions TO service_role;

ALTER TABLE public.pro_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own subscription" ON public.pro_subscriptions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all subscriptions" ON public.pro_subscriptions
  FOR SELECT TO authenticated USING (has_role(auth.uid(),'admin'));
CREATE POLICY "Admins insert subscriptions" ON public.pro_subscriptions
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update subscriptions" ON public.pro_subscriptions
  FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete subscriptions" ON public.pro_subscriptions
  FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'));

CREATE TRIGGER set_pro_sub_updated_at BEFORE UPDATE ON public.pro_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_pro_subs_status ON public.pro_subscriptions(status);
CREATE INDEX idx_pro_subs_expires ON public.pro_subscriptions(expires_at);


CREATE TABLE public.revenue_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  subscription_id uuid REFERENCES public.pro_subscriptions(id) ON DELETE SET NULL,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'BDT',
  type text NOT NULL DEFAULT 'subscription',
  status text NOT NULL DEFAULT 'succeeded',
  reference text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT revenue_tx_type_chk CHECK (type IN ('subscription','one_time','refund','adjustment')),
  CONSTRAINT revenue_tx_status_chk CHECK (status IN ('succeeded','pending','failed','refunded'))
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.revenue_transactions TO authenticated;
GRANT ALL ON public.revenue_transactions TO service_role;

ALTER TABLE public.revenue_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own transactions" ON public.revenue_transactions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all transactions" ON public.revenue_transactions
  FOR SELECT TO authenticated USING (has_role(auth.uid(),'admin'));
CREATE POLICY "Admins insert transactions" ON public.revenue_transactions
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update transactions" ON public.revenue_transactions
  FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete transactions" ON public.revenue_transactions
  FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'));

CREATE INDEX idx_rev_tx_user ON public.revenue_transactions(user_id);
CREATE INDEX idx_rev_tx_created ON public.revenue_transactions(created_at DESC);
CREATE INDEX idx_rev_tx_status ON public.revenue_transactions(status);
