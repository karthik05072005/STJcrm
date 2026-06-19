'use client'
import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { apiFetch } from '@/hooks/useApi'
import { toast } from '@/hooks/useToast'
import { formatDate, formatCurrency, getStatusColor, getPriorityColor, exportToCSV, LEAD_STATUSES, LEAD_SOURCES, PROPERTY_TYPES, PRIORITY_LEVELS } from '@/lib/utils'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Plus, Search, Filter, LayoutList, LayoutGrid, Phone, Mail, MapPin,
  Calendar, Edit2, Trash2, Eye, MoreVertical, Users, ChevronLeft, ChevronRight, Download
} from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(6, 'Phone is required'),
  email: z.string().email().optional().or(z.literal('')),
  city: z.string().optional(),
  budget: z.coerce.number().optional(),
  budgetMax: z.coerce.number().optional(),
  propertyType: z.string().optional(),
  source: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  channelPartner: z.string().optional(),
  projectName: z.string().optional(),
  notes: z.string().optional(),
  followUpDate: z.string().optional(),
})

type FormData = z.infer<typeof schema>

function LeadForm({ lead, onClose }: { lead?: any; onClose: () => void }) {
  const qc = useQueryClient()
  const isEdit = !!lead

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: lead ? {
      ...lead,
      followUpDate: lead.followUpDate ? lead.followUpDate.split('T')[0] : '',
    } : { status: 'New', priority: 'Medium', source: 'Direct' },
  })

  const onSubmit = async (data: FormData) => {
    try {
      if (isEdit) {
        await apiFetch(`/api/leads/${lead.id}`, { method: 'PUT', body: JSON.stringify(data) })
        toast({ title: 'Lead updated successfully', variant: 'default' })
      } else {
        await apiFetch('/api/leads', { method: 'POST', body: JSON.stringify(data) })
        toast({ title: 'Lead created successfully' })
      }
      qc.invalidateQueries({ queryKey: ['leads'] })
      onClose()
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5 col-span-2 sm:col-span-1">
          <Label>Name *</Label>
          <Input placeholder="Full name" {...register('name')} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-1.5 col-span-2 sm:col-span-1">
          <Label>Phone *</Label>
          <Input placeholder="+91 9876543210" {...register('phone')} />
          {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
        </div>
        <div className="space-y-1.5 col-span-2 sm:col-span-1">
          <Label>Email</Label>
          <Input type="email" placeholder="email@example.com" {...register('email')} />
        </div>
        <div className="space-y-1.5 col-span-2 sm:col-span-1">
          <Label>City</Label>
          <Input placeholder="City" {...register('city')} />
        </div>
        <div className="space-y-1.5">
          <Label>Min Budget (₹)</Label>
          <Input type="number" placeholder="2000000" {...register('budget')} />
        </div>
        <div className="space-y-1.5">
          <Label>Max Budget (₹)</Label>
          <Input type="number" placeholder="5000000" {...register('budgetMax')} />
        </div>
        <div className="space-y-1.5">
          <Label>Property Type</Label>
          <Select value={watch('propertyType') || ''} onValueChange={(v) => setValue('propertyType', v)}>
            <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
            <SelectContent>
              {PROPERTY_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Lead Source</Label>
          <Select value={watch('source') || 'Direct'} onValueChange={(v) => setValue('source', v)}>
            <SelectTrigger><SelectValue placeholder="Source" /></SelectTrigger>
            <SelectContent>
              {LEAD_SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Channel Partner Name</Label>
          <Input placeholder="Partner / agency name" {...register('channelPartner')} />
        </div>
        <div className="space-y-1.5 col-span-2 sm:col-span-1">
          <Label>Project Name</Label>
          <Input placeholder="Project of interest" {...register('projectName')} />
        </div>
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select value={watch('status') || 'New'} onValueChange={(v) => setValue('status', v)}>
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              {LEAD_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Priority</Label>
          <Select value={watch('priority') || 'Medium'} onValueChange={(v) => setValue('priority', v)}>
            <SelectTrigger><SelectValue placeholder="Priority" /></SelectTrigger>
            <SelectContent>
              {PRIORITY_LEVELS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 col-span-2 sm:col-span-1">
          <Label>Follow-up Date</Label>
          <Input type="date" {...register('followUpDate')} />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Notes</Label>
          <Textarea placeholder="Add notes..." rows={2} {...register('notes')} />
        </div>
      </div>

      <div className="flex gap-3 justify-end pt-2">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" loading={isSubmitting}>{isEdit ? 'Update Lead' : 'Add Lead'}</Button>
      </div>
    </form>
  )
}

export default function LeadsPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')
  const [view, setView] = useState<'table' | 'kanban'>('table')
  const [showForm, setShowForm] = useState(false)
  const [editLead, setEditLead] = useState<any>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['leads', page, search, statusFilter, sourceFilter],
    queryFn: () => apiFetch(`/api/leads?page=${page}&search=${search}&status=${statusFilter}&source=${sourceFilter}&limit=15`),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/leads/${id}`, { method: 'DELETE' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['leads'] }); toast({ title: 'Lead deleted' }) },
    onError: () => toast({ title: 'Delete failed', variant: 'destructive' }),
  })

  const leads = data?.data || []
  const total = data?.total || 0
  const totalPages = data?.totalPages || 1

  const handleExport = async () => {
    try {
      const all = await apiFetch(`/api/leads?limit=5000&search=${search}&status=${statusFilter}&source=${sourceFilter}`)
      const rows = (all?.data || []).map((l: any) => ({
        Name: l.name,
        Phone: l.phone,
        Email: l.email || '',
        City: l.city || '',
        ProjectName: l.projectName || '',
        ChannelPartner: l.channelPartner || '',
        Source: l.source || '',
        Status: l.status || '',
        Priority: l.priority || '',
        MinBudget: l.budget ?? '',
        MaxBudget: l.budgetMax ?? '',
        FollowUpDate: l.followUpDate ? formatDate(l.followUpDate) : '',
        CreatedAt: formatDate(l.createdAt),
      }))
      if (rows.length === 0) { toast({ title: 'Nothing to export' }); return }
      exportToCSV(`leads-${new Date().toISOString().slice(0, 10)}.csv`, rows)
      toast({ title: `Exported ${rows.length} leads` })
    } catch (err: any) {
      toast({ title: 'Export failed', description: err.message, variant: 'destructive' })
    }
  }

  // Kanban columns
  const kanbanStatuses = ['New', 'Contacted', 'Interested', 'Site Visit Scheduled', 'Negotiation', 'Hot Lead', 'Won', 'Lost']

  return (
    <DashboardLayout title="Leads">
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">Lead Management</h1>
            <p className="text-sm text-muted-foreground">{total} total leads</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setView(view === 'table' ? 'kanban' : 'table')}>
              {view === 'table' ? <LayoutGrid className="w-4 h-4 mr-1" /> : <LayoutList className="w-4 h-4 mr-1" />}
              {view === 'table' ? 'Kanban' : 'Table'}
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="w-4 h-4 mr-1" /> Export
            </Button>
            <Button size="sm" onClick={() => { setEditLead(null); setShowForm(true) }}>
              <Plus className="w-4 h-4 mr-1" /> Add Lead
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search leads..." className="pl-9" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
          </div>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === 'all' ? '' : v); setPage(1) }}>
            <SelectTrigger className="w-40"><SelectValue placeholder="All Statuses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {LEAD_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={sourceFilter} onValueChange={(v) => { setSourceFilter(v === 'all' ? '' : v); setPage(1) }}>
            <SelectTrigger className="w-36"><SelectValue placeholder="All Sources" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              {LEAD_SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Table View */}
        {view === 'table' && (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Lead</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Contact</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Budget</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Source</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Follow-up</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {isLoading
                    ? Array.from({ length: 8 }).map((_, i) => (
                        <tr key={i}><td colSpan={7} className="px-4 py-3"><Skeleton className="h-10" /></td></tr>
                      ))
                    : leads.length === 0
                    ? (
                      <tr><td colSpan={7} className="py-16 text-center">
                        <Users className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
                        <p className="text-sm text-muted-foreground">No leads found</p>
                        <Button size="sm" className="mt-3" onClick={() => setShowForm(true)}>Add your first lead</Button>
                      </td></tr>
                    )
                    : leads.map((lead: any) => (
                      <tr key={lead.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                              {lead.name[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{lead.name}</p>
                              <p className="text-xs text-muted-foreground">{[lead.city, lead.projectName].filter(Boolean).join(' • ') || '-'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <p className="text-sm flex items-center gap-1"><Phone className="w-3 h-3" />{lead.phone}</p>
                          {lead.email && <p className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="w-3 h-3" />{lead.email}</p>}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          {lead.budget ? <span className="text-sm">{formatCurrency(lead.budget)}{lead.budgetMax && ` - ${formatCurrency(lead.budgetMax)}`}</span> : <span className="text-muted-foreground text-sm">-</span>}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>{lead.status}</span>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <span className="text-xs text-muted-foreground">{lead.source}{lead.channelPartner ? ` · ${lead.channelPartner}` : ''}</span>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          {lead.followUpDate
                            ? <span className="text-xs text-primary flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(lead.followUpDate)}</span>
                            : <span className="text-xs text-muted-foreground">-</span>}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7"><MoreVertical className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => { setEditLead(lead); setShowForm(true) }}>
                                <Edit2 className="w-4 h-4 mr-2" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => deleteMutation.mutate(lead.id)}>
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <p className="text-xs text-muted-foreground">
                  Showing {((page - 1) * 15) + 1}–{Math.min(page * 15, total)} of {total}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm px-3 py-1">{page} / {totalPages}</span>
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Kanban View */}
        {view === 'kanban' && (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {kanbanStatuses.map((status) => {
              const statusLeads = leads.filter((l: any) => l.status === status)
              return (
                <div key={status} className="flex-shrink-0 w-64">
                  <div className="mb-3 flex items-center justify-between">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(status)}`}>
                      {status}
                    </span>
                    <span className="text-xs text-muted-foreground font-medium">{statusLeads.length}</span>
                  </div>
                  <div className="space-y-2 min-h-16">
                    {isLoading
                      ? <Skeleton className="h-24" />
                      : statusLeads.map((lead: any) => (
                        <Card key={lead.id} className="p-3 cursor-pointer hover:shadow-sm transition-shadow">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{lead.name}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{lead.phone}</p>
                              {lead.budget && <p className="text-xs text-primary mt-1">{formatCurrency(lead.budget)}</p>}
                            </div>
                            <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0" onClick={() => { setEditLead(lead); setShowForm(true) }}>
                              <Edit2 className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`text-xs px-1.5 py-0.5 rounded ${getPriorityColor(lead.priority)}`}>{lead.priority}</span>
                            <span className="text-xs text-muted-foreground">{lead.source}</span>
                          </div>
                        </Card>
                      ))
                    }
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editLead ? 'Edit Lead' : 'Add New Lead'}</DialogTitle>
          </DialogHeader>
          <LeadForm key={editLead?.id ?? 'new'} lead={editLead} onClose={() => setShowForm(false)} />
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
