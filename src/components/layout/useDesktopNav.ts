import { useMediaQuery } from '@mantine/hooks'

/** Mantine `lg` — fixed sidebar from 1200px; phones and tablets use drawer nav. */
export const DESKTOP_NAV_MEDIA = '(min-width: 75em)'

export function useDesktopNav() {
  return useMediaQuery(DESKTOP_NAV_MEDIA) ?? false
}
