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
import { formatDate, formatCurrency, getStatusColor, exportToCSV, PROJECT_TYPES, PROJECT_STATUSES } from '@/lib/utils'
import { useForm } from 'react-hook-form'
import { Plus, Search, Edit2, Trash2, MoreVertical, Server, MapPin, Building, ChevronLeft, ChevronRight, Download } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

function ProjectForm({ project, onClose }: { project?: any; onClose: () => void }) {
  const qc = useQueryClient()
  const { register, handleSubmit, setValue, watch, formState: { isSubmitting } } = useForm({
    defaultValues: project || { type: 'Residential', status: 'Under Construction' },
  })

  const onSubmit = async (data: any) => {
    try {
      if (project) {
        await apiFetch(`/api/projects/${project.id}`, { method: 'PUT', body: JSON.stringify(data) })
        toast({ title: 'Project updated' })
      } else {
        await apiFetch('/api/projects', { method: 'POST', body: JSON.stringify(data) })
        toast({ title: 'Project created' })
      }
      qc.invalidateQueries({ queryKey: ['projects'] })
      qc.invalidateQueries({ queryKey: ['projects-list'] })
      onClose()
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5 col-span-2">
          <Label>Data Centre Name *</Label>
          <Input placeholder="Sunrise Heights" {...register('name', { required: true })} />
        </div>
        <div className="space-y-1.5">
          <Label>Type</Label>
          <Select value={watch('type') || 'Residential'} onValueChange={(v) => setValue('type', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{PROJECT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select value={watch('status') || 'Under Construction'} onValueChange={(v) => setValue('status', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{PROJECT_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Location / Address</Label>
          <Input placeholder="Sector 150, Noida" {...register('location')} />
        </div>
        <div className="space-y-1.5">
          <Label>City</Label>
          <Input placeholder="Noida" {...register('city')} />
        </div>
        <div className="space-y-1.5">
          <Label>State</Label>
          <Input placeholder="Uttar Pradesh" {...register('state')} />
        </div>
        <div className="space-y-1.5">
          <Label>RERA Number</Label>
          <Input placeholder="UPRERAPRJ1234" {...register('reraNumber')} />
        </div>
        <div className="space-y-1.5">
          <Label>Total Area (sqft)</Label>
          <Input type="number" placeholder="200000" {...register('totalArea')} />
        </div>
        <div className="space-y-1.5">
          <Label>Min Price (₹)</Label>
          <Input type="number" placeholder="3000000" {...register('minPrice')} />
        </div>
        <div className="space-y-1.5">
          <Label>Max Price (₹)</Label>
          <Input type="number" placeholder="10000000" {...register('maxPrice')} />
        </div>
        <div className="space-y-1.5">
          <Label>Launch Date</Label>
          <Input type="date" {...register('launchDate')} />
        </div>
        <div className="space-y-1.5">
          <Label>Possession Date</Label>
          <Input type="date" {...register('possessionDate')} />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Description</Label>
          <Textarea placeholder="Project description..." rows={3} {...register('description')} />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Amenities (comma separated)</Label>
          <Input placeholder="Swimming Pool, Gym, Clubhouse, Garden" {...register('amenities')} />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Nearby Landmarks</Label>
          <Input placeholder="Metro Station, School, Hospital" {...register('nearbyLandmarks')} />
        </div>
      </div>
      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" loading={isSubmitting}>{project ? 'Update Data Centre' : 'Create Data Centre'}</Button>
      </div>
    </form>
  )
}

export default function ProjectsPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editProject, setEditProject] = useState<any>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['projects', page, search],
    queryFn: () => apiFetch(`/api/projects?page=${page}&search=${search}&limit=12`),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/projects/${id}`, { method: 'DELETE' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['projects'] }); toast({ title: 'Data centre deleted' }) },
  })

  const projects = data?.data || []
  const total = data?.total || 0
  const totalPages = data?.totalPages || 1

  const handleExport = async () => {
    try {
      const all = await apiFetch('/api/projects?limit=1000')
      const rows = (all?.data || []).map((p: any) => ({
        Name: p.name,
        Type: p.type,
        Status: p.status,
        Location: p.location || '',
        City: p.city || '',
        State: p.state || '',
        RERA: p.reraNumber || '',
        Units: p._count?.units ?? 0,
        Towers: p._count?.towers ?? 0,
        Buyers: p._count?.customers ?? 0,
        MinPrice: p.minPrice ?? '',
        MaxPrice: p.maxPrice ?? '',
        CreatedAt: formatDate(p.createdAt),
      }))
      if (rows.length === 0) { toast({ title: 'Nothing to export' }); return }
      exportToCSV(`data-centres-${new Date().toISOString().slice(0, 10)}.csv`, rows)
      toast({ title: `Exported ${rows.length} records` })
    } catch (err: any) {
      toast({ title: 'Export failed', description: err.message, variant: 'destructive' })
    }
  }

  return (
    <DashboardLayout title="Data Centre">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">Data Centre</h1>
            <p className="text-sm text-muted-foreground">{total} data centres</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="w-4 h-4 mr-1" /> Export
            </Button>
            <Button size="sm" onClick={() => { setEditProject(null); setShowForm(true) }}>
              <Plus className="w-4 h-4 mr-1" /> Add Data Centre
            </Button>
          </div>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search data centres..." className="pl-9" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
        </div>

        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48" />)}
          </div>
        ) : projects.length === 0 ? (
          <div className="py-16 text-center">
            <Server className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">No data centres yet</p>
            <Button size="sm" className="mt-4" onClick={() => setShowForm(true)}>Create your first data centre</Button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project: any) => (
              <Card key={project.id} className="card-lift overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-blue-500 to-purple-500" />
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{project.name}</h3>
                      <div className="flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground truncate">{project.city}{project.state ? `, ${project.state}` : ''}</p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7"><MoreVertical className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setEditProject(project); setShowForm(true) }}>
                          <Edit2 className="w-4 h-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => deleteMutation.mutate(project.id)}>
                          <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap mb-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(project.status)}`}>{project.status}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted">{project.type}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-muted/50 rounded-lg p-2">
                      <p className="text-lg font-bold">{project._count?.units || 0}</p>
                      <p className="text-xs text-muted-foreground">Units</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-2">
                      <p className="text-lg font-bold">{project._count?.towers || 0}</p>
                      <p className="text-xs text-muted-foreground">Towers</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-2">
                      <p className="text-lg font-bold">{project._count?.customers || 0}</p>
                      <p className="text-xs text-muted-foreground">Buyers</p>
                    </div>
                  </div>

                  {(project.minPrice || project.maxPrice) && (
                    <p className="text-xs text-muted-foreground mt-3">
                      {project.minPrice && formatCurrency(project.minPrice)}
                      {project.minPrice && project.maxPrice && ' – '}
                      {project.maxPrice && formatCurrency(project.maxPrice)}
                    </p>
                  )}
                  {project.reraNumber && (
                    <p className="text-xs text-muted-foreground mt-1">RERA: {project.reraNumber}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1}><ChevronLeft className="w-4 h-4"/></Button>
            <span className="text-sm">{page} / {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page===totalPages}><ChevronRight className="w-4 h-4"/></Button>
          </div>
        )}
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editProject ? 'Edit Data Centre' : 'Add New Data Centre'}</DialogTitle>
          </DialogHeader>
          <ProjectForm key={editProject?.id ?? 'new'} project={editProject} onClose={() => setShowForm(false)} />
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
