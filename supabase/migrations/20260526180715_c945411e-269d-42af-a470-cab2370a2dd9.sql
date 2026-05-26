-- Grant Data API access to muted_users and user_reports
-- Both are auth-only (all policies scope to auth.uid() or roles), so no anon grants.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.muted_users TO authenticated;
GRANT ALL ON public.muted_users TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_reports TO authenticated;
GRANT ALL ON public.user_reports TO service_role;

-- Prevent self-muting at the database layer (defense in depth alongside the hook check)
ALTER TABLE public.muted_users
  DROP CONSTRAINT IF EXISTS muted_users_no_self_mute;
ALTER TABLE public.muted_users
  ADD CONSTRAINT muted_users_no_self_mute CHECK (user_id <> muted_id);

-- Prevent duplicate mutes
CREATE UNIQUE INDEX IF NOT EXISTS muted_users_user_muted_uniq
  ON public.muted_users (user_id, muted_id);

-- Prevent duplicate reports of the same content by the same user
CREATE UNIQUE INDEX IF NOT EXISTS user_reports_unique_per_content
  ON public.user_reports (reporter_id, content_type, content_id)
  WHERE content_id IS NOT NULL;

-- Validate report fields at DB layer
ALTER TABLE public.user_reports
  DROP CONSTRAINT IF EXISTS user_reports_reason_check;
ALTER TABLE public.user_reports
  ADD CONSTRAINT user_reports_reason_check
  CHECK (reason IN ('spam','misinformation','offensive','fraud','other'));

ALTER TABLE public.user_reports
  DROP CONSTRAINT IF EXISTS user_reports_content_type_check;
ALTER TABLE public.user_reports
  ADD CONSTRAINT user_reports_content_type_check
  CHECK (content_type IN ('post','exchange','price','comment','user'));

ALTER TABLE public.user_reports
  DROP CONSTRAINT IF EXISTS user_reports_status_check;
ALTER TABLE public.user_reports
  ADD CONSTRAINT user_reports_status_check
  CHECK (status IN ('pending','reviewing','resolved','dismissed'));

ALTER TABLE public.user_reports
  DROP CONSTRAINT IF EXISTS user_reports_description_length;
ALTER TABLE public.user_reports
  ADD CONSTRAINT user_reports_description_length
  CHECK (description IS NULL OR char_length(description) <= 500);

-- Prevent self-reporting
ALTER TABLE public.user_reports
  DROP CONSTRAINT IF EXISTS user_reports_no_self_report;
ALTER TABLE public.user_reports
  ADD CONSTRAINT user_reports_no_self_report
  CHECK (reported_user_id IS NULL OR reporter_id <> reported_user_id);
