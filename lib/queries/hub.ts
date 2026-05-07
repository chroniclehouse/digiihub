import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

export interface HubOrg {
  id: string
  name: string
  slug: string
}

export interface HubBranding {
  logo_primary_url: string | null
  eyebrow_text: string | null
  eyebrow_secondary: string | null
}

// React cache deduplicates calls within a single render pass,
// so layout and page can both call these without double-querying Supabase.

export const getHubOrg = cache(async (orgSlug: string): Promise<HubOrg | null> => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('organizations')
    .select('id, name, slug')
    .eq('slug', orgSlug)
    .eq('status', 'active')
    .single()
  return data ?? null
})

export const getHubBranding = cache(async (orgId: string): Promise<HubBranding | null> => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('org_branding')
    .select('logo_primary_url, eyebrow_text, eyebrow_secondary')
    .eq('organization_id', orgId)
    .single()
  return data ?? null
})
