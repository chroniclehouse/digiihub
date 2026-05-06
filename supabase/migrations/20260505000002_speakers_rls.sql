-- RLS policies for the speakers table.
-- The initial migration enabled RLS but did not include speaker-specific policies,
-- which blocks all INSERT, UPDATE, and admin SELECT operations.
-- Run this in Supabase SQL Editor.

-- Public read: active speakers visible to everyone (hub pages use the anon key)
CREATE POLICY "Active speakers are publicly readable"
ON public.speakers FOR SELECT
USING (status = 'active');

-- Org members: read all speakers in their org including archived (admin list view)
CREATE POLICY "Org members read all their org speakers"
ON public.speakers FOR SELECT
USING (organization_id IN (SELECT public.user_organizations()));

-- Admins and collaborators: create speakers in their org
CREATE POLICY "Admins and collaborators create speakers"
ON public.speakers FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM public.memberships
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'collaborator')
      AND status = 'active'
  )
);

-- Admins and collaborators: update and archive speakers in their org
CREATE POLICY "Admins and collaborators update speakers"
ON public.speakers FOR UPDATE
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
