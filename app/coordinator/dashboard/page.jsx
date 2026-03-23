"use client"

import { useState, useEffect, useRef } from "react"
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
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
    Download,
    UserPlus,
    Copy,
    Upload,
    FileText,
    ClipboardCheck,
    Trash2,
    ExternalLink,
    IndianRupee,
    CheckSquare,
    XCircle
} from "lucide-react"
import Link from "next/link"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

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
    const [showCreateDialog, setShowCreateDialog] = useState(false)
    const [isCreating, setIsCreating] = useState(false)
    const [createdCredentials, setCreatedCredentials] = useState(null)
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        password: "",
        role: "student_coordinator",
        event_ids: [],
        college: ""
    })
    const router = useRouter()

    const isEventCoordinator = session?.role === "event_coordinator"

    // --- Offline Registrations state ---
    const [offlineRegs, setOfflineRegs] = useState([])
    const [loadingOfflineRegs, setLoadingOfflineRegs] = useState(false)
    const [offlineRegForm, setOfflineRegForm] = useState({
        event_id: "", participant_name: "", participant_email: "",
        participant_phone: "", college_org: "",
        payment_status: "unpaid", amount_paid: "", remarks: ""
    })
    const [submittingOfflineReg, setSubmittingOfflineReg] = useState(false)

    // --- Task Proofs state ---
    const [taskProofs, setTaskProofs] = useState([])
    const [loadingProofs, setLoadingProofs] = useState(false)
    const [proofForm, setProofForm] = useState({
        event_id: "", offline_registration_id: "",
        task_title: "", task_description: ""
    })
    const [proofFile, setProofFile] = useState(null)
    const [uploadingProof, setUploadingProof] = useState(false)
    const [proofStatusFilter, setProofStatusFilter] = useState("all")
    const fileInputRef = useRef(null)

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

    const generatePassword = () => {
        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
        let password = ""
        for (let i = 0; i < 8; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        setFormData(prev => ({ ...prev, password }))
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleCreateCoordinator = async (e) => {
        e.preventDefault()
        if (formData.event_ids.length === 0) {
            toast.error("Please select at least one event")
            return
        }
        setIsCreating(true)

        try {
            const response = await fetch("/api/coordinators", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Failed to create coordinator")
            }

            toast.success(data.message)

            if (data.isNewUser) {
                setCreatedCredentials({
                    email: formData.email,
                    password: formData.password,
                    name: formData.name,
                    role: formData.role
                })
            } else {
                setShowCreateDialog(false)
                setFormData({
                    name: "",
                    email: "",
                    phone: "",
                    password: "",
                    role: "student_coordinator",
                    event_ids: [],
                    college: ""
                })
            }
        } catch (error) {
            toast.error(error.message || "Failed to create coordinator")
        } finally {
            setIsCreating(false)
        }
    }

    const copyCredentials = () => {
        if (createdCredentials) {
            const text = `Email: ${createdCredentials.email}\nPassword: ${createdCredentials.password}`
            navigator.clipboard.writeText(text)
            toast.success("Credentials copied to clipboard!")
        }
    }

    const closeAndReset = () => {
        setShowCreateDialog(false)
        setCreatedCredentials(null)
        setFormData({
            name: "",
            email: "",
            phone: "",
            password: "",
            role: "student_coordinator",
            event_ids: [],
            college: ""
        })
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

    // ---- Offline Registrations ----
    const fetchOfflineRegs = async () => {
        setLoadingOfflineRegs(true)
        try { const res = await fetch("/api/offline-registrations"); if (res.ok) setOfflineRegs(await res.json()) }
        catch (e) { console.error(e) } finally { setLoadingOfflineRegs(false) }
    }
    const handleAddOfflineReg = async (e) => {
        e.preventDefault()
        if (!offlineRegForm.event_id || !offlineRegForm.participant_name) { toast.error("Event and participant name required"); return }
        setSubmittingOfflineReg(true)
        try {
            const res = await fetch("/api/offline-registrations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...offlineRegForm, amount_paid: parseFloat(offlineRegForm.amount_paid) || 0 }) })
            if (res.ok) { toast.success("Offline registration added!"); setOfflineRegForm({ event_id: "", participant_name: "", participant_email: "", participant_phone: "", college_org: "", payment_status: "unpaid", amount_paid: "", remarks: "" }); await fetchOfflineRegs() }
            else { const err = await res.json(); toast.error(err.error || "Failed") }
        } catch (e) { toast.error("Network error") } finally { setSubmittingOfflineReg(false) }
    }
    const handleDeleteOfflineReg = async (id) => {
        if (!confirm("Delete this registration?")) return
        const res = await fetch(`/api/offline-registrations?id=${id}`, { method: "DELETE" })
        if (res.ok) { toast.success("Deleted"); await fetchOfflineRegs() } else toast.error("Failed")
    }

    // ---- Task Proofs ----
    const fetchTaskProofs = async () => {
        setLoadingProofs(true)
        try { const res = await fetch("/api/task-proofs"); if (res.ok) setTaskProofs(await res.json()) }
        catch (e) { console.error(e) } finally { setLoadingProofs(false) }
    }
    const handleProofFileChange = (e) => {
        const f = e.target.files?.[0]; if (!f) return
        const ok = ["image/jpeg","image/png","image/webp","image/gif","application/pdf","application/msword","application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
        if (!ok.includes(f.type)) { toast.error("Invalid file type"); return }
        if (f.size > 10*1024*1024) { toast.error("File too large (max 10MB)"); return }
        setProofFile(f)
    }
    const handleSubmitProof = async (e) => {
        e.preventDefault()
        if (!proofForm.event_id || !proofForm.task_title) { toast.error("Event and task title required"); return }
        if (!proofFile) { toast.error("Please attach a proof file"); return }
        setUploadingProof(true)
        try {
            const fd = new FormData(); fd.append("file", proofFile)
            const up = await fetch("/api/upload/proof", { method: "POST", body: fd })
            if (!up.ok) { const err = await up.json(); toast.error(err.error || "Upload failed"); return }
            const { url, fileType } = await up.json()
            const res = await fetch("/api/task-proofs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...proofForm, file_url: url, file_type: fileType }) })
            if (res.ok) { toast.success("Proof submitted!"); setProofForm({ event_id: "", offline_registration_id: "", task_title: "", task_description: "" }); setProofFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; await fetchTaskProofs() }
            else { const err = await res.json(); toast.error(err.error || "Failed") }
        } catch (e) { toast.error("Network error") } finally { setUploadingProof(false) }
    }
    const filteredProofs = proofStatusFilter === "all" ? taskProofs : taskProofs.filter(p => p.status === proofStatusFilter)
    const statusBadgeClass = (s) => ({ submitted:"bg-blue-100 text-blue-700", verified:"bg-green-100 text-green-700", rejected:"bg-red-100 text-red-700", needs_resubmission:"bg-yellow-100 text-yellow-700", pending:"bg-gray-100 text-gray-700" }[s] || "bg-gray-100 text-gray-700")
    const paymentBadgeClass = (s) => s==="paid" ? "bg-green-100 text-green-700" : s==="free" ? "bg-blue-100 text-blue-700" : "bg-yellow-100 text-yellow-700"
    const isImageFile = (url) => url && /\.(jpg|jpeg|png|webp|gif)$/i.test(url)

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
                actions={isEventCoordinator && (
                    <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
                        <UserPlus className="w-4 h-4" /> Add Student Coordinator
                    </Button>
                )}
            />

            {/* Stats */}
            <div className="mb-8">
                <StatsGrid columns={4}>
                    {stats.map((stat, index) => (
                        <StatCard key={stat.title} {...stat} delay={index} />
                    ))}
                </StatsGrid>
            </div>

            {/* Main Content — Tabbed */}
            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-flex">
                    <TabsTrigger value="overview" className="gap-2">
                        <Calendar className="w-4 h-4" />Overview
                    </TabsTrigger>
                    <TabsTrigger value="offline" className="gap-2" onClick={() => { if (!offlineRegs.length) fetchOfflineRegs() }}>
                        <UserPlus className="w-4 h-4" />Offline Registrations
                    </TabsTrigger>
                    <TabsTrigger value="proofs" className="gap-2" onClick={() => { if (!taskProofs.length) fetchTaskProofs() }}>
                        <ClipboardCheck className="w-4 h-4" />Task Proofs
                    </TabsTrigger>
                </TabsList>

                {/* ─── Tab 1: Overview ─── */}
                <TabsContent value="overview">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <ContentSection title="My Assigned Events" description="Events you're coordinating" className="lg:col-span-2">
                            <Card>
                                <CardContent className="p-0">
                                    {assignedEvents.length > 0 ? (
                                        <div className="divide-y divide-border">
                                            {assignedEvents.map((event, index) => (
                                                <motion.div key={event.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }} className="p-4 hover:bg-muted/50 transition-colors">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-3 mb-2">
                                                                <h4 className="font-semibold truncate">{event.event_title}</h4>
                                                                <EventStatusBadge status={event.event_status} />
                                                            </div>
                                                            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                                                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{new Date(event.start_date).toLocaleDateString()} {new Date(event.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{event.location || "TBD"}</span>
                                                                <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />Organiser: {event.organiser_name || "Unknown"}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => fetchParticipants(event)}>
                                                                <UserCheck className="w-4 h-4" />View Participants
                                                            </Button>
                                                            <Link href={`/coordinator/events/${event.event_id}`}>
                                                                <Button variant="ghost" size="icon"><Eye className="w-4 h-4" /></Button>
                                                            </Link>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-8 text-center text-muted-foreground"><Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>No events assigned yet</p></div>
                                    )}
                                </CardContent>
                            </Card>
                        </ContentSection>
                        <ContentSection title="Pending Reviews" description="Task proofs awaiting approval">
                            <Card><CardContent className="p-0">
                                {tasks.filter(t => t.status === "submitted").length > 0 ? (
                                    <div className="divide-y divide-border">
                                        {tasks.filter(t => t.status === "submitted").slice(0, 5).map((task, i) => (
                                            <motion.div key={task.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="p-4 hover:bg-muted/50 transition-colors">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1 min-w-0"><h4 className="font-medium truncate">{task.title}</h4><p className="text-sm text-muted-foreground">{task.assigned_to_name || "Unassigned"}</p></div>
                                                    <div className="flex items-center gap-2"><TaskStatusBadge status={task.status} size="sm" /><Link href={`/coordinator/tasks/${task.id}`}><Button size="sm" variant="outline">Review</Button></Link></div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                ) : (<div className="p-8 text-center text-muted-foreground"><CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>No pending reviews</p></div>)}
                            </CardContent></Card>
                        </ContentSection>
                        <ContentSection title="Recent Tasks" description="Latest tasks across all events">
                            <Card><CardContent className="p-0">
                                {tasks.length > 0 ? (
                                    <div className="divide-y divide-border">
                                        {tasks.slice(0, 6).map((task, i) => (
                                            <motion.div key={task.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} className="p-4 hover:bg-muted/30 transition-colors">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-medium truncate">{task.title}</div>
                                                        <div className="text-xs text-muted-foreground">{task.event_title}</div>
                                                        <div className="flex items-center gap-2 mt-1"><PriorityBadge priority={task.priority} size="sm" /><span className="text-xs text-muted-foreground">{task.deadline ? new Date(task.deadline).toLocaleDateString() : "-"}</span></div>
                                                    </div>
                                                    <div className="flex items-center gap-2"><TaskStatusBadge status={task.status} size="sm" /><Link href={`/coordinator/tasks/${task.id}`}><Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button></Link></div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                ) : (<div className="p-8 text-center text-muted-foreground"><ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>No tasks yet</p></div>)}
                            </CardContent></Card>
                        </ContentSection>
                    </div>
                </TabsContent>

                {/* ─── Tab 2: Offline Registrations ─── */}
                <TabsContent value="offline">
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        {/* Add Registration Form */}
                        <Card className="xl:col-span-1">
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30"><UserPlus className="w-4 h-4 text-indigo-600" /></div>
                                    <div><p className="font-semibold text-sm">Add Offline Participant</p><p className="text-xs text-muted-foreground">Manual registration entry</p></div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleAddOfflineReg} className="space-y-3">
                                    <div className="space-y-1">
                                        <Label className="text-xs font-medium">Event <span className="text-red-500">*</span></Label>
                                        <Select value={offlineRegForm.event_id} onValueChange={v => setOfflineRegForm(p => ({ ...p, event_id: v }))}>
                                            <SelectTrigger className="h-9"><SelectValue placeholder="Select event" /></SelectTrigger>
                                            <SelectContent>{assignedEvents.map(e => <SelectItem key={e.event_id} value={String(e.event_id)}>{e.event_title}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs font-medium">Full Name <span className="text-red-500">*</span></Label>
                                        <Input className="h-9" placeholder="Participant name" value={offlineRegForm.participant_name} onChange={e => setOfflineRegForm(p => ({ ...p, participant_name: e.target.value }))} required />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-1">
                                            <Label className="text-xs font-medium">Email</Label>
                                            <Input className="h-9" type="email" placeholder="email@domain.com" value={offlineRegForm.participant_email} onChange={e => setOfflineRegForm(p => ({ ...p, participant_email: e.target.value }))} />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs font-medium">Phone</Label>
                                            <Input className="h-9" placeholder="Phone" value={offlineRegForm.participant_phone} onChange={e => setOfflineRegForm(p => ({ ...p, participant_phone: e.target.value }))} />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs font-medium">College / Organization</Label>
                                        <Input className="h-9" placeholder="Institution name" value={offlineRegForm.college_org} onChange={e => setOfflineRegForm(p => ({ ...p, college_org: e.target.value }))} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-1">
                                            <Label className="text-xs font-medium">Payment Status</Label>
                                            <Select value={offlineRegForm.payment_status} onValueChange={v => setOfflineRegForm(p => ({ ...p, payment_status: v }))}>
                                                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="unpaid">Unpaid</SelectItem>
                                                    <SelectItem value="paid">Paid</SelectItem>
                                                    <SelectItem value="free">Free</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs font-medium">Amount Paid (₹)</Label>
                                            <Input className="h-9" type="number" min="0" placeholder="0" value={offlineRegForm.amount_paid} onChange={e => setOfflineRegForm(p => ({ ...p, amount_paid: e.target.value }))} disabled={offlineRegForm.payment_status !== "paid"} />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs font-medium">Remarks</Label>
                                        <Textarea className="text-sm min-h-[60px]" placeholder="Any notes..." value={offlineRegForm.remarks} onChange={e => setOfflineRegForm(p => ({ ...p, remarks: e.target.value }))} />
                                    </div>
                                    <Button type="submit" className="w-full gap-2" disabled={submittingOfflineReg}>
                                        {submittingOfflineReg ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                        Add Registration
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                        {/* Registrations Table */}
                        <Card className="xl:col-span-2">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30"><Users className="w-4 h-4 text-purple-600" /></div>
                                        <div><p className="font-semibold text-sm">Offline Participants</p><p className="text-xs text-muted-foreground">{offlineRegs.length} entries</p></div>
                                    </div>
                                    <Button variant="outline" size="sm" className="gap-1.5" onClick={fetchOfflineRegs} disabled={loadingOfflineRegs}>
                                        {loadingOfflineRegs ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}Refresh
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                {loadingOfflineRegs ? (
                                    <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                                ) : offlineRegs.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>#</TableHead>
                                                    <TableHead>Name</TableHead>
                                                    <TableHead>Email / Phone</TableHead>
                                                    <TableHead>College</TableHead>
                                                    <TableHead>Event</TableHead>
                                                    <TableHead>Payment</TableHead>
                                                    <TableHead>Registered</TableHead>
                                                    <TableHead></TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {offlineRegs.map((reg, i) => (
                                                    <TableRow key={reg.id}>
                                                        <TableCell className="font-medium">{i + 1}</TableCell>
                                                        <TableCell className="font-medium">{reg.participant_name}</TableCell>
                                                        <TableCell className="text-xs text-muted-foreground">
                                                            <div>{reg.participant_email || '—'}</div>
                                                            <div>{reg.participant_phone || '—'}</div>
                                                        </TableCell>
                                                        <TableCell className="text-xs">{reg.college_org || '—'}</TableCell>
                                                        <TableCell className="text-xs">{reg.event_title}</TableCell>
                                                        <TableCell>
                                                            <div className="flex flex-col gap-1">
                                                                <Badge className={`text-xs ${paymentBadgeClass(reg.payment_status)}`}>{reg.payment_status}</Badge>
                                                                {reg.payment_status === 'paid' && reg.amount_paid > 0 && <span className="text-xs text-muted-foreground">₹{reg.amount_paid}</span>}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-xs">{new Date(reg.created_at).toLocaleDateString()}</TableCell>
                                                        <TableCell>
                                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDeleteOfflineReg(reg.id)}>
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                ) : (
                                    <div className="p-12 text-center text-muted-foreground">
                                        <UserPlus className="w-12 h-12 mx-auto mb-3 opacity-40" />
                                        <p className="font-medium">No offline registrations yet</p>
                                        <p className="text-sm mt-1">Add participants using the form on the left.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* ─── Tab 3: Task Proofs ─── */}
                <TabsContent value="proofs">
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        {/* Upload Proof Form */}
                        <Card className="xl:col-span-1">
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30"><Upload className="w-4 h-4 text-emerald-600" /></div>
                                    <div><p className="font-semibold text-sm">Submit Task Proof</p><p className="text-xs text-muted-foreground">Upload proof of task completion</p></div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmitProof} className="space-y-3">
                                    <div className="space-y-1">
                                        <Label className="text-xs font-medium">Event <span className="text-red-500">*</span></Label>
                                        <Select value={proofForm.event_id} onValueChange={v => setProofForm(p => ({ ...p, event_id: v, offline_registration_id: "" }))}>
                                            <SelectTrigger className="h-9"><SelectValue placeholder="Select event" /></SelectTrigger>
                                            <SelectContent>{assignedEvents.map(e => <SelectItem key={e.event_id} value={String(e.event_id)}>{e.event_title}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs font-medium">Link Offline Participant (optional)</Label>
                                        <Select value={proofForm.offline_registration_id} onValueChange={v => setProofForm(p => ({ ...p, offline_registration_id: v }))} disabled={!proofForm.event_id}>
                                            <SelectTrigger className="h-9"><SelectValue placeholder="Select participant" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="">None</SelectItem>
                                                {offlineRegs.filter(r => String(r.event_id) === proofForm.event_id).map(r => <SelectItem key={r.id} value={String(r.id)}>{r.participant_name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs font-medium">Task Title <span className="text-red-500">*</span></Label>
                                        <Select value={proofForm.task_title} onValueChange={v => setProofForm(p => ({ ...p, task_title: v }))}>
                                            <SelectTrigger className="h-9"><SelectValue placeholder="Select task" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Verify participant details">Verify participant details</SelectItem>
                                                <SelectItem value="Collect payment">Collect payment</SelectItem>
                                                <SelectItem value="Confirm seat allocation">Confirm seat allocation</SelectItem>
                                                <SelectItem value="Hand over entry pass">Hand over entry pass</SelectItem>
                                                <SelectItem value="Upload attendance proof">Upload attendance proof</SelectItem>
                                                <SelectItem value="Other">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs font-medium">Description</Label>
                                        <Textarea className="text-sm min-h-[60px]" placeholder="Describe the task completion..." value={proofForm.task_description} onChange={e => setProofForm(p => ({ ...p, task_description: e.target.value }))} />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs font-medium">Proof File <span className="text-red-500">*</span></Label>
                                        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center hover:border-primary/40 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                            {proofFile ? (
                                                <div className="flex items-center gap-2 justify-center">
                                                    <FileText className="w-4 h-4 text-primary" />
                                                    <span className="text-sm font-medium truncate max-w-[160px]">{proofFile.name}</span>
                                                    <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={e => { e.stopPropagation(); setProofFile(null); if(fileInputRef.current) fileInputRef.current.value=""; }}><XCircle className="w-3.5 h-3.5" /></Button>
                                                </div>
                                            ) : (
                                                <div>
                                                    <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                                                    <p className="text-sm text-muted-foreground">Click to upload</p>
                                                    <p className="text-xs text-muted-foreground/70 mt-1">JPEG, PNG, PDF, DOC up to 10MB</p>
                                                </div>
                                            )}
                                            <input ref={fileInputRef} type="file" className="hidden" accept="image/*,.pdf,.doc,.docx" onChange={handleProofFileChange} />
                                        </div>
                                    </div>
                                    <Button type="submit" className="w-full gap-2" disabled={uploadingProof}>
                                        {uploadingProof ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckSquare className="w-4 h-4" />}
                                        Submit Proof
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                        {/* Proofs Table */}
                        <Card className="xl:col-span-2">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30"><ClipboardCheck className="w-4 h-4 text-blue-600" /></div>
                                        <div><p className="font-semibold text-sm">My Task Proofs</p><p className="text-xs text-muted-foreground">{taskProofs.length} submissions</p></div>
                                    </div>
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        {["all","submitted","verified","rejected","needs_resubmission"].map(s => (
                                            <Button key={s} size="sm" variant={proofStatusFilter === s ? "default" : "outline"} className="text-xs h-7" onClick={() => setProofStatusFilter(s)}>
                                                {s === "all" ? "All" : s === "needs_resubmission" ? "Needs Resubmission" : s.charAt(0).toUpperCase() + s.slice(1)}
                                            </Button>
                                        ))}
                                        <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={fetchTaskProofs} disabled={loadingProofs}>
                                            {loadingProofs ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}Refresh
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                {loadingProofs ? (
                                    <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                                ) : filteredProofs.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>#</TableHead>
                                                    <TableHead>Task</TableHead>
                                                    <TableHead>Event</TableHead>
                                                    <TableHead>Participant</TableHead>
                                                    <TableHead>File</TableHead>
                                                    <TableHead>Submitted</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead>Notes</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {filteredProofs.map((proof, i) => (
                                                    <TableRow key={proof.id}>
                                                        <TableCell className="font-medium">{i + 1}</TableCell>
                                                        <TableCell>
                                                            <div className="font-medium text-sm">{proof.task_title}</div>
                                                            {proof.task_description && <div className="text-xs text-muted-foreground truncate max-w-[140px]">{proof.task_description}</div>}
                                                        </TableCell>
                                                        <TableCell className="text-xs">{proof.event_title}</TableCell>
                                                        <TableCell className="text-xs">{proof.participant_name || '—'}</TableCell>
                                                        <TableCell>
                                                            {proof.file_url ? (
                                                                <a href={proof.file_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                                                                    {isImageFile(proof.file_url) ? '🖼 Image' : '📄 File'}
                                                                    <ExternalLink className="w-3 h-3" />
                                                                </a>
                                                            ) : '—'}
                                                        </TableCell>
                                                        <TableCell className="text-xs">{new Date(proof.uploaded_at).toLocaleDateString()}</TableCell>
                                                        <TableCell>
                                                            <Badge className={`text-xs ${statusBadgeClass(proof.status)}`}>
                                                                {proof.status === 'needs_resubmission' ? 'Needs Resubmit' : proof.status.charAt(0).toUpperCase() + proof.status.slice(1)}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-xs text-muted-foreground max-w-[120px] truncate">{proof.reviewer_notes || '—'}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                ) : (
                                    <div className="p-12 text-center text-muted-foreground">
                                        <ClipboardCheck className="w-12 h-12 mx-auto mb-3 opacity-40" />
                                        <p className="font-medium">No proofs yet</p>
                                        <p className="text-sm mt-1">Submit a proof using the form on the left.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>

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

            {/* Create Coordinator Dialog */}
            <Dialog open={showCreateDialog} onOpenChange={closeAndReset}>
                <DialogContent className="max-w-md">
                    {createdCredentials ? (
                        <>
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                    Coordinator Created!
                                </DialogTitle>
                                <DialogDescription>
                                    Share these credentials with {createdCredentials.name}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 pt-4">
                                <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg p-4">
                                    <p className="font-medium mb-2 text-green-800 dark:text-green-300">Login Credentials:</p>
                                    <div className="space-y-1 text-sm text-green-700 dark:text-green-400">
                                        <p><strong>Email:</strong> {createdCredentials.email}</p>
                                        <p><strong>Password:</strong> {createdCredentials.password}</p>
                                        <p><strong>Role:</strong> Student Coordinator</p>
                                    </div>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    An email with these credentials has been sent to the coordinator.
                                </p>
                                <div className="flex gap-2">
                                    <Button onClick={copyCredentials} variant="outline" className="flex-1">
                                        <Copy className="w-4 h-4 mr-2" />
                                        Copy
                                    </Button>
                                    <Button onClick={closeAndReset} className="flex-1">
                                        Done
                                    </Button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <DialogHeader>
                                <DialogTitle>Add Student Coordinator</DialogTitle>
                                <DialogDescription>
                                    Assign a student to help manage your events
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleCreateCoordinator} className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Full Name *</label>
                                    <Input
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="John Doe"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Email *</label>
                                    <Input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="coordinator@email.com"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Password *</label>
                                    <div className="flex gap-2">
                                        <Input
                                            type="text"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            placeholder="Enter password"
                                            required
                                        />
                                        <Button type="button" variant="outline" onClick={generatePassword}>
                                            Generate
                                        </Button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium mb-1.5 block">Assign to Events *</label>
                                    <div className="border rounded-md p-3 max-h-[160px] overflow-y-auto space-y-2 bg-muted/5">
                                        {assignedEvents.map((event) => (
                                            <div key={event.id} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`event-${event.id}`}
                                                    checked={formData.event_ids.includes(String(event.event_id))}
                                                    onCheckedChange={(checked) => {
                                                        const eventId = String(event.event_id);
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            event_ids: checked
                                                                ? [...prev.event_ids, eventId]
                                                                : prev.event_ids.filter(id => id !== eventId)
                                                        }))
                                                    }}
                                                />
                                                <Label htmlFor={`event-${event.id}`} className="text-sm font-normal cursor-pointer leading-tight">
                                                    {event.event_title}
                                                </Label>
                                            </div>
                                        ))}
                                        {assignedEvents.length === 0 && (
                                            <p className="text-xs text-muted-foreground py-2 text-center italic">No events available</p>
                                        )}
                                    </div>
                                </div>
                                <div className="pt-2">
                                    <Button type="submit" className="w-full" disabled={isCreating}>
                                        {isCreating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserPlus className="w-4 h-4 mr-2" />}
                                        Create & Assign Coordinator
                                    </Button>
                                </div>
                            </form>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    )
}
