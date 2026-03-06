"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { DashboardLayout, PageHeader, ContentSection } from "@/components/dashboard-layout"
import { StatCard, StatsGrid } from "@/components/stat-card"
import { TaskStatusBadge, PriorityBadge, EventStatusBadge } from "@/components/task-status-badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import {
    Calendar,
    ClipboardList,
    Users,
    CheckCircle,
    Clock,
    AlertCircle,
    Eye,
    Plus,
    Loader2,
    MapPin,
    UserCheck,
    Award,
    Shield,
    Percent,
    Search,
    Filter,
    Download
} from "lucide-react"
import Link from "next/link"

export default function CoordinatorDashboard() {
    const [session, setSession] = useState(null)
    const [assignedEvents, setAssignedEvents] = useState([])
    const [tasks, setTasks] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [participantsModalEvent, setParticipantsModalEvent] = useState(null)
    const [participants, setParticipants] = useState([])
    const [participantStats, setParticipantStats] = useState({ total: 0, checkedIn: 0, remaining: 0, attendancePercent: 0 })
    const [loadingParticipants, setLoadingParticipants] = useState(false)
    const [actionLoading, setActionLoading] = useState(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [activeFilter, setActiveFilter] = useState("all")
    const router = useRouter()

    const isEventCoordinator = session?.role === "event_coordinator"

    useEffect(() => {
        const checkAuthAndFetch = async () => {
            try {
                const sessionResponse = await fetch("/api/auth/session")
                const sessionData = await sessionResponse.json()

                if (!sessionData.session || !["event_coordinator", "student_coordinator"].includes(sessionData.session.role)) {
                    router.push("/auth/login")
                    return
                }

                setSession(sessionData.session)
                await Promise.all([
                    fetchAssignedEvents(),
                    fetchTasks()
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

    const fetchAssignedEvents = async () => {
        try {
            const response = await fetch("/api/assignments")
            if (response.ok) {
                const data = await response.json()
                setAssignedEvents(Array.isArray(data) ? data : [])
            }
        } catch (error) {
            console.error("[v0] Fetch assigned events error:", error)
        }
    }

    const fetchTasks = async () => {
        try {
            const response = await fetch("/api/tasks")
            if (response.ok) {
                const data = await response.json()
                setTasks(Array.isArray(data) ? data : [])
            }
        } catch (error) {
            console.error("[v0] Fetch tasks error:", error)
        }
    }

    const fetchParticipants = async (event) => {
        setParticipantsModalEvent(event)
        setLoadingParticipants(true)
        setSearchQuery("")
        setActiveFilter("all")
        try {
            const response = await fetch(`/api/events/${event.event_id}/coordinator-participants`)
            if (response.ok) {
                const data = await response.json()
                setParticipants(data.participants || [])
                setParticipantStats(data.stats || { total: 0, checkedIn: 0, remaining: 0, attendancePercent: 0 })
            } else {
                const err = await response.json()
                alert(err.error || "Failed to load participants")
                setParticipantsModalEvent(null)
            }
        } catch (error) {
            console.error("[v0] Fetch participants error:", error)
            setParticipantsModalEvent(null)
        } finally {
            setLoadingParticipants(false)
        }
    }

    const handleParticipantAction = async (registrationId, action) => {
        if (!participantsModalEvent) return
        setActionLoading(registrationId)
        try {
            const response = await fetch(`/api/events/${participantsModalEvent.event_id}/coordinator-participants`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action, registrationId })
            })
            if (response.ok) {
                await fetchParticipants(participantsModalEvent)
            } else {
                const err = await response.json()
                alert(err.error || "Action failed")
            }
        } catch (error) {
            console.error("[v0] Participant action error:", error)
            alert("An error occurred")
        } finally {
            setActionLoading(null)
        }
    }

    // Client-side search and filter
    const filteredParticipants = participants.filter(p => {
        const name = (p.participant_name || p.user_name || "").toLowerCase()
        const email = (p.participant_email || p.user_email || "").toLowerCase()
        const ticketId = (p.booking_id || `REG-${p.id}`).toLowerCase()
        const q = searchQuery.toLowerCase()

        const matchesSearch = !q || name.includes(q) || email.includes(q) || ticketId.includes(q)

        let matchesFilter = true
        if (activeFilter === "checked_in") matchesFilter = p.attendance_status === "present"
        else if (activeFilter === "not_checked_in") matchesFilter = p.attendance_status !== "present"
        else if (activeFilter === "cert_eligible") matchesFilter = p.certificate_eligible === true

        return matchesSearch && matchesFilter
    })

    // CSV export
    const handleExportCSV = () => {
        const headers = ["Name", "Email", "Phone", "Ticket ID", "Attendance Status", "Certificate Status"]
        const rows = participants.map(p => [
            p.participant_name || p.user_name || "",
            p.participant_email || p.user_email || "",
            p.participant_phone || "",
            p.booking_id || `REG-${p.id}`,
            p.attendance_status || "absent",
            p.certificate_eligible ? "eligible" : "not eligible"
        ])

        const csv = [headers.join(","), ...rows.map(r => r.map(v => `"${v}"`).join(","))].join("\n")
        const blob = new Blob([csv], { type: "text/csv" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `participants-${participantsModalEvent?.event_title || "event"}.csv`
        a.click()
        URL.revokeObjectURL(url)
    }

    const stats = [
        {
            title: "Assigned Events",
            value: assignedEvents.length.toString(),
            icon: Calendar,
            color: "purple",
            description: "Events under your coordination"
        },
        {
            title: "Total Tasks",
            value: tasks.length.toString(),
            icon: ClipboardList,
            color: "blue",
            description: "Tasks across all events"
        },
        {
            title: "Pending Review",
            value: tasks.filter(t => t.status === "submitted").length.toString(),
            icon: Clock,
            color: "orange",
            description: "Proofs awaiting approval"
        },
        {
            title: "Completed",
            value: tasks.filter(t => t.status === "approved").length.toString(),
            icon: CheckCircle,
            color: "green",
            description: "Successfully completed tasks"
        }
    ]

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
                title={isEventCoordinator ? "Event Coordinator Dashboard" : "Student Coordinator Dashboard"}
                description={`Welcome back, ${session?.name || "Coordinator"}! Manage your assigned events and tasks.`}
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Assigned Events */}
                <ContentSection title="My Assigned Events" description="Events you're coordinating" className="lg:col-span-2">
                    <Card>
                        <CardContent className="p-0">
                            {assignedEvents.length > 0 ? (
                                <div className="divide-y divide-border">
                                    {assignedEvents.map((event, index) => (
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
                                                        <h4 className="font-semibold truncate">{event.event_title}</h4>
                                                        <EventStatusBadge status={event.event_status} />
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="w-3.5 h-3.5" />
                                                            {new Date(event.start_date).toLocaleDateString()} {new Date(event.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <MapPin className="w-3.5 h-3.5" />
                                                            {event.location || "TBD"}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Users className="w-3.5 h-3.5" />
                                                            Organiser: {event.organiser_name || "Unknown"}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="gap-1.5"
                                                        onClick={() => fetchParticipants(event)}
                                                    >
                                                        <UserCheck className="w-4 h-4" />
                                                        View Participants
                                                    </Button>
                                                    <Link href={`/coordinator/events/${event.event_id}`}>
                                                        <Button variant="ghost" size="icon">
                                                            <Eye className="w-4 h-4" />
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center text-muted-foreground">
                                    <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p>No events assigned yet</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </ContentSection>

                {/* Tasks Needing Review */}
                <ContentSection title="Pending Reviews" description="Task proofs awaiting approval">
                    <Card>
                        <CardContent className="p-0">
                            {tasks.filter(t => t.status === "submitted").length > 0 ? (
                                <div className="divide-y divide-border">
                                    {tasks.filter(t => t.status === "submitted").slice(0, 5).map((task, index) => (
                                        <motion.div
                                            key={task.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            className="p-4 hover:bg-muted/50 transition-colors"
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-medium truncate">{task.title}</h4>
                                                    <p className="text-sm text-muted-foreground truncate">{task.assigned_to_name || "Unassigned"}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <TaskStatusBadge status={task.status} size="sm" />
                                                    <Link href={`/coordinator/tasks/${task.id}`}>
                                                        <Button size="sm" variant="outline">Review</Button>
                                                    </Link>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center text-muted-foreground">
                                    <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p>No pending reviews</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </ContentSection>

                {/* Recent Tasks */}
                <ContentSection title="Recent Tasks" description="Latest tasks across all events">
                    <Card>
                        <CardContent className="p-0">
                            {tasks.length > 0 ? (
                                <div className="divide-y divide-border">
                                    {tasks.slice(0, 6).map((task, index) => (
                                        <motion.div
                                            key={task.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="p-4 hover:bg-muted/30 transition-colors"
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium truncate">{task.title}</div>
                                                    <div className="text-xs text-muted-foreground">{task.event_title}</div>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <PriorityBadge priority={task.priority} size="sm" />
                                                        <span className="text-xs text-muted-foreground">
                                                            {task.deadline ? new Date(task.deadline).toLocaleDateString() : "-"}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <TaskStatusBadge status={task.status} size="sm" />
                                                    <Link href={`/coordinator/tasks/${task.id}`}>
                                                        <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                                                    </Link>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center text-muted-foreground">
                                    <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p>No tasks yet</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </ContentSection>
            </div>

            {/* Participants Modal */}
            <Dialog open={!!participantsModalEvent} onOpenChange={(open) => { if (!open) setParticipantsModalEvent(null) }}>
                <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl flex items-center gap-2">
                            <Shield className="w-5 h-5 text-primary" />
                            Participants — {participantsModalEvent?.event_title}
                        </DialogTitle>
                        <DialogDescription>Manage check-ins, search participants, and track attendance</DialogDescription>
                    </DialogHeader>

                    {loadingParticipants ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <>
                            {/* Live Statistics — visible to event_coordinator only */}
                            {isEventCoordinator && (
                                <>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                                        <Card>
                                            <CardContent className="p-3 flex items-center gap-2">
                                                <div className="p-1.5 rounded-lg bg-primary/10">
                                                    <Users className="w-4 h-4 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="text-xl font-bold">{participantStats.total}</p>
                                                    <p className="text-[10px] text-muted-foreground leading-tight">Total Registered</p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                        <Card>
                                            <CardContent className="p-3 flex items-center gap-2">
                                                <div className="p-1.5 rounded-lg bg-green-500/10">
                                                    <UserCheck className="w-4 h-4 text-green-600" />
                                                </div>
                                                <div>
                                                    <p className="text-xl font-bold">{participantStats.checkedIn}</p>
                                                    <p className="text-[10px] text-muted-foreground leading-tight">Checked In</p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                        <Card>
                                            <CardContent className="p-3 flex items-center gap-2">
                                                <div className="p-1.5 rounded-lg bg-orange-500/10">
                                                    <Clock className="w-4 h-4 text-orange-600" />
                                                </div>
                                                <div>
                                                    <p className="text-xl font-bold">{participantStats.remaining}</p>
                                                    <p className="text-[10px] text-muted-foreground leading-tight">Remaining</p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                        <Card>
                                            <CardContent className="p-3 flex items-center gap-2">
                                                <div className="p-1.5 rounded-lg bg-blue-500/10">
                                                    <Percent className="w-4 h-4 text-blue-600" />
                                                </div>
                                                <div>
                                                    <p className="text-xl font-bold">{participantStats.attendancePercent}%</p>
                                                    <p className="text-[10px] text-muted-foreground leading-tight">Attendance</p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                    <div className="mb-4">
                                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                            <span>Attendance Progress</span>
                                            <span>{participantStats.checkedIn}/{participantStats.total}</span>
                                        </div>
                                        <Progress value={participantStats.attendancePercent} className="h-2" />
                                    </div>
                                </>
                            )}

                            {/* Search & Filter Bar */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
                                <div className="relative flex-1 w-full">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search by name, email, or ticket ID..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-9"
                                    />
                                </div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    {[
                                        { key: "all", label: "All" },
                                        { key: "checked_in", label: "Checked-in" },
                                        { key: "not_checked_in", label: "Not Checked-in" },
                                        { key: "cert_eligible", label: "Cert. Eligible" },
                                    ].map(f => (
                                        <Button
                                            key={f.key}
                                            size="sm"
                                            variant={activeFilter === f.key ? "default" : "outline"}
                                            className="text-xs h-8"
                                            onClick={() => setActiveFilter(f.key)}
                                        >
                                            {f.label}
                                        </Button>
                                    ))}
                                    {/* CSV Export — event_coordinator only */}
                                    {isEventCoordinator && participants.length > 0 && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="text-xs h-8 gap-1 ml-1"
                                            onClick={handleExportCSV}
                                        >
                                            <Download className="w-3.5 h-3.5" />
                                            CSV
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Results count */}
                            {searchQuery || activeFilter !== "all" ? (
                                <p className="text-xs text-muted-foreground mb-2">
                                    Showing {filteredParticipants.length} of {participants.length} participants
                                </p>
                            ) : null}

                            {/* Participants Table */}
                            {filteredParticipants.length > 0 ? (
                                <div className="border rounded-lg">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>#</TableHead>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Email</TableHead>
                                                <TableHead>Phone</TableHead>
                                                <TableHead>Ticket ID</TableHead>
                                                <TableHead>Reg Date</TableHead>
                                                <TableHead>Attendance</TableHead>
                                                <TableHead>Certificate</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredParticipants.map((p, idx) => (
                                                <TableRow key={p.id}>
                                                    <TableCell className="font-medium">{idx + 1}</TableCell>
                                                    <TableCell>{p.participant_name || p.user_name}</TableCell>
                                                    <TableCell className="text-muted-foreground text-xs">{p.participant_email || p.user_email}</TableCell>
                                                    <TableCell className="text-xs">{p.participant_phone || "—"}</TableCell>
                                                    <TableCell>
                                                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{p.booking_id || `REG-${p.id}`}</code>
                                                    </TableCell>
                                                    <TableCell className="text-xs">{new Date(p.created_at).toLocaleDateString()}</TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant={p.attendance_status === 'present' ? 'default' : 'secondary'}
                                                            className={p.attendance_status === 'present' ? 'bg-green-100 text-green-700 hover:bg-green-100' : ''}
                                                        >
                                                            {p.attendance_status === 'present' ? '✓ Present' : 'Absent'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        {p.certificate_eligible ? (
                                                            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                                                                <Award className="w-3 h-3 mr-1" /> Eligible
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="text-muted-foreground">Not Eligible</Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            {p.attendance_status !== 'present' && (
                                                                <Button
                                                                    size="sm" variant="outline"
                                                                    className="gap-1 text-xs h-7 text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                                                                    disabled={actionLoading === p.id}
                                                                    onClick={() => handleParticipantAction(p.id, "checkin")}
                                                                >
                                                                    {actionLoading === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserCheck className="w-3 h-3" />}
                                                                    Check-in
                                                                </Button>
                                                            )}
                                                            {isEventCoordinator && p.attendance_status === 'present' && !p.certificate_eligible && (
                                                                <Button
                                                                    size="sm" variant="outline"
                                                                    className="gap-1 text-xs h-7 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                                                                    disabled={actionLoading === p.id}
                                                                    onClick={() => handleParticipantAction(p.id, "certificate_eligible")}
                                                                >
                                                                    {actionLoading === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Award className="w-3 h-3" />}
                                                                    Certify
                                                                </Button>
                                                            )}
                                                            {p.attendance_status === 'present' && p.certificate_eligible && (
                                                                <Badge variant="outline" className="text-xs text-green-600 border-green-200">
                                                                    <CheckCircle className="w-3 h-3 mr-1" /> Done
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p>{searchQuery || activeFilter !== "all" ? "No participants match your search/filter." : "No participants registered for this event yet."}</p>
                                </div>
                            )}
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    )
}
