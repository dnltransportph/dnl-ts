import { Navigate, Outlet } from 'react-router-dom'
import { Center, Loader, Stack, Text } from '@mantine/core'
import { useAuth } from '@/hooks/useAuth'

export function ProtectedRoute() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <Center mih="100vh">
        <Stack gap="sm" align="center">
          <Loader size="sm" />
          <Text c="dimmed" size="sm">
            Loading…
          </Text>
        </Stack>
      </Center>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
