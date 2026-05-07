-- Sessions: Phase 1 setup
-- Run this in Supabase SQL Editor.
--
-- IMPORTANT: The sessions table has a CHECK constraint requiring exactly one of
-- program_id or group_id to be non-null. Phase 1 sessions are scoped to
-- organization_id only (no program/group), so this constraint must be dropped.
-- It will be re-evaluated when programs/groups are built in a later phase.

-- Drop the program_id / group_id mutual-exclusion constraint
DO $$
DECLARE
  v_name TEXT;
BEGIN
  SELECT conname INTO v_name
  FROM pg_constraint
  WHERE conrelid = 'public.sessions'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%program_id%';
  IF v_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.sessions DROP CONSTRAINT %I', v_name);
  END IF;
END $$;

-- =====================================================================
-- SESSIONS RLS POLICIES
-- =====================================================================

-- Public read: published sessions in active orgs
CREATE POLICY "Published sessions are publicly readable"
ON public.sessions FOR SELECT
USING (
  status = 'published'
  AND organization_id IN (
    SELECT id FROM public.organizations WHERE status = 'active'
  )
);

-- Org members: read all sessions (including draft/cancelled) for their org
CREATE POLICY "Org members read all their org sessions"
ON public.sessions FOR SELECT
USING (organization_id IN (SELECT public.user_organizations()));

-- Admins and collaborators: create sessions
CREATE POLICY "Admins and collaborators create sessions"
ON public.sessions FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM public.memberships
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'collaborator')
      AND status = 'active'
  )
);

-- Admins and collaborators: update sessions
CREATE POLICY "Admins and collaborators update sessions"
ON public.sessions FOR UPDATE
USING (
  organization_id IN (
    SELECT organization_id FROM public.memberships
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'collaborator')
      AND status = 'active'
  )
)
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM public.memberships
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'collaborator')
      AND status = 'active'
  )
);

-- =====================================================================
-- SESSION_SPEAKERS RLS POLICIES
-- =====================================================================

-- Public read: session speakers for published sessions
CREATE POLICY "Session speakers for published sessions are publicly readable"
ON public.session_speakers FOR SELECT
USING (
  session_id IN (
    SELECT id FROM public.sessions WHERE status = 'published'
  )
);

-- Org members: read all session speakers for their org's sessions
CREATE POLICY "Org members read all their session speakers"
ON public.session_speakers FOR SELECT
USING (
  session_id IN (
    SELECT id FROM public.sessions
    WHERE organization_id IN (SELECT public.user_organizations())
  )
);

-- Admins and collaborators: manage session speakers
CREATE POLICY "Admins and collaborators insert session speakers"
ON public.session_speakers FOR INSERT
WITH CHECK (
  session_id IN (
    SELECT s.id FROM public.sessions s
    JOIN public.memberships m ON m.organization_id = s.organization_id
    WHERE m.user_id = auth.uid()
      AND m.role IN ('admin', 'collaborator')
      AND m.status = 'active'
  )
);

CREATE POLICY "Admins and collaborators delete session speakers"
ON public.session_speakers FOR DELETE
USING (
  session_id IN (
    SELECT s.id FROM public.sessions s
    JOIN public.memberships m ON m.organization_id = s.organization_id
    WHERE m.user_id = auth.uid()
      AND m.role IN ('admin', 'collaborator')
      AND m.status = 'active'
  )
);
