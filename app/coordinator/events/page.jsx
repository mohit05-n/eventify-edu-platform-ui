"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { DashboardLayout, PageHeader, ContentSection } from "@/components/dashboard-layout"
import { EventStatusBadge } from "@/components/task-status-badge"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Calendar,
    Eye,
    Loader2,
    MapPin,
    Users,
    ClipboardList,
    UserCheck,
    Clock
} from "lucide-react"
import Link from "next/link"

export default function CoordinatorEventsPage() {
    const [session, setSession] = useState(null)
    const [events, setEvents] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()

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
                await fetchAssignedEvents()
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
                setEvents(Array.isArray(data) ? data : [])
            }
        } catch (error) {
            console.error("[v0] Fetch events error:", error)
        }
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
                title="Assigned Events"
                description={`You are assigned to ${events.length} event(s)`}
            />

            {/* Events Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.length > 0 ? (
                    events.map((assignment, index) => (
                        <motion.div
                            key={assignment.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <Card className="h-full hover:shadow-lg transition-shadow">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <h3 className="font-semibold text-lg truncate">{assignment.event_title}</h3>
                                        <EventStatusBadge status={assignment.event_status} />
                                    </div>

                                    <div className="space-y-2 text-sm text-muted-foreground mb-4">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 shrink-0" />
                                            <span>{new Date(assignment.start_date).toLocaleDateString()} {new Date(assignment.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <MapPin className="w-4 h-4 shrink-0" />
                                            <span className="truncate">{assignment.location || "TBD"}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Users className="w-4 h-4 shrink-0" />
                                            <span className="truncate">Organiser: {assignment.organiser_name || "Unknown"}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Link href={`/coordinator/events/${assignment.event_id}`} className="flex-1">
                                            <Button variant="outline" className="w-full" size="sm">
                                                <Eye className="w-4 h-4 mr-1" />
                                                View
                                            </Button>
                                        </Link>
                                        <Link href="/coordinator/tasks" className="flex-1">
                                            <Button className="w-full" size="sm">
                                                <ClipboardList className="w-4 h-4 mr-1" />
                                                Tasks
                                            </Button>
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))
                ) : (
                    <div className="col-span-full text-center py-12">
                        <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <h3 className="text-xl font-semibold mb-2">No Assigned Events</h3>
                        <p className="text-muted-foreground">You haven't been assigned to any events yet.</p>
                    </div>
                )}
            </div>
        </DashboardLayout>
    )
}
