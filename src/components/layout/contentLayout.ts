/** Full-width page shell — matches transaction pages (no centered max-width column). */
export const appContentShellProps = {
  w: '100%',
  px: { base: 'sm', xs: 'md', sm: 'lg', md: 40, lg: 48, xl: 56 },
} as const

/** Subtle inset panel background (new-period bar, import summary, etc.). */
export const subduedSurfaceStyle = {
  backgroundColor: 'light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-7))',
} as const

/** Divider between stacked sections inside a card/panel. */
export const insetDividerBottom = {
  borderBottom: '1px solid var(--mantine-color-default-border)',
} as const

export const insetDividerTop = {
  borderTop: '1px solid var(--mantine-color-default-border)',
} as const

/** Highlight row for totals (works in light and dark mode). */
export const totalRowStyle = {
  backgroundColor: 'light-dark(var(--mantine-color-brand-0), var(--mantine-color-dark-6))',
  fontWeight: 600,
} as const

/** Two-column panels — single column on phones; side-by-side from tablet width up. */
export const twoColumnGridProps = {
  cols: { base: 1, md: 2 },
  spacing: 'md',
  w: '100%',
} as const

/** Stat cards (entries + total). */
export const statCardsGridProps = {
  cols: { base: 1, sm: 2 },
  spacing: 'md',
} as const

/** Settings master data sections. */
export const settingsGridProps = {
  cols: { base: 1, md: 2 },
  spacing: 'lg',
} as const

/** Import preview sheet counts. */
export const importSheetCountsGridProps = {
  cols: { base: 2, sm: 3, lg: 5 },
  spacing: 'xs',
} as const
