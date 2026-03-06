"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { DashboardLayout, PageHeader, ContentSection } from "@/components/dashboard-layout"
import { EventStatusBadge } from "@/components/task-status-badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import {
    Calendar,
    Search,
    CheckCircle,
    XCircle,
    Eye,
    Loader2,
    MapPin,
    Users
} from "lucide-react"
import Link from "next/link"

export default function AdminEventsPage() {
    const [session, setSession] = useState(null)
    const [events, setEvents] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const router = useRouter()

    useEffect(() => {
        const checkAuthAndFetch = async () => {
            try {
                const sessionResponse = await fetch("/api/auth/session")
                const sessionData = await sessionResponse.json()

                if (!sessionData.session || sessionData.session.role !== "admin") {
                    router.push("/auth/login")
                    return
                }

                setSession(sessionData.session)
                await fetchEvents()
            } catch (error) {
                console.error("[v0] Auth check error:", error)
                router.push("/auth/login")
            } finally {
                setIsLoading(false)
            }
        }

        checkAuthAndFetch()
    }, [router])

    const fetchEvents = async () => {
        try {
            const response = await fetch("/api/events/filter?status=pending")
            if (response.ok) {
                const data = await response.json()
                setEvents(Array.isArray(data) ? data : [])
            }
        } catch (error) {
            console.error("[v0] Fetch events error:", error)
        }
    }

    const handleApprove = async (eventId) => {
        try {
            const response = await fetch(`/api/events/${eventId}/approve`, { method: "POST" })
            if (response.ok) {
                toast.success("Event approved successfully!")
                await fetchEvents()
            } else {
                toast.error("Failed to approve event")
            }
        } catch (error) {
            toast.error("Failed to approve event")
            console.error("[v0] Approve error:", error)
        }
    }

    const handleReject = async (eventId) => {
        try {
            const response = await fetch(`/api/events/${eventId}/reject`, { method: "POST" })
            if (response.ok) {
                toast.success("Event rejected")
                await fetchEvents()
            } else {
                toast.error("Failed to reject event")
            }
        } catch (error) {
            toast.error("Failed to reject event")
            console.error("[v0] Reject error:", error)
        }
    }

    const filteredEvents = events.filter(event =>
        event.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )

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
                title="Event Approvals"
                description={`${events.length} events pending approval`}
            />

            {/* Search */}
            <div className="mb-6">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search events..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            {/* Events List */}
            <div className="space-y-4">
                {filteredEvents.length > 0 ? (
                    filteredEvents.map((event, index) => (
                        <motion.div
                            key={event.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                        <div className="flex gap-4 flex-1">
                                            <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                                                {event.image_url ? (
                                                    <img
                                                        src={event.image_url}
                                                        alt={event.title}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.querySelector('.img-fallback').style.display = 'flex'; }}
                                                    />
                                                ) : null}
                                                <div className={`img-fallback w-full h-full items-center justify-center ${event.image_url ? 'hidden' : 'flex'}`}>
                                                    <Calendar className="w-8 h-8 text-muted-foreground" />
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h3 className="font-semibold text-lg">{event.title}</h3>
                                                    <Badge variant="outline">{event.category}</Badge>
                                                    <EventStatusBadge status={event.status} />
                                                </div>
                                                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{event.description}</p>
                                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="w-4 h-4" />
                                                        {new Date(event.start_date).toLocaleDateString()}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <MapPin className="w-4 h-4" />
                                                        {event.location}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Users className="w-4 h-4" />
                                                        {event.max_capacity} capacity
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Link href={`/events/${event.id}`}>
                                                <Button variant="outline" size="sm">
                                                    <Eye className="w-4 h-4 mr-1" />
                                                    View
                                                </Button>
                                            </Link>
                                            <Button
                                                size="sm"
                                                className="bg-green-600 hover:bg-green-700"
                                                onClick={() => handleApprove(event.id)}
                                            >
                                                <CheckCircle className="w-4 h-4 mr-1" />
                                                Approve
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => handleReject(event.id)}
                                            >
                                                <XCircle className="w-4 h-4 mr-1" />
                                                Reject
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))
                ) : (
                    <div className="text-center py-16">
                        <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500 opacity-50" />
                        <h3 className="text-xl font-semibold mb-2">No Events Pending Approval</h3>
                        <p className="text-muted-foreground">All events have been reviewed!</p>
                    </div>
                )}
            </div>
        </DashboardLayout>
    )
}
