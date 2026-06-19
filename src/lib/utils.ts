import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = 'INR'): string {
  if (currency === 'INR') {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`
    return `₹${amount.toLocaleString('en-IN')}`
  }
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(amount)
}

export function formatDate(date: string | Date | null | undefined, fmt = 'dd MMM yyyy'): string {
  if (!date) return '-'
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    return format(d, fmt)
  } catch {
    return '-'
  }
}

export function formatDateTime(date: string | Date | null | undefined): string {
  return formatDate(date, 'dd MMM yyyy, hh:mm a')
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function slugify(str: string): string {
  return str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

export function truncate(str: string, length = 50): string {
  return str.length > length ? `${str.slice(0, length)}...` : str
}

export function generateReceiptNumber(): string {
  return `RCP-${Date.now().toString(36).toUpperCase()}`
}

export const LEAD_STATUSES = ['New', 'Contacted', 'Interested', 'Site Visit Scheduled', 'Negotiation', 'Hot Lead', 'Won', 'Lost'] as const
export const LEAD_SOURCES = ['Direct', 'Website', 'Social Media', 'Referral', 'Channel Partner', 'Newspaper', 'Hoarding', 'Walk-in', 'Agent', 'Other'] as const
export const PROPERTY_TYPES = ['Apartment', 'Villa', 'Plot', 'Commercial', 'Shop', 'Office', 'Penthouse', 'Studio'] as const
export const UNIT_STATUSES = ['Available', 'Reserved', 'Booked', 'Sold', 'Blocked'] as const
export const PROJECT_TYPES = ['Residential', 'Commercial', 'Mixed Use', 'Township', 'Plotted Development'] as const
export const PROJECT_STATUSES = ['Planning', 'Under Construction', 'Ready to Move', 'Completed', 'On Hold'] as const
export const PAYMENT_MODES = ['Cash', 'Cheque', 'Bank Transfer', 'UPI', 'Card', 'NEFT', 'RTGS'] as const
export const PRIORITY_LEVELS = ['Low', 'Medium', 'High', 'Urgent'] as const
export const FOLLOW_UP_TYPES = ['Call', 'Meeting', 'Site Visit', 'Email', 'WhatsApp', 'Video Call'] as const
export const FOLLOW_UP_STATUSES = ['Pending', 'Completed', 'Missed', 'Rescheduled'] as const
export const TASK_STATUSES = ['To Do', 'In Progress', 'On Hold', 'Done'] as const
export const TASK_CATEGORIES = ['General', 'Call', 'Meeting', 'Follow-up', 'Documentation', 'Site Visit', 'Payment', 'Other'] as const

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    New: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    Contacted: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
    Interested: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    'Site Visit Scheduled': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    Negotiation: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    'Hot Lead': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    Won: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    Lost: 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400',
    Available: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    Reserved: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    Booked: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    Sold: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    Blocked: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    Pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    Completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    Missed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    Rescheduled: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
    Active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    Paid: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    Overdue: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    Confirmed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    Cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    'To Do': 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400',
    'In Progress': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    'On Hold': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    Done: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  }
  return colors[status] || 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
}

export function exportToCSV(filename: string, rows: Record<string, any>[]) {
  if (!rows || rows.length === 0) return
  const headers = Object.keys(rows[0])
  const escape = (val: any) => {
    if (val === null || val === undefined) return ''
    const s = String(val).replace(/"/g, '""')
    return /[",\n]/.test(s) ? `"${s}"` : s
  }
  const csv = [
    headers.join(','),
    ...rows.map((row) => headers.map((h) => escape(row[h])).join(',')),
  ].join('\n')

  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    Low: 'bg-slate-100 text-slate-600',
    Medium: 'bg-blue-100 text-blue-600',
    High: 'bg-orange-100 text-orange-600',
    Urgent: 'bg-red-100 text-red-600',
  }
  return colors[priority] || 'bg-gray-100 text-gray-600'
}
