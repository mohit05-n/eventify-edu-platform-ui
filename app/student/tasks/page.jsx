"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { DashboardLayout, PageHeader, ContentSection } from "@/components/dashboard-layout"
import { TaskStatusBadge, PriorityBadge } from "@/components/task-status-badge"
import { FileUpload } from "@/components/file-upload"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import {
    Search,
    Upload,
    Loader2,
    Calendar,
    CalendarDays,
    Clock,
    AlertCircle,
    X
} from "lucide-react"

export default function StudentTasksPage() {
    const [session, setSession] = useState(null)
    const [tasks, setTasks] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [searchDate, setSearchDate] = useState("")
    const [dateFrom, setDateFrom] = useState("")
    const [dateTo, setDateTo] = useState("")
    const [selectedTask, setSelectedTask] = useState(null)
    const [showUploadDialog, setShowUploadDialog] = useState(false)
    const [uploading, setUploading] = useState(false)
    const router = useRouter()

    useEffect(() => {
        const checkAuthAndFetch = async () => {
            try {
                const sessionResponse = await fetch("/api/auth/session")
                const sessionData = await sessionResponse.json()

                if (!sessionData.session || sessionData.session.role !== "student_coordinator") {
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

    const handleProofUpload = async (uploadData) => {
        if (!selectedTask) return

        setUploading(true)
        try {
            // uploadData comes from FileUpload which already uploaded the file
            // uploadData has: { file_name, file_url, file_type, document_type }
            const proofUrl = uploadData.file_url

            // Submit the real URL as proof
            const response = await fetch(`/api/tasks/${selectedTask.id}/proof`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ proof_url: proofUrl })
            })

            if (response.ok) {
                toast.success("Proof uploaded successfully!")
                setShowUploadDialog(false)
                await fetchTasks()
            } else {
                toast.error("Failed to submit proof")
            }
        } catch (error) {
            toast.error(error.message || "Failed to upload proof")
            console.error("[v0] Upload proof error:", error)
        } finally {
            setUploading(false)
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

    const getDeadlineStatus = (deadline) => {
        const now = new Date()
        const deadlineDate = new Date(deadline)
        const daysUntil = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24))

        if (daysUntil < 0) return { color: "text-red-600", text: "Overdue" }
        if (daysUntil <= 2) return { color: "text-orange-600", text: `${daysUntil} day(s) left` }
        return { color: "text-green-600", text: `${daysUntil} days left` }
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
                title="My Tasks"
                description="View and complete your assigned tasks"
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
                            <SelectItem value="completed">Completed</SelectItem>
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

            {/* Tasks Grid */}
            <div className="grid gap-4">
                {filteredTasks.length > 0 ? (
                    filteredTasks.map((task, index) => {
                        const deadlineStatus = getDeadlineStatus(task.deadline)

                        return (
                            <motion.div
                                key={task.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <Card className={task.status === 'rejected' ? 'border-red-200 bg-red-50/50' : ''}>
                                    <CardContent className="p-4">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="font-semibold text-lg">{task.title}</h3>
                                                    <TaskStatusBadge status={task.status} />
                                                    <PriorityBadge priority={task.priority} />
                                                </div>
                                                <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="w-4 h-4" />
                                                        {task.event_title}
                                                    </span>
                                                    <span className={`flex items-center gap-1 ${deadlineStatus.color}`}>
                                                        <Clock className="w-4 h-4" />
                                                        {deadlineStatus.text}
                                                    </span>
                                                </div>
                                                {task.feedback && (
                                                    <div className="mt-2 p-2 bg-muted/50 rounded text-sm">
                                                        <strong>Feedback:</strong> {task.feedback}
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                {(task.status === 'pending' || task.status === 'rejected') && (
                                                    <Button
                                                        onClick={() => {
                                                            setSelectedTask(task)
                                                            setShowUploadDialog(true)
                                                        }}
                                                    >
                                                        <Upload className="w-4 h-4 mr-2" />
                                                        Upload Proof
                                                    </Button>
                                                )}
                                                {task.status === 'submitted' && (
                                                    <Badge variant="outline">Awaiting Review</Badge>
                                                )}
                                                {task.status === 'completed' && (
                                                    <Badge className="bg-green-100 text-green-800">Completed</Badge>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )
                    })
                ) : (
                    <div className="text-center py-12 text-muted-foreground">
                        <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No tasks found</p>
                    </div>
                )}
            </div>

            {/* Upload Dialog */}
            <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Upload Proof: {selectedTask?.title}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">{selectedTask?.description}</p>
                        <FileUpload
                            accept="image/*,application/pdf"
                            maxSize={10 * 1024 * 1024}
                            onUpload={handleProofUpload}
                        />
                        {uploading && (
                            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Uploading...
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    )
}
