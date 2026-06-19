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
import { formatDateTime, getStatusColor, getPriorityColor, FOLLOW_UP_TYPES, FOLLOW_UP_STATUSES, PRIORITY_LEVELS } from '@/lib/utils'
import { useForm } from 'react-hook-form'
import { Plus, Check, ChevronLeft, ChevronRight, CalendarCheck, Clock, MoreVertical, Edit2, Trash2 } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

function FollowUpForm({ followUp, onClose }: { followUp?: any; onClose: () => void }) {
  const qc = useQueryClient()
  const { data: leads } = useQuery({ queryKey: ['leads-list'], queryFn: () => apiFetch('/api/leads?limit=100') })
  const { register, handleSubmit, setValue, watch, formState: { isSubmitting } } = useForm({
    defaultValues: followUp ? {
      ...followUp,
      dueDate: followUp.dueDate ? followUp.dueDate.slice(0, 16) : '',
    } : { status: 'Pending', priority: 'Medium', type: 'Call' },
  })

  const onSubmit = async (data: any) => {
    try {
      if (followUp) {
        await apiFetch(`/api/follow-ups/${followUp.id}`, { method: 'PUT', body: JSON.stringify(data) })
        toast({ title: 'Follow-up updated' })
      } else {
        await apiFetch('/api/follow-ups', { method: 'POST', body: JSON.stringify(data) })
        toast({ title: 'Follow-up scheduled' })
      }
      qc.invalidateQueries({ queryKey: ['follow-ups'] })
      onClose()
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {!followUp && (
        <div className="space-y-1.5">
          <Label>Lead *</Label>
          <Select onValueChange={(v) => setValue('leadId', v)}>
            <SelectTrigger><SelectValue placeholder="Select lead" /></SelectTrigger>
            <SelectContent>
              {(leads?.data || []).map((l: any) => (
                <SelectItem key={l.id} value={l.id}>{l.name} — {l.phone}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="space-y-1.5">
        <Label>Title *</Label>
        <Input placeholder="e.g., Follow up call" {...register('title', { required: true })} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Type</Label>
          <Select value={watch('type') || 'Call'} onValueChange={(v) => setValue('type', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{FOLLOW_UP_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Priority</Label>
          <Select value={watch('priority') || 'Medium'} onValueChange={(v) => setValue('priority', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{PRIORITY_LEVELS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Due Date & Time *</Label>
          <Input type="datetime-local" {...register('dueDate', { required: true })} />
        </div>
        {followUp && (
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={watch('status') || followUp.status} onValueChange={(v) => setValue('status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{FOLLOW_UP_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        )}
      </div>
      <div className="space-y-1.5">
        <Label>Description</Label>
        <Textarea placeholder="Notes or agenda for this follow-up..." rows={3} {...register('description')} />
      </div>
      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" loading={isSubmitting}>{followUp ? 'Update' : 'Schedule'}</Button>
      </div>
    </form>
  )
}

export default function FollowUpsPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editFollowUp, setEditFollowUp] = useState<any>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['follow-ups', page, statusFilter, typeFilter],
    queryFn: () => apiFetch(`/api/follow-ups?page=${page}&status=${statusFilter}&type=${typeFilter}&limit=20`),
  })

  const completeMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/follow-ups/${id}`, { method: 'PUT', body: JSON.stringify({ status: 'Completed' }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['follow-ups'] }); toast({ title: 'Marked as completed' }) },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/follow-ups/${id}`, { method: 'DELETE' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['follow-ups'] }); toast({ title: 'Follow-up deleted' }) },
  })

  const followUps = data?.data || []
  const total = data?.total || 0
  const totalPages = data?.totalPages || 1

  const isOverdue = (dueDate: string, status: string) => {
    return status === 'Pending' && new Date(dueDate) < new Date()
  }

  return (
    <DashboardLayout title="Follow-Ups">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">Follow-Up Management</h1>
            <p className="text-sm text-muted-foreground">{total} follow-ups</p>
          </div>
          <Button size="sm" onClick={() => { setEditFollowUp(null); setShowForm(true) }}>
            <Plus className="w-4 h-4 mr-1" /> Schedule Follow-Up
          </Button>
        </div>

        <div className="flex flex-wrap gap-3">
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === 'all' ? '' : v); setPage(1) }}>
            <SelectTrigger className="w-36"><SelectValue placeholder="All Statuses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {FOLLOW_UP_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v === 'all' ? '' : v); setPage(1) }}>
            <SelectTrigger className="w-32"><SelectValue placeholder="All Types" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {FOLLOW_UP_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20" />)
            : followUps.length === 0
            ? (
              <div className="py-16 text-center">
                <CalendarCheck className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground">No follow-ups scheduled</p>
                <Button size="sm" className="mt-4" onClick={() => setShowForm(true)}>Schedule Follow-Up</Button>
              </div>
            )
            : followUps.map((f: any) => (
              <Card key={f.id} className={cn('hover:shadow-sm transition-shadow', isOverdue(f.dueDate, f.status) && 'border-red-200 dark:border-red-800/50')}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={cn('mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 cursor-pointer transition-colors',
                      f.status === 'Completed' ? 'bg-green-500 border-green-500' : 'border-muted-foreground hover:border-green-500'
                    )} onClick={() => f.status !== 'Completed' && completeMutation.mutate(f.id)}>
                      {f.status === 'Completed' && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className={cn('text-sm font-medium', f.status === 'Completed' && 'line-through text-muted-foreground')}>{f.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{f.lead?.name} • {f.lead?.phone}</p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7"><MoreVertical className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setEditFollowUp(f); setShowForm(true) }}>
                              <Edit2 className="w-4 h-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => deleteMutation.mutate(f.id)}>
                              <Trash2 className="w-4 h-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      {f.description && <p className="text-xs text-muted-foreground mt-1">{f.description}</p>}
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(f.status)}`}>{f.status}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityColor(f.priority)}`}>{f.priority}</span>
                        <span className="text-xs text-muted-foreground">{f.type}</span>
                        <div className={cn('flex items-center gap-1 text-xs', isOverdue(f.dueDate, f.status) ? 'text-red-500 font-medium' : 'text-muted-foreground')}>
                          <Clock className="w-3 h-3" />
                          {formatDateTime(f.dueDate)}
                          {isOverdue(f.dueDate, f.status) && ' • Overdue'}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          }
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1}><ChevronLeft className="w-4 h-4"/></Button>
            <span className="text-sm">{page} / {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page===totalPages}><ChevronRight className="w-4 h-4"/></Button>
          </div>
        )}
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editFollowUp ? 'Edit Follow-Up' : 'Schedule Follow-Up'}</DialogTitle>
          </DialogHeader>
          <FollowUpForm key={editFollowUp?.id ?? 'new'} followUp={editFollowUp} onClose={() => setShowForm(false)} />
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
