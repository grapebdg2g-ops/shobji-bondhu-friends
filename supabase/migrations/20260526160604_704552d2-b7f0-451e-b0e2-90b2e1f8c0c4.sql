
-- user_reports
CREATE TABLE public.user_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL,
  reported_user_id uuid,
  content_type text NOT NULL CHECK (content_type IN ('post','exchange','price','comment','user')),
  content_id uuid,
  reason text NOT NULL CHECK (reason IN ('spam','inappropriate','fake','harassment','other')),
  description text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reviewed','actioned','dismissed')),
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_user_reports_status ON public.user_reports(status, created_at DESC);
CREATE INDEX idx_user_reports_content ON public.user_reports(content_type, content_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_reports TO authenticated;
GRANT ALL ON public.user_reports TO service_role;

ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own reports"
  ON public.user_reports FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reporter_id AND is_active_user(auth.uid()));

CREATE POLICY "Users view own reports"
  ON public.user_reports FOR SELECT TO authenticated
  USING (auth.uid() = reporter_id);

CREATE POLICY "Mods view all reports"
  ON public.user_reports FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'moderator') OR has_role(auth.uid(),'admin'));

CREATE POLICY "Mods update reports"
  ON public.user_reports FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'moderator') OR has_role(auth.uid(),'admin'))
  WITH CHECK (has_role(auth.uid(),'moderator') OR has_role(auth.uid(),'admin'));

CREATE POLICY "Admins delete reports"
  ON public.user_reports FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'admin'));

-- admin_actions
CREATE TABLE public.admin_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  action_type text NOT NULL,
  target_id uuid,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_admin_actions_created ON public.admin_actions(created_at DESC);
CREATE INDEX idx_admin_actions_target ON public.admin_actions(target_id);

GRANT SELECT, INSERT ON public.admin_actions TO authenticated;
GRANT ALL ON public.admin_actions TO service_role;

ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view actions"
  ON public.admin_actions FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin'));

CREATE POLICY "Admins insert actions"
  ON public.admin_actions FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'admin') AND admin_id = auth.uid());

-- notification_broadcasts
CREATE TABLE public.notification_broadcasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  link text,
  icon text,
  target_type text NOT NULL DEFAULT 'all' CHECK (target_type IN ('all','district','upazila','crop','pro','role')),
  target_value text,
  sent_count integer NOT NULL DEFAULT 0,
  opened_count integer NOT NULL DEFAULT 0,
  scheduled_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_broadcasts_created ON public.notification_broadcasts(created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_broadcasts TO authenticated;
GRANT ALL ON public.notification_broadcasts TO service_role;

ALTER TABLE public.notification_broadcasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view broadcasts"
  ON public.notification_broadcasts FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin'));

CREATE POLICY "Admins insert broadcasts"
  ON public.notification_broadcasts FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'admin') AND admin_id = auth.uid());

CREATE POLICY "Admins update broadcasts"
  ON public.notification_broadcasts FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'admin'))
  WITH CHECK (has_role(auth.uid(),'admin'));

CREATE POLICY "Admins delete broadcasts"
  ON public.notification_broadcasts FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'admin'));

-- Allow admins to insert notifications for any user (broadcast)
CREATE POLICY "Admins broadcast notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'admin'));
