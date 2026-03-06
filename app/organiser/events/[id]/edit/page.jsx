"use client"

import React from "react"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { AlertCircle, Loader2, Upload, Image, X, CheckCircle, ArrowLeft } from "lucide-react"
import { toast } from "sonner"

export default function EditEventPage() {
    const router = useRouter()
    const { id } = useParams()
    const [isLoading, setIsLoading] = useState(false)
    const [isFetching, setIsFetching] = useState(true)
    const [isUploading, setIsUploading] = useState(false)
    const [error, setError] = useState("")
    const [imagePreview, setImagePreview] = useState(null)
    const [imageMode, setImageMode] = useState("upload")
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        category: "workshop",
        location: "",
        start_date: "",
        end_date: "",
        max_capacity: "100",
        price: "0",
        speakers: "",
        image_url: "",
        schedule: "",
    })

    // Fetch existing event data
    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const res = await fetch(`/api/events/${id}`)
                if (!res.ok) throw new Error("Event not found")
                const event = await res.json()

                // Format datetime-local values
                const formatDate = (d) => {
                    if (!d) return ""
                    const date = new Date(d)
                    return date.toISOString().slice(0, 16)
                }

                setFormData({
                    title: event.title || "",
                    description: event.description || "",
                    category: event.category || "workshop",
                    location: event.location || "",
                    start_date: formatDate(event.start_date),
                    end_date: formatDate(event.end_date),
                    max_capacity: String(event.max_capacity || "100"),
                    price: String(event.price || "0"),
                    speakers: event.speakers || "",
                    image_url: event.image_url || "",
                    schedule: event.schedule || "",
                })

                // Set image preview if image exists
                if (event.image_url) {
                    setImagePreview(event.image_url)
                    if (event.image_url.startsWith("http")) {
                        setImageMode("url")
                    }
                }
            } catch (err) {
                toast.error("Failed to load event data")
                console.error("[v0] Fetch event error:", err)
            } finally {
                setIsFetching(false)
            }
        }
        fetchEvent()
    }, [id])

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
    }

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]
        if (!allowedTypes.includes(file.type)) {
            toast.error("Invalid file type. Allowed: JPEG, PNG, GIF, WebP")
            return
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error("File too large. Maximum size is 5MB")
            return
        }

        const reader = new FileReader()
        reader.onload = (e) => setImagePreview(e.target.result)
        reader.readAsDataURL(file)

        setIsUploading(true)
        try {
            const uploadFormData = new FormData()
            uploadFormData.append("file", file)
            const response = await fetch("/api/upload", { method: "POST", body: uploadFormData })
            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || "Upload failed")
            }
            const result = await response.json()
            setFormData((prev) => ({ ...prev, image_url: result.url }))
            toast.success("Image uploaded successfully!")
        } catch (err) {
            toast.error(err.message || "Failed to upload image")
            setImagePreview(null)
        } finally {
            setIsUploading(false)
        }
    }

    const removeImage = () => {
        setImagePreview(null)
        setFormData((prev) => ({ ...prev, image_url: "" }))
    }

    const switchImageMode = (mode) => {
        setImageMode(mode)
        setImagePreview(null)
        setFormData((prev) => ({ ...prev, image_url: "" }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsLoading(true)
        setError("")

        try {
            const response = await fetch(`/api/events/${id}/update`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || "Failed to update event")
            }

            toast.success("Event updated successfully!")
            router.push(`/organiser/events`)
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred")
            console.error("[v0] Update event error:", err)
        } finally {
            setIsLoading(false)
        }
    }

    if (isFetching) {
        return (
            <main>
                <Navbar />
                <div className="flex justify-center items-center min-h-[60vh]">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            </main>
        )
    }

    return (
        <main>
            <Navbar />
            <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <Button variant="ghost" className="mb-4 gap-2" onClick={() => router.back()}>
                    <ArrowLeft className="w-4 h-4" /> Back to Events
                </Button>

                <Card>
                    <CardHeader>
                        <CardTitle>Edit Event</CardTitle>
                        <CardDescription>
                            Update your event details. Changes to approved events may require re-approval.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {error && (
                            <div className="mb-6 p-4 bg-destructive/10 border border-destructive rounded-lg flex gap-3">
                                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                                <p className="text-destructive text-sm">{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Event Image */}
                            <div>
                                <label className="block text-sm font-medium mb-2">Event Image</label>
                                <div className="flex gap-2 mb-3">
                                    <Button type="button" variant={imageMode === "upload" ? "default" : "outline"} size="sm" onClick={() => switchImageMode("upload")} className="gap-1.5">
                                        <Upload className="w-4 h-4" /> Upload from Device
                                    </Button>
                                    <Button type="button" variant={imageMode === "url" ? "default" : "outline"} size="sm" onClick={() => switchImageMode("url")} className="gap-1.5">
                                        <Image className="w-4 h-4" /> Enter Image URL
                                    </Button>
                                </div>

                                {(imagePreview || formData.image_url) ? (
                                    <div className="relative border-2 border-dashed border-input rounded-lg p-4 mb-2">
                                        <img src={imagePreview || formData.image_url} alt="Event preview" className="w-full h-48 object-cover rounded-lg" onError={(e) => { e.target.style.display = 'none'; }} />
                                        <button type="button" onClick={removeImage} className="absolute top-6 right-6 p-1 bg-red-500 text-white rounded-full hover:bg-red-600">
                                            <X className="w-4 h-4" />
                                        </button>
                                        {formData.image_url && (
                                            <div className="absolute bottom-6 left-6 bg-green-500 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                                                <CheckCircle className="w-3 h-3" />
                                                {imageMode === "upload" ? "Uploaded" : "URL Set"}
                                            </div>
                                        )}
                                    </div>
                                ) : imageMode === "upload" ? (
                                    <div className="border-2 border-dashed border-input rounded-lg p-4">
                                        <label className="flex flex-col items-center justify-center h-32 cursor-pointer">
                                            {isUploading ? (
                                                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                                            ) : (
                                                <>
                                                    <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                                                    <span className="text-sm text-muted-foreground">Click to upload image</span>
                                                    <span className="text-xs text-muted-foreground mt-1">JPEG, PNG, GIF, WebP (max 5MB)</span>
                                                </>
                                            )}
                                            <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={handleImageUpload} className="hidden" disabled={isUploading} />
                                        </label>
                                    </div>
                                ) : (
                                    <div className="border-2 border-dashed border-input rounded-lg p-4">
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 text-muted-foreground justify-center mb-2">
                                                <Image className="w-6 h-6" />
                                            </div>
                                            <Input type="url" name="image_url" value={formData.image_url} onChange={handleChange} placeholder="https://example.com/event-image.jpg" />
                                            <p className="text-xs text-muted-foreground text-center">Paste a direct link to your event image</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Event Title *</label>
                                    <Input type="text" name="title" value={formData.title} onChange={handleChange} required placeholder="Enter event title" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Category *</label>
                                    <select name="category" value={formData.category} onChange={handleChange} className="w-full px-3 py-2 border border-input rounded-md bg-background">
                                        <option value="workshop">Workshop</option>
                                        <option value="hackathon">Hackathon</option>
                                        <option value="conference">Conference</option>
                                        <option value="competition">Competition</option>
                                        <option value="seminar">Seminar</option>
                                        <option value="tech-fest">Tech Fest</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Description *</label>
                                <textarea name="description" value={formData.description} onChange={handleChange} required placeholder="Describe your event in detail..." className="w-full px-3 py-2 border border-input rounded-md bg-background min-h-24" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Schedule / Agenda</label>
                                <textarea name="schedule" value={formData.schedule} onChange={handleChange} placeholder={"10:00 AM - Registration\n11:00 AM - Opening Ceremony\n12:00 PM - Lunch Break"} className="w-full px-3 py-2 border border-input rounded-md bg-background min-h-24" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Location *</label>
                                    <Input type="text" name="location" value={formData.location} onChange={handleChange} required placeholder="Event venue address" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Speakers</label>
                                    <Input type="text" name="speakers" value={formData.speakers} onChange={handleChange} placeholder="John Doe, Jane Smith" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Start Date & Time *</label>
                                    <Input type="datetime-local" name="start_date" value={formData.start_date} onChange={handleChange} required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">End Date & Time *</label>
                                    <Input type="datetime-local" name="end_date" value={formData.end_date} onChange={handleChange} required />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Max Capacity</label>
                                    <Input type="number" name="max_capacity" value={formData.max_capacity} onChange={handleChange} min="1" placeholder="100" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Price (₹)</label>
                                    <Input type="number" name="price" value={formData.price} onChange={handleChange} min="0" step="1" placeholder="0 for free events" />
                                </div>
                            </div>

                            <div className="flex gap-3 justify-end pt-6 border-t">
                                <Button type="button" variant="outline" onClick={() => router.back()}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    Update Event
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </main>
    )
}
