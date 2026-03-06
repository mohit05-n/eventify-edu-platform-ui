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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"
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
  X
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
                              <Button variant="ghost" size="icon">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleDeleteEvent(event.id, event.title)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
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
            <DialogTitle className="text-xl">Participants — {participantsModalEvent?.title}</DialogTitle>
            <DialogDescription>Registered participants for this event</DialogDescription>
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
    </DashboardLayout>
  )
}