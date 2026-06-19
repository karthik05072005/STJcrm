'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { apiFetch } from '@/hooks/useApi'
import { toast } from '@/hooks/useToast'
import { formatDate, getStatusColor, getPriorityColor, TASK_STATUSES, TASK_CATEGORIES, PRIORITY_LEVELS } from '@/lib/utils'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Plus, Search, Edit2, Trash2, MoreVertical, ListTodo, CheckCircle2,
  Circle, Calendar, LayoutList, LayoutGrid, Link2
} from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  category: z.string().optional(),
  relatedTo: z.string().optional(),
  dueDate: z.string().optional(),
})

type FormData = z.infer<typeof schema>

function TaskForm({ task, onClose }: { task?: any; onClose: () => void }) {
  const qc = useQueryClient()
  const isEdit = !!task
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: task ? {
      ...task,
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
    } : { status: 'To Do', priority: 'Medium', category: 'General' },
  })

  const onSubmit = async (data: FormData) => {
    try {
      if (isEdit) {
        await apiFetch(`/api/tasks/${task.id}`, { method: 'PUT', body: JSON.stringify(data) })
        toast({ title: 'Task updated' })
      } else {
        await apiFetch('/api/tasks', { method: 'POST', body: JSON.stringify(data) })
        toast({ title: 'Task created' })
      }
      qc.invalidateQueries({ queryKey: ['tasks'] })
      onClose()
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Title *</Label>
        <Input placeholder="e.g., Call back Mr. Sharma about A-101" {...register('title')} />
        {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label>Description</Label>
        <Textarea placeholder="Details..." rows={3} {...register('description')} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select value={watch('status') || 'To Do'} onValueChange={(v) => setValue('status', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{TASK_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Priority</Label>
          <Select value={watch('priority') || 'Medium'} onValueChange={(v) => setValue('priority', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{PRIORITY_LEVELS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Category</Label>
          <Select value={watch('category') || 'General'} onValueChange={(v) => setValue('category', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{TASK_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Due Date</Label>
          <Input type="date" {...register('dueDate')} />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Related To</Label>
          <Input placeholder="Lead / customer / data centre name (optional)" {...register('relatedTo')} />
        </div>
      </div>
      <div className="flex gap-3 justify-end pt-2">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" loading={isSubmitting}>{isEdit ? 'Update Task' : 'Add Task'}</Button>
      </div>
    </form>
  )
}

function TaskCard({ task, onEdit, onToggle, onDelete }: { task: any; onEdit: () => void; onToggle: () => void; onDelete: () => void }) {
  const isDone = task.status === 'Done'
  const overdue = task.dueDate && !isDone && new Date(task.dueDate) < new Date(new Date().toDateString())
  return (
    <Card className="p-3">
      <div className="flex items-start gap-2">
        <button onClick={onToggle} className="mt-0.5 flex-shrink-0 text-muted-foreground hover:text-green-600 transition-colors" title={isDone ? 'Mark as To Do' : 'Mark as Done'}>
          {isDone ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Circle className="w-4 h-4" />}
        </button>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${isDone ? 'line-through text-muted-foreground' : ''}`}>{task.title}</p>
          {task.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{task.description}</p>}
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <span className={`text-xs px-1.5 py-0.5 rounded ${getPriorityColor(task.priority)}`}>{task.priority}</span>
            <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{task.category}</span>
            {task.dueDate && (
              <span className={`text-xs flex items-center gap-1 ${overdue ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
                <Calendar className="w-3 h-3" />{formatDate(task.dueDate)}
              </span>
            )}
          </div>
          {task.relatedTo && (
            <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1"><Link2 className="w-3 h-3" />{task.relatedTo}</p>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0"><MoreVertical className="h-4 w-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}><Edit2 className="w-4 h-4 mr-2" /> Edit</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={onDelete}><Trash2 className="w-4 h-4 mr-2" /> Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  )
}

export default function TasksPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [view, setView] = useState<'board' | 'list'>('board')
  const [showForm, setShowForm] = useState(false)
  const [editTask, setEditTask] = useState<any>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['tasks', search, priorityFilter],
    queryFn: () => apiFetch(`/api/tasks?limit=500&search=${search}&priority=${priorityFilter}`),
  })

  const tasks = data?.data || []
  const total = data?.total || 0

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => apiFetch(`/api/tasks/${id}`, { method: 'PUT', body: JSON.stringify({ status }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/tasks/${id}`, { method: 'DELETE' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tasks'] }); toast({ title: 'Task deleted' }) },
  })

  const toggleDone = (task: any) => updateMutation.mutate({ id: task.id, status: task.status === 'Done' ? 'To Do' : 'Done' })

  const openEdit = (task: any) => { setEditTask(task); setShowForm(true) }

  return (
    <DashboardLayout title="Tasks">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">Task Management</h1>
            <p className="text-sm text-muted-foreground">{total} tasks</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setView(view === 'board' ? 'list' : 'board')}>
              {view === 'board' ? <LayoutList className="w-4 h-4 mr-1" /> : <LayoutGrid className="w-4 h-4 mr-1" />}
              {view === 'board' ? 'List' : 'Board'}
            </Button>
            <Button size="sm" onClick={() => { setEditTask(null); setShowForm(true) }}>
              <Plus className="w-4 h-4 mr-1" /> Add Task
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search tasks..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v === 'all' ? '' : v)}>
            <SelectTrigger className="w-40"><SelectValue placeholder="All Priorities" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              {PRIORITY_LEVELS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-64" />)}
          </div>
        ) : tasks.length === 0 ? (
          <div className="py-16 text-center">
            <ListTodo className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">No tasks yet</p>
            <Button size="sm" className="mt-4" onClick={() => { setEditTask(null); setShowForm(true) }}>Create your first task</Button>
          </div>
        ) : view === 'board' ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {TASK_STATUSES.map((status) => {
              const colTasks = tasks.filter((t: any) => t.status === status)
              return (
                <div key={status} className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(status)}`}>{status}</span>
                    <span className="text-xs text-muted-foreground font-medium">{colTasks.length}</span>
                  </div>
                  <div className="space-y-2 min-h-16">
                    {colTasks.map((task: any) => (
                      <TaskCard key={task.id} task={task} onEdit={() => openEdit(task)} onToggle={() => toggleDone(task)} onDelete={() => deleteMutation.mutate(task.id)} />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="space-y-2 max-w-3xl">
            {tasks.map((task: any) => (
              <TaskCard key={task.id} task={task} onEdit={() => openEdit(task)} onToggle={() => toggleDone(task)} onDelete={() => deleteMutation.mutate(task.id)} />
            ))}
          </div>
        )}
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editTask ? 'Edit Task' : 'Add New Task'}</DialogTitle>
          </DialogHeader>
          <TaskForm key={editTask?.id ?? 'new'} task={editTask} onClose={() => setShowForm(false)} />
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
