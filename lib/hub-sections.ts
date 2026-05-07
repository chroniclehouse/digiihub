// Hub section registry. Add entries here as sections are built.
// Both the nav and the landing page read from this list.
export const HUB_SECTIONS = [
  {
    label: 'Speakers',
    slug: 'speakers',
    description: 'Meet the people leading this program.',
  },
  // { label: 'Sessions', slug: 'sessions', description: 'Program schedule and session materials.' },
  // { label: 'Resources', slug: 'resources', description: 'Downloads, links, and reference docs.' },
] as const

export type HubSection = (typeof HUB_SECTIONS)[number]
