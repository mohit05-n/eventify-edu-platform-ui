"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { DashboardLayout, PageHeader, ContentSection } from "@/components/dashboard-layout"
import { StatCard, StatsGrid } from "@/components/stat-card"
import { TicketCard } from "@/components/ticket-card"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import {
  Download,
  Calendar,
  CheckCircle,
  Loader2,
  Star,
  QrCode,
  MapPin,
  Clock,
  FileText,
  MessageSquare,
  Award,
  CreditCard,
  IndianRupee,
  AlertCircle
} from "lucide-react"
import Link from "next/link"

export default function AttendeeDashboard() {
  const [session, setSession] = useState(null)
  const [registrations, setRegistrations] = useState([])
  const [payments, setPayments] = useState([])
  const [paymentsSummary, setPaymentsSummary] = useState({ totalSpent: 0, successfulPayments: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false)
  const [feedbackRating, setFeedbackRating] = useState(0)
  const [feedbackComment, setFeedbackComment] = useState("")
  const [submittingFeedback, setSubmittingFeedback] = useState(false)
  const router = useRouter()

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
        await Promise.all([
          fetchRegistrations(sessionData.session.userId),
          fetchPayments()
        ])
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

  const fetchPayments = async () => {
    try {
      const response = await fetch('/api/payments/user')
      if (response.ok) {
        const data = await response.json()
        setPayments(data.payments || [])
        setPaymentsSummary(data.summary || { totalSpent: 0, successfulPayments: 0 })
      }
    } catch (error) {
      console.error("[v0] Fetch payments error:", error)
    }
  }

  const handleSubmitFeedback = async () => {
    if (!selectedEvent || feedbackRating === 0) {
      toast.error("Please select a rating")
      return
    }

    setSubmittingFeedback(true)
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: selectedEvent.event_id,
          rating: feedbackRating,
          comment: feedbackComment
        })
      })

      if (response.ok) {
        toast.success("Feedback submitted successfully!")
        setShowFeedbackDialog(false)
        setFeedbackRating(0)
        setFeedbackComment("")
        setSelectedEvent(null)
      } else {
        const data = await response.json()
        toast.error(data.error || "Failed to submit feedback")
      }
    } catch (error) {
      toast.error("Failed to submit feedback")
      console.error("[v0] Submit feedback error:", error)
    } finally {
      setSubmittingFeedback(false)
    }
  }

  const stats = [
    {
      title: "Registered Events",
      value: registrations.length.toString(),
      icon: Calendar,
      color: "blue",
      description: "Events you're attending"
    },
    {
      title: "Upcoming",
      value: registrations.filter(r => new Date(r.event_start_date) > new Date()).length.toString(),
      icon: Clock,
      color: "purple",
      description: "Events coming up"
    },
    {
      title: "Certificates",
      value: registrations.filter(r => r.certificate_issued).length.toString(),
      icon: Award,
      color: "green",
      description: "Available to download"
    },
    {
      title: "Total Spent",
      value: `₹${paymentsSummary.totalSpent?.toLocaleString() || 0}`,
      icon: CreditCard,
      color: "orange",
      description: `${paymentsSummary.successfulPayments || 0} successful payments`
    }
  ]

  // Generate a simple QR code data (in reality, you'd use a proper QR library)
  const getTicketQRData = (registration) => {
    return `TICKET-${registration.id}-${registration.event_id}-${session?.userId}`
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
        title="My Dashboard"
        description={`Welcome, ${session?.name || "Attendee"}! Track your events and download your tickets.`}
        actions={
          <Link href="/events">
            <Button>
              <Calendar className="w-4 h-4 mr-2" />
              Browse Events
            </Button>
          </Link>
        }
      />

      {/* Stats */}
      <div className="mb-8">
        <StatsGrid columns={4}>
          {stats.map((stat, index) => (
            <StatCard key={stat.title} {...stat} delay={index} />
          ))}
        </StatsGrid>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Registrations */}
        <div className="lg:col-span-2">
          <ContentSection title="My Registrations" description="Events you've registered for">
            <Card>
              <CardContent className="p-0">
                {registrations.length > 0 ? (
                  <div className="divide-y divide-border">
                    {registrations.map((reg, index) => {
                      const isUpcoming = new Date(reg.event_start_date) > new Date()
                      const isPast = new Date(reg.event_start_date) < new Date()

                      return (
                        <motion.div
                          key={reg.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="p-4"
                        >
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="font-semibold text-lg">{reg.event_title}</h4>
                                <Badge className={
                                  reg.status === "confirmed"
                                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                    : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                                }>
                                  {reg.status}
                                </Badge>
                                {isUpcoming && <Badge variant="outline">Upcoming</Badge>}
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  {new Date(reg.event_start_date).toLocaleDateString()}
                                </span>
                                {reg.event_location && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-4 h-4" />
                                    {reg.event_location}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-2">
                                Ticket #{reg.id}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {/* Complete Payment Button (for pending registrations) */}
                              {reg.status === "pending" && (
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => router.push(`/checkout?eventId=${reg.event_id}&registrationId=${reg.id}`)}
                                  className="gap-1"
                                >
                                  <CreditCard className="w-4 h-4" />
                                  Complete Payment
                                </Button>
                              )}

                              {/* QR/Ticket Button */}
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <QrCode className="w-4 h-4 mr-1" />
                                    View Ticket
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-lg">
                                  <DialogHeader>
                                    <DialogTitle>Event Ticket</DialogTitle>
                                  </DialogHeader>
                                  <TicketCard
                                    registration={reg}
                                    userName={session?.name}
                                    userEmail={session?.email}
                                  />
                                </DialogContent>
                              </Dialog>

                              {/* Feedback Button (for past events) */}
                              {isPast && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedEvent(reg)
                                    setShowFeedbackDialog(true)
                                  }}
                                >
                                  <Star className="w-4 h-4 mr-1" />
                                  Feedback
                                </Button>
                              )}

                              {/* Certificate (if issued) */}
                              {reg.certificate_issued && reg.certificate_url && (
                                <a href={reg.certificate_url} download target="_blank" rel="noopener noreferrer">
                                  <Button variant="outline" size="sm" className="gap-1 bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800">
                                    <Download className="w-4 h-4" />
                                    Certificate
                                  </Button>
                                </a>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="p-12 text-center text-muted-foreground">
                    <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-semibold mb-2">No Registrations Yet</h3>
                    <p className="mb-4">Browse events and register to see them here!</p>
                    <Link href="/events">
                      <Button>Browse Events</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </ContentSection>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Links */}
          <ContentSection title="Quick Links">
            <Card>
              <CardContent className="p-4 space-y-2">
                <Link href="/events" className="block">
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Calendar className="w-4 h-4" />
                    Browse Events
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </ContentSection>

          {/* Upcoming Event */}
          {registrations.filter(r => new Date(r.event_start_date) > new Date()).length > 0 && (
            <ContentSection title="Next Event">
              <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
                <CardContent className="p-4">
                  {(() => {
                    const upcoming = registrations
                      .filter(r => new Date(r.event_start_date) > new Date())
                      .sort((a, b) => new Date(a.event_start_date) - new Date(b.event_start_date))[0]

                    if (!upcoming) return null

                    const daysUntil = Math.ceil((new Date(upcoming.event_start_date) - new Date()) / (1000 * 60 * 60 * 24))

                    return (
                      <>
                        <div className="text-4xl font-bold text-primary mb-2">{daysUntil}</div>
                        <p className="text-sm text-muted-foreground mb-2">days until</p>
                        <h4 className="font-semibold">{upcoming.event_title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {new Date(upcoming.event_start_date).toLocaleDateString()}
                        </p>
                      </>
                    )
                  })()}
                </CardContent>
              </Card>
            </ContentSection>
          )}

          {/* Payment History */}
          <ContentSection title="Recent Payments">
            <Card>
              <CardContent className="p-0">
                {payments.length > 0 ? (
                  <div className="divide-y divide-border">
                    {payments.slice(0, 5).map((payment, index) => (
                      <motion.div
                        key={payment.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{payment.event_title}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(payment.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">₹{payment.amount}</span>
                            <Badge className={
                              payment.status === 'completed'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                : payment.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                  : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            }>
                              {payment.status}
                            </Badge>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-muted-foreground text-sm">
                    <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No payment history
                  </div>
                )}
              </CardContent>
            </Card>
          </ContentSection>
        </div>
      </div>

      {/* Feedback Dialog */}
      <Dialog open={showFeedbackDialog} onOpenChange={setShowFeedbackDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rate Your Experience</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-3">
                How was your experience at {selectedEvent?.event_title}?
              </p>
              <div className="flex gap-2 justify-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setFeedbackRating(star)}
                    className="p-2 transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-8 h-8 ${star <= feedbackRating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground"
                        }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Textarea
                placeholder="Share your thoughts about the event (optional)"
                value={feedbackComment}
                onChange={(e) => setFeedbackComment(e.target.value)}
                rows={4}
              />
            </div>
            <Button
              className="w-full"
              onClick={handleSubmitFeedback}
              disabled={submittingFeedback || feedbackRating === 0}
            >
              {submittingFeedback ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Submit Feedback
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}