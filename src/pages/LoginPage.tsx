import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { Alert, Center, Code, Paper, Stack, Text, Title } from '@mantine/core'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { isSupabaseConfigured } from '@/lib/supabase'

export function LoginPage() {
  const { session, signIn, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (loading) {
    return (
      <Center mih="100vh">
        <Text c="dimmed">Loading…</Text>
      </Center>
    )
  }

  if (session) {
    return <Navigate to="/" replace />
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const { error: signInError } = await signIn(email, password)
    setSubmitting(false)
    if (signInError) setError(signInError)
  }

  return (
    <Center mih="100vh" px="md">
      <Paper withBorder shadow="sm" p="xl" w="100%" maw={420}>
        <Title order={2}>
          DNL
        </Title>
        <Text size="sm" c="dimmed" mt={4}>
          Sign in to manage monthly P&L
        </Text>

        {!isSupabaseConfigured && (
          <Alert color="yellow" mt="md">
            Supabase is not configured. Copy <Code>.env.example</Code> to <Code>.env</Code> and add
            your project URL and anon key.
          </Alert>
        )}

        <Stack component="form" onSubmit={handleSubmit} gap="md" mt="lg">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          {error && (
            <Text size="sm" c="red">
              {error}
            </Text>
          )}
          <Button type="submit" fullWidth disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </Stack>
      </Paper>
    </Center>
  )
}
