'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { apiFetch } from '@/hooks/useApi'
import { toast } from '@/hooks/useToast'
import { formatCurrency, getStatusColor, UNIT_STATUSES, PROPERTY_TYPES } from '@/lib/utils'
import { useForm } from 'react-hook-form'
import { Plus, Search, Edit2, Trash2, MoreVertical, Building2, LayoutGrid, LayoutList, ChevronLeft, ChevronRight } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

const FACINGS = ['North', 'South', 'East', 'West', 'North-East', 'North-West', 'South-East', 'South-West', 'Park Facing', 'Road Facing']
const FURNISHING_OPTIONS = ['Unfurnished', 'Semi-Furnished', 'Fully Furnished']

function UnitForm({ unit, onClose }: { unit?: any; onClose: () => void }) {
  const qc = useQueryClient()
  const { data: projects } = useQuery({ queryKey: ['projects-list'], queryFn: () => apiFetch('/api/projects?limit=100') })
  const { register, handleSubmit, setValue, watch, formState: { isSubmitting } } = useForm({
    defaultValues: unit || { status: 'Available', sizeUnit: 'sqft', furnishing: 'Unfurnished', balcony: false, parking: false },
  })

  const onSubmit = async (data: any) => {
    try {
      const payload = {
        ...data,
        price: parseFloat(data.price) || 0,
        plcCharges: parseFloat(data.plcCharges) || 0,
        parkingCharges: parseFloat(data.parkingCharges) || 0,
        otherCharges: parseFloat(data.otherCharges) || 0,
        size: parseFloat(data.size) || null,
        bedrooms: parseInt(data.bedrooms) || null,
        bathrooms: parseInt(data.bathrooms) || null,
      }
      if (unit) {
        await apiFetch(`/api/inventory/${unit.id}`, { method: 'PUT', body: JSON.stringify(payload) })
        toast({ title: 'Unit updated' })
      } else {
        await apiFetch('/api/inventory', { method: 'POST', body: JSON.stringify(payload) })
        toast({ title: 'Unit added' })
      }
      qc.invalidateQueries({ queryKey: ['inventory'] })
      onClose()
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5 col-span-2">
          <Label>Data Centre *</Label>
          <Select value={watch('projectId') || ''} onValueChange={(v) => setValue('projectId', v)}>
            <SelectTrigger><SelectValue placeholder="Select data centre" /></SelectTrigger>
            <SelectContent>
              {(projects?.data || []).map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Unit Number *</Label>
          <Input placeholder="A-101" {...register('unitNumber', { required: true })} />
        </div>
        <div className="space-y-1.5">
          <Label>Type</Label>
          <Select value={watch('type') || 'Apartment'} onValueChange={(v) => setValue('type', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {PROPERTY_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Size</Label>
          <Input type="number" placeholder="1200" {...register('size')} />
        </div>
        <div className="space-y-1.5">
          <Label>Size Unit</Label>
          <Select value={watch('sizeUnit') || 'sqft'} onValueChange={(v) => setValue('sizeUnit', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {['sqft', 'sqm', 'sqyd'].map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Base Price (₹)</Label>
          <Input type="number" placeholder="5000000" {...register('price')} />
        </div>
        <div className="space-y-1.5">
          <Label>PLC Charges (₹)</Label>
          <Input type="number" placeholder="100000" {...register('plcCharges')} />
        </div>
        <div className="space-y-1.5">
          <Label>Parking Charges (₹)</Label>
          <Input type="number" placeholder="200000" {...register('parkingCharges')} />
        </div>
        <div className="space-y-1.5">
          <Label>Other Charges (₹)</Label>
          <Input type="number" placeholder="0" {...register('otherCharges')} />
        </div>
        <div className="space-y-1.5">
          <Label>Facing</Label>
          <Select value={watch('facing') || ''} onValueChange={(v) => setValue('facing', v)}>
            <SelectTrigger><SelectValue placeholder="Facing direction" /></SelectTrigger>
            <SelectContent>
              {FACINGS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select value={watch('status') || 'Available'} onValueChange={(v) => setValue('status', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {UNIT_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Bedrooms</Label>
          <Input type="number" placeholder="2" {...register('bedrooms')} />
        </div>
        <div className="space-y-1.5">
          <Label>Bathrooms</Label>
          <Input type="number" placeholder="2" {...register('bathrooms')} />
        </div>
        <div className="space-y-1.5">
          <Label>Furnishing</Label>
          <Select value={watch('furnishing') || 'Unfurnished'} onValueChange={(v) => setValue('furnishing', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {FURNISHING_OPTIONS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-4 col-span-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="rounded" {...register('balcony')} />
            <span className="text-sm">Has Balcony</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="rounded" {...register('parking')} />
            <span className="text-sm">Has Parking</span>
          </label>
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Notes</Label>
          <Textarea placeholder="Internal notes about this unit (pricing remarks, hold reason, buyer interest...)" rows={3} {...register('notes')} />
        </div>
      </div>
      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" loading={isSubmitting}>{unit ? 'Update Unit' : 'Add Unit'}</Button>
      </div>
    </form>
  )
}

const STATUS_COLORS: Record<string, string> = {
  Available: 'bg-green-500',
  Reserved: 'bg-yellow-500',
  Booked: 'bg-blue-500',
  Sold: 'bg-purple-500',
  Blocked: 'bg-red-500',
}

export default function InventoryPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [projectFilter, setProjectFilter] = useState('')
  const [view, setView] = useState<'grid' | 'table'>('table')
  const [showForm, setShowForm] = useState(false)
  const [editUnit, setEditUnit] = useState<any>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['inventory', page, search, statusFilter, projectFilter],
    queryFn: () => apiFetch(`/api/inventory?page=${page}&search=${search}&status=${statusFilter}&projectId=${projectFilter}&limit=24`),
  })
  const { data: projects } = useQuery({ queryKey: ['projects-list'], queryFn: () => apiFetch('/api/projects?limit=100') })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/inventory/${id}`, { method: 'DELETE' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['inventory'] }); toast({ title: 'Unit removed' }) },
  })

  const units = data?.data || []
  const total = data?.total || 0
  const totalPages = data?.totalPages || 1

  const statusCounts = UNIT_STATUSES.reduce((acc, s) => {
    acc[s] = units.filter((u: any) => u.status === s).length
    return acc
  }, {} as Record<string, number>)

  return (
    <DashboardLayout title="Inventory">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">Inventory Management</h1>
            <p className="text-sm text-muted-foreground">{total} units</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setView(view === 'table' ? 'grid' : 'table')}>
              {view === 'table' ? <LayoutGrid className="w-4 h-4 mr-1" /> : <LayoutList className="w-4 h-4 mr-1" />}
              {view === 'table' ? 'Grid' : 'Table'}
            </Button>
            <Button size="sm" onClick={() => { setEditUnit(null); setShowForm(true) }}>
              <Plus className="w-4 h-4 mr-1" /> Add Unit
            </Button>
          </div>
        </div>

        {/* Status Summary */}
        <div className="flex flex-wrap gap-2">
          {UNIT_STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(statusFilter === s ? '' : s)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${statusFilter === s ? 'border-primary bg-primary/10 text-primary' : 'hover:bg-muted'}`}
            >
              <div className={`w-2 h-2 rounded-full ${STATUS_COLORS[s]}`} />
              {s}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search units..." className="pl-9" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
          </div>
          <Select value={projectFilter} onValueChange={(v) => { setProjectFilter(v === 'all' ? '' : v); setPage(1) }}>
            <SelectTrigger className="w-48"><SelectValue placeholder="All Data Centres" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Data Centres</SelectItem>
              {(projects?.data || []).map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Grid View */}
        {view === 'grid' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {isLoading
              ? Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
              : units.map((unit: any) => (
                <Card
                  key={unit.id}
                  className="cursor-pointer card-lift"
                  onClick={() => { setEditUnit(unit); setShowForm(true) }}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm">{unit.unitNumber}</span>
                      <div className={`w-2.5 h-2.5 rounded-full ${STATUS_COLORS[unit.status]}`} />
                    </div>
                    <p className="text-xs text-muted-foreground">{unit.type}</p>
                    <p className="text-xs text-muted-foreground">{unit.size} {unit.sizeUnit}</p>
                    {unit.totalPrice && <p className="text-xs font-semibold text-primary mt-1">{formatCurrency(unit.totalPrice)}</p>}
                    <span className={`mt-1 inline-block text-xs px-1.5 py-0.5 rounded-full font-medium ${getStatusColor(unit.status)}`}>{unit.status}</span>
                  </CardContent>
                </Card>
              ))
            }
          </div>
        )}

        {/* Table View */}
        {view === 'table' && (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Unit</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase hidden sm:table-cell">Data Centre</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase hidden md:table-cell">Size</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase hidden md:table-cell">Price</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase hidden lg:table-cell">Facing</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {isLoading
                    ? Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i}><td colSpan={7}><Skeleton className="h-12 m-2" /></td></tr>
                    ))
                    : units.length === 0
                    ? (
                      <tr><td colSpan={7} className="py-16 text-center">
                        <Building2 className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
                        <p className="text-sm text-muted-foreground">No units found</p>
                        <Button size="sm" className="mt-3" onClick={() => setShowForm(true)}>Add Unit</Button>
                      </td></tr>
                    )
                    : units.map((unit: any) => (
                      <tr key={unit.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <p className="text-sm font-bold">{unit.unitNumber}</p>
                          <p className="text-xs text-muted-foreground">{unit.type} • {unit.bedrooms}BHK</p>
                        </td>
                        <td className="px-4 py-3 text-sm hidden sm:table-cell">{unit.project?.name}</td>
                        <td className="px-4 py-3 text-sm hidden md:table-cell">{unit.size} {unit.sizeUnit}</td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          {unit.totalPrice ? <span className="text-sm font-semibold">{formatCurrency(unit.totalPrice)}</span> : '-'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${STATUS_COLORS[unit.status]}`} />
                            <span className="text-xs">{unit.status}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell">{unit.facing || '-'}</td>
                        <td className="px-4 py-3 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7"><MoreVertical className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => { setEditUnit(unit); setShowForm(true) }}>
                                <Edit2 className="w-4 h-4 mr-2" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => deleteMutation.mutate(unit.id)}>
                                <Trash2 className="w-4 h-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <p className="text-xs text-muted-foreground">Page {page} of {totalPages} • {total} units</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1}><ChevronLeft className="w-4 h-4"/></Button>
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page===totalPages}><ChevronRight className="w-4 h-4"/></Button>
                </div>
              </div>
            )}
          </Card>
        )}
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editUnit ? 'Edit Unit' : 'Add New Unit'}</DialogTitle>
          </DialogHeader>
          <UnitForm key={editUnit?.id ?? 'new'} unit={editUnit} onClose={() => setShowForm(false)} />
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
