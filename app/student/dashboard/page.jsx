"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { DashboardLayout, PageHeader, ContentSection } from "@/components/dashboard-layout"
import { StatCard, StatsGrid } from "@/components/stat-card"
import { TaskStatusBadge, PriorityBadge } from "@/components/task-status-badge"
import { FileUpload } from "@/components/file-upload"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import {
    ClipboardList,
    CheckCircle,
    Clock,
    AlertCircle,
    Upload,
    Eye,
    Calendar,
    Loader2,
    FileText,
    MessageSquare
} from "lucide-react"
import Link from "next/link"

export default function StudentDashboard() {
    const [session, setSession] = useState(null)
    const [tasks, setTasks] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedTask, setSelectedTask] = useState(null)
    const [showUploadDialog, setShowUploadDialog] = useState(false)
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
                setTasks(Array.isArray(data) ? data : [])
            }
        } catch (error) {
            console.error("[v0] Fetch tasks error:", error)
        }
    }

    const handleProofUpload = async (uploadData) => {
        if (!selectedTask) return

        try {
            const response = await fetch(`/api/tasks/${selectedTask.id}/proof`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ proof_url: uploadData.file_url })
            })

            if (response.ok) {
                toast.success("Proof uploaded successfully!")
                setShowUploadDialog(false)
                setSelectedTask(null)
                await fetchTasks()
            } else {
                throw new Error("Upload failed")
            }
        } catch (error) {
            console.error("[v0] Proof upload error:", error)
            toast.error("Failed to upload proof. Please try again.")
        }
    }

    const getTasksByStatus = (status) => tasks.filter(t => t.status === status)

    const stats = [
        {
            title: "Total Tasks",
            value: tasks.length.toString(),
            icon: ClipboardList,
            color: "blue",
            description: "Tasks assigned to you"
        },
        {
            title: "Pending",
            value: getTasksByStatus("pending").length.toString(),
            icon: Clock,
            color: "orange",
            description: "Tasks awaiting action"
        },
        {
            title: "Submitted",
            value: getTasksByStatus("submitted").length.toString(),
            icon: Upload,
            color: "purple",
            description: "Awaiting review"
        },
        {
            title: "Completed",
            value: getTasksByStatus("approved").length.toString(),
            icon: CheckCircle,
            color: "green",
            description: "Successfully completed"
        }
    ]

    const getDeadlineStatus = (deadline) => {
        if (!deadline) return "normal"
        const now = new Date()
        const deadlineDate = new Date(deadline)
        const diffDays = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24))

        if (diffDays < 0) return "overdue"
        if (diffDays <= 2) return "urgent"
        if (diffDays <= 7) return "soon"
        return "normal"
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
                title="Student Coordinator Dashboard"
                description={`Welcome, ${session?.name || "Student"}! Complete your assigned tasks to help make the event successful.`}
            />

            {/* Stats */}
            <div className="mb-8">
                <StatsGrid columns={4}>
                    {stats.map((stat, index) => (
                        <StatCard key={stat.title} {...stat} delay={index} />
                    ))}
                </StatsGrid>
            </div>

            {/* Task Sections */}
            <div className="space-y-8">
                {/* Urgent Tasks */}
                {tasks.filter(t => t.status === "pending" || t.status === "rejected").length > 0 && (
                    <ContentSection
                        title="Action Required"
                        description="Tasks that need your immediate attention"
                    >
                        <div className="grid gap-4">
                            {tasks
                                .filter(t => t.status === "pending" || t.status === "rejected")
                                .map((task, index) => {
                                    const deadlineStatus = getDeadlineStatus(task.deadline)
                                    return (
                                        <motion.div
                                            key={task.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                        >
                                            <Card className={deadlineStatus === "overdue" ? "border-red-500" : deadlineStatus === "urgent" ? "border-orange-500" : ""}>
                                                <CardContent className="p-6">
                                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-3 mb-2">
                                                                <h3 className="font-semibold text-lg">{task.title}</h3>
                                                                <TaskStatusBadge status={task.status} />
                                                                <PriorityBadge priority={task.priority} />
                                                            </div>
                                                            <p className="text-sm text-muted-foreground mb-2">
                                                                {task.description || "No description provided"}
                                                            </p>
                                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                                <span className="flex items-center gap-1">
                                                                    <Calendar className="w-4 h-4" />
                                                                    {task.event_title}
                                                                </span>
                                                                {task.deadline && (
                                                                    <span className={`flex items-center gap-1 ${deadlineStatus === "overdue" ? "text-red-500" :
                                                                            deadlineStatus === "urgent" ? "text-orange-500" : ""
                                                                        }`}>
                                                                        <Clock className="w-4 h-4" />
                                                                        Due: {new Date(task.deadline).toLocaleDateString()}
                                                                        {deadlineStatus === "overdue" && " (Overdue!)"}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {task.feedback && task.status === "rejected" && (
                                                                <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                                                    <p className="text-sm text-red-600 dark:text-red-400">
                                                                        <MessageSquare className="w-4 h-4 inline mr-1" />
                                                                        Feedback: {task.feedback}
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Dialog open={showUploadDialog && selectedTask?.id === task.id} onOpenChange={(open) => {
                                                                setShowUploadDialog(open)
                                                                if (!open) setSelectedTask(null)
                                                            }}>
                                                                <DialogTrigger asChild>
                                                                    <Button
                                                                        onClick={() => {
                                                                            setSelectedTask(task)
                                                                            setShowUploadDialog(true)
                                                                        }}
                                                                    >
                                                                        <Upload className="w-4 h-4 mr-2" />
                                                                        Upload Proof
                                                                    </Button>
                                                                </DialogTrigger>
                                                                <DialogContent className="max-w-md">
                                                                    <DialogHeader>
                                                                        <DialogTitle>Upload Proof for: {task.title}</DialogTitle>
                                                                    </DialogHeader>
                                                                    <FileUpload
                                                                        onUpload={handleProofUpload}
                                                                        accept="image/*,.pdf,.doc,.docx"
                                                                        placeholder="Upload proof of task completion (images, PDFs, documents)"
                                                                        documentType="other"
                                                                    />
                                                                </DialogContent>
                                                            </Dialog>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    )
                                })}
                        </div>
                    </ContentSection>
                )}

                {/* Submitted Tasks */}
                {getTasksByStatus("submitted").length > 0 && (
                    <ContentSection
                        title="Awaiting Review"
                        description="Tasks you've submitted and are pending coordinator approval"
                    >
                        <Card>
                            <CardContent className="p-0">
                                <div className="divide-y divide-border">
                                    {getTasksByStatus("submitted").map((task, index) => (
                                        <motion.div
                                            key={task.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: index * 0.1 }}
                                            className="p-4 flex items-center justify-between"
                                        >
                                            <div>
                                                <h4 className="font-medium">{task.title}</h4>
                                                <p className="text-sm text-muted-foreground">{task.event_title}</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <TaskStatusBadge status="submitted" />
                                                {task.proof_url && (
                                                    <Button variant="outline" size="sm" asChild>
                                                        <a href={task.proof_url} target="_blank" rel="noopener noreferrer">
                                                            <FileText className="w-4 h-4 mr-1" />
                                                            View Proof
                                                        </a>
                                                    </Button>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </ContentSection>
                )}

                {/* Completed Tasks */}
                {getTasksByStatus("approved").length > 0 && (
                    <ContentSection
                        title="Completed Tasks"
                        description="Tasks that have been approved by your coordinator"
                    >
                        <Card>
                            <CardContent className="p-0">
                                <div className="divide-y divide-border">
                                    {getTasksByStatus("approved").map((task, index) => (
                                        <motion.div
                                            key={task.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: index * 0.1 }}
                                            className="p-4 flex items-center justify-between"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                                </div>
                                                <div>
                                                    <h4 className="font-medium">{task.title}</h4>
                                                    <p className="text-sm text-muted-foreground">{task.event_title}</p>
                                                </div>
                                            </div>
                                            <TaskStatusBadge status="approved" />
                                        </motion.div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </ContentSection>
                )}

                {/* Empty State */}
                {tasks.length === 0 && (
                    <Card className="p-12 text-center">
                        <ClipboardList className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <h3 className="text-xl font-semibold mb-2">No Tasks Yet</h3>
                        <p className="text-muted-foreground">
                            You haven't been assigned any tasks yet. Check back later or contact your event coordinator.
                        </p>
                    </Card>
                )}
            </div>
        </DashboardLayout>
    )
}
