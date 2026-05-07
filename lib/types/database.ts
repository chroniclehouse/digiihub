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

// Session
export type SessionType = 'regular' | 'special' | 'graduation' | 'custom'
export type SessionStatus = 'draft' | 'published' | 'cancelled'

export interface Session {
  id: string
  organization_id: string
  program_id: string | null
  group_id: string | null
  session_number: number | null
  title: string
  type: SessionType
  custom_type_label: string | null
  session_date: string        // 'YYYY-MM-DD'
  start_time: string | null   // 'HH:MM:SS' from DB
  end_time: string | null
  location_name: string | null
  location_address: string | null
  room: string | null
  description: string | null
  status: SessionStatus
  created_at: string
  updated_at: string
}

export interface SessionInput {
  session_number?: number | null
  title: string
  type: SessionType
  custom_type_label?: string | null
  session_date: string
  start_time?: string | null
  end_time?: string | null
  location_name?: string | null
  location_address?: string | null
  room?: string | null
  description?: string | null
  status: SessionStatus
}

export interface SessionSpeaker {
  id: string
  session_id: string
  speaker_id: string
  role: SpeakerRole
  display_order: number
}

export interface SessionSpeakerInput {
  speakerId: string
  role: SpeakerRole
  displayOrder: number
}

export interface SessionWithSpeakers extends Session {
  session_speakers: Array<{
    id: string
    role: SpeakerRole
    display_order: number
    speaker: Pick<Speaker, 'id' | 'full_name' | 'title' | 'photo_url'>
  }>
}
