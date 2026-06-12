import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Period } from '@/types/database'

const STORAGE_KEY = 'dnl-selected-period-id'

interface PeriodContextValue {
  periods: Period[]
  selectedPeriod: Period | null
  loading: boolean
  isPeriodClosed: boolean
  selectPeriod: (id: string) => void
  createPeriod: (year: number, month: number) => Promise<{ error: string | null }>
  closePeriod: (id: string) => Promise<{ error: string | null }>
  reopenPeriod: (id: string) => Promise<{ error: string | null }>
  refreshPeriods: () => Promise<void>
}

const PeriodContext = createContext<PeriodContextValue | null>(null)

async function fetchPeriods(): Promise<Period[]> {
  const { data, error } = await supabase
    .from('periods')
    .select('*')
    .order('year', { ascending: false })
    .order('month', { ascending: false })

  if (error) throw error
  return data ?? []
}

export function PeriodProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [selectedId, setSelectedId] = useState<string | null>(
    () => localStorage.getItem(STORAGE_KEY),
  )

  const { data: periods = [], isLoading } = useQuery({
    queryKey: ['periods'],
    queryFn: fetchPeriods,
  })

  const selectedPeriod = useMemo(
    () => periods.find((p) => p.id === selectedId) ?? periods[0] ?? null,
    [periods, selectedId],
  )

  useEffect(() => {
    if (selectedPeriod) {
      localStorage.setItem(STORAGE_KEY, selectedPeriod.id)
      setSelectedId(selectedPeriod.id)
    }
  }, [selectedPeriod])

  const selectPeriod = useCallback((id: string) => {
    setSelectedId(id)
    localStorage.setItem(STORAGE_KEY, id)
  }, [])

  const refreshPeriods = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['periods'] })
  }, [queryClient])

  const createPeriod = useCallback(
    async (year: number, month: number) => {
      const { data, error } = await supabase
        .from('periods')
        .insert({ year, month })
        .select()
        .single()

      if (error) {
        if (error.code === '23505') {
          return { error: 'This month already exists.' }
        }
        return { error: error.message }
      }

      await refreshPeriods()
      if (data) selectPeriod(data.id)
      return { error: null }
    },
    [refreshPeriods, selectPeriod],
  )

  const closePeriod = useCallback(
    async (id: string) => {
      const { error } = await supabase
        .from('periods')
        .update({ status: 'closed', closed_at: new Date().toISOString() })
        .eq('id', id)

      if (error) return { error: error.message }
      await refreshPeriods()
      return { error: null }
    },
    [refreshPeriods],
  )

  const reopenPeriod = useCallback(
    async (id: string) => {
      const { error } = await supabase
        .from('periods')
        .update({ status: 'open', closed_at: null, closed_by: null })
        .eq('id', id)

      if (error) return { error: error.message }
      await refreshPeriods()
      return { error: null }
    },
    [refreshPeriods],
  )

  const isPeriodClosed = selectedPeriod?.status === 'closed'

  return (
    <PeriodContext.Provider
      value={{
        periods,
        selectedPeriod,
        loading: isLoading,
        isPeriodClosed,
        selectPeriod,
        createPeriod,
        closePeriod,
        reopenPeriod,
        refreshPeriods,
      }}
    >
      {children}
    </PeriodContext.Provider>
  )
}

export function usePeriod() {
  const ctx = useContext(PeriodContext)
  if (!ctx) throw new Error('usePeriod must be used within PeriodProvider')
  return ctx
}
