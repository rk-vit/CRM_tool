export type UserRole = "admin" | "sales"

export interface User {
  id: string
  name: string
  email: string
  password?: string
  role: UserRole
  avatar?: string
  phone?: string
  createdAt: string
}

export type LeadStatus = "new" | "contacted" | "qualified" | "negotiation" | "won" | "lost"
export type LeadSubStatus = "hot" | "warm" | "cold"
export type LeadSource = "website" | "google_ads" | "facebook" | "referral" | "direct" | "99acres" | "magicbricks"

export interface Lead {
  id: string
  name: string
  email: string
  phone: string
  alternatePhone?: string
  project: string
  status: LeadStatus
  subStatus: LeadSubStatus
  source: LeadSource
  medium: string
  assignedTo: string
  assignedToName: string
  createdAt: string
  updatedAt: string
  followUpDate?: string
  budget?: string
  requirements?: string
  notes?: string
}

export interface TimelineEvent {
  id: string
  leadId: string
  type: "status_change" | "call" | "email" | "comment" | "workflow" | "sms" | "whatsapp" | "meeting"
  title: string
  description: string
  createdAt: string
  createdBy: string
  metadata?: Record<string, unknown>
}

export interface CallLog {
  id: string
  leadId: string
  callerNumber: string
  callerTo: string
  duration: number
  direction: "inbound" | "outbound"
  status: "answered" | "missed" | "busy" | "no_answer"
  recordingUrl?: string
  assignedTo: string
  createdAt: string
}

export interface EmailLog {
  id: string
  leadId: string
  subject: string
  body: string
  from: string
  to: string
  status: "sent" | "delivered" | "opened" | "clicked" | "bounced"
  createdAt: string
}

export interface Comment {
  id: string
  leadId: string
  text: string
  createdBy: string
  createdByName: string
  createdAt: string
}

export interface DashboardStats {
  newLeads: number
  reEngaged: number
  todayFollowUp: number
  missedFollowUp: number
  todayLeads: number
  siteVisitCompleted: number
  booked: number
  allLeads: number
}

export interface SalesExecutive extends User {
  leadsAssigned: number
  leadsConverted: number
  totalCalls: number
  conversionRate: number
}

export interface UnknownCaller {
  id: string
  phone: string
  exotelCallSid?: string
  callDuration: number
  callStatus: string
  recordingUrl?: string
  reviewed: boolean
  discarded: boolean
  convertedLeadId?: string
  createdAt: string
}
