"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { motion } from "framer-motion"
import { DashboardLayout, PageHeader, ContentSection } from "@/components/dashboard-layout"
import { EventStatusBadge } from "@/components/task-status-badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Calendar, MapPin, Users, Clock, Edit, ArrowLeft, Loader2,
    User, IndianRupee, Eye, Mail, CheckCircle, XCircle, AlertCircle, Mic, Award, Download
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export default function OrganiserEventDetailPage() {
    const { id } = useParams()
    const router = useRouter()
    const [session, setSession] = useState(null)
    const [event, setEvent] = useState(null)
    const [participants, setParticipants] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [issuingCertificates, setIssuingCertificates] = useState(false)
    const [certificatesIssued, setCertificatesIssued] = useState(false)

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Auth check
                const sessionRes = await fetch("/api/auth/session")
                const sessionData = await sessionRes.json()
                if (!sessionData.session || sessionData.session.role !== "organiser") {
                    router.push("/auth/login")
                    return
                }
                setSession(sessionData.session)

                // Fetch event
                const eventRes = await fetch(`/api/events/${id}`)
                if (!eventRes.ok) throw new Error("Event not found")
                const eventData = await eventRes.json()
                setEvent(eventData)

                // Fetch participants (registrations for this event)
                const partRes = await fetch(`/api/registrations?event_id=${id}`)
                if (partRes.ok) {
                    const partData = await partRes.json()
                    setParticipants(Array.isArray(partData) ? partData : [])
                }
            } catch (err) {
                console.error("[v0] Fetch error:", err)
            } finally {
                setIsLoading(false)
            }
        }
        fetchData()
    }, [id, router])

    const handleIssueCertificates = async () => {
        setIssuingCertificates(true)
        try {
            const res = await fetch(`/api/events/${id}/certificates`, { method: "POST" })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Failed to issue certificates")
            toast.success(data.message || "Certificates issued successfully!")
            setCertificatesIssued(true)
        } catch (err) {
            toast.error(err.message)
        } finally {
            setIssuingCertificates(false)
        }
    }

    const handleDownloadCSV = () => {
        if (participants.length === 0) {
            toast.error("No participants to export")
            return
        }

        const headers = ["Name", "Email", "Phone", "Booking ID", "Status", "Registration Date"]
        const rows = participants.map(p => [
            p.participant_name || p.user_name || "",
            p.participant_email || p.user_email || "",
            p.participant_phone || "",
            p.booking_id || `REG-${p.id}`,
            p.status || "confirmed",
            new Date(p.registered_at || p.created_at).toLocaleDateString()
        ])

        const csvContent = [
            headers.join(","),
            ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
        ].join("\n")

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.setAttribute("href", url)
        link.setAttribute("download", `participants_${event.title.replace(/\s+/g, '_').toLowerCase()}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        toast.success("Participant list downloaded!")
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!event) {
        return (
            <DashboardLayout session={session}>
                <div className="text-center py-16">
                    <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h2 className="text-xl font-semibold mb-2">Event Not Found</h2>
                    <p className="text-muted-foreground mb-4">This event does not exist or you don't have permission to view it.</p>
                    <Button onClick={() => router.push("/organiser/events")}>Back to Events</Button>
                </div>
            </DashboardLayout>
        )
    }

    const isExpired = new Date(event.end_date) < new Date()
    const confirmedCount = participants.filter(p => p.status === "confirmed").length
    const pendingCount = participants.filter(p => p.status === "pending").length

    return (
        <DashboardLayout session={session}>
            <PageHeader
                title={event.title}
                description="View event details and manage participants"
                actions={
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => router.push("/organiser/events")} className="gap-2">
                            <ArrowLeft className="w-4 h-4" /> Back
                        </Button>
                        <Link href={`/events/${id}`}>
                            <Button variant="outline" className="gap-2">
                                <Eye className="w-4 h-4" /> Public View
                            </Button>
                        </Link>
                        <Link href={`/organiser/events/${id}/edit`}>
                            <Button className="gap-2">
                                <Edit className="w-4 h-4" /> Edit Event
                            </Button>
                        </Link>
                    </div>
                }
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Event Details */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Hero Image */}
                    {event.image_url && (
                        <Card className="overflow-hidden">
                            <img
                                src={event.image_url}
                                alt={event.title}
                                className="w-full h-64 object-cover"
                                onError={(e) => { e.target.style.display = 'none'; }}
                            />
                        </Card>
                    )}

                    {/* Event Info */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Event Details</CardTitle>
                                <EventStatusBadge status={event.status} />
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-muted-foreground">{event.description}</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-center gap-3 text-sm">
                                    <Calendar className="w-4 h-4 text-primary" />
                                    <div>
                                        <p className="font-medium">Start Date</p>
                                        <p className="text-muted-foreground">{new Date(event.start_date).toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <Clock className="w-4 h-4 text-primary" />
                                    <div>
                                        <p className="font-medium">End Date</p>
                                        <p className="text-muted-foreground">{new Date(event.end_date).toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <MapPin className="w-4 h-4 text-primary" />
                                    <div>
                                        <p className="font-medium">Location</p>
                                        <p className="text-muted-foreground">{event.location}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <Users className="w-4 h-4 text-primary" />
                                    <div>
                                        <p className="font-medium">Capacity</p>
                                        <p className="text-muted-foreground">{event.current_capacity || 0} / {event.max_capacity} registered</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <IndianRupee className="w-4 h-4 text-primary" />
                                    <div>
                                        <p className="font-medium">Price</p>
                                        <p className="text-muted-foreground">{event.price && parseFloat(event.price) > 0 ? `₹${event.price}` : "Free"}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <Badge variant="outline" className="capitalize">{event.category}</Badge>
                                    {isExpired && <Badge variant="destructive">Expired</Badge>}
                                </div>
                            </div>

                            {event.speakers && (
                                <div className="pt-4 border-t">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Mic className="w-4 h-4 text-primary" />
                                        <p className="font-medium text-sm">Speakers</p>
                                    </div>
                                    <p className="text-sm text-muted-foreground">{event.speakers}</p>
                                </div>
                            )}

                            {event.schedule && (
                                <div className="pt-4 border-t">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Clock className="w-4 h-4 text-primary" />
                                        <p className="font-medium text-sm">Schedule / Agenda</p>
                                    </div>
                                    <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-sans">{event.schedule}</pre>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Participants List */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Participants ({participants.length})</CardTitle>
                                <div className="flex gap-2">
                                    <Badge variant="outline" className="gap-1">
                                        <CheckCircle className="w-3 h-3 text-green-500" /> {confirmedCount} confirmed
                                    </Badge>
                                    {pendingCount > 0 && (
                                        <Badge variant="outline" className="gap-1">
                                            <Clock className="w-3 h-3 text-yellow-500" /> {pendingCount} pending
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {participants.length > 0 ? (
                                <div className="divide-y divide-border">
                                    {participants.map((participant, index) => (
                                        <motion.div
                                            key={participant.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.03 }}
                                            className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                    <User className="w-4 h-4 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm">{participant.user_name || "Participant"}</p>
                                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <Mail className="w-3 h-3" /> {participant.user_email || "—"}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {participant.status === "confirmed" ? (
                                                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0">
                                                        <CheckCircle className="w-3 h-3 mr-1" /> Confirmed
                                                    </Badge>
                                                ) : (
                                                    <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-0">
                                                        <Clock className="w-3 h-3 mr-1" /> Pending
                                                    </Badge>
                                                )}
                                                <span className="text-xs text-muted-foreground">
                                                    {new Date(participant.registered_at || participant.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center text-muted-foreground">
                                    <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p>No participants yet</p>
                                    <p className="text-sm mt-1">Registrations will appear here when attendees sign up</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Stats */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Quick Stats</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Total Registrations</span>
                                <span className="font-semibold">{participants.length}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Confirmed</span>
                                <span className="font-semibold text-green-600">{confirmedCount}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Pending Payment</span>
                                <span className="font-semibold text-yellow-600">{pendingCount}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Capacity</span>
                                <span className="font-semibold">{event.current_capacity || 0} / {event.max_capacity}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Fill Rate</span>
                                <span className="font-semibold">
                                    {Math.round(((event.current_capacity || 0) / (event.max_capacity || 1)) * 100)}%
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Link href={`/organiser/events/${id}/edit`} className="block">
                                <Button variant="outline" className="w-full justify-start gap-2">
                                    <Edit className="w-4 h-4" /> Edit Event
                                </Button>
                            </Link>
                            <Link href={`/events/${id}`} className="block">
                                <Button variant="outline" className="w-full justify-start gap-2">
                                    <Eye className="w-4 h-4" /> View Public Page
                                </Button>
                            </Link>
                            <Button
                                variant={certificatesIssued ? "outline" : "default"}
                                className={`w-full justify-start gap-2 ${certificatesIssued ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800" : !isExpired ? "opacity-50 cursor-not-allowed bg-gray-400 text-white" : "bg-amber-600 hover:bg-amber-700 text-white"}`}
                                onClick={handleIssueCertificates}
                                disabled={issuingCertificates || certificatesIssued || !isExpired}
                                title={!isExpired ? "Certificates can only be issued after the event ends" : ""}
                            >
                                {issuingCertificates ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : certificatesIssued ? (
                                    <CheckCircle className="w-4 h-4" />
                                ) : !isExpired ? (
                                    <Clock className="w-4 h-4" />
                                ) : (
                                    <Award className="w-4 h-4" />
                                )}
                                {issuingCertificates
                                    ? "Sending Certificates..."
                                    : certificatesIssued
                                        ? "Certificates Issued"
                                        : !isExpired
                                            ? "Event In Progress"
                                            : "Issue Certificates"}
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full justify-start gap-2 border-primary/20 hover:bg-primary/5"
                                onClick={handleDownloadCSV}
                            >
                                <Download className="w-4 h-4 text-primary" />
                                Download Participants (CSV)
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    )
}
