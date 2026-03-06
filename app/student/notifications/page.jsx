"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { DashboardLayout, PageHeader, ContentSection } from "@/components/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
    Bell,
    BellOff,
    CheckCircle,
    Clock,
    Calendar,
    ClipboardList,
    AlertCircle,
    Loader2,
    CheckCheck
} from "lucide-react"

export default function StudentNotificationsPage() {
    const [session, setSession] = useState(null)
    const [notifications, setNotifications] = useState([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [isLoading, setIsLoading] = useState(true)
    const [filter, setFilter] = useState("all")
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
                await fetchNotifications()
            } catch (error) {
                console.error("[v0] Auth check error:", error)
                router.push("/auth/login")
            } finally {
                setIsLoading(false)
            }
        }

        checkAuthAndFetch()
    }, [router])

    const fetchNotifications = async () => {
        try {
            const response = await fetch("/api/notifications")
            if (response.ok) {
                const data = await response.json()
                setNotifications(data.notifications || [])
                setUnreadCount(data.unreadCount || 0)
            }
        } catch (error) {
            console.error("[v0] Fetch notifications error:", error)
        }
    }

    const markAsRead = async (id) => {
        try {
            const response = await fetch(`/api/notifications/${id}/read`, {
                method: "POST"
            })
            if (response.ok) {
                setNotifications(prev =>
                    prev.map(n => n.id === id ? { ...n, is_read: true } : n)
                )
                setUnreadCount(prev => Math.max(0, prev - 1))
            }
        } catch (error) {
            console.error("[v0] Mark as read error:", error)
        }
    }

    const markAllAsRead = async () => {
        try {
            const response = await fetch("/api/notifications", {
                method: "POST"
            })
            if (response.ok) {
                setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
                setUnreadCount(0)
                toast.success("All notifications marked as read")
            }
        } catch (error) {
            toast.error("Failed to mark all as read")
        }
    }

    const getNotificationIcon = (type) => {
        switch (type) {
            case "task_approved":
                return <CheckCircle className="w-5 h-5 text-green-500" />
            case "task_rejected":
                return <AlertCircle className="w-5 h-5 text-red-500" />
            case "task":
                return <ClipboardList className="w-5 h-5 text-purple-500" />
            default:
                return <Bell className="w-5 h-5 text-muted-foreground" />
        }
    }

    const timeAgo = (dateString) => {
        const now = new Date()
        const date = new Date(dateString)
        const diff = Math.floor((now - date) / 1000)

        if (diff < 60) return "Just now"
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
        if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
        return date.toLocaleDateString()
    }

    const filteredNotifications = filter === "unread"
        ? notifications.filter(n => !n.is_read)
        : notifications

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
                title="Notifications"
                description={`You have ${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`}
                actions={
                    unreadCount > 0 && (
                        <Button onClick={markAllAsRead} variant="outline" className="gap-2">
                            <CheckCheck className="w-4 h-4" />
                            Mark All Read
                        </Button>
                    )
                }
            />

            <div className="flex gap-2 mb-6">
                <Button
                    variant={filter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter("all")}
                >
                    All ({notifications.length})
                </Button>
                <Button
                    variant={filter === "unread" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter("unread")}
                >
                    Unread ({unreadCount})
                </Button>
            </div>

            <ContentSection>
                {filteredNotifications.length > 0 ? (
                    <div className="space-y-3">
                        {filteredNotifications.map((notification, index) => (
                            <motion.div
                                key={notification.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.03 }}
                            >
                                <Card
                                    className={`cursor-pointer transition-all duration-200 hover:shadow-md ${!notification.is_read
                                            ? "border-l-4 border-l-primary bg-primary/5"
                                            : "opacity-75 hover:opacity-100"
                                        }`}
                                    onClick={() => {
                                        if (!notification.is_read) {
                                            markAsRead(notification.id)
                                        }
                                    }}
                                >
                                    <CardContent className="p-4">
                                        <div className="flex items-start gap-3">
                                            <div className="mt-0.5">
                                                {getNotificationIcon(notification.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className={`text-sm font-medium ${!notification.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
                                                        {notification.title}
                                                    </h4>
                                                    {!notification.is_read && (
                                                        <Badge className="bg-primary/20 text-primary text-xs px-1.5 py-0">
                                                            New
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    {notification.message}
                                                </p>
                                                <div className="flex items-center gap-3 mt-2">
                                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {timeAgo(notification.created_at)}
                                                    </span>
                                                    {notification.event_title && (
                                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" />
                                                            {notification.event_title}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            {!notification.is_read && (
                                                <div className="w-2.5 h-2.5 rounded-full bg-primary shrink-0 mt-2" />
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <Card>
                        <CardContent className="p-12 text-center text-muted-foreground">
                            <BellOff className="w-16 h-16 mx-auto mb-4 opacity-50" />
                            <h3 className="text-xl font-semibold mb-2">
                                {filter === "unread" ? "No Unread Notifications" : "No Notifications Yet"}
                            </h3>
                            <p>
                                {filter === "unread"
                                    ? "You're all caught up! No unread notifications."
                                    : "You'll see notifications about your tasks and assignments here."
                                }
                            </p>
                        </CardContent>
                    </Card>
                )}
            </ContentSection>
        </DashboardLayout>
    )
}
