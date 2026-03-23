"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { DashboardLayout, PageHeader } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import {
    UserPlus,
    Users,
    Search,
    Mail,
    Phone,
    Loader2,
    GraduationCap,
    User,
    Copy,
    CheckCircle,
    Calendar,
    ClipboardList,
    Plus
} from "lucide-react"
import { Textarea } from "@/components/ui/textarea"

export default function CoordinatorsPage() {
    const COMMON_TASKS = [
        "Logistics Coordination",
        "Registration & Helpdesk",
        "Promotion & Social Media",
        "Venue Setup",
        "Guest/Speaker Management",
        "Technical Support",
        "Sponsorship & Branding",
        "Certificate Preparation",
        "Food & Refreshments",
        "Volunteer Management"
    ]

    const [session, setSession] = useState(null)
    const [coordinators, setCoordinators] = useState([])
    const [events, setEvents] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [showCreateDialog, setShowCreateDialog] = useState(false)
    const [isCreating, setIsCreating] = useState(false)
    const [createdCredentials, setCreatedCredentials] = useState(null)
    const [showTaskDialog, setShowTaskDialog] = useState(false)
    const [selectedCoordinator, setSelectedCoordinator] = useState(null)
    const [isCreatingTask, setIsCreatingTask] = useState(false)
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        password: "",
        role: "student_coordinator",
        event_ids: [],
        college: ""
    })
    const [taskFormData, setTaskFormData] = useState({
        title: "",
        description: "",
        deadline: "",
        priority: "medium",
        event_ids: []
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
                await Promise.all([fetchCoordinators(), fetchEvents(sessionData.session.userId, true)])
            } catch (error) {
                console.error("[v0] Auth check error:", error)
                router.push("/auth/login")
            } finally {
                setIsLoading(false)
            }
        }

        checkAuthAndFetch()
    }, [router])

    const fetchCoordinators = async () => {
        try {
            const response = await fetch("/api/coordinators")
            if (response.ok) {
                const data = await response.json()
                setCoordinators(data.coordinators || [])
            }
        } catch (error) {
            console.error("[v0] Fetch coordinators error:", error)
        }
    }

    const fetchEvents = async (userId, excludeExpired = false) => {
        try {
            const url = `/api/events/organiser?organiser_id=${userId}${excludeExpired ? '&exclude_expired=true' : ''}`
            const response = await fetch(url)
            if (response.ok) {
                const data = await response.json()
                setEvents(Array.isArray(data) ? data : [])
            }
        } catch (error) {
            console.error("[v0] Fetch events error:", error)
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

            await fetchCoordinators()
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

    const filteredCoordinators = coordinators.filter(coord =>
        coord.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        coord.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        coord.event_title?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const handleOpenTaskDialog = (coordinator) => {
        // Find all events assigned to this user id
        const assignedEvents = coordinators
            .filter(c => c.id === coordinator.id)
            .map(c => ({
                event_id: c.event_id,
                event_title: c.event_title
            }))

        setSelectedCoordinator({
            ...coordinator,
            assignedEvents
        })
        setTaskFormData({
            title: "",
            description: "",
            deadline: "",
            priority: "medium",
            event_ids: [String(coordinator.event_id)] // Default to current event
        })
        setShowTaskDialog(true)
    }

    const handleCreateTask = async (e) => {
        e.preventDefault()
        if (!selectedCoordinator) return
        if (taskFormData.event_ids.length === 0) {
            toast.error("Please select at least one event")
            return
        }

        setIsCreatingTask(true)
        try {
            const response = await fetch("/api/tasks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    event_ids: taskFormData.event_ids,
                    title: taskFormData.title,
                    description: taskFormData.description,
                    assigned_to: selectedCoordinator.id,
                    deadline: taskFormData.deadline || null,
                    priority: taskFormData.priority
                })
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || "Failed to create task")
            }

            toast.success(`Task assigned to ${selectedCoordinator.name}!`)
            setShowTaskDialog(false)
            setSelectedCoordinator(null)
        } catch (error) {
            toast.error(error.message || "Failed to create task")
        } finally {
            setIsCreatingTask(false)
        }
    }

    const getRoleBadge = (role) => {
        if (role === "event_coordinator") {
            return <Badge className="bg-blue-100 text-blue-800">Faculty Coordinator</Badge>
        }
        return <Badge className="bg-green-100 text-green-800">Student Coordinator</Badge>
    }

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
                title="Coordinator Management"
                description="Create and manage coordinators for your events"
                actions={
                    <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
                        <UserPlus className="w-4 h-4" />
                        Add Coordinator
                    </Button>
                }
            />

            {/* Search */}
            <div className="mb-6">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search coordinators..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            {/* Coordinators Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCoordinators.length > 0 ? (
                    filteredCoordinators.map((coord, index) => (
                        <motion.div
                            key={`${coord.id}-${coord.event_id}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <Card className="h-full">
                                <CardContent className="p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                            {coord.role === "event_coordinator" ? (
                                                <User className="w-6 h-6 text-primary" />
                                            ) : (
                                                <GraduationCap className="w-6 h-6 text-primary" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold truncate">{coord.name}</h3>
                                            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                                                <Mail className="w-3 h-3" />
                                                <span className="truncate">{coord.email}</span>
                                            </div>
                                            {coord.phone && (
                                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                    <Phone className="w-3 h-3" />
                                                    {coord.phone}
                                                </div>
                                            )}
                                            <div className="mt-2 space-y-2">
                                                {getRoleBadge(coord.role)}
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                    <Calendar className="w-3 h-3" />
                                                    {coord.event_title}
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="w-full mt-2 gap-1"
                                                    onClick={() => handleOpenTaskDialog(coord)}
                                                >
                                                    <ClipboardList className="w-3 h-3" />
                                                    Assign Task
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))
                ) : (
                    <div className="col-span-full text-center py-12">
                        <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <h3 className="text-xl font-semibold mb-2">No Coordinators Yet</h3>
                        <p className="text-muted-foreground mb-4">
                            Add coordinators to help manage your events
                        </p>
                        <Button onClick={() => setShowCreateDialog(true)}>
                            <UserPlus className="w-4 h-4 mr-2" />
                            Add First Coordinator
                        </Button>
                    </div>
                )}
            </div>

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
                            <div className="space-y-4">
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <p className="font-medium mb-2">Login Credentials:</p>
                                    <div className="space-y-1 text-sm">
                                        <p><strong>Email:</strong> {createdCredentials.email}</p>
                                        <p><strong>Password:</strong> {createdCredentials.password}</p>
                                        <p><strong>Role:</strong> {createdCredentials.role === "event_coordinator" ? "Faculty Coordinator" : "Student Coordinator"}</p>
                                    </div>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    An email with these credentials has been sent to the coordinator.
                                </p>
                                <div className="flex gap-2">
                                    <Button onClick={copyCredentials} variant="outline" className="flex-1">
                                        <Copy className="w-4 h-4 mr-2" />
                                        Copy Credentials
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
                                <DialogTitle>Add New Coordinator</DialogTitle>
                                <DialogDescription>
                                    Create login credentials for a coordinator
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleCreateCoordinator} className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium">Full Name *</label>
                                    <Input
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="John Doe"
                                        required
                                    />
                                </div>
                                <div>
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
                                <div>
                                    <label className="text-sm font-medium">Phone</label>
                                    <Input
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="9876543210"
                                    />
                                </div>
                                <div>
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
                                <div>
                                    <label className="text-sm font-medium">Role *</label>
                                    <Select value={formData.role} onValueChange={(v) => setFormData(prev => ({ ...prev, role: v }))}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="student_coordinator">Student Coordinator</SelectItem>
                                            <SelectItem value="event_coordinator">Faculty Coordinator</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-1.5 block">Assign to Events *</label>
                                    <div className="border rounded-md p-3 max-h-[180px] overflow-y-auto space-y-2 bg-muted/5">
                                        {events.map((event) => (
                                            <div key={event.id} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`event-${event.id}`}
                                                    checked={formData.event_ids.includes(String(event.id))}
                                                    onCheckedChange={(checked) => {
                                                        const eventId = String(event.id);
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            event_ids: checked
                                                                ? [...prev.event_ids, eventId]
                                                                : prev.event_ids.filter(id => id !== eventId)
                                                        }))
                                                    }}
                                                />
                                                <Label htmlFor={`event-${event.id}`} className="text-sm font-normal cursor-pointer leading-tight">
                                                    {event.title}
                                                </Label>
                                            </div>
                                        ))}
                                        {events.length === 0 && (
                                            <p className="text-xs text-muted-foreground py-2 text-center italic">No active events found</p>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium">College/Institution</label>
                                    <Input
                                        name="college"
                                        value={formData.college}
                                        onChange={handleChange}
                                        placeholder="Tech Institute"
                                    />
                                </div>
                                <div className="flex gap-2 pt-4">
                                    <Button type="button" variant="outline" onClick={closeAndReset} className="flex-1">
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={isCreating} className="flex-1">
                                        {isCreating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                        Create Coordinator
                                    </Button>
                                </div>
                            </form>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* Task Assignment Dialog */}
            <Dialog open={showTaskDialog} onOpenChange={(open) => {
                setShowTaskDialog(open)
                if (!open) setSelectedCoordinator(null)
            }}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <ClipboardList className="w-5 h-5" />
                            Assign Task
                        </DialogTitle>
                        <DialogDescription>
                            Create a task for {selectedCoordinator?.name}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateTask} className="space-y-4">
                        <div className="space-y-4">
                            <div>
                                <div>
                                    <label className="text-sm font-medium">Pick a Template (Optional)</label>
                                    <Select
                                        onValueChange={(v) => setTaskFormData(prev => ({ ...prev, title: v }))}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Common tasks..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {COMMON_TASKS.map(task => (
                                                <SelectItem key={task} value={task}>{task}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <label className="text-sm font-medium">Task Title *</label>
                                    <Input
                                        value={taskFormData.title}
                                        onChange={(e) => setTaskFormData(prev => ({ ...prev, title: e.target.value }))}
                                        placeholder="Enter or refine task title..."
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium">Description</label>
                                <Textarea
                                    value={taskFormData.description}
                                    onChange={(e) => setTaskFormData(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Describe what needs to be done..."
                                    rows={3}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium">Deadline</label>
                                    <Input
                                        type="datetime-local"
                                        value={taskFormData.deadline}
                                        onChange={(e) => setTaskFormData(prev => ({ ...prev, deadline: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Priority</label>
                                    <Select
                                        value={taskFormData.priority}
                                        onValueChange={(v) => setTaskFormData(prev => ({ ...prev, priority: v }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="low">Low</SelectItem>
                                            <SelectItem value="medium">Medium</SelectItem>
                                            <SelectItem value="high">High</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium block">Assign for Events *</label>
                                <div className="border rounded-md p-3 max-h-[120px] overflow-y-auto space-y-2 bg-muted/5">
                                    {selectedCoordinator?.assignedEvents?.map((event) => (
                                        <div key={event.event_id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`task-event-${event.event_id}`}
                                                checked={taskFormData.event_ids.includes(String(event.event_id))}
                                                onCheckedChange={(checked) => {
                                                    const eventId = String(event.event_id);
                                                    setTaskFormData(prev => ({
                                                        ...prev,
                                                        event_ids: checked
                                                            ? [...prev.event_ids, eventId]
                                                            : prev.event_ids.filter(id => id !== eventId)
                                                    }))
                                                }}
                                            />
                                            <Label htmlFor={`task-event-${event.event_id}`} className="text-sm font-normal cursor-pointer leading-tight">
                                                {event.event_title}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowTaskDialog(false)}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isCreatingTask} className="flex-1">
                                {isCreatingTask && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Assign Task
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </DashboardLayout >
    )
}
