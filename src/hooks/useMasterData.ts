import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { CostCenter, Customer, CustomerDeliverySite, Employee, Plate, Supplier } from '@/types/database'

async function fetchPlates(): Promise<Plate[]> {
  const { data, error } = await supabase.from('plates').select('*').order('code')
  if (error) throw error
  return data ?? []
}

async function fetchCostCenters(): Promise<CostCenter[]> {
  const { data, error } = await supabase.from('cost_centers').select('*').order('code')
  if (error) throw error
  return data ?? []
}

async function fetchCustomers(): Promise<Customer[]> {
  const { data, error } = await supabase.from('customers').select('*').order('name')
  if (error) throw error
  return data ?? []
}

async function fetchSuppliers(): Promise<Supplier[]> {
  const { data, error } = await supabase.from('suppliers').select('*').order('name')
  if (error) throw error
  return data ?? []
}

async function fetchEmployees(): Promise<Employee[]> {
  const { data, error } = await supabase.from('employees').select('*').order('name')
  if (error) throw error
  return data ?? []
}

async function fetchCustomerDeliverySites(): Promise<CustomerDeliverySite[]> {
  const { data, error } = await supabase
    .from('customer_delivery_sites')
    .select('id, customer_id, delivery_site, trips, amount, created_at, customers(name)')
    .order('delivery_site')

  if (error) throw error

  return (data ?? []).map((row) => {
    const customer = row.customers as { name: string } | { name: string }[] | null
    const customerName = Array.isArray(customer) ? customer[0]?.name : customer?.name

    return {
      id: row.id,
      customer_id: row.customer_id,
      customer_name: customerName ?? '',
      delivery_site: row.delivery_site,
      trips: Number(row.trips),
      amount: Number(row.amount),
      created_at: row.created_at,
    }
  })
}

export function useMasterData() {
  const plates = useQuery({ queryKey: ['plates'], queryFn: fetchPlates })
  const costCenters = useQuery({ queryKey: ['cost_centers'], queryFn: fetchCostCenters })
  const customers = useQuery({ queryKey: ['customers'], queryFn: fetchCustomers })
  const suppliers = useQuery({ queryKey: ['suppliers'], queryFn: fetchSuppliers })
  const employees = useQuery({ queryKey: ['employees'], queryFn: fetchEmployees })
  const customerDeliverySites = useQuery({
    queryKey: ['customer_delivery_sites'],
    queryFn: fetchCustomerDeliverySites,
  })

  const toOptions = (values: string[]) => [
    { value: '', label: '—' },
    ...values.map((v) => ({ value: v, label: v })),
  ]

  return {
    plates,
    costCenters,
    customers,
    suppliers,
    employees,
    customerDeliverySites,
    plateOptions: toOptions((plates.data ?? []).map((p) => p.code)),
    costCenterOptions: toOptions((costCenters.data ?? []).map((c) => c.code)),
    customerOptions: toOptions((customers.data ?? []).map((c) => c.name)),
    supplierOptions: toOptions((suppliers.data ?? []).map((s) => s.name)),
    employeeOptions: toOptions((employees.data ?? []).map((e) => e.name)),
  }
}

export const MASTER_DATA_QUERY_KEYS = [
  'plates',
  'cost_centers',
  'customers',
  'suppliers',
  'employees',
  'customer_delivery_sites',
] as const
