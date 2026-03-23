"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { DashboardLayout, PageHeader, ContentSection } from "@/components/dashboard-layout"
import { StatCard, StatsGrid } from "@/components/stat-card"
import { EventStatusBadge, TaskStatusBadge } from "@/components/task-status-badge"
import { EventWorkflowTimeline } from "@/components/progress-timeline"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import {
  Calendar,
  Plus,
  Users,
  DollarSign,
  TrendingUp,
  Eye,
  Loader2,
  BarChart3,
  FileText,
  Bell,
  CheckCircle,
  Award,
  Clock,
  AlertCircle,
  CreditCard,
  IndianRupee,
  Trash2,
  UserCheck,
  X,
  Download,
  FileBarChart2,
  Shield,
  XCircle,
  CheckSquare,
  ExternalLink,
  ClipboardCheck,
  FileSignature,
  Trophy,
  Target,
  BarChart4,
  Edit,
  FileQuestion
} from "lucide-react"
import Link from "next/link"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts"

export default function OrganiserDashboard() {
  const [session, setSession] = useState(null)
  const [events, setEvents] = useState([])
  const [notifications, setNotifications] = useState([])
  const [revenueData, setRevenueData] = useState({ summary: { totalRevenue: 0, successfulPayments: 0 }, revenueByEvent: [] })
  const [isLoading, setIsLoading] = useState(true)
  const [issuingCertEventId, setIssuingCertEventId] = useState(null)
  const [participantsModalEvent, setParticipantsModalEvent] = useState(null)
  const [participants, setParticipants] = useState([])
  const [loadingParticipants, setLoadingParticipants] = useState(false)
  const [proofsModalOpen, setProofsModalOpen] = useState(false)
  const [coordinatorProofs, setCoordinatorProofs] = useState([])
  const [loadingProofs, setLoadingProofs] = useState(false)
  const [proofFilter, setProofFilter] = useState("all")
  const [postEventModalEvent, setPostEventModalEvent] = useState(null)
  const [isSavingPostEvent, setIsSavingPostEvent] = useState(false)
  const [postEventForm, setPostEventForm] = useState({
    actual_attendance: "",
    summary: "",
    key_achievements: "",
    highlights: "",
    feedback_rating: "5"
  })
  const router = useRouter()

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      try {
        const sessionResponse = await fetch("/api/auth/session")
        const sessionData = await sessionResponse.json()

        if (!sessionData.session || sessionData.session.role !== "organiser") {
          router.push("/auth/login")
          return
        }

        setSession(sessionData.session)
        await Promise.all([
          fetchEvents(sessionData.session.userId),
          fetchNotifications(),
          fetchRevenueData()
        ])
      } catch (error) {
        console.error("[v0] Auth check error:", error)
        router.push("/auth/login")
      } finally {
        setIsLoading(false)
      }
    }

    checkAuthAndFetch()
  }, [router])

  const fetchEvents = async (userId) => {
    try {
      const response = await fetch(`/api/events/organiser?organiser_id=${userId}`)
      if (response.ok) {
        const data = await response.json()
        setEvents(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error("[v0] Fetch events error:", error)
    }
  }

  const fetchNotifications = async () => {
    try {
      const response = await fetch("/api/notifications?limit=5")
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
      }
    } catch (error) {
      console.error("[v0] Fetch notifications error:", error)
    }
  }

  const fetchRevenueData = async () => {
    try {
      const response = await fetch("/api/payments/organiser")
      if (response.ok) {
        const data = await response.json()
        setRevenueData(data)
      }
    } catch (error) {
      console.error("[v0] Fetch revenue error:", error)
    }
  }

  const fetchParticipants = async (event) => {
    setParticipantsModalEvent(event)
    setLoadingParticipants(true)
    try {
      const response = await fetch(`/api/registrations?event_id=${event.id}`)
      if (response.ok) {
        const data = await response.json()
        setParticipants(Array.isArray(data) ? data : [])
      } else {
        setParticipants([])
      }
    } catch (error) {
      console.error("[v0] Fetch participants error:", error)
      setParticipants([])
    } finally {
      setLoadingParticipants(false)
    }
  }

  const fetchCoordinatorProofs = async () => {
    setLoadingProofs(true)
    try {
      const response = await fetch("/api/task-proofs")
      if (response.ok) {
        const data = await response.json()
        setCoordinatorProofs(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error("[v0] Fetch proofs error:", error)
    } finally {
      setLoadingProofs(false)
    }
  }

  const handleUpdateProofStatus = async (proofId, status, notes = "") => {
    try {
      const response = await fetch("/api/task-proofs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: proofId, status, reviewer_notes: notes })
      })

      if (response.ok) {
        toast.success(`Proof marked as ${status}`)
        fetchCoordinatorProofs()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to update proof status")
      }
    } catch (error) {
      console.error("[v0] Update proof status error:", error)
      toast.error("An error occurred. Please try again.")
    }
  }

  const handleOpenPostEvent = (event) => {
    setPostEventModalEvent(event)
    if (event.post_event_data) {
      setPostEventForm({
        actual_attendance: event.post_event_data.actual_attendance || "",
        summary: event.post_event_data.summary || "",
        key_achievements: event.post_event_data.key_achievements || "",
        highlights: event.post_event_data.highlights || "",
        feedback_rating: event.post_event_data.feedback_rating || "5"
      })
    } else {
      setPostEventForm({
        actual_attendance: event.current_capacity || "",
        summary: "",
        key_achievements: "",
        highlights: "",
        feedback_rating: "5"
      })
    }
  }

  const handleSavePostEvent = async () => {
    if (!postEventModalEvent) return
    setIsSavingPostEvent(true)
    try {
      const response = await fetch(`/api/events/${postEventModalEvent.id}/post-event`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_event_data: postEventForm })
      })

      if (response.ok) {
        toast.success("Post-event details updated!")
        setPostEventModalEvent(null)
        fetchEvents(session.userId) // Refresh list
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to save")
      }
    } catch (e) {
      toast.error("Network error")
    } finally {
      setIsSavingPostEvent(false)
    }
  }

  const handleDownloadPostEventReport = () => {
    if (!postEventModalEvent) return
    
    const event = postEventModalEvent
    const data = postEventForm
    const totalReg = event.current_capacity || 0
    const attendanceRate = data.actual_attendance ? ((parseInt(data.actual_attendance) / totalReg) * 100).toFixed(1) : "0"

    const html = `<!DOCTYPE html>
<html>
<head>
    <title>Post Event Report — ${event.title}</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; line-height: 1.6; }
        .header { text-align: center; border-bottom: 2px solid #6366f1; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { color: #6366f1; margin-bottom: 5px; }
        .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; }
        .stat-card { background: #f8fafc; padding: 20px; border-radius: 10px; text-align: center; border: 1px solid #e2e8f0; }
        .stat-card .value { font-size: 24px; font-weight: bold; color: #1e293b; }
        .stat-card .label { font-size: 14px; color: #64748b; }
        .section { margin-bottom: 25px; }
        .section h2 { border-left: 4px solid #6366f1; padding-left: 10px; font-size: 18px; margin-bottom: 15px; color: #1e293b; }
        .content-box { background: white; border: 1px solid #f1f5f9; padding: 15px; border-radius: 8px; }
        .footer { margin-top: 50px; font-size: 12px; color: #94a3b8; text-align: center; }
    </style>
</head>
<body>
    <div class="header">
        <h1>POST-EVENT ANALYSIS</h1>
        <p>${event.title}</p>
        <p>${new Date(event.start_date).toLocaleDateString()} — ${new Date(event.end_date).toLocaleDateString()}</p>
    </div>

    <div class="stats-grid">
        <div class="stat-card"><div class="value">${totalReg}</div><div class="label">Total Registered</div></div>
        <div class="stat-card"><div class="value">${data.actual_attendance || "—"}</div><div class="label">Actual Attendance</div></div>
        <div class="stat-card"><div class="value">${attendanceRate}%</div><div class="label">Attendance rate</div></div>
    </div>

    <div class="section">
        <h2>Event Summary</h2>
        <div class="content-box">${data.summary || "No summary provided."}</div>
    </div>

    <div class="section">
        <h2>Key Achievements</h2>
        <div class="content-box">${data.key_achievements || "No achievements recorded."}</div>
    </div>

    <div class="section">
        <h2>Highlights & Feedback</h2>
        <div class="content-box">
            <p><strong>Feedback Score:</strong> ${data.feedback_rating}/10</p>
            <p>${data.highlights || "No highlights provided."}</p>
        </div>
    </div>

    <div class="footer">Generated by EventifyEDU Platform • ${new Date().toLocaleString()}</div>
</body>
</html>`;

    const win = window.open('', '_blank')
    win.document.write(html)
    win.document.close()
  }

  const handleDeleteEvent = async (eventId, eventTitle) => {
    if (!confirm(`Are you sure you want to delete "${eventTitle}"? This action cannot be undone and will delete all associated registrations and payments.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/events/${eventId}/delete`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("Event deleted successfully");
        setEvents(events.filter(event => event.id !== eventId));
      } else {
        const error = await response.json();
        alert(error.error || "Failed to delete event");
      }
    } catch (error) {
      console.error("[v0] Delete event error:", error);
      alert("An error occurred while deleting the event");
    }
  };

  const handleDownloadCSV = () => {
    if (participants.length === 0) {
      alert("No participants to export");
      return;
    }

    const headers = ["Name", "Email", "Phone", "Enrollment ID", "Semester", "Branch", "Gender", "Registration Date", "Ticket ID", "Status"];
    const rows = participants.map((p, idx) => [
      p.participant_name || p.user_name || "",
      p.participant_email || p.user_email || "",
      p.participant_phone || "",
      p.participant_enrollment_id || "",
      p.participant_semester || "",
      p.participant_branch || "",
      p.participant_gender || "",
      new Date(p.created_at).toLocaleDateString(),
      p.booking_id || `REG-${p.id}`,
      p.status || "confirmed"
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `participants_${participantsModalEvent?.title?.replace(/\s+/g, '_').toLowerCase() || 'event'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGenerateReport = async (event) => {
    // Fetch participants for this event
    let eventParticipants = [];
    try {
      const res = await fetch(`/api/registrations?event_id=${event.id}`);
      if (res.ok) eventParticipants = await res.json();
    } catch (e) { console.error(e); }

    const confirmed = eventParticipants.filter(p => p.status === 'confirmed').length;
    const pending = eventParticipants.filter(p => p.status === 'pending').length;
    const totalRevenue = eventParticipants
      .filter(p => p.status === 'confirmed')
      .length * parseFloat(event.price || 0);

    const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';
    const formatDateTime = (d) => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A';

    const participantRows = eventParticipants.map((p, i) => `
      <tr class="${i % 2 === 0 ? 'even' : 'odd'}">
        <td>${i + 1}</td>
        <td>${p.participant_name || p.user_name || '-'}</td>
        <td>${p.participant_email || p.user_email || '-'}</td>
        <td>${p.participant_phone || '-'}</td>
        <td>${p.participant_enrollment_id || '-'}</td>
        <td>${p.participant_semester || '-'}</td>
        <td>${p.participant_branch || '-'}</td>
        <td>${p.participant_gender || '-'}</td>
        <td><span class="badge badge-${p.status}">${p.status}</span></td>
        <td>${formatDate(p.created_at)}</td>
      </tr>`).join('');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Event Report — ${event.title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; background: #f8fafc; color: #1e293b; padding: 32px; }
    .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; border-radius: 16px; padding: 32px; margin-bottom: 28px; }
    .header h1 { font-size: 26px; font-weight: 700; margin-bottom: 6px; }
    .header .subtitle { font-size: 13px; opacity: 0.85; margin-bottom: 16px; }
    .meta-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-top: 16px; }
    .meta-item { background: rgba(255,255,255,0.15); border-radius: 10px; padding: 12px 14px; }
    .meta-item .label { font-size: 11px; opacity: 0.75; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
    .meta-item .value { font-size: 14px; font-weight: 600; }
    .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 28px; }
    .stat-card { background: white; border-radius: 12px; padding: 20px; box-shadow: 0 1px 4px rgba(0,0,0,0.07); border-left: 4px solid; }
    .stat-card.total { border-color: #6366f1; }
    .stat-card.confirmed { border-color: #22c55e; }
    .stat-card.pending { border-color: #f59e0b; }
    .stat-card.revenue { border-color: #3b82f6; }
    .stat-card .num { font-size: 28px; font-weight: 700; margin-bottom: 4px; }
    .stat-card.total .num { color: #6366f1; }
    .stat-card.confirmed .num { color: #22c55e; }
    .stat-card.pending .num { color: #f59e0b; }
    .stat-card.revenue .num { color: #3b82f6; }
    .stat-card .lbl { font-size: 12px; color: #64748b; font-weight: 500; }
    .section { background: white; border-radius: 12px; box-shadow: 0 1px 4px rgba(0,0,0,0.07); margin-bottom: 24px; overflow: hidden; }
    .section-header { padding: 18px 24px; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; gap: 10px; }
    .section-header h2 { font-size: 15px; font-weight: 600; color: #1e293b; }
    .section-header .count { background: #f1f5f9; color: #64748b; font-size: 12px; font-weight: 600; padding: 2px 8px; border-radius: 20px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { background: #f8fafc; padding: 10px 14px; text-align: left; font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.4px; border-bottom: 1px solid #e2e8f0; }
    td { padding: 10px 14px; border-bottom: 1px solid #f1f5f9; color: #334155; }
    tr.even { background: #fafafa; }
    tr:last-child td { border-bottom: none; }
    .badge { padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 600; }
    .badge-confirmed { background: #dcfce7; color: #166534; }
    .badge-pending { background: #fef9c3; color: #854d0e; }
    .badge-cancelled { background: #fee2e2; color: #991b1b; }
    .footer { text-align: center; font-size: 11px; color: #94a3b8; margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; }
    .no-participants { padding: 40px; text-align: center; color: #94a3b8; font-size: 14px; }
    @media print {
      body { background: white; padding: 16px; }
      .no-print { display: none; }
      .section { box-shadow: none; border: 1px solid #e2e8f0; }
    }
  </style>
</head>
<body>
  <div style="text-align:right;margin-bottom:16px" class="no-print">
    <button onclick="window.print()" style="background:#6366f1;color:white;border:none;padding:10px 22px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer">🖨 Print / Save as PDF</button>
  </div>

  <div class="header">
    <div style="display:flex;justify-content:space-between;align-items:flex-start">
      <div>
        <h1>${event.title}</h1>
        <div class="subtitle">Event Report &nbsp;•&nbsp; Generated on ${formatDateTime(new Date())}</div>
        <span style="background:rgba(255,255,255,0.2);padding:3px 12px;border-radius:20px;font-size:12px;font-weight:600;text-transform:capitalize">${event.status || 'Completed'}</span>
      </div>
      <div style="text-align:right;font-size:13px;opacity:0.85">
        <div style="font-weight:600;font-size:16px">EventifyEDU</div>
        <div>Organiser: ${session?.name || 'N/A'}</div>
      </div>
    </div>
    <div class="meta-grid">
      <div class="meta-item"><div class="label">📅 Start Date</div><div class="value">${formatDateTime(event.start_date)}</div></div>
      <div class="meta-item"><div class="label">📅 End Date</div><div class="value">${formatDateTime(event.end_date)}</div></div>
      <div class="meta-item"><div class="label">📍 Location</div><div class="value">${event.location || 'N/A'}</div></div>
      <div class="meta-item"><div class="label">🏷 Category</div><div class="value" style="text-transform:capitalize">${event.category || 'N/A'}</div></div>
      <div class="meta-item"><div class="label">💰 Ticket Price</div><div class="value">${parseFloat(event.price || 0) > 0 ? '₹' + parseFloat(event.price).toFixed(2) : 'Free'}</div></div>
      <div class="meta-item"><div class="label">🪑 Capacity</div><div class="value">${event.current_capacity || 0} / ${event.max_capacity || 'Unlimited'}</div></div>
    </div>
  </div>

  <div class="stats">
    <div class="stat-card total"><div class="num">${eventParticipants.length}</div><div class="lbl">Total Registered</div></div>
    <div class="stat-card confirmed"><div class="num">${confirmed}</div><div class="lbl">Confirmed</div></div>
    <div class="stat-card pending"><div class="num">${pending}</div><div class="lbl">Pending / Unpaid</div></div>
    <div class="stat-card revenue"><div class="num">${parseFloat(event.price || 0) > 0 ? '₹' + totalRevenue.toLocaleString('en-IN') : '—'}</div><div class="lbl">Revenue Collected</div></div>
  </div>

  <div class="section">
    <div class="section-header">
      <h2>👥 Participant Details</h2>
      <span class="count">${eventParticipants.length} participants</span>
    </div>
    ${eventParticipants.length > 0 ? `
    <table>
      <thead>
        <tr>
          <th>#</th><th>Name</th><th>Email</th><th>Phone</th>
          <th>Enrollment ID</th><th>Semester</th><th>Branch</th><th>Gender</th>
          <th>Status</th><th>Reg. Date</th>
        </tr>
      </thead>
      <tbody>${participantRows}</tbody>
    </table>` : '<div class="no-participants">No participants registered for this event.</div>'}
  </div>

  <div class="footer">
    Report generated by EventifyEDU &nbsp;•&nbsp; ${formatDateTime(new Date())} &nbsp;•&nbsp; ${event.title}
  </div>
</body>
</html>`;

    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
  };

  const stats = [
    {
      title: "Total Events",
      value: events.length.toString(),
      icon: Calendar,
      color: "purple",
      description: "Events you've created"
    },
    {
      title: "Active Events",
      value: events.filter(e => e.status === "approved").length.toString(),
      icon: CheckCircle,
      color: "green",
      description: "Currently running"
    },
    {
      title: "Pending Approval",
      value: events.filter(e => e.status === "pending").length.toString(),
      icon: Clock,
      color: "orange",
      description: "Awaiting admin review"
    },
    {
      title: "Total Revenue",
      value: `₹${revenueData.summary?.totalRevenue?.toLocaleString() || 0}`,
      icon: IndianRupee,
      color: "blue",
      description: `${revenueData.summary?.successfulPayments || 0} successful payments`
    }
  ]

  const registrationData = events.slice(0, 5).map(event => ({
    name: event.title?.substring(0, 15) + (event.title?.length > 15 ? "..." : "") || "Event",
    registrations: event.current_capacity || 0,
    capacity: event.max_capacity || 100
  }))

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <DashboardLayout session={session}>
      <PageHeader
        title="Organizer Dashboard"
        description={`Welcome back, ${session?.name || "Organizer"}! Manage your events and track performance.`}
        actions={
          <Link href="/organiser/create-event">
            <Button size="lg" className="gap-2">
              <Plus className="w-4 h-4" />
              Create Event
            </Button>
          </Link>
        }
      />

      {/* Stats */}
      <div className="mb-8">
        <StatsGrid columns={4}>
          {stats.map((stat, index) => (
            <StatCard key={stat.title} {...stat} delay={index} />
          ))}
        </StatsGrid>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Events List */}
        <div className="lg:col-span-2 space-y-6">
          <ContentSection title="My Events" description="Manage and track your events">
            <Card>
              <CardContent className="p-0">
                {events.length > 0 ? (
                  <div className="divide-y divide-border">
                    {events.slice(0, 6).map((event, index) => (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-medium truncate">{event.title}</h4>
                              <EventStatusBadge status={event.status} />
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {new Date(event.start_date).toLocaleDateString()}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                {event.current_capacity || 0}/{event.max_capacity || 100}
                              </span>
                            </div>
                            <Progress
                              value={((event.current_capacity || 0) / (event.max_capacity || 100)) * 100}
                              className="h-2"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            {event.status === 'approved' && new Date(event.end_date) < new Date() && (
                              <div className="flex items-center gap-2">
                                {event.certificates_issued_count > 0 ? (
                                  <Badge variant="secondary" className="gap-2 py-1.5 text-green-700 bg-green-50 border-green-200">
                                    <CheckCircle className="w-3.5 h-3.5" />
                                    Certificates Issued
                                  </Badge>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-2 text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                                    disabled={issuingCertEventId === event.id}
                                    onClick={async (e) => {
                                      e.preventDefault();
                                      if (confirm(`Issue certificates for "${event.title}"? This will notify all confirmed participants.`)) {
                                        try {
                                          setIssuingCertEventId(event.id);
                                          const res = await fetch(`/api/events/${event.id}/issue-certificates`, { method: 'POST' });
                                          const data = await res.json();
                                          if (res.ok) {
                                            alert(data.message || `Certificates issued successfully!`);
                                            // Refresh events to update the UI state
                                            fetchEvents(session.userId);
                                          } else {
                                            alert(data.error || "Failed to issue certificates");
                                          }
                                        } catch (err) {
                                          console.error(err);
                                          alert("An error occurred. Please try again.");
                                        } finally {
                                          setIssuingCertEventId(null);
                                        }
                                      }
                                    }}
                                  >
                                    {issuingCertEventId === event.id ? (
                                      <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Issuing...
                                      </>
                                    ) : (
                                      <>
                                        <Award className="w-4 h-4" />
                                        Issue Certificates
                                      </>
                                    )}
                                  </Button>
                                )}
                              </div>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              title="View Participants"
                              onClick={() => fetchParticipants(event)}
                            >
                              <UserCheck className="w-4 h-4" />
                            </Button>
                            <Link href={`/organiser/events/${event.id}`}>
                              <Button variant="ghost" size="icon" title="View Event">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Generate Report"
                              className="text-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
                              onClick={() => handleGenerateReport(event)}
                            >
                              <FileBarChart2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleDeleteEvent(event.id, event.title)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                            {event.status === 'approved' && new Date(event.end_date) < new Date() && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-2 border-primary/20 hover:bg-primary/5 text-primary ml-2"
                                onClick={() => handleOpenPostEvent(event)}
                              >
                                <FileSignature className="w-4 h-4" />
                                Post Event
                              </Button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No events yet. Create your first event!</p>
                    <Link href="/organiser/create-event">
                      <Button className="mt-4" variant="outline">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Event
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </ContentSection>

          {/* Registration Chart */}
          {events.length > 0 && (
            <ContentSection title="Event Registrations" description="Registration status across your events">
              <Card>
                <CardContent className="p-6">
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={registrationData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="registrations" fill="oklch(0.42 0.19 281)" name="Registrations" />
                      <Bar dataKey="capacity" fill="oklch(0.42 0.19 281 / 0.3)" name="Capacity" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </ContentSection>
          )}
        </div>

        {/* Sidebar Content */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <ContentSection title="Quick Actions">
            <Card>
              <CardContent className="p-4 space-y-2">
                <Link href="/organiser/create-event" className="block">
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Plus className="w-4 h-4" />
                    Create New Event
                  </Button>
                </Link>
                <Link href="/organiser/events" className="block">
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Calendar className="w-4 h-4" />
                    View All Events
                  </Button>
                </Link>
                <Link href="/organiser/notifications" className="block">
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Bell className="w-4 h-4" />
                    Notifications
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-2 border-primary/20 hover:bg-primary/5 text-primary"
                  onClick={() => {
                    setProofsModalOpen(true)
                    fetchCoordinatorProofs()
                  }}
                >
                  <ClipboardCheck className="w-4 h-4" />
                  Coordinator Proofs
                </Button>
              </CardContent>
            </Card>
          </ContentSection>

          {/* Recent Notifications */}
          <ContentSection title="Recent Notifications">
            <Card>
              <CardContent className="p-0">
                {notifications.length > 0 ? (
                  <div className="divide-y divide-border">
                    {notifications.slice(0, 5).map((notification, index) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className={`p-4 ${!notification.is_read ? 'bg-primary/5' : ''}`}
                      >
                        <p className={`text-sm ${!notification.is_read ? 'font-medium' : ''}`}>
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(notification.created_at).toLocaleDateString()}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-muted-foreground text-sm">
                    No notifications yet
                  </div>
                )}
              </CardContent>
            </Card>
          </ContentSection>
        </div>
      </div>

      {/* View Participants Modal */}
      <Dialog open={!!participantsModalEvent} onOpenChange={(open) => { if (!open) setParticipantsModalEvent(null) }}>
        <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between pr-8">
              <div>
                <DialogTitle className="text-xl">Participants — {participantsModalEvent?.title}</DialogTitle>
                <DialogDescription>Registered participants for this event</DialogDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-primary/20 hover:bg-primary/5"
                onClick={handleDownloadCSV}
                disabled={participants.length === 0}
              >
                <Download className="w-4 h-4 text-primary" />
                Download CSV
              </Button>
            </div>
          </DialogHeader>

          {loadingParticipants ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <Card>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{participants.length}</p>
                      <p className="text-xs text-muted-foreground">Total Registered</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-500/10">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{participants.filter(p => p.status === 'confirmed').length}</p>
                      <p className="text-xs text-muted-foreground">Total Attendees</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Participants Table */}
              {participants.length > 0 ? (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Enrollment ID</TableHead>
                        <TableHead>Semester</TableHead>
                        <TableHead>Branch</TableHead>
                        <TableHead>Gender</TableHead>
                        <TableHead>Registration Date</TableHead>
                        <TableHead>Ticket ID</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {participants.map((p, idx) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">{idx + 1}</TableCell>
                          <TableCell>{p.participant_name || p.user_name}</TableCell>
                          <TableCell className="text-muted-foreground">{p.participant_email || p.user_email}</TableCell>
                          <TableCell>{p.participant_phone || '—'}</TableCell>
                          <TableCell>{p.participant_enrollment_id || '—'}</TableCell>
                          <TableCell>{p.participant_semester || '—'}</TableCell>
                          <TableCell>{p.participant_branch || '—'}</TableCell>
                          <TableCell>{p.participant_gender || '—'}</TableCell>
                          <TableCell>{new Date(p.created_at).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{p.booking_id || `REG-${p.id}`}</code>
                          </TableCell>
                          <TableCell>
                            <Badge variant={p.status === 'confirmed' ? 'default' : p.status === 'pending' ? 'secondary' : 'destructive'}
                              className={p.status === 'confirmed' ? 'bg-green-100 text-green-700 hover:bg-green-100' : ''}
                            >
                              {p.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No participants registered for this event yet.</p>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Coordinator Proofs Review Modal */}
      <Dialog open={proofsModalOpen} onOpenChange={setProofsModalOpen}>
        <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <div>
                <DialogTitle>Coordinator Task Proofs</DialogTitle>
                <DialogDescription>Review and verify offline registration tasks submitted by coordinators</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <Tabs defaultValue="all" className="w-full" onValueChange={setProofFilter}>
            <TabsList className="grid grid-cols-5 w-full mb-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="submitted">Pending</TabsTrigger>
              <TabsTrigger value="verified">Verified</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
              <TabsTrigger value="needs_resubmission">Resubmit</TabsTrigger>
            </TabsList>

            <TabsContent value={proofFilter} className="mt-0">
              {loadingProofs ? (
                <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
              ) : coordinatorProofs.filter(p => proofFilter === "all" || p.status === proofFilter).length > 0 ? (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Coordinator</TableHead>
                        <TableHead>Event & Task</TableHead>
                        <TableHead>Proof</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {coordinatorProofs
                        .filter(p => proofFilter === "all" || p.status === proofFilter)
                        .map((proof) => (
                          <TableRow key={proof.id}>
                            <TableCell>
                              <div className="font-medium text-sm">{proof.coordinator_name}</div>
                              <div className="text-xs text-muted-foreground">{new Date(proof.uploaded_at).toLocaleDateString()}</div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium text-sm">{proof.event_title}</div>
                              <div className="text-xs text-primary font-medium">{proof.task_title}</div>
                              {proof.participant_name && <div className="text-xs text-muted-foreground">For: {proof.participant_name}</div>}
                            </TableCell>
                            <TableCell>
                              {proof.file_url ? (
                                <a 
                                  href={proof.file_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="inline-flex items-center gap-1.5 p-1.5 rounded-md bg-muted hover:bg-muted/80 text-xs font-medium transition-colors"
                                >
                                  {proof.file_type?.startsWith('image/') ? <Eye className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                                  View Proof
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              ) : <span className="text-xs text-muted-foreground italic">No file</span>}
                            </TableCell>
                            <TableCell>
                              <TaskStatusBadge status={proof.status} size="sm" />
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                {proof.status === 'submitted' || proof.status === 'needs_resubmission' ? (
                                  <>
                                    <Button 
                                      size="sm" 
                                      variant="ghost" 
                                      className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                      onClick={() => handleUpdateProofStatus(proof.id, 'verified')}
                                      title="Verify"
                                    >
                                      <CheckSquare className="w-4 h-4" />
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="ghost" 
                                      className="h-8 w-8 p-0 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                                      onClick={() => {
                                        const notes = prompt("Enter notes for resubmission:");
                                        if (notes !== null) handleUpdateProofStatus(proof.id, 'needs_resubmission', notes);
                                      }}
                                      title="Needs Resubmission"
                                    >
                                      <AlertCircle className="w-4 h-4" />
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="ghost" 
                                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                      onClick={() => {
                                        const notes = prompt("Enter reason for rejection:");
                                        if (notes !== null) handleUpdateProofStatus(proof.id, 'rejected', notes);
                                      }}
                                      title="Reject"
                                    >
                                      <XCircle className="w-4 h-4" />
                                    </Button>
                                  </>
                                ) : (
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="text-xs h-7"
                                    onClick={() => handleUpdateProofStatus(proof.id, 'submitted', "Reset for re-review")}
                                  >
                                    Reset
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-20 text-muted-foreground">
                  <ClipboardCheck className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>No proof submissions found for this filter.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Post Event Details Modal */}
      <Dialog open={!!postEventModalEvent} onOpenChange={(open) => !open && setPostEventModalEvent(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-indigo-500" />
              <div>
                <DialogTitle>Post Event Details — {postEventModalEvent?.title}</DialogTitle>
                <DialogDescription>Record the final outcomes and analysis for this event</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="attendance">Actual Attendance</Label>
                <div className="relative">
                  <Users className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input 
                    id="attendance" 
                    type="number" 
                    className="pl-9"
                    placeholder="Approx number of attendees"
                    value={postEventForm.actual_attendance}
                    onChange={(e) => setPostEventForm({...postEventForm, actual_attendance: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="rating">Overall Feedback (1-10)</Label>
                <div className="relative">
                  <Target className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input 
                    id="rating" 
                    type="number" 
                    min="1" max="10"
                    className="pl-9"
                    value={postEventForm.feedback_rating}
                    onChange={(e) => setPostEventForm({...postEventForm, feedback_rating: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="summary">Event Summary</Label>
              <Textarea 
                id="summary" 
                placeholder="Provide a brief overview of how the event went..."
                className="min-h-[100px]"
                value={postEventForm.summary}
                onChange={(e) => setPostEventForm({...postEventForm, summary: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="achievements">Key Achievements</Label>
              <Textarea 
                id="achievements" 
                placeholder="What were the major successes or targets reached?"
                value={postEventForm.key_achievements}
                onChange={(e) => setPostEventForm({...postEventForm, key_achievements: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="highlights">Highlights & Memorable Moments</Label>
              <Textarea 
                id="highlights" 
                placeholder="Any special mentions or unexpected highlights..."
                value={postEventForm.highlights}
                onChange={(e) => setPostEventForm({...postEventForm, highlights: e.target.value})}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={handleDownloadPostEventReport}
            >
              <BarChart4 className="w-4 h-4" />
              Download Post Event Report
            </Button>
            <div className="flex-1" />
            <Button 
              variant="outline" 
              onClick={() => setPostEventModalEvent(null)}
            >
              Cancel
            </Button>
            <Button 
              className="gap-2"
              disabled={isSavingPostEvent}
              onClick={handleSavePostEvent}
            >
              {isSavingPostEvent ? <Loader2 className="w-4 h-4 animate-spin" /> : <ClipboardCheck className="w-4 h-4" />}
              Save Details
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}