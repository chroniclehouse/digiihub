-- Fix: session_speakers and speakers not visible to anon role on hub pages.
--
-- Root cause: the session_speakers public SELECT policy used a subquery on
-- `sessions`, which triggers sessions RLS under the anon role, which then
-- queries `organizations`, creating a recursive RLS evaluation chain that
-- Supabase/PostgREST silently short-circuits — returning empty session_speakers
-- even when the data exists and all policies "should" match.
--
-- The fix mirrors the pattern already used in this schema: wrap the cross-table
-- check in a SECURITY DEFINER function so it runs as the defining role and
-- bypasses the recursive RLS stack entirely.

-- Helper: returns TRUE if a session is published and its org is active.
-- SECURITY DEFINER so the check bypasses RLS on sessions + organizations.
CREATE OR REPLACE FUNCTION public.is_session_publicly_readable(p_session_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.sessions s
    JOIN public.organizations o ON o.id = s.organization_id
    WHERE s.id = p_session_id
      AND s.status = 'published'
      AND o.status = 'active'
  );
$$;

-- Drop the old policy that used the recursive subquery.
DROP POLICY IF EXISTS "Session speakers for published sessions are publicly readable"
  ON public.session_speakers;

-- Recreate using the SECURITY DEFINER function — no recursive RLS chain.
CREATE POLICY "Session speakers for published sessions are publicly readable"
ON public.session_speakers FOR SELECT
USING (public.is_session_publicly_readable(session_id));

-- Also ensure the speakers public read policy is not role-restricted.
-- The original policy has no TO clause (applies to all roles including anon),
-- but drop and recreate explicitly to be safe.
DROP POLICY IF EXISTS "Active speakers are publicly readable"
  ON public.speakers;

CREATE POLICY "Active speakers are publicly readable"
ON public.speakers FOR SELECT
USING (status = 'active');
