'use client'
import { useState, useRef } from 'react'
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
import { formatDate, formatCurrency, getStatusColor } from '@/lib/utils'
import { useForm } from 'react-hook-form'
import { Plus, Search, Edit2, Trash2, MoreVertical, UserCheck, ChevronLeft, ChevronRight, CheckSquare, Square, FileText, Upload, Download } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

const DOC_CATEGORIES = ['General', 'Agreement', 'Identity', 'Payment', 'Property', 'Legal', 'Bank', 'Tax', 'Other']

const CHECKLIST_ITEMS = [
  { key: 'allotmentLetter', label: 'Allotment Letter' },
  { key: 'tokenMoney', label: 'Token Money' },
  { key: 'idProof', label: 'ID Proof' },
  { key: 'panCardDoc', label: 'PAN Card' },
  { key: 'agreementCopy', label: 'Agreement Copy' },
  { key: 'paymentPlan', label: 'Payment Plan' },
  { key: 'bankDocuments', label: 'Bank Documents' },
  { key: 'possessionLetter', label: 'Possession Letter' },
]

function CustomerForm({ customer, onClose }: { customer?: any; onClose: () => void }) {
  const qc = useQueryClient()
  const isEdit = !!customer
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm({
    defaultValues: customer || {
      bookingStatus: 'Active',
      allotmentLetter: false, tokenMoney: false, idProof: false,
      panCardDoc: false, agreementCopy: false, paymentPlan: false,
      bankDocuments: false, possessionLetter: false,
    },
  })

  const { data: projects } = useQuery({ queryKey: ['projects-list'], queryFn: () => apiFetch('/api/projects?limit=100') })
  const { data: units } = useQuery({ queryKey: ['units-list'], queryFn: () => apiFetch('/api/inventory?limit=200&status=Available') })
  const { data: leads } = useQuery({ queryKey: ['leads-list'], queryFn: () => apiFetch('/api/leads?limit=100') })

  const checklist = watch(CHECKLIST_ITEMS.map((i) => i.key) as any)

  const onSubmit = async (data: any) => {
    try {
      if (isEdit) {
        await apiFetch(`/api/customers/${customer.id}`, { method: 'PUT', body: JSON.stringify(data) })
        toast({ title: 'Customer updated' })
      } else {
        await apiFetch('/api/customers', { method: 'POST', body: JSON.stringify(data) })
        toast({ title: 'Customer created' })
      }
      qc.invalidateQueries({ queryKey: ['customers'] })
      onClose()
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">Basic Information</h3>
        <div className="grid grid-cols-2 gap-4">
          {!isEdit && (
            <div className="space-y-1.5 col-span-2">
              <Label>Select Lead (Optional)</Label>
              <Select onValueChange={(v) => setValue('leadId', v)}>
                <SelectTrigger><SelectValue placeholder="Link to existing lead" /></SelectTrigger>
                <SelectContent>
                  {(leads?.data || []).map((l: any) => (
                    <SelectItem key={l.id} value={l.id}>{l.name} — {l.phone}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-1.5 col-span-2 sm:col-span-1">
            <Label>Applicant Name *</Label>
            <Input placeholder="Full name" {...register('applicantName', { required: true })} />
          </div>
          <div className="space-y-1.5 col-span-2 sm:col-span-1">
            <Label>Phone *</Label>
            <Input placeholder="+91 9876543210" {...register('applicantPhone', { required: true })} />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input type="email" {...register('email')} />
          </div>
          <div className="space-y-1.5">
            <Label>PAN Card</Label>
            <Input placeholder="ABCDE1234F" {...register('panCard')} />
          </div>
          <div className="space-y-1.5">
            <Label>Date of Birth</Label>
            <Input type="date" {...register('dateOfBirth')} />
          </div>
          <div className="space-y-1.5">
            <Label>Date of Agreement</Label>
            <Input type="date" {...register('dateOfAgreement')} />
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">Data Centre Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Data Centre</Label>
            <Select value={watch('projectId') || ''} onValueChange={(v) => setValue('projectId', v)}>
              <SelectTrigger><SelectValue placeholder="Select data centre" /></SelectTrigger>
              <SelectContent>
                {(projects?.data || []).map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Unit</Label>
            <Select value={watch('unitId') || ''} onValueChange={(v) => setValue('unitId', v)}>
              <SelectTrigger><SelectValue placeholder="Select unit" /></SelectTrigger>
              <SelectContent>
                {(units?.data || []).map((u: any) => (
                  <SelectItem key={u.id} value={u.id}>{u.unitNumber} — {u.type} ({u.project?.name})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Booking Status</Label>
            <Select value={watch('bookingStatus') || 'Active'} onValueChange={(v) => setValue('bookingStatus', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {['Active', 'Cancelled', 'Completed', 'On Hold'].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">Address</h3>
        <div className="grid gap-4">
          <div className="space-y-1.5">
            <Label>Permanent Address</Label>
            <Textarea placeholder="Full permanent address" rows={2} {...register('permanentAddress')} />
          </div>
          <div className="space-y-1.5">
            <Label>Current Address</Label>
            <Textarea placeholder="Current address (if different)" rows={2} {...register('currentAddress')} />
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">Document Checklist</h3>
        <div className="grid grid-cols-2 gap-2">
          {CHECKLIST_ITEMS.map((item) => (
            <label key={item.key} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted cursor-pointer">
              <input type="checkbox" className="rounded" {...register(item.key as any)} />
              <span className="text-sm">{item.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Notes</Label>
        <Textarea placeholder="Additional notes..." rows={2} {...register('notes')} />
      </div>

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" loading={isSubmitting}>{isEdit ? 'Update' : 'Create Customer'}</Button>
      </div>
    </form>
  )
}

function CustomerDocsDialog({ customer, onClose }: { customer: any; onClose: () => void }) {
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [docName, setDocName] = useState('')
  const [docCategory, setDocCategory] = useState('General')

  const { data, isLoading } = useQuery({
    queryKey: ['customer-docs', customer.id],
    queryFn: () => apiFetch(`/api/documents?customerId=${customer.id}`),
  })
  const docs = data?.data || []

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/documents/${id}`, { method: 'DELETE' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['customer-docs', customer.id] }); toast({ title: 'Document deleted' }) },
  })

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0]
    if (!file) { toast({ title: 'Select a file first', variant: 'destructive' }); return }
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('name', docName || file.name)
    fd.append('category', docCategory)
    fd.append('customerId', customer.id)
    try {
      const { useAuthStore } = await import('@/store/auth')
      const token = useAuthStore.getState().token
      const res = await fetch('/api/documents', { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {}, body: fd })
      if (!res.ok) throw new Error('Upload failed')
      toast({ title: 'Document uploaded' })
      setDocName('')
      if (fileRef.current) fileRef.current.value = ''
      qc.invalidateQueries({ queryKey: ['customer-docs', customer.id] })
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Upload box */}
      <div className="rounded-xl border p-4 space-y-3 bg-muted/20">
        <p className="text-sm font-semibold flex items-center gap-2"><Upload className="w-4 h-4" /> Upload a document</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Document Name</Label>
            <Input placeholder="e.g., Agreement Copy" value={docName} onChange={(e) => setDocName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={docCategory} onValueChange={setDocCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{DOC_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <input ref={fileRef} type="file" className="text-sm flex-1 min-w-48" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx" />
          <Button size="sm" onClick={handleUpload} loading={uploading}>Upload</Button>
        </div>
      </div>

      {/* Document list */}
      <div className="space-y-2">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12" />)
        ) : docs.length === 0 ? (
          <div className="py-10 text-center">
            <FileText className="w-10 h-10 mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">No documents for this customer yet</p>
          </div>
        ) : (
          docs.map((doc: any) => (
            <div key={doc.id} className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/30 transition-colors">
              <FileText className="w-5 h-5 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{doc.name}</p>
                <p className="text-xs text-muted-foreground">{doc.category} • {formatDate(doc.createdAt)}{doc.fileSize ? ` • ${(doc.fileSize / 1024).toFixed(1)} KB` : ''}</p>
              </div>
              <a href={doc.filePath} download={doc.fileName} className="p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground" title="Download">
                <Download className="w-4 h-4" />
              </a>
              <button onClick={() => deleteMutation.mutate(doc.id)} className="p-2 rounded-md hover:bg-red-500/10 text-muted-foreground hover:text-red-500" title="Delete">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="flex justify-end">
        <Button variant="outline" onClick={onClose}>Close</Button>
      </div>
    </div>
  )
}

export default function CustomersPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editCustomer, setEditCustomer] = useState<any>(null)
  const [docsCustomer, setDocsCustomer] = useState<any>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['customers', page, search],
    queryFn: () => apiFetch(`/api/customers?page=${page}&search=${search}&limit=15`),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/customers/${id}`, { method: 'DELETE' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['customers'] }); toast({ title: 'Customer deleted' }) },
  })

  const customers = data?.data || []
  const total = data?.total || 0
  const totalPages = data?.totalPages || 1

  const checklistComplete = (c: any) => {
    return CHECKLIST_ITEMS.filter((i) => c[i.key]).length
  }

  return (
    <DashboardLayout title="Customers">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">Customer Management</h1>
            <p className="text-sm text-muted-foreground">{total} customers</p>
          </div>
          <Button size="sm" onClick={() => { setEditCustomer(null); setShowForm(true) }}>
            <Plus className="w-4 h-4 mr-1" /> Add Customer
          </Button>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search customers..." className="pl-9" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
        </div>

        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Customer</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase hidden sm:table-cell">Data Centre / Unit</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase hidden md:table-cell">Documents</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase hidden lg:table-cell">Date</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isLoading
                  ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}><td colSpan={6}><Skeleton className="h-12 m-2" /></td></tr>
                  ))
                  : customers.length === 0
                  ? (
                    <tr><td colSpan={6} className="py-16 text-center">
                      <UserCheck className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
                      <p className="text-sm text-muted-foreground">No customers found</p>
                      <Button size="sm" className="mt-3" onClick={() => setShowForm(true)}>Add Customer</Button>
                    </td></tr>
                  )
                  : customers.map((c: any) => (
                    <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-xs font-bold text-purple-600 flex-shrink-0">
                            {c.applicantName[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{c.applicantName}</p>
                            <p className="text-xs text-muted-foreground">{c.applicantPhone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <p className="text-sm">{c.project?.name || '-'}</p>
                        <p className="text-xs text-muted-foreground">{c.unit ? `Unit ${c.unit.unitNumber}` : 'No unit'}</p>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="flex items-center gap-1.5">
                          <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 rounded-full" style={{ width: `${(checklistComplete(c) / 8) * 100}%` }} />
                          </div>
                          <span className="text-xs text-muted-foreground">{checklistComplete(c)}/8</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(c.bookingStatus)}`}>{c.bookingStatus}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell">{formatDate(c.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7"><MoreVertical className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setEditCustomer(c); setShowForm(true) }}>
                              <Edit2 className="w-4 h-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setDocsCustomer(c)}>
                              <FileText className="w-4 h-4 mr-2" /> Documents
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => deleteMutation.mutate(c.id)}>
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
              <p className="text-xs text-muted-foreground">Showing {((page-1)*15)+1}–{Math.min(page*15, total)} of {total}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1}><ChevronLeft className="w-4 h-4"/></Button>
                <span className="text-sm px-2">{page}/{totalPages}</span>
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page===totalPages}><ChevronRight className="w-4 h-4"/></Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editCustomer ? 'Edit Customer' : 'Add New Customer'}</DialogTitle>
          </DialogHeader>
          <CustomerForm key={editCustomer?.id ?? 'new'} customer={editCustomer} onClose={() => setShowForm(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!docsCustomer} onOpenChange={(o) => !o && setDocsCustomer(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Documents — {docsCustomer?.applicantName}</DialogTitle>
          </DialogHeader>
          {docsCustomer && <CustomerDocsDialog key={docsCustomer.id} customer={docsCustomer} onClose={() => setDocsCustomer(null)} />}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
