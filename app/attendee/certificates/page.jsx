"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { DashboardLayout, PageHeader } from "@/components/dashboard-layout"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Award, Download, Calendar, MapPin, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export default function CertificatesPage() {
    const [session, setSession] = useState(null)
    const [certificates, setCertificates] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
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
                await fetchCertificates(sessionData.session.userId)
            } catch (error) {
                console.error("[v0] Auth check error:", error)
                router.push("/auth/login")
            } finally {
                setIsLoading(false)
            }
        }

        checkAuthAndFetch()
    }, [router])

    const fetchCertificates = async (userId) => {
        try {
            const response = await fetch(`/api/registrations/get?user_id=${userId}`)
            if (response.ok) {
                const data = await response.json()
                const allRegs = Array.isArray(data) ? data : []
                // Only show registrations with issued certificates
                const issuedCerts = allRegs.filter(r => r.certificate_issued === true)
                setCertificates(issuedCerts)
            }
        } catch (error) {
            console.error("[v0] Fetch certificates error:", error)
        }
    }

    const filteredCerts = certificates.filter(cert =>
        cert.event_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cert.certificate_id?.toLowerCase().includes(searchQuery.toLowerCase())
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
                title="My Certificates"
                description="View and download your official participation certificates from completed events"
                actions={
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search certificates..."
                            className="pl-9"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                }
            />

            {certificates.length === 0 ? (
                <Card className="border-dashed py-12">
                    <CardContent className="flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                            <Award className="w-8 h-8 text-muted-foreground opacity-50" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">No Certificates Issued Yet</h3>
                        <p className="text-muted-foreground max-w-sm mb-6">
                            Certificates are issued by organizers after an event concludes.
                            Attend your registered events to start earning recognition!
                        </p>
                        <Link href="/events">
                            <Button>Browse Upcoming Events</Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : filteredCerts.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-muted-foreground">No certificates match your search query.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCerts.map((cert, index) => (
                        <motion.div
                            key={cert.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <Card className="h-full flex flex-col hover:shadow-md transition-all border-l-4 border-l-primary/30">
                                <CardContent className="p-6 flex-1">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-2 bg-primary/10 rounded-lg">
                                            <Award className="w-6 h-6 text-primary" />
                                        </div>
                                        <Badge variant="outline" className="font-mono text-[10px]">
                                            {cert.certificate_id}
                                        </Badge>
                                    </div>

                                    <h3 className="font-bold text-lg mb-2 line-clamp-2">
                                        {cert.event_title}
                                    </h3>

                                    <div className="space-y-2 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4" />
                                            <span>
                                                Issued: {cert.issue_date
                                                    ? new Date(cert.issue_date).toLocaleDateString('en-US', {
                                                        month: 'short', day: 'numeric', year: 'numeric'
                                                    })
                                                    : new Date(cert.event_start_date).toLocaleDateString('en-US', {
                                                        month: 'short', day: 'numeric', year: 'numeric'
                                                    })
                                                }
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <MapPin className="w-4 h-4" />
                                            <span>{cert.event_location || "Online"}</span>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="p-6 pt-0 flex gap-2">
                                    <Button
                                        className="flex-1 gap-2"
                                        onClick={() => {
                                            const downloadPath = cert.certificate_url || `/api/registrations/${cert.id}/certificate`;
                                            window.open(downloadPath, '_blank');
                                        }}
                                    >
                                        <Download className="w-4 h-4" />
                                        Download PDF
                                    </Button>
                                    <Link href={`/events/${cert.event_id}`} className="block">
                                        <Button variant="outline" size="icon" title="View Event">
                                            <Search className="w-4 h-4" />
                                        </Button>
                                    </Link>
                                </CardFooter>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            )}

            <div className="mt-12 p-6 bg-primary/5 rounded-2xl border border-primary/10 flex flex-col md:flex-row items-center gap-6">
                <div className="p-4 bg-primary/10 rounded-xl">
                    <Award className="w-10 h-10 text-primary" />
                </div>
                <div className="flex-1 text-center md:text-left">
                    <h4 className="font-bold text-lg">Verified Credentials</h4>
                    <p className="text-muted-foreground text-sm">
                        All certificates issued via EventifyEDU include a unique verification ID.
                        You can share these documents with educational institutions or employers as proof of participation.
                    </p>
                </div>
            </div>
        </DashboardLayout>
    )
}
