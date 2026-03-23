"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { DashboardLayout, PageHeader, ContentSection } from "@/components/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import {
    Search,
    Loader2,
    ClipboardList,
    Calendar,
    CalendarDays,
    User,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    Plus,
    Eye,
    ExternalLink,
    X
} from "lucide-react"
import Link from "next/link"

export default function OrganiserTasksPage() {
    const [session, setSession] = useState(null)
    const [tasks, setTasks] = useState([])
    const [events, setEvents] = useState([])
    const [coordinators, setCoordinators] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedEvent, setSelectedEvent] = useState("all")
    const [searchDate, setSearchDate] = useState("")
    const [dateFrom, setDateFrom] = useState("")
    const [dateTo, setDateTo] = useState("")
    const [showCreateDialog, setShowCreateDialog] = useState(false)
    const [isCreating, setIsCreating] = useState(false)
    const [showReviewDialog, setShowReviewDialog] = useState(false)
    const [selectedTask, setSelectedTask] = useState(null)
    const [feedback, setFeedback] = useState("")
    const [isReviewing, setIsReviewing] = useState(false)
    const [taskFormData, setTaskFormData] = useState({
        event_id: "",
        title: "",
        description: "",
        assigned_to: "",
        deadline: "",
        priority: "medium"
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
                    fetchEvents(sessionData.session.userId, true),
                    fetchCoordinators()
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

    useEffect(() => {
        if (events.length > 0) {
            fetchAllTasks()
        }
    }, [events, selectedEvent])

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

    const fetchAllTasks = async () => {
        try {
            let allTasks = []
            const eventsToFetch = selectedEvent === "all"
                ? events
                : events.filter(e => String(e.id) === selectedEvent)

            for (const event of eventsToFetch) {
                const response = await fetch(`/api/tasks?event_id=${event.id}`)
                if (response.ok) {
                    const eventTasks = await response.json()
                    allTasks = [...allTasks, ...eventTasks.map(t => ({
                        ...t,
                        event_title: event.title
                    }))]
                }
            }
            setTasks(allTasks)
        } catch (error) {
            console.error("[v0] Fetch tasks error:", error)
        }
    }

    const handleCreateTask = async (e) => {
        e.preventDefault()
        setIsCreating(true)
        try {
            const response = await fetch("/api/tasks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    event_id: taskFormData.event_id,
                    title: taskFormData.title,
                    description: taskFormData.description,
                    assigned_to: taskFormData.assigned_to || null,
                    deadline: taskFormData.deadline || null,
                    priority: taskFormData.priority
                })
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || "Failed to create task")
            }

            toast.success("Task created successfully!")
            setShowCreateDialog(false)
            setTaskFormData({
                event_id: "",
                title: "",
                description: "",
                assigned_to: "",
                deadline: "",
                priority: "medium"
            })
            await fetchAllTasks()
        } catch (error) {
            toast.error(error.message || "Failed to create task")
        } finally {
            setIsCreating(false)
        }
    }

    const handleReview = async (status) => {
        if (!selectedTask) return
        setIsReviewing(true)
        try {
            const response = await fetch(`/api/tasks/${selectedTask.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status, feedback })
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || "Failed to update task")
            }

            toast.success(`Task ${status === 'approved' ? 'approved' : 'rejected'}!`)
            setShowReviewDialog(false)
            setSelectedTask(null)
            setFeedback("")
            await fetchAllTasks()
        } catch (error) {
            toast.error(error.message || "Failed to review task")
        } finally {
            setIsReviewing(false)
        }
    }

    const getStatusBadge = (status) => {
        const styles = {
            pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
            in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
            submitted: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
            approved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
            rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
        }
        return <Badge className={styles[status] || styles.pending}>{status?.replace('_', ' ') || 'pending'}</Badge>
    }

    const getPriorityBadge = (priority) => {
        const styles = {
            low: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
            medium: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
            high: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
        }
        return <Badge variant="outline" className={styles[priority] || styles.medium}>{priority || 'medium'}</Badge>
    }

    const filteredTasks = tasks.filter(task => {
        const matchesSearch = task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            task.assigned_to_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            task.event_title?.toLowerCase().includes(searchQuery.toLowerCase())

        // Date filtering on deadline
        let matchesDate = true
        if (task.deadline) {
            const deadlineDate = new Date(task.deadline).toISOString().split('T')[0]
            if (searchDate) {
                matchesDate = deadlineDate === searchDate
            }
            if (matchesDate && dateFrom) {
                matchesDate = deadlineDate >= dateFrom
            }
            if (matchesDate && dateTo) {
                matchesDate = deadlineDate <= dateTo
            }
        } else {
            // If task has no deadline, hide it when any date filter is active
            if (searchDate || dateFrom || dateTo) {
                matchesDate = false
            }
        }

        return matchesSearch && matchesDate
    })

    const coordinatorsForEvent = taskFormData.event_id
        ? coordinators.filter(c => String(c.event_id) === taskFormData.event_id)
        : []

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
                title="Task Management"
                description="Create and manage tasks for your event coordinators"
                actions={
                    <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
                        <Plus className="w-4 h-4" />
                        Create Task
                    </Button>
                }
            />

            {/* Filters */}
            <div className="flex flex-col gap-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search tasks..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                        <SelectTrigger className="w-full md:w-[200px]">
                            <SelectValue placeholder="Filter by event" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Events</SelectItem>
                            {events.map(event => (
                                <SelectItem key={event.id} value={String(event.id)}>
                                    {event.title}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-shrink-0">
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Search by Date</label>
                        <div className="relative">
                            <CalendarDays className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                type="date"
                                value={searchDate}
                                onChange={(e) => { setSearchDate(e.target.value); setDateFrom(""); setDateTo(""); }}
                                className="pl-10 w-full md:w-[180px]"
                            />
                        </div>
                    </div>
                    <div className="flex items-end gap-2">
                        <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">From</label>
                            <Input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => { setDateFrom(e.target.value); setSearchDate(""); }}
                                className="w-full md:w-[160px]"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">To</label>
                            <Input
                                type="date"
                                value={dateTo}
                                onChange={(e) => { setDateTo(e.target.value); setSearchDate(""); }}
                                className="w-full md:w-[160px]"
                            />
                        </div>
                    </div>
                    {(searchDate || dateFrom || dateTo) && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setSearchDate(""); setDateFrom(""); setDateTo(""); }}
                            className="gap-1 text-muted-foreground h-10"
                        >
                            <X className="w-4 h-4" />
                            Clear Dates
                        </Button>
                    )}
                </div>
            </div>

            {/* Tasks List */}
            <ContentSection>
                <Card>
                    <CardContent className="p-0">
                        {filteredTasks.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-border bg-muted/30">
                                            <th className="px-4 py-3 text-left text-sm font-medium">Task</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium">Event</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium">Assigned To</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium">Priority</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium">Deadline</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredTasks.map((task, index) => (
                                            <motion.tr
                                                key={task.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: index * 0.05 }}
                                                className="border-b border-border hover:bg-muted/30 transition-colors"
                                            >
                                                <td className="px-4 py-3">
                                                    <div className="font-medium">{task.title}</div>
                                                    {task.description && (
                                                        <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                                                            {task.description}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-sm">{task.event_title}</td>
                                                <td className="px-4 py-3 text-sm">
                                                    {task.assigned_to_name || <span className="text-muted-foreground">Unassigned</span>}
                                                </td>
                                                <td className="px-4 py-3">{getPriorityBadge(task.priority)}</td>
                                                <td className="px-4 py-3 text-sm text-muted-foreground">
                                                    {task.deadline ? new Date(task.deadline).toLocaleDateString() : "-"}
                                                </td>
                                                <td className="px-4 py-3">{getStatusBadge(task.status)}</td>
                                                <td className="px-4 py-3">
                                                    {task.status === 'submitted' && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => {
                                                                setSelectedTask(task)
                                                                setFeedback("")
                                                                setShowReviewDialog(true)
                                                            }}
                                                            className="gap-1"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                            Review
                                                        </Button>
                                                    )}
                                                    {['approved', 'rejected'].includes(task.status) && task.proof_url && (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => {
                                                                setSelectedTask(task)
                                                                setFeedback(task.feedback || "")
                                                                setShowReviewDialog(true)
                                                            }}
                                                            className="gap-1 text-muted-foreground"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                            View Proof
                                                        </Button>
                                                    )}
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="p-12 text-center text-muted-foreground">
                                <ClipboardList className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                <h3 className="text-xl font-semibold mb-2">No Tasks Yet</h3>
                                <p className="mb-4">Create tasks and assign them to your coordinators</p>
                                <Button onClick={() => setShowCreateDialog(true)}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Create First Task
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </ContentSection>

            {/* Create Task Dialog */}
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <ClipboardList className="w-5 h-5" />
                            Create New Task
                        </DialogTitle>
                        <DialogDescription>
                            Create a task and optionally assign it to a coordinator
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateTask} className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Event *</label>
                            <Select
                                value={taskFormData.event_id}
                                onValueChange={(v) => setTaskFormData(prev => ({ ...prev, event_id: v, assigned_to: "" }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select event" />
                                </SelectTrigger>
                                <SelectContent>
                                    {events.map(event => (
                                        <SelectItem key={event.id} value={String(event.id)}>
                                            {event.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Task Title *</label>
                            <Input
                                value={taskFormData.title}
                                onChange={(e) => setTaskFormData(prev => ({ ...prev, title: e.target.value }))}
                                placeholder="e.g., Prepare event materials"
                                required
                            />
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
                        <div>
                            <label className="text-sm font-medium">Assign To</label>
                            <Select
                                value={taskFormData.assigned_to}
                                onValueChange={(v) => setTaskFormData(prev => ({ ...prev, assigned_to: v }))}
                                disabled={!taskFormData.event_id}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={taskFormData.event_id ? "Select coordinator" : "Select event first"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {coordinatorsForEvent.map(coord => (
                                        <SelectItem key={coord.id} value={String(coord.id)}>
                                            {coord.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
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
                        <div className="flex gap-2 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowCreateDialog(false)}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isCreating || !taskFormData.event_id} className="flex-1">
                                {isCreating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Create Task
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Review Task Dialog */}
            <Dialog open={showReviewDialog} onOpenChange={(open) => {
                setShowReviewDialog(open)
                if (!open) {
                    setSelectedTask(null)
                    setFeedback("")
                }
            }}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Eye className="w-5 h-5" />
                            Review Task Submission
                        </DialogTitle>
                        <DialogDescription>
                            {selectedTask?.title}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        {selectedTask?.description && (
                            <div className="p-3 bg-muted/50 rounded-lg">
                                <p className="text-sm font-medium mb-1">Task Description:</p>
                                <p className="text-sm text-muted-foreground">{selectedTask.description}</p>
                            </div>
                        )}

                        <div>
                            <p className="text-sm font-medium mb-2">Submitted by:</p>
                            <p className="text-sm text-muted-foreground">{selectedTask?.assigned_to_name || 'Unknown'}</p>
                        </div>

                        {selectedTask?.proof_url && (
                            <div>
                                <p className="text-sm font-medium mb-2">Proof of Completion:</p>
                                <div className="space-y-2">
                                    <div className="border rounded-lg overflow-hidden bg-muted/30 p-1">
                                        <img
                                            src={selectedTask.proof_url}
                                            alt="Task proof"
                                            className="w-full max-h-64 object-contain rounded"
                                            onError={(e) => {
                                                e.target.parentElement.style.display = 'none'
                                            }}
                                        />
                                    </div>
                                    <a
                                        href={selectedTask.proof_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 text-primary hover:underline text-sm bg-primary/5 px-3 py-2 rounded-lg"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                        Open Proof in New Tab
                                    </a>
                                </div>
                            </div>
                        )}
                        {!selectedTask?.proof_url && selectedTask?.status === 'submitted' && (
                            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                                <p className="text-sm text-yellow-700 dark:text-yellow-400">
                                    <AlertCircle className="w-4 h-4 inline mr-1" />
                                    No proof file attached. The coordinator may have submitted without uploading proof.
                                </p>
                            </div>
                        )}

                        <div>
                            <label className="text-sm font-medium block mb-2">Feedback (optional)</label>
                            <Textarea
                                placeholder="Provide feedback to the coordinator..."
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                rows={3}
                            />
                        </div>

                        <div className="flex gap-2 pt-2">
                            <Button
                                variant="destructive"
                                onClick={() => handleReview('rejected')}
                                disabled={isReviewing}
                                className="flex-1"
                            >
                                {isReviewing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                <XCircle className="w-4 h-4 mr-1" />
                                Reject
                            </Button>
                            <Button
                                onClick={() => handleReview('approved')}
                                disabled={isReviewing}
                                className="flex-1 bg-green-600 hover:bg-green-700"
                            >
                                {isReviewing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Approve
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    )
}
