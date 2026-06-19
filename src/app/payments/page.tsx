'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { apiFetch } from '@/hooks/useApi'
import { toast } from '@/hooks/useToast'
import { formatDate, formatCurrency, getStatusColor, PAYMENT_MODES } from '@/lib/utils'
import { useForm } from 'react-hook-form'
import { Plus, Search, MoreVertical, Edit2, Trash2, CreditCard, ChevronLeft, ChevronRight, IndianRupee } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

const PAYMENT_TYPES = ['Booking', 'Installment', 'Registration', 'OC', 'Final', 'Other']

function PaymentForm({ payment, onClose }: { payment?: any; onClose: () => void }) {
  const qc = useQueryClient()
  const { data: customers } = useQuery({ queryKey: ['customers-list'], queryFn: () => apiFetch('/api/customers?limit=200') })
  const { register, handleSubmit, setValue, watch, formState: { isSubmitting } } = useForm({
    defaultValues: payment || { status: 'Paid', type: 'Installment', paymentMode: 'Bank Transfer' },
  })

  const onSubmit = async (data: any) => {
    try {
      const payload = { ...data, amount: parseFloat(data.amount) }
      if (payment) {
        await apiFetch(`/api/payments/${payment.id}`, { method: 'PUT', body: JSON.stringify(payload) })
        toast({ title: 'Payment updated' })
      } else {
        await apiFetch('/api/payments', { method: 'POST', body: JSON.stringify(payload) })
        toast({ title: 'Payment recorded' })
      }
      qc.invalidateQueries({ queryKey: ['payments'] })
      onClose()
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {!payment && (
        <div className="space-y-1.5">
          <Label>Customer *</Label>
          <Select onValueChange={(v) => setValue('customerId', v)}>
            <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
            <SelectContent>
              {(customers?.data || []).map((c: any) => (
                <SelectItem key={c.id} value={c.id}>{c.applicantName} — {c.applicantPhone}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Amount (₹) *</Label>
          <Input type="number" placeholder="500000" {...register('amount', { required: true })} />
        </div>
        <div className="space-y-1.5">
          <Label>Payment Type</Label>
          <Select value={watch('type') || 'Installment'} onValueChange={(v) => setValue('type', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{PAYMENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Payment Mode</Label>
          <Select value={watch('paymentMode') || 'Bank Transfer'} onValueChange={(v) => setValue('paymentMode', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{PAYMENT_MODES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select value={watch('status') || 'Paid'} onValueChange={(v) => setValue('status', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {['Paid', 'Pending', 'Overdue', 'Cancelled'].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Payment Date</Label>
          <Input type="date" {...register('paymentDate')} />
        </div>
        <div className="space-y-1.5">
          <Label>Due Date</Label>
          <Input type="date" {...register('dueDate')} />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Transaction ID</Label>
          <Input placeholder="TXN12345" {...register('transactionId')} />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Notes</Label>
          <Textarea rows={2} {...register('notes')} />
        </div>
      </div>
      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" loading={isSubmitting}>{payment ? 'Update' : 'Record Payment'}</Button>
      </div>
    </form>
  )
}

export default function PaymentsPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editPayment, setEditPayment] = useState<any>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['payments', page, statusFilter],
    queryFn: () => apiFetch(`/api/payments?page=${page}&status=${statusFilter}&limit=20`),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/payments/${id}`, { method: 'DELETE' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['payments'] }); toast({ title: 'Payment deleted' }) },
  })

  const payments = data?.data || []
  const total = data?.total || 0
  const totalPages = data?.totalPages || 1
  const totalAmount = payments.reduce((sum: number, p: any) => sum + (p.status === 'Paid' ? p.amount : 0), 0)

  return (
    <DashboardLayout title="Payments">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">Payment Management</h1>
            <p className="text-sm text-muted-foreground">{total} records • {formatCurrency(totalAmount)} collected (this page)</p>
          </div>
          <Button size="sm" onClick={() => { setEditPayment(null); setShowForm(true) }}>
            <Plus className="w-4 h-4 mr-1" /> Record Payment
          </Button>
        </div>

        <div className="flex flex-wrap gap-3">
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === 'all' ? '' : v); setPage(1) }}>
            <SelectTrigger className="w-36"><SelectValue placeholder="All Statuses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {['Paid', 'Pending', 'Overdue', 'Cancelled'].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Receipt</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase hidden sm:table-cell">Customer</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Amount</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase hidden md:table-cell">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase hidden md:table-cell">Mode</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase hidden lg:table-cell">Date</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isLoading
                  ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}><td colSpan={8}><Skeleton className="h-12 m-2" /></td></tr>
                  ))
                  : payments.length === 0
                  ? (
                    <tr><td colSpan={8} className="py-16 text-center">
                      <CreditCard className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
                      <p className="text-sm text-muted-foreground">No payments recorded</p>
                      <Button size="sm" className="mt-3" onClick={() => setShowForm(true)}>Record Payment</Button>
                    </td></tr>
                  )
                  : payments.map((p: any) => (
                    <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-xs font-mono text-muted-foreground">{p.receiptNumber}</p>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <p className="text-sm font-medium">{p.customer?.applicantName}</p>
                        <p className="text-xs text-muted-foreground">{p.customer?.applicantPhone}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-bold text-green-600">{formatCurrency(p.amount)}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">{p.type}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">{p.paymentMode}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(p.status)}`}>{p.status}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell">{formatDate(p.paymentDate)}</td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7"><MoreVertical className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setEditPayment(p); setShowForm(true) }}>
                              <Edit2 className="w-4 h-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => deleteMutation.mutate(p.id)}>
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
              <p className="text-xs text-muted-foreground">Page {page} of {totalPages} • {total} records</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1}><ChevronLeft className="w-4 h-4"/></Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page===totalPages}><ChevronRight className="w-4 h-4"/></Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editPayment ? 'Edit Payment' : 'Record Payment'}</DialogTitle>
          </DialogHeader>
          <PaymentForm key={editPayment?.id ?? 'new'} payment={editPayment} onClose={() => setShowForm(false)} />
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
