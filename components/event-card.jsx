"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Calendar, MapPin, Users, Share2, CheckCircle, Clock, Loader2, Ticket } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { TicketCard } from "@/components/ticket-card"

export function EventCard({ event, session }) {
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [imgError, setImgError] = useState(false)
  const [showTicketDialog, setShowTicketDialog] = useState(false)
  const [registrationData, setRegistrationData] = useState(null)
  const [loadingTicket, setLoadingTicket] = useState(false)

  const startDate = new Date(event.start_date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })

  const isExpired = event.is_expired || new Date(event.end_date) < new Date()
  const isRegistered = event.is_registered
  const isAdmin = session?.role === "admin" || session?.role === "organiser"

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/events/${event.id}` : ""
  const shareText = `Check out ${event.title} on EventifyEDU!`

  const handleShare = (platform) => {
    const encodedUrl = encodeURIComponent(shareUrl)
    const encodedText = encodeURIComponent(shareText)

    const urls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
      copy: "",
    }

    if (platform === "copy") {
      navigator.clipboard.writeText(shareUrl)
      toast.success("Link copied to clipboard!")
      setShowShareMenu(false)
      return
    }

    if (urls[platform]) {
      window.open(urls[platform], "_blank", "noopener,noreferrer")
      setShowShareMenu(false)
    }
  }

  const handleViewTicket = async () => {
    setShowTicketDialog(true)
    if (registrationData) return // already fetched
    setLoadingTicket(true)
    try {
      const res = await fetch(`/api/registrations/get`)
      if (res.ok) {
        const data = await res.json()
        const regs = Array.isArray(data) ? data : []
        const reg = regs.find(r => String(r.event_id) === String(event.id))
        setRegistrationData(reg || null)
      }
    } catch (err) {
      console.error("Failed to fetch ticket:", err)
      toast.error("Failed to load ticket")
    } finally {
      setLoadingTicket(false)
    }
  }

  return (
    <>
      <Card className={`overflow-hidden hover-lift h-full group ${isExpired ? 'opacity-75' : ''}`}>
        {/* Image with overlays */}
        <div className="relative w-full h-40 bg-gradient-to-br from-primary/20 to-secondary/20 overflow-hidden">
          {event.image_url && !imgError ? (
            <img
              src={event.image_url}
              alt={event.title}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/30 via-secondary/20 to-accent/30">
              <Calendar className="w-10 h-10 text-primary/40" />
            </div>
          )}

          {/* Status Overlays */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {isRegistered && !isAdmin && (
              <Badge className="bg-green-500 text-white gap-1">
                <CheckCircle className="w-3 h-3" />
                Booked
              </Badge>
            )}
            {isExpired && (
              <Badge variant="destructive" className="gap-1">
                <Clock className="w-3 h-3" />
                Expired
              </Badge>
            )}
          </div>

          {/* Category Badge */}
          <div className="absolute top-2 right-2">
            <Badge variant="secondary" className="capitalize">
              {event.category}
            </Badge>
          </div>
        </div>

        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <h3 className="font-semibold text-lg line-clamp-2">{event.title}</h3>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              {startDate}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              {event.location}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>
                {event.current_capacity || 0}
                {event.max_capacity && ` / ${event.max_capacity}`} registered
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div>
              {event.price && event.price > 0 ? (
                <div className="font-semibold text-primary">₹{event.price}</div>
              ) : (
                <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                  Free
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isAdmin ? (
                /* Admin: just show View Details, no ticket options */
                <Link href={`/events/${event.id}`}>
                  <Button size="sm" variant="outline">
                    View Details
                  </Button>
                </Link>
              ) : isRegistered ? (
                <>
                  <Link href={`/events/${event.id}`}>
                    <Button size="sm" variant="outline">
                      View Details
                    </Button>
                  </Link>
                  <Button size="sm" className="gap-1" onClick={handleViewTicket}>
                    <Ticket className="w-3 h-3" />
                    View Ticket
                  </Button>
                </>
              ) : isExpired ? (
                <Link href={`/events/${event.id}`}>
                  <Button size="sm" variant="outline">
                    View Details
                  </Button>
                </Link>
              ) : (
                <Button asChild size="sm">
                  <Link href={`/events/${event.id}`}>View Details</Link>
                </Button>
              )}
              <div className="relative">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={() => setShowShareMenu(!showShareMenu)}
                >
                  <Share2 className="w-4 h-4" />
                </Button>
                {showShareMenu && (
                  <div className="absolute top-full right-0 mt-2 bg-card border border-border rounded-lg shadow-xl p-2 min-w-[160px] animate-scale-in z-50">
                    <button
                      onClick={() => handleShare("twitter")}
                      className="w-full text-left px-3 py-2 hover:bg-accent/10 rounded text-sm flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                      Twitter
                    </button>
                    <button
                      onClick={() => handleShare("whatsapp")}
                      className="w-full text-left px-3 py-2 hover:bg-accent/10 rounded text-sm flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                      </svg>
                      WhatsApp
                    </button>
                    <button
                      onClick={() => handleShare("copy")}
                      className="w-full text-left px-3 py-2 hover:bg-accent/10 rounded text-sm flex items-center gap-2"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                      Copy Link
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ticket Popup Dialog */}
      <Dialog open={showTicketDialog} onOpenChange={setShowTicketDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle className="flex items-center gap-2">
              <Ticket className="w-5 h-5 text-primary" />
              Your Ticket
            </DialogTitle>
            <DialogDescription>
              Ticket for {event.title}
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 pb-6">
            {loadingTicket ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : registrationData ? (
              <TicketCard
                registration={{
                  ...registrationData,
                  event_title: event.title,
                  event_start_date: event.start_date,
                  event_location: event.location,
                }}
                userName={session?.name}
                userEmail={session?.email}
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>Could not load ticket information.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

