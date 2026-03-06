"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { DashboardLayout, PageHeader, ContentSection } from "@/components/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import {
    ClipboardList,
    Calendar,
    Clock,
    Upload,
    CheckCircle,
    Play,
    Send,
    Loader2,
    AlertCircle,
    FileText,
    ExternalLink
} from "lucide-react"

export default function MyTasksPage() {
    const [session, setSession] = useState(null)
    const [tasks, setTasks] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedTask, setSelectedTask] = useState(null)
    const [showSubmitDialog, setShowSubmitDialog] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [proofUrl, setProofUrl] = useState("")
    const [proofFile, setProofFile] = useState(null)
    const [isUploading, setIsUploading] = useState(false)
    const router = useRouter()

    useEffect(() => {
        const checkAuthAndFetch = async () => {
            try {
                const sessionResponse = await fetch("/api/auth/session")
                const sessionData = await sessionResponse.json()

                if (!sessionData.session) {
                    router.push("/auth/login")
                    return
                }

                // Allow both student_coordinator and event_coordinator
                if (!["student_coordinator", "event_coordinator"].includes(sessionData.session.role)) {
                    router.push("/auth/login")
                    return
                }

                setSession(sessionData.session)
                await fetchMyTasks()
            } catch (error) {
                console.error("[v0] Auth check error:", error)
                router.push("/auth/login")
            } finally {
                setIsLoading(false)
            }
        }

        checkAuthAndFetch()
    }, [router])

    const fetchMyTasks = async () => {
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

    const handleStartTask = async (taskId) => {
        try {
            const response = await fetch(`/api/tasks/${taskId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "in_progress" })
            })

            if (response.ok) {
                toast.success("Task started! Good luck!")
                await fetchMyTasks()
            } else {
                const err = await response.json()
                toast.error(err.error || "Failed to start task")
            }
        } catch (error) {
            toast.error("Failed to start task")
            console.error("[v0] Start task error:", error)
        }
    }

    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        try {
            const formData = new FormData()
            formData.append("file", file)

            const response = await fetch("/api/upload", {
                method: "POST",
                body: formData
            })

            if (response.ok) {
                const data = await response.json()
                setProofUrl(data.url)
                setProofFile(file)
                toast.success("File uploaded successfully!")
            } else {
                toast.error("Failed to upload file")
            }
        } catch (error) {
            toast.error("Failed to upload file")
            console.error("[v0] Upload error:", error)
        } finally {
            setIsUploading(false)
        }
    }

    const handleSubmitTask = async () => {
        if (!selectedTask) return

        if (!proofUrl) {
            toast.error("Please upload proof of completion")
            return
        }

        setIsSubmitting(true)
        try {
            // First upload the proof
            const proofResponse = await fetch(`/api/tasks/${selectedTask.id}/proof`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ proof_url: proofUrl })
            })

            if (!proofResponse.ok) {
                const err = await proofResponse.json()
                throw new Error(err.error || "Failed to submit proof")
            }

            toast.success("Task submitted for review!")
            setShowSubmitDialog(false)
            setProofUrl("")
            setProofFile(null)
            setSelectedTask(null)
            await fetchMyTasks()
        } catch (error) {
            toast.error(error.message || "Failed to submit task")
            console.error("[v0] Submit task error:", error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const getStatusColor = (status) => {
        const colors = {
            pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
            in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
            submitted: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
            approved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
            rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
        }
        return colors[status] || colors.pending
    }

    const getPriorityColor = (priority) => {
        const colors = {
            low: "bg-gray-100 text-gray-800 border-gray-300",
            medium: "bg-blue-100 text-blue-800 border-blue-300",
            high: "bg-red-100 text-red-800 border-red-300"
        }
        return colors[priority] || colors.medium
    }

    const formatDeadline = (deadline) => {
        if (!deadline) return "No deadline"
        const date = new Date(deadline)
        const now = new Date()
        const diffDays = Math.ceil((date - now) / (1000 * 60 * 60 * 24))

        if (diffDays < 0) return "Overdue"
        if (diffDays === 0) return "Due today"
        if (diffDays === 1) return "Due tomorrow"
        return `${diffDays} days left`
    }

    const pendingTasks = tasks.filter(t => t.status === "pending")
    const inProgressTasks = tasks.filter(t => t.status === "in_progress")
    const submittedTasks = tasks.filter(t => t.status === "submitted")
    const completedTasks = tasks.filter(t => ["approved", "rejected"].includes(t.status))

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
                description="View and submit your assigned tasks"
            />

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="w-8 h-8 text-yellow-600" />
                            <div>
                                <p className="text-2xl font-bold text-yellow-800 dark:text-yellow-400">{pendingTasks.length}</p>
                                <p className="text-sm text-yellow-600">Pending</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <Play className="w-8 h-8 text-blue-600" />
                            <div>
                                <p className="text-2xl font-bold text-blue-800 dark:text-blue-400">{inProgressTasks.length}</p>
                                <p className="text-sm text-blue-600">In Progress</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <Send className="w-8 h-8 text-purple-600" />
                            <div>
                                <p className="text-2xl font-bold text-purple-800 dark:text-purple-400">{submittedTasks.length}</p>
                                <p className="text-sm text-purple-600">Submitted</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                            <div>
                                <p className="text-2xl font-bold text-green-800 dark:text-green-400">{completedTasks.length}</p>
                                <p className="text-sm text-green-600">Completed</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tasks List */}
            <ContentSection title="All Tasks" description="Tasks assigned to you by organizers">
                <Card>
                    <CardContent className="p-0">
                        {tasks.length > 0 ? (
                            <div className="divide-y divide-border">
                                {tasks.map((task, index) => (
                                    <motion.div
                                        key={task.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="p-4 hover:bg-muted/30 transition-colors"
                                    >
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-semibold truncate">{task.title}</h3>
                                                    <Badge variant="outline" className={getPriorityColor(task.priority)}>
                                                        {task.priority}
                                                    </Badge>
                                                </div>
                                                {task.description && (
                                                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                                        {task.description}
                                                    </p>
                                                )}
                                                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="w-4 h-4" />
                                                        {task.event_title || "Unknown Event"}
                                                    </span>
                                                    {task.deadline && (
                                                        <span className={`flex items-center gap-1 ${formatDeadline(task.deadline) === "Overdue" ? "text-red-600" : ""
                                                            }`}>
                                                            <Clock className="w-4 h-4" />
                                                            {formatDeadline(task.deadline)}
                                                        </span>
                                                    )}
                                                </div>
                                                {task.feedback && task.status === "rejected" && (
                                                    <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded text-sm text-red-700 dark:text-red-400">
                                                        <strong>Feedback:</strong> {task.feedback}
                                                    </div>
                                                )}
                                                {task.proof_url && ["submitted", "approved", "rejected"].includes(task.status) && (
                                                    <div className="mt-2 flex items-center gap-2">
                                                        <a
                                                            href={task.proof_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1 text-primary hover:underline text-xs bg-primary/5 px-2 py-1 rounded"
                                                        >
                                                            <ExternalLink className="w-3 h-3" />
                                                            View Submitted Proof
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Badge className={getStatusColor(task.status)}>
                                                    {task.status?.replace("_", " ")}
                                                </Badge>

                                                {/* Action buttons based on status */}
                                                {task.status === "pending" && (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleStartTask(task.id)}
                                                        className="gap-1"
                                                    >
                                                        <Play className="w-4 h-4" />
                                                        Start
                                                    </Button>
                                                )}
                                                {(task.status === "in_progress" || task.status === "rejected") && (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedTask(task)
                                                            setProofUrl("")
                                                            setProofFile(null)
                                                            setShowSubmitDialog(true)
                                                        }}
                                                        className="gap-1"
                                                    >
                                                        <Upload className="w-4 h-4" />
                                                        Submit
                                                    </Button>
                                                )}
                                                {task.status === "submitted" && (
                                                    <span className="text-sm text-muted-foreground">
                                                        Awaiting review...
                                                    </span>
                                                )}
                                                {task.status === "approved" && (
                                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-12 text-center text-muted-foreground">
                                <ClipboardList className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                <h3 className="text-xl font-semibold mb-2">No Tasks Assigned</h3>
                                <p>You don't have any tasks assigned yet. Check back later!</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </ContentSection>

            {/* Submit Task Dialog */}
            <Dialog open={showSubmitDialog} onOpenChange={(open) => {
                setShowSubmitDialog(open)
                if (!open) {
                    setSelectedTask(null)
                    setProofUrl("")
                    setProofFile(null)
                }
            }}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Upload className="w-5 h-5" />
                            Submit Task
                        </DialogTitle>
                        <DialogDescription>
                            Upload proof of completion for: {selectedTask?.title}
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
                            <label className="text-sm font-medium block mb-2">Upload Proof *</label>
                            <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-4 text-center">
                                {proofFile ? (
                                    <div className="flex items-center justify-center gap-2 text-green-600">
                                        <FileText className="w-5 h-5" />
                                        <span className="text-sm font-medium">{proofFile.name}</span>
                                    </div>
                                ) : isUploading ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span className="text-sm">Uploading...</span>
                                    </div>
                                ) : (
                                    <>
                                        <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                                        <p className="text-sm text-muted-foreground mb-2">
                                            Click to upload or drag and drop
                                        </p>
                                        <input
                                            type="file"
                                            accept="image/*,.pdf,.doc,.docx"
                                            onChange={handleFileUpload}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            style={{ position: 'relative' }}
                                        />
                                        <Button variant="outline" size="sm" asChild>
                                            <label className="cursor-pointer">
                                                Choose File
                                                <input
                                                    type="file"
                                                    accept="image/*,.pdf,.doc,.docx"
                                                    onChange={handleFileUpload}
                                                    className="hidden"
                                                />
                                            </label>
                                        </Button>
                                    </>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Supported: Images, PDF, Word documents (max 5MB)
                            </p>
                        </div>

                        <div>
                            <label className="text-sm font-medium block mb-2">Or enter URL</label>
                            <Input
                                placeholder="https://drive.google.com/..."
                                value={proofUrl}
                                onChange={(e) => setProofUrl(e.target.value)}
                            />
                        </div>

                        <div className="flex gap-2 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowSubmitDialog(false)}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSubmitTask}
                                disabled={isSubmitting || !proofUrl}
                                className="flex-1"
                            >
                                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Submit for Review
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    )
}
