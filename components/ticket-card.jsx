"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Calendar,
    MapPin,
    Download,
    QrCode,
    Clock,
    User,
    Ticket as TicketIcon
} from "lucide-react"
import QRCode from "qrcode"

export function TicketCard({ registration, userName, userEmail }) {
    const qrRef = useRef(null)
    const ticketRef = useRef(null)
    const [qrDataUrl, setQrDataUrl] = useState(null)

    // Prioritize participant details if available (for multi-ticket support)
    const attendeeName = registration.participant_name || userName || 'Attendee'
    const attendeeEmail = registration.participant_email || userEmail || 'Email not provided'

    // Generate unique ticket ID with null-safe handling
    const dateStr = registration.created_at?.slice(0, 10)?.replace(/-/g, '') || Date.now().toString()
    const ticketId = registration.ticket_id || `EVT-${registration.event_id || 0}-${registration.id || 0}-${dateStr}`

    // QR code data with null-safe values
    const qrData = JSON.stringify({
        ticketId,
        eventId: registration.event_id || 0,
        registrationId: registration.id || 0,
        attendee: attendeeName,
        event: registration.event_title || 'Event',
        date: registration.event_start_date || new Date().toISOString(),
        status: registration.status || 'unknown'
    })

    useEffect(() => {
        // Generate QR code as data URL
        QRCode.toDataURL(qrData, {
            width: 150,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#ffffff'
            }
        }).then(url => {
            setQrDataUrl(url)
        }).catch(err => {
            console.error("QR generation error:", err)
        })
    }, [qrData])

    const formatDate = (dateString) => {
        if (!dateString) return "TBA"
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    const formatTime = (dateString) => {
        if (!dateString) return ""
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const downloadTicket = async () => {
        if (!ticketRef.current) {
            console.error("Ticket ref not found")
            return
        }

        try {
            const { toPng } = await import('html-to-image')

            // Wait a brief moment to ensure QR code is rendered
            await new Promise(resolve => setTimeout(resolve, 300))

            const dataUrl = await toPng(ticketRef.current, {
                quality: 1.0,
                pixelRatio: 2,
                backgroundColor: '#ffffff',
                cacheBust: true,
                // filter out elements that shouldn't be captured
                filter: (node) => {
                    // skip hidden elements
                    if (node.style && node.style.display === 'none') return false
                    return true
                }
            })

            const link = document.createElement('a')
            link.download = `ticket-${ticketId}.png`
            link.href = dataUrl
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        } catch (error) {
            console.error("Download error:", error)
            // Fallback: try a second time (html-to-image sometimes needs a retry)
            try {
                const { toPng } = await import('html-to-image')
                const dataUrl = await toPng(ticketRef.current, {
                    quality: 1.0,
                    pixelRatio: 2,
                    backgroundColor: '#ffffff',
                    cacheBust: true,
                })
                const link = document.createElement('a')
                link.download = `ticket-${ticketId}.png`
                link.href = dataUrl
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
            } catch (retryError) {
                console.error("Retry download error:", retryError)
                alert("Download failed. Please take a screenshot of your ticket instead.")
            }
        }
    }

    const isUpcoming = new Date(registration.event_start_date) > new Date()
    const isConfirmed = registration.status === 'confirmed'

    return (
        <Card className="overflow-hidden border-2 hover:shadow-lg transition-all duration-300">
            <div ref={ticketRef} className="bg-gradient-to-br from-primary/5 via-background to-secondary/5">
                {/* Ticket Header */}
                <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <TicketIcon className="w-5 h-5" />
                            <span className="font-semibold">Event Ticket</span>
                        </div>
                        <Badge className={
                            isConfirmed
                                ? "bg-green-500 text-white"
                                : "bg-yellow-500 text-white"
                        }>
                            {registration.status?.toUpperCase()}
                        </Badge>
                    </div>
                </div>

                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Event Info */}
                        <div className="flex-1 space-y-3">
                            <h3 className="text-xl font-bold text-foreground">
                                {registration.event_title}
                            </h3>

                            <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Calendar className="w-4 h-4 text-primary" />
                                    <span>{formatDate(registration.event_start_date)}</span>
                                </div>

                                {registration.event_start_date && (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Clock className="w-4 h-4 text-primary" />
                                        <span>{formatTime(registration.event_start_date)}</span>
                                    </div>
                                )}

                                {registration.event_location && (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <MapPin className="w-4 h-4 text-primary" />
                                        <span>{registration.event_location}</span>
                                    </div>
                                )}

                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <User className="w-4 h-4 text-primary" />
                                    <span>{attendeeName}</span>
                                </div>
                            </div>

                            {/* Ticket ID */}
                            <div className="pt-2 border-t border-dashed">
                                <p className="text-xs text-muted-foreground">Ticket ID</p>
                                <p className="font-mono text-sm font-semibold">{ticketId}</p>
                            </div>

                            {/* Payment Info */}
                            {registration.payment_status && (
                                <div className="flex items-center gap-2">
                                    <Badge variant={registration.payment_status === 'completed' ? 'default' : 'secondary'}>
                                        {registration.payment_status === 'completed' ? '✓ Paid' : 'Payment ' + registration.payment_status}
                                    </Badge>
                                    {registration.payment_amount && (
                                        <span className="text-sm font-semibold">₹{registration.payment_amount}</span>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* QR Code Section */}
                        <div className="flex flex-col items-center justify-center p-4 border-l-2 border-dashed">
                            {qrDataUrl ? (
                                <img
                                    src={qrDataUrl}
                                    alt="Ticket QR Code"
                                    className="w-32 h-32 rounded-lg"
                                />
                            ) : (
                                <div className="w-32 h-32 bg-muted rounded-lg flex items-center justify-center">
                                    <QrCode className="w-8 h-8 text-muted-foreground animate-pulse" />
                                </div>
                            )}
                            <p className="text-xs text-muted-foreground mt-2 text-center">
                                Scan at venue entry
                            </p>
                        </div>
                    </div>
                </CardContent>
            </div>

            {/* Action Buttons */}
            <div className="border-t bg-muted/30 p-3 flex gap-2 justify-end">
                {registration.certificate_issued && (
                    <Button
                        variant="default"
                        size="sm"
                        onClick={() => window.open(`/api/registrations/${registration.id}/certificate`, '_blank')}
                        className="gap-2 bg-green-600 hover:bg-green-700"
                    >
                        <Download className="w-4 h-4" />
                        Download Certificate
                    </Button>
                )}
                <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadTicket}
                    className="gap-2"
                >
                    <Download className="w-4 h-4" />
                    Download Ticket
                </Button>
            </div>
        </Card>
    )
}
