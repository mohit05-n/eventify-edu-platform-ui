"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/components/auth-context"
import { toast } from "sonner"
import {
    Calendar, MapPin, Users, User, Clock, IndianRupee,
    Star, Send, Loader2, ArrowLeft, Share2, CheckCircle, Mic, CreditCard, X, FileText, Download,
    Plus, Trash2, UserPlus, Ticket
} from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TicketCard } from "@/components/ticket-card"

export default function EventDetailPage() {
    const { id } = useParams()
    const router = useRouter()
    const { session } = useAuth()

    const [event, setEvent] = useState(null)
    const [loading, setLoading] = useState(true)
    const [registering, setRegistering] = useState(false)
    const [isRegistered, setIsRegistered] = useState(false)
    const [registrationData, setRegistrationData] = useState(null)
    const [imgError, setImgError] = useState(false)
    const [showFullImage, setShowFullImage] = useState(false)
    const [showTicketDialog, setShowTicketDialog] = useState(false)

    // Multi-participant state
    const [isRegDialogOpen, setIsRegDialogOpen] = useState(false)
    const [participants, setParticipants] = useState([])

    // Feedback state
    const [feedbackList, setFeedbackList] = useState([])
    const [feedbackStats, setFeedbackStats] = useState({ averageRating: 0, totalReviews: 0 })
    const [rating, setRating] = useState(0)
    const [hoverRating, setHoverRating] = useState(0)
    const [comment, setComment] = useState("")
    const [submittingFeedback, setSubmittingFeedback] = useState(false)

    useEffect(() => {
        fetchEvent()
        fetchFeedback()
    }, [id])

    useEffect(() => {
        if (session && id) checkRegistration()
    }, [session, id])

    // Initialize/reset participants when dialog opens or session changes
    useEffect(() => {
        if (session && participants.length === 0) {
            setParticipants([{
                name: session.name || "",
                email: session.email || "",
                phone: session.phone || "",
                enrollmentId: "",
                semester: "",
                branch: "",
                gender: ""
            }])
        }
    }, [session])

    const fetchEvent = async () => {
        if (!id || id === "undefined" || id === "null") {
            setLoading(false)
            return
        }

        try {
            const res = await fetch(`/api/events/${id}`)
            const data = await res.json()

            if (!res.ok) {
                const errorMsg = data.error || "Event not found"
                throw new Error(errorMsg)
            }

            setEvent(data)
        } catch (err) {
            console.error("[v0] Fetch event error:", err)
            toast.error(err.message)
        } finally {
            setLoading(false)
        }
    }

    const fetchFeedback = async () => {
        try {
            const res = await fetch(`/api/feedback?event_id=${id}`)
            if (res.ok) {
                const data = await res.json()
                setFeedbackList(data.feedback || [])
                setFeedbackStats(data.stats || { averageRating: 0, totalReviews: 0 })
            }
        } catch (err) {
            console.error("[v0] Fetch feedback error:", err)
        }
    }

    const checkRegistration = async () => {
        try {
            const res = await fetch(`/api/registrations/get`)
            if (res.ok) {
                const data = await res.json()
                const regs = Array.isArray(data) ? data : []
                const reg = regs.find(r => String(r.event_id) === String(id))
                setIsRegistered(!!reg)
                setRegistrationData(reg || null)
            }
        } catch { }
    }

    const addParticipant = () => {
        setParticipants([...participants, { name: "", email: "", phone: "", enrollmentId: "", semester: "", branch: "", gender: "" }])
    }

    const removeParticipant = (index) => {
        if (participants.length <= 1) return;
        const newParticipants = [...participants]
        newParticipants.splice(index, 1)
        setParticipants(newParticipants)
    }

    const updateParticipant = (index, field, value) => {
        const newParticipants = [...participants]
        newParticipants[index][field] = value
        setParticipants(newParticipants)
    }

    const handleRegister = async () => {
        if (!session) {
            router.push("/auth/login")
            return
        }

        // Validate participants
        for (const p of participants) {
            if (!p.name || !p.email) {
                toast.error("Please fill in all participant names and emails")
                return
            }
        }

        setRegistering(true)
        try {
            const res = await fetch("/api/registrations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    eventId: parseInt(id),
                    participants: participants
                }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Registration failed")

            if (data.isPaidEvent) {
                toast.info("Registrations created. Redirecting to payment...")
                router.push(`/checkout?eventId=${id}&bookingId=${data.bookingId}`)
            } else {
                toast.success("Successfully registered all participants!")
                setIsRegistered(true)
                setIsRegDialogOpen(false)
                await checkRegistration()
            }
        } catch (err) {
            toast.error(err.message)
        } finally {
            setRegistering(false)
        }
    }

    const handleFeedbackSubmit = async (e) => {
        e.preventDefault()
        if (!rating) {
            toast.error("Please select a rating")
            return
        }
        setSubmittingFeedback(true)
        try {
            const res = await fetch("/api/feedback", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ event_id: parseInt(id), rating, comment }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Failed to submit feedback")
            toast.success(data.message || "Feedback submitted!")
            setRating(0)
            setComment("")
            fetchFeedback()
        } catch (err) {
            toast.error(err.message)
        } finally {
            setSubmittingFeedback(false)
        }
    }

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href)
        toast.success("Link copied to clipboard!")
    }

    if (loading) {
        return (
            <main>
                <Navbar />
                <div className="flex justify-center items-center min-h-[60vh]">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            </main>
        )
    }

    if (!event) {
        return (
            <main>
                <Navbar />
                <div className="max-w-4xl mx-auto px-4 py-16 text-center">
                    <h1 className="text-3xl font-bold mb-4">Event Not Found</h1>
                    <p className="text-muted-foreground mb-6">This event doesn&apos;t exist or is no longer available.</p>
                    <Button onClick={() => router.push("/events")}>Browse Events</Button>
                </div>
            </main>
        )
    }

    const isExpired = new Date(event.end_date) < new Date()
    const startDate = new Date(event.start_date).toLocaleDateString("en-US", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
    })
    const startTime = new Date(event.start_date).toLocaleTimeString("en-US", {
        hour: "2-digit", minute: "2-digit",
    })
    const endDate = new Date(event.end_date).toLocaleDateString("en-US", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
    })
    const endTime = new Date(event.end_date).toLocaleTimeString("en-US", {
        hour: "2-digit", minute: "2-digit",
    })

    const spotsLeft = event.max_capacity ? event.max_capacity - (event.current_capacity || 0) : null
    const isFull = spotsLeft !== null && spotsLeft <= 0

    const totalPrice = event.price ? parseFloat(event.price) * participants.length : 0

    return (
        <>
            <main>
                <Navbar />
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Back Button */}
                    <Button variant="ghost" className="mb-6 gap-2" onClick={() => router.back()}>
                        <ArrowLeft className="w-4 h-4" /> Back
                    </Button>

                    {/* Hero Image */}
                    <div className="relative w-full h-64 md:h-80 lg:h-96 rounded-2xl overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/20 mb-8">
                        {event.image_url && !imgError ? (
                            <img
                                src={event.image_url}
                                alt={event.title}
                                className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
                                onError={() => setImgError(true)}
                                onClick={() => setShowFullImage(true)}
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/30 via-secondary/20 to-accent/30">
                                <div className="text-center">
                                    <Calendar className="w-16 h-16 text-primary/50 mx-auto mb-2" />
                                    <p className="text-muted-foreground text-sm">No image available</p>
                                </div>
                            </div>
                        )}

                        {/* Full Image Lightbox */}
                        {showFullImage && event.image_url && (
                            <div
                                className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-pointer"
                                onClick={() => setShowFullImage(false)}
                                onKeyDown={(e) => e.key === 'Escape' && setShowFullImage(false)}
                                tabIndex={0}
                            >
                                <button
                                    className="absolute top-4 right-4 text-white bg-white/20 hover:bg-white/40 rounded-full p-2 transition-colors z-10"
                                    onClick={() => setShowFullImage(false)}
                                >
                                    <X className="w-6 h-6" />
                                </button>
                                <img
                                    src={event.image_url}
                                    alt={event.title}
                                    className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                        )}
                        {/* Overlays */}
                        <div className="absolute top-4 left-4 flex gap-2">
                            <Badge variant="secondary" className="capitalize text-sm px-3 py-1">
                                {event.category}
                            </Badge>
                            {isExpired && (
                                <Badge variant="destructive" className="gap-1"><Clock className="w-3 h-3" /> Expired</Badge>
                            )}
                            {isRegistered && (
                                <Badge className="bg-green-500 text-white gap-1"><CheckCircle className="w-3 h-3" /> Registered</Badge>
                            )}
                        </div>
                        <Button
                            variant="secondary"
                            size="icon"
                            className="absolute top-4 right-4 rounded-full"
                            onClick={handleShare}
                        >
                            <Share2 className="w-4 h-4" />
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Title & Description */}
                            <div>
                                <h1 className="text-3xl md:text-4xl font-bold mb-4">{event.title}</h1>
                                <p className="text-muted-foreground text-lg leading-relaxed">{event.description}</p>
                            </div>

                            {/* Event Details Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Card className="border-l-4 border-l-primary">
                                    <CardContent className="p-4 flex items-center gap-3">
                                        <Calendar className="w-5 h-5 text-primary flex-shrink-0" />
                                        <div>
                                            <p className="text-sm text-muted-foreground">Start</p>
                                            <p className="font-medium">{startDate}</p>
                                            <p className="text-sm text-muted-foreground">{startTime}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="border-l-4 border-l-secondary">
                                    <CardContent className="p-4 flex items-center gap-3">
                                        <Clock className="w-5 h-5 text-secondary flex-shrink-0" />
                                        <div>
                                            <p className="text-sm text-muted-foreground">End</p>
                                            <p className="font-medium">{endDate}</p>
                                            <p className="text-sm text-muted-foreground">{endTime}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="border-l-4 border-l-green-500">
                                    <CardContent className="p-4 flex items-center gap-3">
                                        <MapPin className="w-5 h-5 text-green-500 flex-shrink-0" />
                                        <div>
                                            <p className="text-sm text-muted-foreground">Location</p>
                                            <p className="font-medium">{event.location}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="border-l-4 border-l-orange-500">
                                    <CardContent className="p-4 flex items-center gap-3">
                                        <Users className="w-5 h-5 text-orange-500 flex-shrink-0" />
                                        <div>
                                            <p className="text-sm text-muted-foreground">Capacity</p>
                                            <p className="font-medium">
                                                {event.current_capacity || 0}{event.max_capacity ? ` / ${event.max_capacity}` : ""} registered
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Speakers */}
                            {event.speakers && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Mic className="w-5 h-5 text-primary" /> Speakers
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex flex-wrap gap-2">
                                            {event.speakers.split(",").map((speaker, i) => (
                                                <Badge key={i} variant="outline" className="px-3 py-1.5 text-sm">
                                                    <User className="w-3 h-3 mr-1" /> {speaker.trim()}
                                                </Badge>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Schedule */}
                            {event.schedule && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Clock className="w-5 h-5 text-primary" /> Schedule / Agenda
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            {event.schedule.split("\n").map((line, i) => (
                                                <div key={i} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                                                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                                                    <p className="text-sm">{line.trim()}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Brochure */}
                            {event.brochure_url && (
                                <Card className="border-l-4 border-l-blue-500">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <FileText className="w-5 h-5 text-blue-500" /> Event Brochure
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground mb-4">
                                            Download or view the official brochure for this event.
                                        </p>
                                        <div className="flex gap-3">
                                            <Button
                                                variant="default"
                                                className="gap-2"
                                                onClick={() => window.open(event.brochure_url, '_blank')}
                                            >
                                                <FileText className="w-4 h-4" /> View Brochure
                                            </Button>
                                            <Button
                                                variant="outline"
                                                className="gap-2"
                                                asChild
                                            >
                                                <a href={event.brochure_url} download>
                                                    <Download className="w-4 h-4" /> Download
                                                </a>
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Organizer Info */}
                            {event.organiser_name && (
                                <Card>
                                    <CardContent className="p-4 flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-lg">
                                            {event.organiser_name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Organized by</p>
                                            <p className="font-semibold">{event.organiser_name}</p>
                                            {event.organiser_college && (
                                                <p className="text-sm text-muted-foreground">{event.organiser_college}</p>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* ─── Feedback Section ─────────────────────────────────────────── */}
                            <div className="space-y-6">
                                <h2 className="text-2xl font-bold flex items-center gap-2">
                                    <Star className="w-6 h-6 text-yellow-500" /> Reviews & Feedback
                                </h2>

                                {/* Average Rating */}
                                {feedbackStats.totalReviews > 0 && (
                                    <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 rounded-xl">
                                        <div className="text-4xl font-bold text-yellow-600">
                                            {feedbackStats.averageRating.toFixed(1)}
                                        </div>
                                        <div>
                                            <div className="flex gap-0.5">
                                                {[1, 2, 3, 4, 5].map((s) => (
                                                    <Star
                                                        key={s}
                                                        className={`w-5 h-5 ${s <= Math.round(feedbackStats.averageRating) ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`}
                                                    />
                                                ))}
                                            </div>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                {feedbackStats.totalReviews} review{feedbackStats.totalReviews !== 1 ? "s" : ""}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Feedback Form — only for registered attendees */}
                                {session && isRegistered && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-lg">Leave Your Feedback</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium mb-2">Rating</label>
                                                    <div className="flex gap-1">
                                                        {[1, 2, 3, 4, 5].map((s) => (
                                                            <button
                                                                key={s}
                                                                type="button"
                                                                className="p-1 transition-transform hover:scale-110"
                                                                onClick={() => setRating(s)}
                                                                onMouseEnter={() => setHoverRating(s)}
                                                                onMouseLeave={() => setHoverRating(0)}
                                                            >
                                                                <Star
                                                                    className={`w-8 h-8 transition-colors ${s <= (hoverRating || rating)
                                                                        ? "text-yellow-500 fill-yellow-500"
                                                                        : "text-gray-300"
                                                                        }`}
                                                                />
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium mb-2">Comment (optional)</label>
                                                    <textarea
                                                        value={comment}
                                                        onChange={(e) => setComment(e.target.value)}
                                                        placeholder="Share your experience..."
                                                        className="w-full px-3 py-2 border border-input rounded-md bg-background min-h-20 resize-none"
                                                    />
                                                </div>
                                                <Button type="submit" disabled={submittingFeedback || !rating} className="gap-2">
                                                    {submittingFeedback ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                                    Submit Feedback
                                                </Button>
                                            </form>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Feedback List */}
                                {feedbackList.length > 0 ? (
                                    <div className="space-y-4">
                                        {feedbackList.map((fb) => (
                                            <Card key={fb.id}>
                                                <CardContent className="p-4">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-sm">
                                                                {fb.user_name?.charAt(0) || "?"}
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-sm">{fb.user_name}</p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {new Date(fb.created_at).toLocaleDateString("en-US", {
                                                                        month: "short", day: "numeric", year: "numeric",
                                                                    })}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-0.5">
                                                            {[1, 2, 3, 4, 5].map((s) => (
                                                                <Star
                                                                    key={s}
                                                                    className={`w-4 h-4 ${s <= fb.rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`}
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>
                                                    {fb.comment && (
                                                        <p className="text-sm text-muted-foreground mt-2">{fb.comment}</p>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground text-center py-6">No reviews yet. Be the first to leave feedback!</p>
                                )}
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Registration Card */}
                            <Card className="sticky top-24">
                                <CardContent className="p-6 space-y-4">
                                    {/* Price */}
                                    <div className="text-center">
                                        {event.price && parseFloat(event.price) > 0 ? (
                                            <div className="flex items-center justify-center gap-1">
                                                <IndianRupee className="w-6 h-6 text-primary" />
                                                <span className="text-3xl font-bold text-primary">{event.price}</span>
                                            </div>
                                        ) : (
                                            <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 text-lg px-4 py-1">
                                                Free
                                            </Badge>
                                        )}
                                    </div>

                                    {/* Spots Left */}
                                    {spotsLeft !== null && (
                                        <div className="text-center">
                                            <p className={`text-sm font-medium ${spotsLeft <= 10 ? "text-orange-500" : "text-muted-foreground"}`}>
                                                {isFull ? "Event is full" : `${spotsLeft} spot${spotsLeft !== 1 ? "s" : ""} left`}
                                            </p>
                                        </div>
                                    )}

                                    {/* Register / Payment Button */}
                                    {(session?.role === 'admin' || session?.role === 'organiser') ? (
                                        /* Admin/Organiser: just viewing, no registration/ticket actions */
                                        <div className="bg-muted/50 rounded-lg p-3 text-center">
                                            <p className="text-sm text-muted-foreground font-medium">
                                                {session.role === 'admin' ? 'Admin View' : 'Organiser View'}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {session.role === 'admin'
                                                    ? 'You are viewing this event as an admin'
                                                    : 'Organisers cannot register for events'}
                                            </p>
                                        </div>
                                    ) : isRegistered ? (
                                        <div className="space-y-3">
                                            {registrationData?.status === 'pending' && event.price && parseFloat(event.price) > 0 ? (
                                                <>
                                                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 text-center">
                                                        <p className="text-sm text-yellow-700 dark:text-yellow-400 font-medium">Payment Pending</p>
                                                        <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-1">Complete payment to confirm your registration</p>
                                                    </div>
                                                    <Button
                                                        className="w-full gap-2"
                                                        onClick={() => router.push(`/checkout?eventId=${id}&registrationId=${registrationData.id}`)}
                                                    >
                                                        <CreditCard className="w-4 h-4" />
                                                        Pay ₹{event.price} & Confirm
                                                    </Button>
                                                </>
                                            ) : (
                                                <Button className="w-full gap-2" variant="outline" onClick={() => setShowTicketDialog(true)}>
                                                    <Ticket className="w-4 h-4 text-green-500" /> View My Ticket
                                                </Button>
                                            )}
                                        </div>
                                    ) : isExpired ? (
                                        <div className="space-y-3">
                                            <div className="bg-muted/50 rounded-lg p-3 text-center">
                                                <p className="text-sm text-muted-foreground font-medium">This event has ended</p>
                                                <p className="text-xs text-muted-foreground mt-1">Registration is closed</p>
                                            </div>
                                            <Button className="w-full" variant="outline" onClick={() => router.push('/events')}>
                                                Browse More Events
                                            </Button>
                                        </div>
                                    ) : isFull ? (
                                        <Button className="w-full" disabled>Sold Out</Button>
                                    ) : (
                                        <Dialog open={isRegDialogOpen} onOpenChange={setIsRegDialogOpen}>
                                            <DialogTrigger asChild>
                                                <Button className="w-full" onClick={() => {
                                                    if (!session) {
                                                        router.push("/auth/login")
                                                    }
                                                }}>
                                                    {session ? "Register Now" : "Login to Register"}
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                                <DialogHeader>
                                                    <DialogTitle>Register for {event.title}</DialogTitle>
                                                    <DialogDescription>
                                                        Add participants and confirm their details. You can register multiple people at once.
                                                    </DialogDescription>
                                                </DialogHeader>

                                                <div className="space-y-6 py-4">
                                                    {participants.map((p, index) => (
                                                        <div key={index} className="p-4 border rounded-xl relative bg-muted/30">
                                                            <div className="flex justify-between items-center mb-4">
                                                                <h4 className="font-semibold text-sm flex items-center gap-2">
                                                                    <User className="w-4 h-4" /> Participant #{index + 1}
                                                                    {index === 0 && <Badge variant="secondary" className="ml-2 font-normal">Primary</Badge>}
                                                                </h4>
                                                                {index > 0 && (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="text-destructive hover:text-destructive hover:bg-destructive/10 -mr-2"
                                                                        onClick={() => removeParticipant(index)}
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </Button>
                                                                )}
                                                            </div>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                <div className="space-y-2">
                                                                    <Label htmlFor={`name-${index}`}>Full Name <span className="text-destructive">*</span></Label>
                                                                    <Input
                                                                        id={`name-${index}`}
                                                                        placeholder="Enter full name"
                                                                        value={p.name}
                                                                        onChange={(e) => updateParticipant(index, "name", e.target.value)}
                                                                    />
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <Label htmlFor={`email-${index}`}>Email Address <span className="text-destructive">*</span></Label>
                                                                    <Input
                                                                        id={`email-${index}`}
                                                                        type="email"
                                                                        placeholder="Enter email address"
                                                                        value={p.email}
                                                                        onChange={(e) => updateParticipant(index, "email", e.target.value)}
                                                                    />
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <Label htmlFor={`phone-${index}`}>Phone Number (Optional)</Label>
                                                                    <Input
                                                                        id={`phone-${index}`}
                                                                        placeholder="Enter phone number"
                                                                        value={p.phone}
                                                                        onChange={(e) => updateParticipant(index, "phone", e.target.value)}
                                                                    />
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <Label htmlFor={`enrollmentId-${index}`}>Enrollment ID <span className="text-destructive">*</span></Label>
                                                                    <Input
                                                                        id={`enrollmentId-${index}`}
                                                                        placeholder="e.g. EN21CS001"
                                                                        value={p.enrollmentId || ""}
                                                                        onChange={(e) => updateParticipant(index, "enrollmentId", e.target.value)}
                                                                    />
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <Label htmlFor={`semester-${index}`}>Semester <span className="text-destructive">*</span></Label>
                                                                    <Input
                                                                        id={`semester-${index}`}
                                                                        placeholder="e.g. 3rd Sem"
                                                                        value={p.semester || ""}
                                                                        onChange={(e) => updateParticipant(index, "semester", e.target.value)}
                                                                    />
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <Label htmlFor={`branch-${index}`}>Branch <span className="text-destructive">*</span></Label>
                                                                    <Input
                                                                        id={`branch-${index}`}
                                                                        placeholder="e.g. CSE, ECE, ME"
                                                                        value={p.branch || ""}
                                                                        onChange={(e) => updateParticipant(index, "branch", e.target.value)}
                                                                    />
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <Label htmlFor={`gender-${index}`}>Gender <span className="text-destructive">*</span></Label>
                                                                    <Select
                                                                        value={p.gender || ""}
                                                                        onValueChange={(val) => updateParticipant(index, "gender", val)}
                                                                    >
                                                                        <SelectTrigger id={`gender-${index}`}>
                                                                            <SelectValue placeholder="Select gender" />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="Male">Male</SelectItem>
                                                                            <SelectItem value="Female">Female</SelectItem>
                                                                            <SelectItem value="Other">Other</SelectItem>
                                                                            <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}

                                                    {participants.length < (spotsLeft || 10) && (
                                                        <Button
                                                            variant="outline"
                                                            className="w-full border-dashed gap-2 py-6 text-muted-foreground hover:text-primary hover:border-primary transition-all"
                                                            onClick={addParticipant}
                                                        >
                                                            <Plus className="w-4 h-4" /> Add Another Participant
                                                        </Button>
                                                    )}
                                                </div>

                                                <DialogFooter className="flex-col sm:flex-row gap-4 items-center border-t pt-6">
                                                    <div className="flex-1 text-center sm:text-left">
                                                        <p className="text-sm text-muted-foreground">Total for {participants.length} ticket(s)</p>
                                                        <p className="text-2xl font-bold text-primary flex items-center gap-1 justify-center sm:justify-start">
                                                            <IndianRupee className="w-5 h-5" /> {totalPrice.toFixed(2)}
                                                        </p>
                                                    </div>
                                                    <div className="flex gap-2 w-full sm:w-auto">
                                                        <Button variant="ghost" onClick={() => setIsRegDialogOpen(false)}>Cancel</Button>
                                                        <Button
                                                            className="flex-1 sm:flex-none gap-2 px-8"
                                                            onClick={handleRegister}
                                                            disabled={registering}
                                                        >
                                                            {registering ? (
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                            ) : (
                                                                <CreditCard className="w-4 h-4" />
                                                            )}
                                                            {event.price && parseFloat(event.price) > 0 ? "Proceed to Payment" : "Confirm Registration"}
                                                        </Button>
                                                    </div>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    )}

                                    {/* Quick Info */}
                                    <div className="space-y-3 pt-4 border-t border-border">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Calendar className="w-4 h-4" />
                                            <span>{startDate}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Clock className="w-4 h-4" />
                                            <span>{startTime} - {endTime}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <MapPin className="w-4 h-4" />
                                            <span>{event.location}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>

            {/* Inline Ticket Dialog */}
            <Dialog open={showTicketDialog} onOpenChange={setShowTicketDialog}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
                    <DialogHeader className="px-6 pt-6 pb-2">
                        <DialogTitle className="flex items-center gap-2">
                            <Ticket className="w-5 h-5 text-primary" />
                            Your Ticket
                        </DialogTitle>
                        <DialogDescription>
                            Ticket for {event?.title}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="px-6 pb-6">
                        {registrationData && (
                            <TicketCard
                                registration={{
                                    ...registrationData,
                                    event_title: event?.title,
                                    event_start_date: event?.start_date,
                                    event_location: event?.location,
                                }}
                                userName={session?.name}
                                userEmail={session?.email}
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}

