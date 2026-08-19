CREATE OR REPLACE FUNCTION public.touch_post_reaction_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.touch_post_reaction_updated_at() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.sync_post_reaction_count() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.notify_post_reaction() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.notify_post_comment() FROM anon, authenticated, public;