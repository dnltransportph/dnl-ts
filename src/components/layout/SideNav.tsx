import { useLocation, useNavigate } from 'react-router-dom'
import { ActionIcon, Anchor, Box, NavLink, Stack, Text, Tooltip } from '@mantine/core'
import { navItems, resolveActiveTab } from '@/components/layout/navConfig'
import { ChevronLeftIcon, ChevronRightIcon, LogoutIcon } from '@/components/layout/navIcons'
import { useAuth } from '@/hooks/useAuth'

type SideNavProps = {
  collapsed: boolean
  onToggleCollapsed: () => void
}

type SideNavContentProps = {
  collapsed: boolean
  onToggleCollapsed?: () => void
  onNavigate?: () => void
}

export const SIDEBAR_WIDTH_EXPANDED = 248
export const SIDEBAR_WIDTH_COLLAPSED = 68

export function getSidebarWidth(collapsed: boolean) {
  return collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED
}

export function SideNavContent({ collapsed, onToggleCollapsed, onNavigate }: SideNavContentProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const activeTab = resolveActiveTab(location.pathname)
  const showCollapseToggle = Boolean(onToggleCollapsed)

  const handleNavigate = (to: string) => {
    navigate(to)
    onNavigate?.()
  }

  return (
    <>
      <Box
        py="sm"
        px={collapsed ? 'xs' : 'md'}
        style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}
      >
        <Box
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'space-between',
            gap: 'var(--mantine-spacing-xs)',
          }}
        >
          {!collapsed && (
            <Text size="xs" fw={600} c="dimmed" tt="uppercase" style={{ letterSpacing: '0.04em' }}>
              Navigation
            </Text>
          )}
          {showCollapseToggle && (
            <Tooltip
              label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              position="right"
              withArrow
            >
              <ActionIcon
                variant="subtle"
                color="gray"
                onClick={onToggleCollapsed}
                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
              </ActionIcon>
            </Tooltip>
          )}
        </Box>
      </Box>

      <Stack gap={4} p="xs" style={{ flex: 1, overflowY: 'auto' }}>
        {navItems.map((item) => {
          const link = (
            <NavLink
              label={collapsed ? undefined : item.label}
              leftSection={<item.Icon size={20} />}
              active={activeTab === item.to}
              variant="light"
              color="brand"
              onClick={() => handleNavigate(item.to)}
              noWrap
              styles={{
                root: {
                  borderRadius: 'var(--mantine-radius-sm)',
                  minHeight: onNavigate ? 44 : undefined,
                  ...(collapsed
                    ? {
                        justifyContent: 'center',
                        paddingInline: 'var(--mantine-spacing-xs)',
                      }
                    : {}),
                },
                section: collapsed ? { marginInlineEnd: 0 } : undefined,
              }}
            />
          )

          if (collapsed) {
            return (
              <Tooltip key={item.to} label={item.label} position="right" withArrow>
                {link}
              </Tooltip>
            )
          }

          return <Box key={item.to}>{link}</Box>
        })}
      </Stack>

      <Box
        py="sm"
        px={collapsed ? 'xs' : 'md'}
        style={{
          borderTop: '1px solid var(--mantine-color-default-border)',
          marginTop: 'auto',
          textAlign: 'left',
        }}
      >
        {collapsed ? (
          <Stack gap="xs" align="flex-start">
            <Tooltip label={user?.email ?? 'Signed in'} position="right" withArrow>
              <Text size="xs" c="dimmed" lineClamp={1} style={{ maxWidth: 44 }}>
                {user?.email?.charAt(0).toUpperCase() ?? '?'}
              </Text>
            </Tooltip>
            <Tooltip label="Sign out" position="right" withArrow>
              <ActionIcon
                variant="subtle"
                color="gray"
                onClick={() => signOut()}
                aria-label="Sign out"
                size="lg"
              >
                <LogoutIcon />
              </ActionIcon>
            </Tooltip>
          </Stack>
        ) : (
          <Stack gap={2} align="flex-start">
            <Text size="xs" c="dimmed" lineClamp={1} title={user?.email ?? undefined}>
              {user?.email}
            </Text>
            <Anchor
              component="button"
              type="button"
              size="xs"
              onClick={() => signOut()}
              style={{ alignSelf: 'flex-start', minHeight: 44, display: 'inline-flex', alignItems: 'center' }}
            >
              Sign out
            </Anchor>
          </Stack>
        )}
      </Box>
    </>
  )
}

export function SideNav({ collapsed, onToggleCollapsed }: SideNavProps) {
  return (
    <Box
      component="nav"
      aria-label="Main navigation"
      visibleFrom="lg"
      w={collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 200,
        flexShrink: 0,
        borderRight: '1px solid var(--mantine-color-default-border)',
        background: 'var(--mantine-color-body)',
        transition: 'width 200ms ease',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
      }}
    >
      <SideNavContent collapsed={collapsed} onToggleCollapsed={onToggleCollapsed} />
    </Box>
  )
}
