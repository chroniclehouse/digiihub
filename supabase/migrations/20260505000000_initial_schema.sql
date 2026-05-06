-- =====================================================================
-- DIGIIHUB DATABASE SCHEMA v1.0
-- =====================================================================
-- Multi-tenant SaaS schema for DigiiHub on Supabase (PostgreSQL)
-- 
-- Build artifact for Phase 0. Run this against a fresh Supabase project
-- to bootstrap the complete database structure.
--
-- This file represents the committed schema. The companion document
-- DigiiHub_Schema_Design_v1.0.docx captures rationale and design decisions.
--
-- Migration sequence:
--   1. Custom enum types
--   2. Layer 1: Foundational entities (users, organizations, memberships)
--   3. Layer 2: Programs and groups
--   4. Layer 3: Content tables
--   5. Layer 4: Specialized concerns
--   6. Indexes
--   7. Row Level Security policies
--   8. Triggers and functions
--
-- Chronicle House, LLC | May 2026
-- =====================================================================

BEGIN;

-- =====================================================================
-- EXTENSIONS
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================================
-- CUSTOM TYPES (ENUMS)
-- =====================================================================

-- Organization tiers and status
CREATE TYPE org_tier AS ENUM ('entry', 'pro', 'white_label');
CREATE TYPE org_status AS ENUM ('active', 'past_due', 'cancelled', 'archived');

-- Membership roles and status
CREATE TYPE membership_role AS ENUM ('admin', 'collaborator', 'participant', 'viewer');
CREATE TYPE membership_status AS ENUM ('active', 'invited', 'removed');

-- Program and group lifecycle
CREATE TYPE program_status AS ENUM ('draft', 'active', 'paused', 'completed', 'archived');
CREATE TYPE group_status AS ENUM ('draft', 'active', 'paused', 'completed', 'archived');
CREATE TYPE group_member_status AS ENUM ('enrolled', 'completed', 'withdrawn');

-- Sessions
CREATE TYPE session_type AS ENUM ('regular', 'special', 'graduation', 'custom');
CREATE TYPE session_status AS ENUM ('draft', 'published', 'cancelled');
CREATE TYPE speaker_role AS ENUM ('primary', 'co_facilitator', 'guest');
CREATE TYPE speaker_status AS ENUM ('active', 'archived');

-- Workbook
CREATE TYPE workbook_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE workbook_prompt_type AS ENUM (
  'text', 'textarea', 'repeating_text', 'select', 
  'multiselect', 'date', 'number', 'rating'
);

-- Resources
CREATE TYPE resource_type AS ENUM ('link', 'pdf', 'video', 'tool', 'document');
CREATE TYPE resource_visibility_scope AS ENUM ('organization', 'program', 'group');
CREATE TYPE resource_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE document_type AS ENUM (
  'pdf', 'word', 'presentation', 'interactive', 'link', 'spreadsheet'
);

-- Discussion
CREATE TYPE discussion_status AS ENUM ('published', 'hidden', 'deleted');
CREATE TYPE directory_visibility AS ENUM ('group_members', 'admins_only', 'hidden');

-- Notifications
CREATE TYPE notify_scope AS ENUM ('all_groups', 'specific_groups');
CREATE TYPE digest_frequency AS ENUM ('instant', 'daily', 'weekly', 'off');
CREATE TYPE notification_type AS ENUM (
  'discussion_post_created', 'discussion_reply_created', 'directory_member_joined',
  'capture_shared_to_gallery', 'capture_comment_received',
  'participant_invited', 'participant_accepted', 'collaborator_invited',
  'session_starting_soon', 'session_cancelled', 'survey_available', 'survey_reminder',
  'workbook_published', 'consent_required', 'consent_updated',
  'subscription_payment_succeeded', 'subscription_payment_failed', 'subscription_cancelled',
  'trial_ending_soon', 'storage_approaching_limit', 'participant_limit_approaching',
  'digest_daily', 'digest_weekly', 'admin_alert',
  'password_reset', 'email_verification', 'magic_link'
);
CREATE TYPE notification_priority AS ENUM ('high', 'normal', 'low');
CREATE TYPE notification_status AS ENUM ('queued', 'processing', 'sent', 'failed', 'cancelled');
CREATE TYPE digest_status AS ENUM ('pending', 'queued', 'sent', 'skipped');
CREATE TYPE template_status AS ENUM ('active', 'archived');
CREATE TYPE delivery_event_type AS ENUM (
  'sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained', 'unsubscribed'
);

-- Surveys
CREATE TYPE survey_type AS ENUM (
  'pre_session', 'post_session', 'mid_program', 'end_program', 'custom'
);
CREATE TYPE survey_provider AS ENUM (
  'google_forms', 'typeform', 'jotform', 'qualtrics', 'survey_monkey', 'other'
);
CREATE TYPE survey_completion_mode AS ENUM ('honor_system', 'webhook_verified');
CREATE TYPE survey_status AS ENUM ('draft', 'published', 'closed', 'archived');
CREATE TYPE verification_method AS ENUM ('honor', 'webhook', 'admin_override');

-- Sponsors and About
CREATE TYPE sponsor_status AS ENUM ('active', 'archived');
CREATE TYPE about_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE about_block_type AS ENUM (
  'text', 'highlights_list', 'two_column', 'image', 'links', 'markdown', 'html'
);

-- Branding
CREATE TYPE theme_preset AS ENUM (
  'digiihub_default', 'pvamu_purple_gold', 'navy_coral', 'forest_amber',
  'slate_teal', 'burgundy_gold', 'royal_silver', 'custom'
);

-- Capture and Share
CREATE TYPE capture_type AS ENUM ('photo', 'video', 'quote', 'document_scan');
CREATE TYPE capture_status AS ENUM ('processing', 'ready', 'archived', 'deleted');
CREATE TYPE capture_visibility AS ENUM (
  'admin_only', 'shared_gallery', 'admins_collaborators'
);
CREATE TYPE reaction_type AS ENUM ('heart', 'celebrate', 'thank_you', 'memorable');

-- Generated content
CREATE TYPE content_source_type AS ENUM ('capture', 'manual_prompt', 'session', 'resource');
CREATE TYPE generated_content_type AS ENUM (
  'social_post_linkedin', 'social_post_instagram', 'social_post_facebook',
  'social_post_twitter', 'announcement', 'newsletter_blurb', 'email_draft',
  'caption', 'canva_brief'
);
CREATE TYPE content_platform AS ENUM (
  'linkedin', 'instagram', 'facebook', 'twitter', 'internal', 'email', 'canva', 'other'
);
CREATE TYPE generated_status AS ENUM ('draft', 'edited', 'approved', 'published', 'archived');
CREATE TYPE destination_type AS ENUM ('manual_copy', 'direct_post', 'scheduled', 'canva_export');
CREATE TYPE destination_status AS ENUM ('pending', 'scheduled', 'posted', 'failed');

-- Consent
CREATE TYPE consent_document_type AS ENUM (
  'terms_of_service', 'privacy_policy', 'media_release', 'communications', 'custom'
);
CREATE TYPE consent_doc_status AS ENUM ('draft', 'active', 'superseded', 'archived');
CREATE TYPE consent_status AS ENUM ('granted', 'declined', 'withdrawn');
CREATE TYPE consent_required_role AS ENUM (
  'all', 'participant', 'admin', 'collaborator', 'viewer'
);
CREATE TYPE consent_enforcement AS ENUM ('strict', 'soft');

-- Billing
CREATE TYPE subscription_status AS ENUM ('trialing', 'active', 'past_due', 'cancelled', 'paused');
CREATE TYPE billing_interval AS ENUM ('monthly', 'annual');
CREATE TYPE invoice_status AS ENUM ('draft', 'open', 'paid', 'void', 'uncollectible');

-- Audit
CREATE TYPE actor_role AS ENUM (
  'admin', 'collaborator', 'participant', 'viewer', 'system', 'support'
);

-- =====================================================================
-- LAYER 1: FOUNDATIONAL ENTITIES
-- =====================================================================

-- USERS (extends Supabase auth.users)
-- Public profile data; auth handled by Supabase Auth
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ORGANIZATIONS
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9][a-z0-9-]*[a-z0-9]$'),
  custom_domain TEXT UNIQUE,
  tier org_tier NOT NULL DEFAULT 'entry',
  status org_status NOT NULL DEFAULT 'active',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  timezone TEXT NOT NULL DEFAULT 'America/Chicago',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- MEMBERSHIPS
CREATE TABLE public.memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role membership_role NOT NULL,
  permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
  status membership_status NOT NULL DEFAULT 'invited',
  invited_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, organization_id)
);

-- =====================================================================
-- LAYER 2: PROGRAMS AND GROUPS
-- =====================================================================

CREATE TABLE public.programs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  group_label TEXT NOT NULL DEFAULT 'Group',
  status program_status NOT NULL DEFAULT 'draft',
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_at TIMESTAMPTZ,
  paused_at TIMESTAMPTZ,
  UNIQUE(organization_id, slug)
);

CREATE TABLE public.groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  status group_status NOT NULL DEFAULT 'draft',
  start_date DATE,
  end_date DATE,
  max_participants INTEGER CHECK (max_participants IS NULL OR max_participants > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_at TIMESTAMPTZ,
  paused_at TIMESTAMPTZ,
  UNIQUE(program_id, slug)
);

CREATE TABLE public.group_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  membership_id UUID NOT NULL REFERENCES public.memberships(id) ON DELETE CASCADE,
  status group_member_status NOT NULL DEFAULT 'enrolled',
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  withdrawn_at TIMESTAMPTZ,
  UNIQUE(group_id, membership_id)
);

-- =====================================================================
-- LAYER 3: CONTENT
-- =====================================================================

-- Sessions
CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  program_id UUID REFERENCES public.programs(id) ON DELETE CASCADE,
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
  session_number INTEGER,
  title TEXT NOT NULL,
  type session_type NOT NULL DEFAULT 'regular',
  custom_type_label TEXT,
  session_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  location_name TEXT,
  location_address TEXT,
  room TEXT,
  description TEXT,
  status session_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (
    (program_id IS NOT NULL AND group_id IS NULL) OR
    (program_id IS NULL AND group_id IS NOT NULL)
  )
);

CREATE TABLE public.speakers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  title TEXT,
  organization_name TEXT,
  photo_url TEXT,
  bio TEXT,
  links JSONB NOT NULL DEFAULT '[]'::jsonb,
  status speaker_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.session_speakers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  speaker_id UUID NOT NULL REFERENCES public.speakers(id) ON DELETE RESTRICT,
  role speaker_role NOT NULL DEFAULT 'primary',
  display_order INTEGER NOT NULL DEFAULT 0,
  UNIQUE(session_id, speaker_id)
);

-- Workbook
CREATE TABLE public.workbook_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  title TEXT,
  instructions TEXT,
  status workbook_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.workbook_prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL REFERENCES public.workbook_templates(id) ON DELETE CASCADE,
  prompt_order INTEGER NOT NULL DEFAULT 0,
  prompt_type workbook_prompt_type NOT NULL,
  label TEXT NOT NULL,
  placeholder TEXT,
  helper_text TEXT,
  required BOOLEAN NOT NULL DEFAULT FALSE,
  options JSONB,
  min_value INTEGER,
  max_value INTEGER,
  repeat_count INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.workbook_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prompt_id UUID NOT NULL REFERENCES public.workbook_prompts(id) ON DELETE CASCADE,
  membership_id UUID NOT NULL REFERENCES public.memberships(id) ON DELETE CASCADE,
  value TEXT,
  values JSONB,
  number_value INTEGER,
  date_value DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(prompt_id, membership_id)
);

-- Resources
CREATE TABLE public.resource_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, slug)
);

CREATE TABLE public.resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.resource_categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  resource_type resource_type NOT NULL,
  url TEXT,
  file_path TEXT,
  visibility_scope resource_visibility_scope NOT NULL DEFAULT 'organization',
  program_id UUID REFERENCES public.programs(id) ON DELETE CASCADE,
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
  status resource_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE public.session_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  speaker_id UUID REFERENCES public.speakers(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  document_type document_type NOT NULL,
  url TEXT,
  file_path TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  status resource_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Discussion
CREATE TABLE public.discussion_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  author_membership_id UUID NOT NULL REFERENCES public.memberships(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT NOT NULL,
  pinned BOOLEAN NOT NULL DEFAULT FALSE,
  status discussion_status NOT NULL DEFAULT 'published',
  pinned_at TIMESTAMPTZ,
  pinned_by UUID REFERENCES public.memberships(id) ON DELETE SET NULL,
  hidden_reason TEXT,
  edited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE public.discussion_replies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES public.discussion_posts(id) ON DELETE CASCADE,
  author_membership_id UUID NOT NULL REFERENCES public.memberships(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  status discussion_status NOT NULL DEFAULT 'published',
  hidden_reason TEXT,
  edited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE public.group_directory_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  membership_id UUID NOT NULL REFERENCES public.memberships(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  business_name TEXT,
  industry TEXT,
  role_or_title TEXT,
  short_bio TEXT,
  contact_info JSONB NOT NULL DEFAULT '{}'::jsonb,
  visibility directory_visibility NOT NULL DEFAULT 'group_members',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(group_id, membership_id)
);

CREATE TABLE public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  membership_id UUID NOT NULL UNIQUE REFERENCES public.memberships(id) ON DELETE CASCADE,
  notify_on_new_post BOOLEAN NOT NULL DEFAULT FALSE,
  notify_on_new_reply BOOLEAN NOT NULL DEFAULT FALSE,
  notify_on_directory_join BOOLEAN NOT NULL DEFAULT FALSE,
  notify_scope notify_scope NOT NULL DEFAULT 'all_groups',
  scoped_group_ids JSONB,
  digest_frequency digest_frequency NOT NULL DEFAULT 'off',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Surveys
CREATE TABLE public.surveys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE,
  program_id UUID REFERENCES public.programs(id) ON DELETE CASCADE,
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
  survey_type survey_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  external_url TEXT NOT NULL,
  provider survey_provider NOT NULL,
  webhook_url TEXT,
  webhook_secret TEXT,
  completion_mode survey_completion_mode NOT NULL DEFAULT 'honor_system',
  estimated_minutes INTEGER,
  required BOOLEAN NOT NULL DEFAULT FALSE,
  status survey_status NOT NULL DEFAULT 'draft',
  available_from TIMESTAMPTZ,
  available_until TIMESTAMPTZ,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (session_id IS NOT NULL OR program_id IS NOT NULL OR group_id IS NOT NULL)
);

CREATE TABLE public.survey_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  survey_id UUID NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
  membership_id UUID NOT NULL REFERENCES public.memberships(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verification_method verification_method NOT NULL DEFAULT 'honor',
  webhook_response_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(survey_id, membership_id)
);

-- Sponsors and About
CREATE TABLE public.sponsor_tiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  slug TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  icon TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, slug)
);

CREATE TABLE public.sponsors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  tier_id UUID NOT NULL REFERENCES public.sponsor_tiers(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  website_url TEXT,
  status sponsor_status NOT NULL DEFAULT 'active',
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.sponsor_section_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  section_label TEXT NOT NULL DEFAULT 'Sponsors and Partners',
  intro_text TEXT,
  cta_text TEXT,
  cta_url TEXT,
  show_open_opportunities BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.about_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  tab_label TEXT NOT NULL,
  slug TEXT NOT NULL,
  heading TEXT NOT NULL,
  subheading TEXT,
  intro_card_title TEXT,
  intro_card_body TEXT,
  stats JSONB NOT NULL DEFAULT '[]'::jsonb,
  display_order INTEGER NOT NULL DEFAULT 0,
  status about_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, slug)
);

CREATE TABLE public.about_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  about_section_id UUID NOT NULL REFERENCES public.about_sections(id) ON DELETE CASCADE,
  block_type about_block_type NOT NULL,
  heading TEXT,
  content TEXT,
  items JSONB,
  columns JSONB,
  image_url TEXT,
  image_caption TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================================
-- LAYER 4: SPECIALIZED CONCERNS
-- =====================================================================

-- Branding
CREATE TABLE public.org_branding (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE,
  logo_primary_url TEXT,
  logo_secondary_url TEXT,
  favicon_url TEXT,
  eyebrow_text TEXT,
  eyebrow_secondary TEXT,
  theme_preset theme_preset NOT NULL DEFAULT 'digiihub_default',
  custom_palette JSONB,
  custom_fonts JSONB,
  pwa_app_name TEXT,
  pwa_short_name TEXT,
  pwa_theme_color TEXT,
  pwa_background_color TEXT,
  show_powered_by BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Capture and Share
CREATE TABLE public.captures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  captured_by_membership_id UUID NOT NULL REFERENCES public.memberships(id) ON DELETE CASCADE,
  capture_type capture_type NOT NULL,
  group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL,
  session_id UUID REFERENCES public.sessions(id) ON DELETE SET NULL,
  title TEXT,
  caption TEXT,
  participant_caption TEXT,
  file_path TEXT,
  file_url TEXT,
  thumbnail_url TEXT,
  transcript TEXT,
  quote_text TEXT,
  quote_attribution TEXT,
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  status capture_status NOT NULL DEFAULT 'processing',
  visibility capture_visibility NOT NULL DEFAULT 'admin_only',
  allow_downloads BOOLEAN NOT NULL DEFAULT TRUE,
  allow_comments BOOLEAN NOT NULL DEFAULT TRUE,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_at TIMESTAMPTZ
);

CREATE TABLE public.capture_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  capture_id UUID NOT NULL REFERENCES public.captures(id) ON DELETE CASCADE,
  membership_id UUID NOT NULL REFERENCES public.memberships(id) ON DELETE CASCADE,
  reaction_type reaction_type NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(capture_id, membership_id, reaction_type)
);

CREATE TABLE public.capture_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  capture_id UUID NOT NULL REFERENCES public.captures(id) ON DELETE CASCADE,
  membership_id UUID NOT NULL REFERENCES public.memberships(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  status discussion_status NOT NULL DEFAULT 'published',
  hidden_reason TEXT,
  parent_comment_id UUID REFERENCES public.capture_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE public.capture_downloads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  capture_id UUID NOT NULL REFERENCES public.captures(id) ON DELETE CASCADE,
  membership_id UUID NOT NULL REFERENCES public.memberships(id) ON DELETE CASCADE,
  downloaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.generated_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  generated_by_membership_id UUID NOT NULL REFERENCES public.memberships(id) ON DELETE CASCADE,
  source_type content_source_type NOT NULL,
  source_capture_id UUID REFERENCES public.captures(id) ON DELETE SET NULL,
  source_session_id UUID REFERENCES public.sessions(id) ON DELETE SET NULL,
  source_resource_id UUID REFERENCES public.resources(id) ON DELETE SET NULL,
  source_prompt TEXT,
  content_type generated_content_type NOT NULL,
  platform content_platform NOT NULL,
  content TEXT NOT NULL,
  content_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  status generated_status NOT NULL DEFAULT 'draft',
  ai_model_used TEXT NOT NULL,
  tokens_used INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

CREATE TABLE public.content_destinations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  generated_content_id UUID NOT NULL REFERENCES public.generated_content(id) ON DELETE CASCADE,
  destination_type destination_type NOT NULL,
  platform content_platform NOT NULL,
  external_post_url TEXT,
  external_post_id TEXT,
  scheduled_for TIMESTAMPTZ,
  posted_at TIMESTAMPTZ,
  status destination_status NOT NULL DEFAULT 'pending',
  failure_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.brand_voice_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE,
  tone_descriptors JSONB NOT NULL DEFAULT '[]'::jsonb,
  voice_notes TEXT,
  words_to_avoid JSONB NOT NULL DEFAULT '[]'::jsonb,
  words_to_use JSONB NOT NULL DEFAULT '[]'::jsonb,
  sample_content TEXT,
  auto_use_in_generation BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Consent
CREATE TABLE public.consent_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  document_type consent_document_type NOT NULL,
  version TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  content_summary TEXT,
  effective_date DATE NOT NULL,
  status consent_doc_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.consent_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  membership_id UUID REFERENCES public.memberships(id) ON DELETE CASCADE,
  consent_document_id UUID NOT NULL REFERENCES public.consent_documents(id) ON DELETE RESTRICT,
  consent_status consent_status NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  consented_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  withdrawn_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, consent_document_id)
);

CREATE TABLE public.consent_required_for_org (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  consent_document_id UUID NOT NULL REFERENCES public.consent_documents(id) ON DELETE CASCADE,
  required_for_role consent_required_role NOT NULL,
  enforcement consent_enforcement NOT NULL DEFAULT 'strict',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, consent_document_id, required_for_role)
);

-- Billing
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT NOT NULL,
  tier org_tier NOT NULL,
  status subscription_status NOT NULL,
  billing_interval billing_interval NOT NULL,
  price_amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  trial_started_at TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.subscription_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  stripe_event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  stripe_invoice_id TEXT NOT NULL UNIQUE,
  amount_paid INTEGER NOT NULL,
  amount_due INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  status invoice_status NOT NULL,
  invoice_pdf_url TEXT,
  billing_period_start DATE NOT NULL,
  billing_period_end DATE NOT NULL,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.usage_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  active_admins INTEGER NOT NULL DEFAULT 0,
  active_collaborators INTEGER NOT NULL DEFAULT 0,
  active_participants INTEGER NOT NULL DEFAULT 0,
  active_groups INTEGER NOT NULL DEFAULT 0,
  storage_used_bytes BIGINT NOT NULL DEFAULT 0,
  ai_tokens_used INTEGER NOT NULL DEFAULT 0,
  transcription_minutes_used INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, period_start, period_end)
);

-- Audit
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  actor_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  actor_membership_id UUID REFERENCES public.memberships(id) ON DELETE SET NULL,
  actor_role actor_role NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  changes JSONB,
  metadata JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notifications queue
CREATE TABLE public.notification_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  recipient_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  notification_type notification_type NOT NULL,
  template_id TEXT NOT NULL,
  template_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  priority notification_priority NOT NULL DEFAULT 'normal',
  scheduled_for TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status notification_status NOT NULL DEFAULT 'queued',
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  last_attempt_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  failure_reason TEXT,
  external_message_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.notification_digests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  membership_id UUID NOT NULL REFERENCES public.memberships(id) ON DELETE CASCADE,
  digest_type digest_frequency NOT NULL,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  digest_data JSONB NOT NULL,
  status digest_status NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_key TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  subject_template TEXT NOT NULL,
  html_template TEXT NOT NULL,
  text_template TEXT NOT NULL,
  status template_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(template_key, version)
);

CREATE TABLE public.email_delivery_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  notification_queue_id UUID NOT NULL REFERENCES public.notification_queue(id) ON DELETE CASCADE,
  event_type delivery_event_type NOT NULL,
  event_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================================
-- INDEXES
-- =====================================================================

-- Memberships (heavy lookup table)
CREATE INDEX idx_memberships_user_status ON public.memberships(user_id, status);
CREATE INDEX idx_memberships_org_role_status ON public.memberships(organization_id, role, status);

-- Organizations (subdomain routing)
CREATE INDEX idx_organizations_slug ON public.organizations(slug);
CREATE INDEX idx_organizations_custom_domain ON public.organizations(custom_domain) WHERE custom_domain IS NOT NULL;

-- Sessions
CREATE INDEX idx_sessions_org_date ON public.sessions(organization_id, session_date);
CREATE INDEX idx_sessions_program ON public.sessions(program_id) WHERE program_id IS NOT NULL;
CREATE INDEX idx_sessions_group ON public.sessions(group_id) WHERE group_id IS NOT NULL;

-- Workbook (heavy participant queries)
CREATE INDEX idx_workbook_entries_membership ON public.workbook_entries(membership_id);
CREATE INDEX idx_workbook_prompts_template ON public.workbook_prompts(template_id, prompt_order);

-- Discussion
CREATE INDEX idx_discussion_posts_group_created ON public.discussion_posts(group_id, created_at DESC);
CREATE INDEX idx_discussion_posts_status ON public.discussion_posts(status, deleted_at);
CREATE INDEX idx_discussion_replies_post ON public.discussion_replies(post_id, created_at);

-- Resources
CREATE INDEX idx_resources_org_status ON public.resources(organization_id, status);
CREATE INDEX idx_resources_visibility ON public.resources(visibility_scope, program_id, group_id);

-- Captures
CREATE INDEX idx_captures_org_visibility ON public.captures(organization_id, visibility);
CREATE INDEX idx_captures_group ON public.captures(group_id) WHERE group_id IS NOT NULL;

-- Group members
CREATE INDEX idx_group_members_membership ON public.group_members(membership_id);
CREATE INDEX idx_group_members_group_status ON public.group_members(group_id, status);

-- Audit logs (heavy timeseries queries)
CREATE INDEX idx_audit_logs_org_created ON public.audit_logs(organization_id, created_at DESC);
CREATE INDEX idx_audit_logs_actor_created ON public.audit_logs(actor_user_id, created_at DESC);

-- Notification queue (worker processing)
CREATE INDEX idx_notification_queue_status_scheduled ON public.notification_queue(status, scheduled_for, priority);

-- Subscription events (deduplication + audit)
CREATE INDEX idx_subscription_events_subscription ON public.subscription_events(subscription_id, created_at DESC);

-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.speakers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_speakers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workbook_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workbook_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workbook_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_directory_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsor_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsor_section_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.about_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.about_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_branding ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.captures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capture_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capture_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capture_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_voice_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_required_for_org ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_digests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_delivery_log ENABLE ROW LEVEL SECURITY;

-- =====================================================================
-- HELPER FUNCTIONS
-- =====================================================================

-- Get all organization IDs the current user belongs to (active memberships)
CREATE OR REPLACE FUNCTION public.user_organizations()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM memberships
  WHERE user_id = auth.uid() AND status = 'active'
$$;

-- Get all organization IDs where current user is admin
CREATE OR REPLACE FUNCTION public.user_admin_organizations()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM memberships
  WHERE user_id = auth.uid() AND role = 'admin' AND status = 'active'
$$;

-- Check if current user is admin of given org
CREATE OR REPLACE FUNCTION public.is_org_admin(org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM memberships
    WHERE user_id = auth.uid() 
      AND organization_id = org_id 
      AND role = 'admin' 
      AND status = 'active'
  )
$$;

-- Get current user's membership IDs
CREATE OR REPLACE FUNCTION public.user_memberships()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM memberships WHERE user_id = auth.uid()
$$;

-- Get group IDs where current user is enrolled
CREATE OR REPLACE FUNCTION public.user_enrolled_groups()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT gm.group_id FROM group_members gm
  JOIN memberships m ON m.id = gm.membership_id
  WHERE m.user_id = auth.uid() AND gm.status = 'enrolled'
$$;

-- =====================================================================
-- RLS POLICIES (representative examples; full policies in migration 002)
-- =====================================================================

-- Users: read self, update self
CREATE POLICY "Users read own profile" ON public.users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users update own profile" ON public.users
  FOR UPDATE USING (id = auth.uid());

-- Organizations: members can read their orgs
CREATE POLICY "Members read their organizations" ON public.organizations
  FOR SELECT USING (id IN (SELECT public.user_organizations()));

-- Organizations: only admins can update
CREATE POLICY "Admins update their organizations" ON public.organizations
  FOR UPDATE USING (id IN (SELECT public.user_admin_organizations()));

-- Memberships: users see their own memberships
CREATE POLICY "Users see own memberships" ON public.memberships
  FOR SELECT USING (user_id = auth.uid());

-- Memberships: admins see all org memberships
CREATE POLICY "Admins see org memberships" ON public.memberships
  FOR SELECT USING (organization_id IN (SELECT public.user_admin_organizations()));

-- Memberships: admins manage memberships
CREATE POLICY "Admins manage memberships" ON public.memberships
  FOR ALL USING (organization_id IN (SELECT public.user_admin_organizations()));

-- Programs: org members read
CREATE POLICY "Members read org programs" ON public.programs
  FOR SELECT USING (organization_id IN (SELECT public.user_organizations()));

-- Programs: admins write
CREATE POLICY "Admins manage org programs" ON public.programs
  FOR ALL USING (organization_id IN (SELECT public.user_admin_organizations()));

-- Sessions: org members read published
CREATE POLICY "Members read org sessions" ON public.sessions
  FOR SELECT USING (
    organization_id IN (SELECT public.user_organizations())
    AND status = 'published'
  );

CREATE POLICY "Admins manage org sessions" ON public.sessions
  FOR ALL USING (organization_id IN (SELECT public.user_admin_organizations()));

-- Workbook entries: self-only
CREATE POLICY "Users access own workbook entries" ON public.workbook_entries
  FOR ALL USING (membership_id IN (SELECT public.user_memberships()));

-- Discussion posts: group members read published
CREATE POLICY "Group members read discussion" ON public.discussion_posts
  FOR SELECT USING (
    group_id IN (SELECT public.user_enrolled_groups())
    AND status = 'published'
  );

-- Discussion posts: authors create their own
CREATE POLICY "Members create discussion posts" ON public.discussion_posts
  FOR INSERT WITH CHECK (
    group_id IN (SELECT public.user_enrolled_groups())
    AND author_membership_id IN (SELECT public.user_memberships())
  );

-- Discussion posts: authors edit their own
CREATE POLICY "Authors edit own posts" ON public.discussion_posts
  FOR UPDATE USING (author_membership_id IN (SELECT public.user_memberships()));

-- Audit logs: service role only for writes
CREATE POLICY "Service role manages audit logs" ON public.audit_logs
  FOR ALL USING (auth.role() = 'service_role');

-- Audit logs: admins read their org's logs
CREATE POLICY "Admins read org audit logs" ON public.audit_logs
  FOR SELECT USING (organization_id IN (SELECT public.user_admin_organizations()));

-- Notification queue: service role only
CREATE POLICY "Service role only for notification queue" ON public.notification_queue
  FOR ALL USING (auth.role() = 'service_role');

-- Subscription events: service role only
CREATE POLICY "Service role only for subscription events" ON public.subscription_events
  FOR ALL USING (auth.role() = 'service_role');

-- =====================================================================
-- TRIGGERS
-- =====================================================================

-- Auto-update updated_at on row changes
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Apply to tables with updated_at columns
CREATE TRIGGER set_updated_at_users BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_updated_at_organizations BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_updated_at_memberships BEFORE UPDATE ON public.memberships FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_updated_at_programs BEFORE UPDATE ON public.programs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_updated_at_groups BEFORE UPDATE ON public.groups FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_updated_at_sessions BEFORE UPDATE ON public.sessions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_updated_at_speakers BEFORE UPDATE ON public.speakers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_updated_at_workbook_templates BEFORE UPDATE ON public.workbook_templates FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_updated_at_workbook_prompts BEFORE UPDATE ON public.workbook_prompts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_updated_at_workbook_entries BEFORE UPDATE ON public.workbook_entries FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_updated_at_resources BEFORE UPDATE ON public.resources FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_updated_at_session_documents BEFORE UPDATE ON public.session_documents FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_updated_at_discussion_posts BEFORE UPDATE ON public.discussion_posts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_updated_at_discussion_replies BEFORE UPDATE ON public.discussion_replies FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_updated_at_org_branding BEFORE UPDATE ON public.org_branding FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_updated_at_captures BEFORE UPDATE ON public.captures FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_updated_at_subscriptions BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =====================================================================
-- COMPLETION
-- =====================================================================

COMMIT;

-- =====================================================================
-- POST-MIGRATION NOTES
-- =====================================================================
-- 
-- Additional work for production deployment:
--
-- 1. Complete RLS policies for all tables (this file has representative
--    examples; production needs full coverage with INSERT/UPDATE/DELETE
--    policies for each role).
--
-- 2. Add audit log triggers on all writeable tables to auto-record
--    changes for compliance.
--
-- 3. Create scheduled jobs:
--    - Soft delete cleanup (runs daily, removes rows where deleted_at
--      is older than 30 days)
--    - Usage metrics calculation (runs nightly)
--    - Notification digest generation (runs hourly per timezone)
--    - Notification queue processor (runs continuously)
--
-- 4. Set up Supabase Storage buckets:
--    - logos (public read, admin write)
--    - resources (auth read by org members, admin write)
--    - captures (auth read by visibility rules, admin write)
--    - documents (auth read by session access, admin write)
--    - exports (auth read by owner only, admin write)
--
-- 5. Configure Supabase Auth:
--    - Email/password
--    - Magic links
--    - Email templates branded for DigiiHub
--
-- 6. Configure Stripe webhook endpoint and secret
--
-- 7. Set up automated RLS testing suite before any production traffic
-- =====================================================================
