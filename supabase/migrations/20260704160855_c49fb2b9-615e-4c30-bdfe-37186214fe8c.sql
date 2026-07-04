
REVOKE ALL ON FUNCTION public.search_cache(vector, float, int, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.cleanup_ai_chat_cache() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.increment_cache_hit(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.record_cache_feedback(uuid, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.search_cache(vector, float, int, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_ai_chat_cache() TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_cache_hit(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.record_cache_feedback(uuid, boolean) TO service_role;
