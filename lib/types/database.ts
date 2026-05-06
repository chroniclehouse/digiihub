// Organization
export type OrgTier = 'entry' | 'pro' | 'white_label'
export type OrgStatus = 'active' | 'past_due' | 'cancelled' | 'archived'

export interface Organization {
  id: string
  name: string
  slug: string
  custom_domain: string | null
  tier: OrgTier
  status: OrgStatus
  timezone: string
  created_at: string
  updated_at: string
}

// Membership
export type MembershipRole = 'admin' | 'collaborator' | 'participant' | 'viewer'
export type MembershipStatus = 'active' | 'invited' | 'removed'

export interface Membership {
  id: string
  user_id: string
  organization_id: string
  role: MembershipRole
  status: MembershipStatus
  accepted_at: string | null
  created_at: string
  updated_at: string
}

// Speaker
export type SpeakerStatus = 'active' | 'archived'
export type SpeakerRole = 'primary' | 'co_facilitator' | 'guest'

export interface SpeakerLink {
  label: string
  url: string
}

export interface Speaker {
  id: string
  organization_id: string
  full_name: string
  title: string | null
  organization_name: string | null
  photo_url: string | null
  bio: string | null
  links: SpeakerLink[]
  status: SpeakerStatus
  created_at: string
  updated_at: string
}

export interface SpeakerInput {
  full_name: string
  title?: string | null
  organization_name?: string | null
  photo_url?: string | null
  bio?: string | null
  links?: SpeakerLink[]
}
