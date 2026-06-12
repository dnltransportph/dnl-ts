import type { ComponentType } from 'react'
import type { NavIconProps } from '@/components/layout/navIcons'
import {
  AuditLogIcon,
  DashboardIcon,
  DieselIcon,
  ImportExportIcon,
  PurchasesIcon,
  SalaryIcon,
  SalesIcon,
  SettingsIcon,
  TollIcon,
} from '@/components/layout/navIcons'

export type NavItem = {
  to: string
  label: string
  end?: boolean
  Icon: ComponentType<NavIconProps>
}

export const navItems: NavItem[] = [
  { to: '/', label: 'P&L Dashboard', end: true, Icon: DashboardIcon },
  { to: '/sales', label: 'Sales', Icon: SalesIcon },
  { to: '/purchases', label: 'Purchases & Expenses', Icon: PurchasesIcon },
  { to: '/diesel', label: 'Diesel', Icon: DieselIcon },
  { to: '/salary', label: 'Salary', Icon: SalaryIcon },
  { to: '/toll', label: 'Toll Fee Refund', Icon: TollIcon },
  { to: '/import-export', label: 'Import / Export', Icon: ImportExportIcon },
  { to: '/audit', label: 'Audit Log', Icon: AuditLogIcon },
  { to: '/settings', label: 'Settings', Icon: SettingsIcon },
]

export function resolveActiveTab(pathname: string): string {
  let best: NavItem | null = null
  for (const item of navItems) {
    const matches = item.end
      ? pathname === item.to
      : pathname === item.to || pathname.startsWith(`${item.to}/`)
    if (matches && (!best || item.to.length > best.to.length)) {
      best = item
    }
  }
  return best?.to ?? '/'
}
