"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { DashboardLayout, PageHeader } from "@/components/dashboard-layout"
import { TicketCard } from "@/components/ticket-card"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Calendar, Ticket, Clock, CheckCircle } from "lucide-react"
import Link from "next/link"

export default function MyTicketsPage() {
    const [session, setSession] = useState(null)
    const [registrations, setRegistrations] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()
    const searchParams = useSearchParams()
    const filterEventId = searchParams.get('eventId')

    useEffect(() => {
        const checkAuthAndFetch = async () => {
            try {
                const sessionResponse = await fetch("/api/auth/session")
                const sessionData = await sessionResponse.json()

                if (!sessionData.session || sessionData.session.role !== "attendee") {
                    router.push("/auth/login")
                    return
                }

                setSession(sessionData.session)
                await fetchRegistrations(sessionData.session.userId)
            } catch (error) {
                console.error("[v0] Auth check error:", error)
                router.push("/auth/login")
            } finally {
                setIsLoading(false)
            }
        }

        checkAuthAndFetch()
    }, [router])

    const fetchRegistrations = async (userId) => {
        try {
            const response = await fetch(`/api/registrations/get?user_id=${userId}`)
            if (response.ok) {
                const data = await response.json()
                setRegistrations(Array.isArray(data) ? data : [])
            }
        } catch (error) {
            console.error("[v0] Fetch registrations error:", error)
        }
    }

    // Apply event filter if eventId query param is present
    const displayRegistrations = filterEventId
        ? registrations.filter(r => String(r.event_id) === String(filterEventId))
        : registrations

    // Filter tickets
    const confirmedTickets = displayRegistrations.filter(r => r.status === 'confirmed')
    const pendingTickets = displayRegistrations.filter(r => r.status === 'pending')
    const upcomingTickets = confirmedTickets.filter(r => new Date(r.event_start_date) > new Date())
    const pastTickets = confirmedTickets.filter(r => new Date(r.event_start_date) <= new Date())

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
                title={filterEventId ? "Event Ticket" : "My Tickets"}
                description={filterEventId ? "Your ticket for this event" : "View and download your event tickets with QR codes"}
                actions={
                    <div className="flex gap-2">
                        {filterEventId && (
                            <Link href="/attendee/tickets">
                                <Button variant="outline">
                                    <Ticket className="w-4 h-4 mr-2" />
                                    View All Tickets
                                </Button>
                            </Link>
                        )}
                        <Link href="/events">
                            <Button>
                                <Calendar className="w-4 h-4 mr-2" />
                                Browse Events
                            </Button>
                        </Link>
                    </div>
                }
            />

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-full">
                            <Ticket className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{registrations.length}</p>
                            <p className="text-xs text-muted-foreground">Total Tickets</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 bg-green-500/20 rounded-full">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{confirmedTickets.length}</p>
                            <p className="text-xs text-muted-foreground">Confirmed</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 bg-purple-500/20 rounded-full">
                            <Calendar className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{upcomingTickets.length}</p>
                            <p className="text-xs text-muted-foreground">Upcoming</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 bg-orange-500/20 rounded-full">
                            <Clock className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{pendingTickets.length}</p>
                            <p className="text-xs text-muted-foreground">Pending Payment</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tickets Tabs */}
            <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-6">
                    <TabsTrigger value="all">All ({registrations.length})</TabsTrigger>
                    <TabsTrigger value="upcoming">Upcoming ({upcomingTickets.length})</TabsTrigger>
                    <TabsTrigger value="past">Past ({pastTickets.length})</TabsTrigger>
                    <TabsTrigger value="pending">Pending ({pendingTickets.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="all">
                    <TicketsList
                        tickets={displayRegistrations}
                        userName={session?.name}
                        userEmail={session?.email}
                    />
                </TabsContent>

                <TabsContent value="upcoming">
                    <TicketsList
                        tickets={upcomingTickets}
                        userName={session?.name}
                        userEmail={session?.email}
                        emptyMessage="No upcoming events. Browse events to register!"
                    />
                </TabsContent>

                <TabsContent value="past">
                    <TicketsList
                        tickets={pastTickets}
                        userName={session?.name}
                        userEmail={session?.email}
                        emptyMessage="No past events yet."
                    />
                </TabsContent>

                <TabsContent value="pending">
                    <TicketsList
                        tickets={pendingTickets}
                        userName={session?.name}
                        userEmail={session?.email}
                        emptyMessage="No pending payments."
                        showPaymentWarning
                    />
                </TabsContent>
            </Tabs>
        </DashboardLayout>
    )
}

function TicketsList({ tickets, userName, userEmail, emptyMessage, showPaymentWarning }) {
    if (!tickets || tickets.length === 0) {
        return (
            <div className="text-center py-12">
                <Ticket className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-xl font-semibold mb-2">No Tickets Found</h3>
                <p className="text-muted-foreground mb-4">{emptyMessage || "Register for events to get tickets"}</p>
                <Link href="/events">
                    <Button>Browse Events</Button>
                </Link>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {showPaymentWarning && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <p className="text-yellow-800 text-sm">
                        ⚠️ These registrations are pending payment. Complete payment to confirm your tickets.
                    </p>
                </div>
            )}
            {tickets.map((registration, index) => (
                <motion.div
                    key={registration.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                >
                    <TicketCard
                        registration={registration}
                        userName={userName}
                        userEmail={userEmail}
                    />
                </motion.div>
            ))}
        </div>
    )
}
