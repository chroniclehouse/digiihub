-- Public read policies for hub pages.
-- Hub participants and visitors access the hub without signing in (anon key).
-- Without these policies, org info and branding are invisible to unauthenticated requests,
-- breaking the speakers page org lookup and all future hub sections.

-- Active organizations are publicly readable
CREATE POLICY "Active organizations are publicly readable"
ON public.organizations FOR SELECT
USING (status = 'active');

-- Org branding is publicly readable for active orgs
CREATE POLICY "Org branding is publicly readable"
ON public.org_branding FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.organizations
    WHERE id = organization_id AND status = 'active'
  )
);
