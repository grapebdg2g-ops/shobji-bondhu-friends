
REVOKE EXECUTE ON FUNCTION public.increment_likes(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.decrement_likes(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.increment_comments(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.increment_likes(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_likes(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_comments(uuid) TO authenticated;
