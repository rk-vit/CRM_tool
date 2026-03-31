import type { Lead, User, TimelineEvent, CallLog, EmailLog, Comment, DashboardStats, SalesExecutive } from "./types"

export const currentUser: User = {
  id: "user-1",
  name: "Rajesh Kumar",
  email: "rajesh@realestate.com",
  role: "sales",
  phone: "+91 9876543210",
  createdAt: "2024-01-15T10:00:00Z"
}

export const adminUser: User = {
  id: "admin-1",
  name: "Priya Sharma",
  email: "priya@realestate.com",
  role: "admin",
  phone: "+91 9876543211",
  createdAt: "2023-06-01T10:00:00Z"
}

export const salesExecutives: SalesExecutive[] = [
  {
    id: "user-1",
    name: "Rajesh Kumar",
    email: "rajesh@realestate.com",
    role: "sales",
    phone: "+91 9876543210",
    createdAt: "2024-01-15T10:00:00Z",
    leadsAssigned: 85,
    leadsConverted: 12,
    totalCalls: 234,
    conversionRate: 14.1
  },
  {
    id: "user-2",
    name: "Amit Patel",
    email: "amit@realestate.com",
    role: "sales",
    phone: "+91 9876543212",
    createdAt: "2024-02-01T10:00:00Z",
    leadsAssigned: 72,
    leadsConverted: 8,
    totalCalls: 189,
    conversionRate: 11.1
  },
  {
    id: "user-3",
    name: "Sneha Reddy",
    email: "sneha@realestate.com",
    role: "sales",
    phone: "+91 9876543213",
    createdAt: "2024-01-20T10:00:00Z",
    leadsAssigned: 91,
    leadsConverted: 15,
    totalCalls: 278,
    conversionRate: 16.5
  },
  {
    id: "user-4",
    name: "Vikram Singh",
    email: "vikram@realestate.com",
    role: "sales",
    phone: "+91 9876543214",
    createdAt: "2024-03-01T10:00:00Z",
    leadsAssigned: 45,
    leadsConverted: 5,
    totalCalls: 112,
    conversionRate: 11.1
  }
]

export const leads: Lead[] = [
  {
    id: "RS1791",
    name: "Badri Narayanan",
    email: "badrinarayanan.rameshkumar@gmail.com",
    phone: "+91 9360926633",
    alternatePhone: "+91 9876543200",
    project: "Gold Mine Residency",
    status: "qualified",
    subStatus: "hot",
    source: "google_ads",
    medium: "Google Ads",
    assignedTo: "user-1",
    assignedToName: "Rajesh Kumar",
    createdAt: "2024-08-23T09:00:32Z",
    updatedAt: "2024-08-23T09:04:00Z",
    followUpDate: "2024-08-24T11:00:00Z",
    budget: "80L - 1Cr",
    requirements: "3BHK with parking",
    notes: "Interested in south-facing units"
  },
  {
    id: "RS1792",
    name: "Suresh Rajan",
    email: "suresh.rajan@email.com",
    phone: "+91 9443690870",
    project: "Silver Fields Phase 2",
    status: "new",
    subStatus: "warm",
    source: "99acres",
    medium: "99 Acres",
    assignedTo: "user-1",
    assignedToName: "Rajesh Kumar",
    createdAt: "2024-08-22T14:08:50Z",
    updatedAt: "2024-08-22T14:08:50Z",
    budget: "60L - 80L",
    requirements: "2BHK near metro"
  },
  {
    id: "RS1793",
    name: "Priya Mehta",
    email: "priya.mehta@email.com",
    phone: "+91 9944224809",
    project: "Silver Fields Phase 2",
    status: "new",
    subStatus: "cold",
    source: "website",
    medium: "Website",
    assignedTo: "user-1",
    assignedToName: "Rajesh Kumar",
    createdAt: "2024-08-22T11:16:23Z",
    updatedAt: "2024-08-22T11:16:23Z"
  },
  {
    id: "RS1794",
    name: "Arun Kumar",
    email: "arun.kumar@email.com",
    phone: "+91 9876123456",
    project: "Gold Mine Residency",
    status: "contacted",
    subStatus: "warm",
    source: "facebook",
    medium: "Facebook Ads",
    assignedTo: "user-2",
    assignedToName: "Amit Patel",
    createdAt: "2024-08-21T10:30:00Z",
    updatedAt: "2024-08-23T15:00:00Z",
    followUpDate: "2024-08-25T10:00:00Z",
    budget: "1Cr - 1.5Cr"
  },
  {
    id: "RS1795",
    name: "Lakshmi Venkat",
    email: "lakshmi.v@email.com",
    phone: "+91 9876789012",
    project: "Emerald Heights",
    status: "negotiation",
    subStatus: "hot",
    source: "referral",
    medium: "Referral",
    assignedTo: "user-3",
    assignedToName: "Sneha Reddy",
    createdAt: "2024-08-15T09:00:00Z",
    updatedAt: "2024-08-23T16:00:00Z",
    followUpDate: "2024-08-24T14:00:00Z",
    budget: "1.5Cr - 2Cr",
    requirements: "4BHK with garden"
  },
  {
    id: "RS1796",
    name: "Mohammed Ali",
    email: "m.ali@email.com",
    phone: "+91 9845123789",
    project: "Gold Mine Residency",
    status: "won",
    subStatus: "hot",
    source: "google_ads",
    medium: "Google Ads",
    assignedTo: "user-1",
    assignedToName: "Rajesh Kumar",
    createdAt: "2024-07-10T10:00:00Z",
    updatedAt: "2024-08-20T12:00:00Z",
    budget: "90L - 1Cr"
  },
  {
    id: "RS1797",
    name: "Deepa Krishnan",
    email: "deepa.k@email.com",
    phone: "+91 9876543100",
    project: "Silver Fields Phase 2",
    status: "lost",
    subStatus: "cold",
    source: "magicbricks",
    medium: "MagicBricks",
    assignedTo: "user-2",
    assignedToName: "Amit Patel",
    createdAt: "2024-07-05T11:00:00Z",
    updatedAt: "2024-08-15T10:00:00Z"
  },
  {
    id: "RS1798",
    name: "Ramesh Gupta",
    email: "ramesh.g@email.com",
    phone: "+91 9123456789",
    project: "Emerald Heights",
    status: "qualified",
    subStatus: "warm",
    source: "direct",
    medium: "Walk-in",
    assignedTo: "user-3",
    assignedToName: "Sneha Reddy",
    createdAt: "2024-08-20T14:30:00Z",
    updatedAt: "2024-08-23T09:00:00Z",
    followUpDate: "2024-08-26T10:00:00Z"
  },
  {
    id: "RS1799",
    name: "Kavitha Nair",
    email: "kavitha.n@email.com",
    phone: "+91 9087654321",
    project: "Gold Mine Residency",
    status: "contacted",
    subStatus: "hot",
    source: "website",
    medium: "Website",
    assignedTo: "user-4",
    assignedToName: "Vikram Singh",
    createdAt: "2024-08-22T16:00:00Z",
    updatedAt: "2024-08-23T11:00:00Z",
    followUpDate: "2024-08-24T15:00:00Z",
    budget: "70L - 90L"
  },
  {
    id: "RS1800",
    name: "Sanjay Sharma",
    email: "sanjay.s@email.com",
    phone: "+91 9876012345",
    project: "Silver Fields Phase 2",
    status: "new",
    subStatus: "warm",
    source: "facebook",
    medium: "Facebook Ads",
    assignedTo: "user-4",
    assignedToName: "Vikram Singh",
    createdAt: "2024-08-23T08:00:00Z",
    updatedAt: "2024-08-23T08:00:00Z"
  }
]

export const timelineEvents: TimelineEvent[] = [
  {
    id: "evt-1",
    leadId: "RS1791",
    type: "workflow",
    title: "New Lead Notification Triggered",
    description: "Workflow triggered: WhatsApp notification sent to lead",
    createdAt: "2024-08-23T09:00:36Z",
    createdBy: "system"
  },
  {
    id: "evt-2",
    leadId: "RS1791",
    type: "status_change",
    title: "Lead Status Updated",
    description: "Status changed from New to Qualified by Rajesh Kumar",
    createdAt: "2024-08-23T09:02:00Z",
    createdBy: "user-1"
  },
  {
    id: "evt-3",
    leadId: "RS1791",
    type: "call",
    title: "Outbound Call Made",
    description: "Call duration: 8 minutes. Customer interested in site visit.",
    createdAt: "2024-08-23T09:03:52Z",
    createdBy: "user-1"
  },
  {
    id: "evt-4",
    leadId: "RS1791",
    type: "comment",
    title: "Note Added",
    description: "Spoke to the customer and he asked to call back tomorrow 11 AM",
    createdAt: "2024-08-23T09:05:00Z",
    createdBy: "user-1"
  },
  {
    id: "evt-5",
    leadId: "RS1791",
    type: "sms",
    title: "SMS Sent",
    description: "Welcome SMS sent to lead",
    createdAt: "2024-08-23T09:00:36Z",
    createdBy: "system"
  },
  {
    id: "evt-6",
    leadId: "RS1792",
    type: "workflow",
    title: "New Lead Alert",
    description: "Auto-assignment completed. Lead assigned to Rajesh Kumar",
    createdAt: "2024-08-22T14:08:55Z",
    createdBy: "system"
  },
  {
    id: "evt-7",
    leadId: "RS1794",
    type: "email",
    title: "Email Sent",
    description: "Property brochure sent to client",
    createdAt: "2024-08-23T15:00:00Z",
    createdBy: "user-2"
  },
  {
    id: "evt-8",
    leadId: "RS1795",
    type: "meeting",
    title: "Site Visit Scheduled",
    description: "Site visit scheduled for August 24th, 2:00 PM",
    createdAt: "2024-08-23T16:00:00Z",
    createdBy: "user-3"
  }
]

export const callLogs: CallLog[] = [
  {
    id: "call-1",
    leadId: "RS1791",
    callerNumber: "+91 9876543210",
    callerTo: "+91 9360926633",
    duration: 480,
    direction: "outbound",
    status: "answered",
    recordingUrl: "/recordings/call-1.mp3",
    assignedTo: "user-1",
    createdAt: "2024-08-23T09:03:52Z"
  },
  {
    id: "call-2",
    leadId: "RS1791",
    callerNumber: "+91 9360926633",
    callerTo: "+91 9876543210",
    duration: 120,
    direction: "inbound",
    status: "answered",
    recordingUrl: "/recordings/call-2.mp3",
    assignedTo: "user-1",
    createdAt: "2024-08-22T16:30:00Z"
  },
  {
    id: "call-3",
    leadId: "RS1794",
    callerNumber: "+91 9876543212",
    callerTo: "+91 9876123456",
    duration: 300,
    direction: "outbound",
    status: "answered",
    recordingUrl: "/recordings/call-3.mp3",
    assignedTo: "user-2",
    createdAt: "2024-08-23T14:00:00Z"
  },
  {
    id: "call-4",
    leadId: "RS1795",
    callerNumber: "+91 9876543213",
    callerTo: "+91 9876789012",
    duration: 0,
    direction: "outbound",
    status: "missed",
    assignedTo: "user-3",
    createdAt: "2024-08-23T10:00:00Z"
  }
]

export const emailLogs: EmailLog[] = [
  {
    id: "email-1",
    leadId: "RS1791",
    subject: "Welcome to Gold Mine Residency",
    body: "Dear Badri, Thank you for your interest...",
    from: "rajesh@realestate.com",
    to: "badrinarayanan.rameshkumar@gmail.com",
    status: "opened",
    createdAt: "2024-08-23T09:10:00Z"
  },
  {
    id: "email-2",
    leadId: "RS1794",
    subject: "Gold Mine Residency - Property Brochure",
    body: "Dear Arun, Please find attached...",
    from: "amit@realestate.com",
    to: "arun.kumar@email.com",
    status: "delivered",
    createdAt: "2024-08-23T15:00:00Z"
  }
]

export const comments: Comment[] = [
  {
    id: "comment-1",
    leadId: "RS1791",
    text: "Spoke to the customer and he asked to call back tomorrow 11 AM",
    createdBy: "user-1",
    createdByName: "Rajesh Kumar",
    createdAt: "2024-08-23T09:05:00Z"
  },
  {
    id: "comment-2",
    leadId: "RS1791",
    text: "Customer confirmed interest in 3BHK south-facing unit",
    createdBy: "user-1",
    createdByName: "Rajesh Kumar",
    createdAt: "2024-08-22T17:00:00Z"
  },
  {
    id: "comment-3",
    leadId: "RS1794",
    text: "Client requested detailed floor plans for Tower B",
    createdBy: "user-2",
    createdByName: "Amit Patel",
    createdAt: "2024-08-23T14:30:00Z"
  }
]

export const dashboardStats: DashboardStats = {
  newLeads: 113,
  reEngaged: 11,
  todayFollowUp: 8,
  missedFollowUp: 31,
  todayLeads: 5,
  siteVisitCompleted: 27,
  booked: 25,
  allLeads: 348
}

export const projects = [
  "Gold Mine Residency",
  "Silver Fields Phase 2",
  "Emerald Heights",
  "Diamond Park",
  "Platinum Towers"
]
