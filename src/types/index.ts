export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  createdAt: string
}

export interface Lead {
  id: string
  name: string
  email?: string
  phone: string
  city?: string
  budget?: number
  budgetMax?: number
  propertyType?: string
  source: string
  status: string
  priority: string
  notes?: string
  followUpDate?: string
  createdAt: string
  updatedAt: string
  followUps?: FollowUp[]
  callLogs?: CallLog[]
}

export interface Customer {
  id: string
  leadId?: string
  applicantName: string
  applicantPhone: string
  email?: string
  dateOfBirth?: string
  dateOfAgreement?: string
  permanentAddress?: string
  currentAddress?: string
  panCard?: string
  projectId?: string
  unitId?: string
  bookingStatus: string
  allotmentLetter: boolean
  tokenMoney: boolean
  idProof: boolean
  panCardDoc: boolean
  agreementCopy: boolean
  paymentPlan: boolean
  bankDocuments: boolean
  possessionLetter: boolean
  notes?: string
  createdAt: string
  updatedAt: string
  lead?: Lead
  project?: Project
  unit?: Unit
  payments?: Payment[]
  bookings?: Booking[]
}

export interface Project {
  id: string
  name: string
  description?: string
  location?: string
  city?: string
  state?: string
  type: string
  status: string
  totalUnits: number
  reraNumber?: string
  minPrice?: number
  maxPrice?: number
  mainImage?: string
  amenities?: string
  launchDate?: string
  possessionDate?: string
  createdAt: string
  updatedAt: string
  towers?: Tower[]
  units?: Unit[]
}

export interface Tower {
  id: string
  projectId: string
  name: string
  totalFloors: number
  totalUnits: number
  createdAt: string
  floors?: Floor[]
  units?: Unit[]
}

export interface Floor {
  id: string
  towerId: string
  number: number
  name?: string
  units?: Unit[]
}

export interface Unit {
  id: string
  projectId: string
  towerId?: string
  floorId?: string
  unitNumber: string
  type: string
  size?: number
  sizeUnit: string
  facing?: string
  price?: number
  plcCharges?: number
  parkingCharges?: number
  totalPrice?: number
  status: string
  furnishing: string
  bedrooms?: number
  bathrooms?: number
  balcony: boolean
  parking: boolean
  description?: string
  createdAt: string
  project?: Project
  tower?: Tower
  floor?: Floor
}

export interface Booking {
  id: string
  customerId: string
  unitId: string
  bookingDate: string
  bookingAmount: number
  totalAmount: number
  discountAmount: number
  status: string
  paymentPlan?: string
  notes?: string
  createdAt: string
  customer?: Customer
  unit?: Unit
  payments?: Payment[]
}

export interface Payment {
  id: string
  customerId: string
  bookingId?: string
  amount: number
  paymentDate: string
  dueDate?: string
  paymentMode: string
  transactionId?: string
  receiptNumber?: string
  type: string
  status: string
  notes?: string
  createdAt: string
  customer?: Customer
  booking?: Booking
}

export interface FollowUp {
  id: string
  leadId: string
  title: string
  description?: string
  dueDate: string
  type: string
  status: string
  priority: string
  completedAt?: string
  createdAt: string
  lead?: Lead
}

export interface CallLog {
  id: string
  leadId: string
  type: string
  notes?: string
  duration?: number
  createdAt: string
}

export interface Document {
  id: string
  customerId?: string
  name: string
  fileName: string
  filePath: string
  fileSize?: number
  fileType?: string
  category: string
  description?: string
  createdAt: string
  customer?: Customer
}

export interface Notification {
  id: string
  title: string
  message: string
  type: string
  isRead: boolean
  link?: string
  createdAt: string
}

export interface ActivityLog {
  id: string
  action: string
  entity: string
  entityId?: string
  description?: string
  createdAt: string
  user?: User
}

export interface DashboardStats {
  totalLeads: number
  activeClients: number
  soldUnits: number
  totalRevenue: number
  monthlyRevenue: number
  followUpsPending: number
  conversionRate: number
  bookingAmount: number
  availableUnits: number
  bookedUnits: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}
