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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    Calendar,
    Plus,
    Users,
    Search,
    Eye,
    Edit,
    Trash2,
    Loader2,
    MapPin
} from "lucide-react"
import Link from "next/link"

export default function OrganiserEventsPage() {
    const [session, setSession] = useState(null)
    const [events, setEvents] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
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
                await fetchEvents(sessionData.session.userId)
            } catch (error) {
                console.error("[v0] Auth check error:", error)
                router.push("/auth/login")
            } finally {
                setIsLoading(false)
            }
        }

        checkAuthAndFetch()
    }, [router])

    const fetchEvents = async (userId) => {
        try {
            const response = await fetch(`/api/events/organiser?organiser_id=${userId}`)
            if (response.ok) {
                const data = await response.json()
                setEvents(Array.isArray(data) ? data : [])
            }
        } catch (error) {
            console.error("[v0] Fetch events error:", error)
        }
    }

    const handleDeleteEvent = async (eventId, eventTitle) => {
        if (!confirm(`Are you sure you want to delete "${eventTitle}"? This action cannot be undone and will delete all associated registrations and payments.`)) {
            return;
        }

        try {
            const response = await fetch(`/api/events/${eventId}/delete`, {
                method: "DELETE",
            });

            if (response.ok) {
                alert("Event deleted successfully");
                setEvents(events.filter(event => event.id !== eventId));
            } else {
                const error = await response.json();
                alert(error.error || "Failed to delete event");
            }
        } catch (error) {
            console.error("[v0] Delete event error:", error);
            alert("An error occurred while deleting the event");
        }
    };

    const filteredEvents = events.filter(event => {
        const matchesSearch = event.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            event.description?.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesStatus = statusFilter === "all" || event.status === statusFilter
        return matchesSearch && matchesStatus
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
                title="My Events"
                description="Manage all your events in one place"
                actions={
                    <Link href="/organiser/create-event">
                        <Button size="lg" className="gap-2">
                            <Plus className="w-4 h-4" />
                            Create Event
                        </Button>
                    </Link>
                }
            />

            {/* Filters */}
            <div className="mb-6 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search events..."
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
                        <SelectItem value="all">All Events</SelectItem>
                        <SelectItem value="pending">Pending Approval</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Events Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.length > 0 ? (
                    filteredEvents.map((event, index) => (
                        <motion.div
                            key={event.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <Card className="h-full hover:shadow-lg transition-shadow">
                                <div className="relative h-40 bg-gradient-to-br from-primary/20 to-secondary/20">
                                    {event.image_url && (
                                        <img
                                            src={event.image_url}
                                            alt={event.title}
                                            className="w-full h-full object-cover"
                                            onError={(e) => { e.target.style.display = 'none'; }}
                                        />
                                    )}
                                    <div className="absolute top-3 right-3">
                                        <EventStatusBadge status={event.status} />
                                    </div>
                                </div>
                                <CardContent className="p-4">
                                    <h3 className="font-semibold text-lg mb-2 line-clamp-1">{event.title}</h3>
                                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{event.description}</p>

                                    <div className="space-y-2 text-sm text-muted-foreground mb-4">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4" />
                                            {new Date(event.start_date).toLocaleDateString()}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <MapPin className="w-4 h-4" />
                                            {event.location}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Users className="w-4 h-4" />
                                            {event.current_capacity || 0}/{event.max_capacity} registered
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Link href={`/events/${event.id}`} className="flex-1">
                                            <Button variant="outline" className="w-full" size="sm">
                                                <Eye className="w-4 h-4 mr-1" />
                                                View
                                            </Button>
                                        </Link>
                                        <Link href={`/organiser/events/${event.id}/edit`}>
                                            <Button variant="outline" size="icon">
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                        </Link>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="text-destructive hover:bg-destructive/10 border-destructive/20"
                                            onClick={() => handleDeleteEvent(event.id, event.title)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))
                ) : (
                    <div className="col-span-full text-center py-12">
                        <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <h3 className="text-xl font-semibold mb-2">No events found</h3>
                        <p className="text-muted-foreground mb-4">
                            {searchQuery || statusFilter !== "all"
                                ? "Try adjusting your filters"
                                : "Create your first event to get started!"}
                        </p>
                        <Link href="/organiser/create-event">
                            <Button>
                                <Plus className="w-4 h-4 mr-2" />
                                Create Event
                            </Button>
                        </Link>
                    </div>
                )}
            </div>
        </DashboardLayout>
    )
}
