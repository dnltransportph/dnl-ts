import { Outlet } from 'react-router-dom'
import {
  Alert,
  Box,
  Burger,
  Drawer,
  Group,
  NumberInput,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { usePeriod } from '@/hooks/usePeriod'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import {
  appContentShellProps,
  insetDividerTop,
  subduedSurfaceStyle,
} from '@/components/layout/contentLayout'
import { SideNav, SideNavContent, getSidebarWidth } from '@/components/layout/SideNav'
import { useDesktopNav } from '@/components/layout/useDesktopNav'
import { ColorSchemeToggle } from '@/components/ColorSchemeToggle'
import { formatPeriodLabel } from '@/lib/format'
import type { Period } from '@/types/database'
import { useState, type CSSProperties } from 'react'

const periodSelectOptions = (periods: Period[]) => [
  ...(periods.length === 0 ? [{ value: '', label: 'No periods yet' }] : []),
  ...periods.map((p) => ({
    value: p.id,
    label: `${formatPeriodLabel(p.year, p.month)}${p.status === 'closed' ? ' (closed)' : ''}`,
  })),
]

function PeriodSelect({
  periods,
  selectedPeriod,
  onSelectPeriod,
  style,
}: {
  periods: Period[]
  selectedPeriod: Period | null
  onSelectPeriod: (id: string) => void
  style?: CSSProperties
}) {
  return (
    <Box miw={140} style={style}>
      <Select
        value={selectedPeriod?.id ?? ''}
        onChange={(e) => onSelectPeriod(e.target.value)}
        options={periodSelectOptions(periods)}
      />
    </Box>
  )
}

function PeriodActionButtons({
  selectedPeriod,
  isPeriodClosed,
  periodActionLoading,
  onClosePeriod,
  onReopenPeriod,
  onToggleNewPeriod,
  grow,
}: {
  selectedPeriod: Period | null
  isPeriodClosed: boolean
  periodActionLoading: boolean
  onClosePeriod: () => void
  onReopenPeriod: () => void
  onToggleNewPeriod: () => void
  grow?: boolean
}) {
  return (
    <Group gap="sm" grow={grow} wrap="nowrap" w={grow ? '100%' : undefined}>
      {selectedPeriod &&
        (isPeriodClosed ? (
          <Button size="sm" onClick={onReopenPeriod} disabled={periodActionLoading}>
            Reopen
          </Button>
        ) : (
          <Button size="sm" onClick={onClosePeriod} disabled={periodActionLoading}>
            Close period
          </Button>
        ))}
      <Button size="sm" onClick={onToggleNewPeriod}>
        New month
      </Button>
    </Group>
  )
}

function PeriodToolbar({
  periods,
  selectedPeriod,
  isPeriodClosed,
  periodActionLoading,
  onSelectPeriod,
  onClosePeriod,
  onReopenPeriod,
  onToggleNewPeriod,
}: {
  periods: Period[]
  selectedPeriod: Period | null
  isPeriodClosed: boolean
  periodActionLoading: boolean
  onSelectPeriod: (id: string) => void
  onClosePeriod: () => void
  onReopenPeriod: () => void
  onToggleNewPeriod: () => void
}) {
  const actions = (
    <PeriodActionButtons
      selectedPeriod={selectedPeriod}
      isPeriodClosed={isPeriodClosed}
      periodActionLoading={periodActionLoading}
      onClosePeriod={onClosePeriod}
      onReopenPeriod={onReopenPeriod}
      onToggleNewPeriod={onToggleNewPeriod}
    />
  )

  return (
    <>
      <Stack gap="sm" w="100%" hiddenFrom="sm">
        <Group gap="xs" align="center" wrap="nowrap" w="100%">
          <Text size="sm" fw={500} style={{ whiteSpace: 'nowrap' }}>
            Period
          </Text>
          <PeriodSelect
            periods={periods}
            selectedPeriod={selectedPeriod}
            onSelectPeriod={onSelectPeriod}
            style={{ flex: 1, minWidth: 0 }}
          />
        </Group>
        <PeriodActionButtons
          selectedPeriod={selectedPeriod}
          isPeriodClosed={isPeriodClosed}
          periodActionLoading={periodActionLoading}
          onClosePeriod={onClosePeriod}
          onReopenPeriod={onReopenPeriod}
          onToggleNewPeriod={onToggleNewPeriod}
          grow
        />
      </Stack>

      <Group align="center" wrap="nowrap" gap="sm" justify="flex-start" w="100%" visibleFrom="sm">
        <Text size="sm" fw={500} style={{ whiteSpace: 'nowrap' }}>
          Period
        </Text>
        <PeriodSelect
          periods={periods}
          selectedPeriod={selectedPeriod}
          onSelectPeriod={onSelectPeriod}
          style={{ flex: '1 1 10rem', maxWidth: '16rem' }}
        />
        {actions}
      </Group>
    </>
  )
}

export function AppLayout() {
  const {
    periods,
    selectedPeriod,
    selectPeriod,
    createPeriod,
    closePeriod,
    reopenPeriod,
    isPeriodClosed,
  } = usePeriod()
  const isDesktopNav = useDesktopNav()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileNavOpened, { toggle: toggleMobileNav, close: closeMobileNav }] = useDisclosure(false)
  const [showNewPeriod, setShowNewPeriod] = useState(false)
  const [newYear, setNewYear] = useState(String(new Date().getFullYear()))
  const [newMonth, setNewMonth] = useState(String(new Date().getMonth() + 1))
  const [periodError, setPeriodError] = useState<string | null>(null)
  const [periodActionLoading, setPeriodActionLoading] = useState(false)

  const handleCreatePeriod = async () => {
    setPeriodError(null)
    const { error } = await createPeriod(Number(newYear), Number(newMonth))
    if (error) {
      setPeriodError(error)
      return
    }
    setShowNewPeriod(false)
  }

  const handleClosePeriod = async () => {
    if (!selectedPeriod) return
    if (
      !confirm(
        `Close ${formatPeriodLabel(selectedPeriod.year, selectedPeriod.month)}? No one will be able to edit entries until it is reopened.`,
      )
    ) {
      return
    }

    setPeriodActionLoading(true)
    setPeriodError(null)
    const { error } = await closePeriod(selectedPeriod.id)
    setPeriodActionLoading(false)
    if (error) setPeriodError(error)
  }

  const handleReopenPeriod = async () => {
    if (!selectedPeriod) return
    if (
      !confirm(
        `Reopen ${formatPeriodLabel(selectedPeriod.year, selectedPeriod.month)}? Edits will be allowed again.`,
      )
    ) {
      return
    }

    setPeriodActionLoading(true)
    setPeriodError(null)
    const { error } = await reopenPeriod(selectedPeriod.id)
    setPeriodActionLoading(false)
    if (error) setPeriodError(error)
  }

  const contentOffset = isDesktopNav ? getSidebarWidth(sidebarCollapsed) : 0

  return (
    <Box style={{ minHeight: '100vh' }}>
      <SideNav
        collapsed={sidebarCollapsed}
        onToggleCollapsed={() => setSidebarCollapsed((v) => !v)}
      />

      <Drawer
        opened={mobileNavOpened}
        onClose={closeMobileNav}
        hiddenFrom="lg"
        size={280}
        padding={0}
        withCloseButton
        styles={{
          body: {
            display: 'flex',
            flexDirection: 'column',
            height: 'calc(100% - var(--drawer-header-height, 60px))',
            padding: 0,
          },
        }}
      >
        <Box
          component="nav"
          aria-label="Main navigation"
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
          }}
        >
          <SideNavContent collapsed={false} onNavigate={closeMobileNav} />
        </Box>
      </Drawer>

      <Box
        style={{
          marginLeft: contentOffset,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          overflow: 'hidden',
          transition: isDesktopNav ? 'margin-left 200ms ease' : undefined,
        }}
      >
        <Box
          component="header"
          style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}
          bg="var(--mantine-color-body)"
        >
          <Box {...appContentShellProps} py="sm">
            <Stack gap="sm">
              <Group justify="space-between" align="center" wrap="nowrap" gap="sm">
                <Group gap="sm" align="center" wrap="nowrap" miw={0} style={{ flex: 1 }}>
                  <Burger
                    opened={mobileNavOpened}
                    onClick={toggleMobileNav}
                    hiddenFrom="lg"
                    size="sm"
                    aria-label={mobileNavOpened ? 'Close navigation menu' : 'Open navigation menu'}
                  />
                  <Stack gap={0} miw={0}>
                    <Title order={4}>DNL</Title>
                    <Text size="xs" c="dimmed" visibleFrom="xs">
                      DNL Transport Services
                    </Text>
                  </Stack>
                </Group>
                <ColorSchemeToggle />
              </Group>

              <PeriodToolbar
                periods={periods}
                selectedPeriod={selectedPeriod}
                isPeriodClosed={isPeriodClosed}
                periodActionLoading={periodActionLoading}
                onSelectPeriod={selectPeriod}
                onClosePeriod={handleClosePeriod}
                onReopenPeriod={handleReopenPeriod}
                onToggleNewPeriod={() => setShowNewPeriod((v) => !v)}
              />
            </Stack>
          </Box>

          {showNewPeriod && (
            <Box style={{ ...insetDividerTop, ...subduedSurfaceStyle }} py="sm">
              <Box {...appContentShellProps}>
                <Group align="flex-end" wrap="wrap" gap="sm">
                  <NumberInput
                    label="Year"
                    value={Number(newYear)}
                    onChange={(value) => setNewYear(String(value ?? ''))}
                    w={96}
                    size="sm"
                  />
                  <NumberInput
                    label="Month"
                    value={Number(newMonth)}
                    onChange={(value) => setNewMonth(String(value ?? ''))}
                    min={1}
                    max={12}
                    w={80}
                    size="sm"
                  />
                  <Button size="sm" onClick={handleCreatePeriod}>
                    Create period
                  </Button>
                  {periodError && (
                    <Text size="sm" c="red">
                      {periodError}
                    </Text>
                  )}
                </Group>
              </Box>
            </Box>
          )}

          {periodError && !showNewPeriod && (
            <Alert color="red" variant="light" radius={0}>
              <Box {...appContentShellProps} p={0}>
                {periodError}
              </Box>
            </Alert>
          )}
        </Box>

        <Box component="main" {...appContentShellProps} py={{ base: 'md', sm: 'lg' }} style={{ flex: 1, overflow: 'auto' }}>
          {!selectedPeriod ? (
            <Alert color="yellow" title="Create your first period">
              Click &quot;New month&quot; above to add a reporting month before entering transactions.
            </Alert>
          ) : (
            <Outlet />
          )}
        </Box>
      </Box>
    </Box>
  )
}
