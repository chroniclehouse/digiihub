@AGENTS.md

# DigiiHub

Multi-tenant SaaS platform. Organizations build, brand, and deliver digital hubs for cohort-based programs.

## Stack
- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind v4
- **Backend/DB**: Supabase (PostgreSQL + RLS + Auth + Storage)
- **Hosting**: Netlify (`digiihubapp.netlify.app`)
- **Payments**: Stripe
- **AI**: Anthropic API (Claude)
- **Email**: MailerLite

## Architecture

Multi-tenancy via Row Level Security. Each org is a tenant. Subdomain routing: `orgslug.digiihubapp.netlify.app` rewrites to `/hub/[orgSlug]` via middleware.

## Key Files
- `middleware.ts` — subdomain routing + auth protection
- `lib/supabase/client.ts` — browser client
- `lib/supabase/server.ts` — server client + service role client
- `supabase/migrations/` — SQL migration files (run in order)

## Brand
- Navy `#1a2744`, Terracotta `#b85d3c`, Cream `#e8d4a0`, Paper `#faf6ef`
- Display: Playfair Display | UI: Inter | Labels: JetBrains Mono
- No em-dashes. Ever.

## Supabase Project
Project ID: `fhromuggohvvvyuyjwlt`
URL: `https://fhromuggohvvvyuyjwlt.supabase.co`

## Build Phases
- **Phase 0** (current): Foundation — schema, scaffold, auth wiring
- **Phase 1**: Hub sections (sessions, workbook, speakers, resources, etc.)
- **Phase 2**: Admin portal
- **Phase 3**: AI + content workflow
- **Phase 4**: Accessibility + polish
- **Phase 5**: Launch prep

## Roles
`admin` | `collaborator` | `participant` | `viewer`

## Copy Rules
No em-dashes. Direct voice. No corporate filler.
