"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { DashboardLayout, PageHeader, ContentSection } from "@/components/dashboard-layout"
import { TaskStatusBadge, PriorityBadge } from "@/components/task-status-badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import {
    Plus,
    Search,
    CheckCircle,
    XCircle,
    Eye,
    Loader2,
    Calendar,
    CalendarDays,
    User,
    X
} from "lucide-react"

export default function CoordinatorTasksPage() {
    const [session, setSession] = useState(null)
    const [tasks, setTasks] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [searchDate, setSearchDate] = useState("")
    const [dateFrom, setDateFrom] = useState("")
    const [dateTo, setDateTo] = useState("")
    const [selectedTask, setSelectedTask] = useState(null)
    const [showReviewDialog, setShowReviewDialog] = useState(false)
    const [feedback, setFeedback] = useState("")
    const router = useRouter()

    useEffect(() => {
        const checkAuthAndFetch = async () => {
            try {
                const sessionResponse = await fetch("/api/auth/session")
                const sessionData = await sessionResponse.json()

                if (!sessionData.session || sessionData.session.role !== "event_coordinator") {
                    router.push("/auth/login")
                    return
                }

                setSession(sessionData.session)
                await fetchTasks()
            } catch (error) {
                console.error("[v0] Auth check error:", error)
                router.push("/auth/login")
            } finally {
                setIsLoading(false)
            }
        }

        checkAuthAndFetch()
    }, [router])

    const fetchTasks = async () => {
        try {
            const response = await fetch("/api/tasks")
            if (response.ok) {
                const data = await response.json()
                setTasks(Array.isArray(data) ? data : (data.tasks || []))
            }
        } catch (error) {
            console.error("[v0] Fetch tasks error:", error)
        }
    }

    const handleReview = async (taskId, status) => {
        try {
            const response = await fetch(`/api/tasks/${taskId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status, feedback })
            })

            if (response.ok) {
                toast.success(`Task ${status === 'approved' ? 'approved' : 'rejected'}!`)
                setShowReviewDialog(false)
                setFeedback("")
                await fetchTasks()
            } else {
                toast.error("Failed to update task")
            }
        } catch (error) {
            toast.error("Failed to update task")
            console.error("[v0] Review task error:", error)
        }
    }

    const filteredTasks = tasks.filter(task => {
        const matchesSearch = task.title?.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesStatus = statusFilter === "all" || task.status === statusFilter

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
            if (searchDate || dateFrom || dateTo) {
                matchesDate = false
            }
        }

        return matchesSearch && matchesStatus && matchesDate
    })

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
                description="Review and manage tasks assigned to student coordinators"
            />

            {/* Filters */}
            <div className="mb-6 flex flex-col gap-4">
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
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Tasks</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="submitted">Submitted</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
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

            {/* Tasks Table */}
            <Card>
                <CardContent className="p-0">
                    {filteredTasks.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="text-left p-4 font-medium">Task</th>
                                        <th className="text-left p-4 font-medium">Event</th>
                                        <th className="text-left p-4 font-medium">Assigned To</th>
                                        <th className="text-left p-4 font-medium">Deadline</th>
                                        <th className="text-left p-4 font-medium">Priority</th>
                                        <th className="text-left p-4 font-medium">Status</th>
                                        <th className="text-left p-4 font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {filteredTasks.map((task, index) => (
                                        <motion.tr
                                            key={task.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: index * 0.03 }}
                                            className="hover:bg-muted/30"
                                        >
                                            <td className="p-4">
                                                <div className="font-medium">{task.title}</div>
                                                <div className="text-sm text-muted-foreground line-clamp-1">{task.description}</div>
                                            </td>
                                            <td className="p-4 text-sm">{task.event_title}</td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <User className="w-4 h-4" />
                                                    {task.assigned_to_name}
                                                </div>
                                            </td>
                                            <td className="p-4 text-sm">
                                                {new Date(task.deadline).toLocaleDateString()}
                                            </td>
                                            <td className="p-4">
                                                <PriorityBadge priority={task.priority} />
                                            </td>
                                            <td className="p-4">
                                                <TaskStatusBadge status={task.status} />
                                            </td>
                                            <td className="p-4">
                                                {task.status === 'submitted' && (
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            size="sm"
                                                            onClick={() => {
                                                                setSelectedTask(task)
                                                                setShowReviewDialog(true)
                                                            }}
                                                        >
                                                            <Eye className="w-4 h-4 mr-1" />
                                                            Review
                                                        </Button>
                                                    </div>
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
                        <div className="text-center py-12 text-muted-foreground">
                            No tasks found
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Review Dialog */}
            <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Review Task: {selectedTask?.title}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <h4 className="font-medium mb-1">Description</h4>
                            <p className="text-sm text-muted-foreground">{selectedTask?.description}</p>
                        </div>
                        {selectedTask?.proof_url && (
                            <div>
                                <h4 className="font-medium mb-2">Proof Submitted</h4>
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
                                        <Eye className="w-4 h-4" />
                                        Open Proof in New Tab
                                    </a>
                                </div>
                            </div>
                        )}
                        <div>
                            <h4 className="font-medium mb-1">Feedback (optional)</h4>
                            <Textarea
                                placeholder="Provide feedback to the student coordinator..."
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                rows={3}
                            />
                        </div>
                        <div className="flex gap-3">
                            <Button
                                className="flex-1 bg-green-600 hover:bg-green-700"
                                onClick={() => handleReview(selectedTask?.id, 'approved')}
                            >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Approve
                            </Button>
                            <Button
                                variant="destructive"
                                className="flex-1"
                                onClick={() => handleReview(selectedTask?.id, 'rejected')}
                            >
                                <XCircle className="w-4 h-4 mr-2" />
                                Reject
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    )
}
