import { localStorageColorSchemeManager, MantineProvider } from '@mantine/core'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { theme } from '@/theme'
import { AuthProvider } from '@/hooks/useAuth'
import { PeriodProvider } from '@/hooks/usePeriod'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AppLayout } from '@/components/layout/AppLayout'
import { LoginPage } from '@/pages/LoginPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { SalesPage } from '@/pages/SalesPage'
import { PurchasesPage } from '@/pages/PurchasesPage'
import { DieselPage } from '@/pages/DieselPage'
import { SalaryPage } from '@/pages/SalaryPage'
import { TollPage } from '@/pages/TollPage'
import { ImportExportPage } from '@/pages/ImportExportPage'
import { AuditLogPage } from '@/pages/AuditLogPage'
import { SettingsPage } from '@/pages/SettingsPage'

const colorSchemeManager = localStorageColorSchemeManager({
  key: 'dnl-color-scheme',
})

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
})

export default function App() {
  return (
    <MantineProvider
      theme={theme}
      defaultColorScheme="light"
      colorSchemeManager={colorSchemeManager}
    >
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route element={<ProtectedRoute />}>
                <Route
                  element={
                    <PeriodProvider>
                      <AppLayout />
                    </PeriodProvider>
                  }
                >
                  <Route index element={<DashboardPage />} />
                  <Route path="sales" element={<SalesPage />} />
                  <Route path="purchases" element={<PurchasesPage />} />
                  <Route path="diesel" element={<DieselPage />} />
                  <Route path="salary" element={<SalaryPage />} />
                  <Route path="toll" element={<TollPage />} />
                  <Route path="import-export" element={<ImportExportPage />} />
                  <Route path="reports" element={<Navigate to="/" replace />} />
                  <Route path="audit" element={<AuditLogPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                </Route>
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </MantineProvider>
  )
}
