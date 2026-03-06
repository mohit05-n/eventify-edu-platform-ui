"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { DashboardLayout, PageHeader } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import {
    User, Mail, Phone, Calendar, MapPin, Award, Star, Download,
    Edit2, Save, X, Lock, Camera, Loader2, CheckCircle, Clock,
    BookOpen, MessageSquare, Shield, Upload
} from "lucide-react"

export default function AttendeeProfilePage() {
    const router = useRouter()
    const [session, setSession] = useState(null)
    const [profile, setProfile] = useState(null)
    const [stats, setStats] = useState({ upcoming: [], past: [], certificates: [], feedback: [] })
    const [isLoading, setIsLoading] = useState(true)
    const [isEditing, setIsEditing] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [activeTab, setActiveTab] = useState("overview")
    const [editForm, setEditForm] = useState({})
    const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" })
    const [isChangingPassword, setIsChangingPassword] = useState(false)
    const [uploadingAvatar, setUploadingAvatar] = useState(false)
    const [avatarUrl, setAvatarUrl] = useState(null)
    const fileInputRef = useRef(null)

    useEffect(() => {
        const init = async () => {
            try {
                const sessionRes = await fetch("/api/auth/session")
                const sessionData = await sessionRes.json()
                if (!sessionData.session || sessionData.session.role !== "attendee") {
                    router.push("/auth/login")
                    return
                }
                setSession(sessionData.session)
                await loadProfile()
            } catch {
                router.push("/auth/login")
            } finally {
                setIsLoading(false)
            }
        }
        init()
    }, [router])

    const loadProfile = async () => {
        const res = await fetch("/api/profile")
        if (res.ok) {
            const data = await res.json()
            setProfile(data.user)
            setAvatarUrl(data.user.profile_picture || null)
            setStats(data.stats || { upcoming: [], past: [], certificates: [], feedback: [] })
            setEditForm({
                name: data.user.name || "",
                phone: data.user.phone || "",
                college: data.user.college || "",
                department: data.user.department || "",
            })
        }
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            const res = await fetch("/api/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editForm),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            toast.success("Profile updated!")
            setIsEditing(false)
            await loadProfile()
        } catch (err) {
            toast.error(err.message)
        } finally {
            setIsSaving(false)
        }
    }

    const handlePasswordChange = async () => {
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            toast.error("Passwords do not match")
            return
        }
        setIsChangingPassword(true)
        try {
            const res = await fetch("/api/profile/password", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    currentPassword: passwordForm.currentPassword,
                    newPassword: passwordForm.newPassword,
                }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            toast.success("Password changed successfully!")
            setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
        } catch (err) {
            toast.error(err.message)
        } finally {
            setIsChangingPassword(false)
        }
    }

    const handleAvatarUpload = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        // Show a local preview immediately
        const localPreview = URL.createObjectURL(file)
        setAvatarUrl(localPreview)
        setUploadingAvatar(true)
        try {
            const formData = new FormData()
            formData.append("file", file)
            const res = await fetch("/api/profile/upload-avatar", { method: "POST", body: formData })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            // Replace preview with real URL + cache-bust
            setAvatarUrl(data.url + "?t=" + Date.now())
            toast.success("Profile picture updated!")
        } catch (err) {
            // Revert to original on failure
            setAvatarUrl(profile?.profile_picture || null)
            toast.error(err.message)
        } finally {
            setUploadingAvatar(false)
            // reset so same file can be picked again
            if (fileInputRef.current) fileInputRef.current.value = ""
        }
    }

    const tabs = [
        { id: "overview", label: "Overview", icon: User },
        { id: "bookings", label: "Bookings", icon: BookOpen },
        { id: "certificates", label: "Certificates", icon: Award },
        { id: "feedback", label: "Feedback", icon: MessageSquare },
        { id: "security", label: "Security", icon: Lock },
    ]

    if (isLoading) return (
        <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
    )

    const initials = profile?.name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "U"

    return (
        <DashboardLayout session={session}>
            <PageHeader
                title="My Profile"
                description="Manage your personal information and account settings"
            />

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Left Sidebar — Avatar + Quick Info */}
                <div className="space-y-4">
                    {/* Avatar Card */}
                    <Card className="overflow-hidden">
                        <div className="h-20 bg-gradient-to-r from-blue-500 to-indigo-600" />
                        <CardContent className="p-4 -mt-12">
                            <div className="relative w-20 h-20 mx-auto mb-3">
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt="Avatar" className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg" />
                                ) : (
                                    <div className="w-20 h-20 rounded-full border-4 border-white shadow-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold">
                                        {initials}
                                    </div>
                                )}
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploadingAvatar}
                                    className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary text-white rounded-full flex items-center justify-center hover:bg-primary/90 transition-colors shadow"
                                >
                                    {uploadingAvatar ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                                </button>
                                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                            </div>
                            <div className="text-center">
                                <p className="font-bold text-lg">{profile?.name}</p>
                                <Badge className="mt-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Attendee</Badge>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Stats */}
                    <Card>
                        <CardContent className="p-4 space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Upcoming Events</span>
                                <span className="font-bold text-blue-600">{stats.upcoming?.length || 0}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Events Attended</span>
                                <span className="font-bold text-green-600">{stats.past?.length || 0}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Certificates</span>
                                <span className="font-bold text-amber-600">{stats.certificates?.length || 0}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Reviews Given</span>
                                <span className="font-bold text-purple-600">{stats.feedback?.length || 0}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Account Meta */}
                    <Card>
                        <CardContent className="p-4 space-y-2">
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Account Info</p>
                            <div className="space-y-2">
                                <div>
                                    <p className="text-xs text-muted-foreground">Member Since</p>
                                    <p className="text-sm font-medium">{profile?.created_at ? new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "—"}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Last Login</p>
                                    <p className="text-sm font-medium">{profile?.last_login_at ? new Date(profile.last_login_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right — Tabs */}
                <div className="lg:col-span-3 space-y-4">
                    {/* Tab Bar */}
                    <div className="flex gap-1 p-1 bg-muted rounded-xl overflow-x-auto">
                        {tabs.map((tab) => {
                            const Icon = tab.icon
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.id ? "bg-white dark:bg-card shadow text-primary" : "text-muted-foreground hover:text-foreground"}`}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span className="hidden sm:inline">{tab.label}</span>
                                </button>
                            )
                        })}
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>

                            {/* Overview Tab */}
                            {activeTab === "overview" && (
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between">
                                        <CardTitle>Personal Information</CardTitle>
                                        {!isEditing ? (
                                            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="gap-2">
                                                <Edit2 className="w-4 h-4" /> Edit
                                            </Button>
                                        ) : (
                                            <div className="flex gap-2">
                                                <Button size="sm" onClick={handleSave} disabled={isSaving} className="gap-2">
                                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
                                                </Button>
                                                <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        )}
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Full Name</Label>
                                                {isEditing ? (
                                                    <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                                                ) : (
                                                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg"><User className="w-4 h-4 text-muted-foreground" /><span>{profile?.name || "—"}</span></div>
                                                )}
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Email Address</Label>
                                                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg"><Mail className="w-4 h-4 text-muted-foreground" /><span className="text-sm">{profile?.email || "—"}</span></div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Phone Number</Label>
                                                {isEditing ? (
                                                    <Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} placeholder="+91 9876543210" />
                                                ) : (
                                                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg"><Phone className="w-4 h-4 text-muted-foreground" /><span>{profile?.phone || "Not set"}</span></div>
                                                )}
                                            </div>
                                            <div className="space-y-2">
                                                <Label>College / Institution</Label>
                                                {isEditing ? (
                                                    <Input value={editForm.college} onChange={(e) => setEditForm({ ...editForm, college: e.target.value })} placeholder="Your college name" />
                                                ) : (
                                                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg"><BookOpen className="w-4 h-4 text-muted-foreground" /><span>{profile?.college || "Not set"}</span></div>
                                                )}
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Department</Label>
                                                {isEditing ? (
                                                    <Input value={editForm.department} onChange={(e) => setEditForm({ ...editForm, department: e.target.value })} placeholder="Your department" />
                                                ) : (
                                                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg"><MapPin className="w-4 h-4 text-muted-foreground" /><span>{profile?.department || "Not set"}</span></div>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Bookings Tab */}
                            {activeTab === "bookings" && (
                                <div className="space-y-4">
                                    {/* Upcoming */}
                                    <Card>
                                        <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="w-5 h-5 text-blue-500" /> Upcoming Events ({stats.upcoming?.length || 0})</CardTitle></CardHeader>
                                        <CardContent>
                                            {stats.upcoming?.length > 0 ? (
                                                <div className="space-y-3">
                                                    {stats.upcoming.map((reg) => (
                                                        <div key={reg.id} className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                                                            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                                                                <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-medium truncate">{reg.event_title}</p>
                                                                <p className="text-sm text-muted-foreground">{new Date(reg.start_date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</p>
                                                            </div>
                                                            <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">Upcoming</Badge>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : <p className="text-center text-muted-foreground py-6">No upcoming events</p>}
                                        </CardContent>
                                    </Card>

                                    {/* Past */}
                                    <Card>
                                        <CardHeader><CardTitle className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-500" /> Past Events ({stats.past?.length || 0})</CardTitle></CardHeader>
                                        <CardContent>
                                            {stats.past?.length > 0 ? (
                                                <div className="space-y-3">
                                                    {stats.past.map((reg) => (
                                                        <div key={reg.id} className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                                                            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                                                                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-medium truncate">{reg.event_title}</p>
                                                                <p className="text-sm text-muted-foreground">{new Date(reg.start_date).toLocaleDateString()}</p>
                                                            </div>
                                                            <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">Attended</Badge>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : <p className="text-center text-muted-foreground py-6">No past events</p>}
                                        </CardContent>
                                    </Card>
                                </div>
                            )}

                            {/* Certificates Tab */}
                            {activeTab === "certificates" && (
                                <Card>
                                    <CardHeader><CardTitle className="flex items-center gap-2"><Award className="w-5 h-5 text-amber-500" /> My Certificates ({stats.certificates?.length || 0})</CardTitle></CardHeader>
                                    <CardContent>
                                        {stats.certificates?.length > 0 ? (
                                            <div className="grid gap-4">
                                                {stats.certificates.map((cert, i) => (
                                                    <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20 dark:border-amber-800">
                                                        <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                                                            <Award className="w-6 h-6 text-amber-600" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-semibold text-amber-900 dark:text-amber-200 truncate">{cert.event_title}</p>
                                                            <p className="text-sm text-amber-700 dark:text-amber-400">{new Date(cert.start_date).toLocaleDateString()}</p>
                                                            {cert.certificate_id && <p className="text-xs text-muted-foreground mt-1">ID: {cert.certificate_id}</p>}
                                                        </div>
                                                        {cert.certificate_url && (
                                                            <a href={cert.certificate_url} download target="_blank" rel="noopener noreferrer">
                                                                <Button size="sm" className="gap-2 bg-amber-600 hover:bg-amber-700 text-white">
                                                                    <Download className="w-4 h-4" /> Download
                                                                </Button>
                                                            </a>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-10">
                                                <Award className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
                                                <p className="text-muted-foreground">No certificates yet. Attend events to earn them!</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Feedback Tab */}
                            {activeTab === "feedback" && (
                                <Card>
                                    <CardHeader><CardTitle className="flex items-center gap-2"><MessageSquare className="w-5 h-5 text-purple-500" /> Feedback History ({stats.feedback?.length || 0})</CardTitle></CardHeader>
                                    <CardContent>
                                        {stats.feedback?.length > 0 ? (
                                            <div className="space-y-3">
                                                {stats.feedback.map((fb, i) => (
                                                    <div key={i} className="p-4 rounded-lg border space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <p className="font-medium">{fb.event_title}</p>
                                                            <div className="flex gap-0.5">
                                                                {[1, 2, 3, 4, 5].map((s) => (
                                                                    <Star key={s} className={`w-4 h-4 ${s <= fb.rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`} />
                                                                ))}
                                                            </div>
                                                        </div>
                                                        {fb.comment && <p className="text-sm text-muted-foreground">{fb.comment}</p>}
                                                        <p className="text-xs text-muted-foreground">{new Date(fb.created_at).toLocaleDateString()}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : <p className="text-center text-muted-foreground py-6">No feedback given yet</p>}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Security Tab */}
                            {activeTab === "security" && (
                                <Card>
                                    <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="w-5 h-5 text-red-500" /> Change Password</CardTitle></CardHeader>
                                    <CardContent className="space-y-4 max-w-md">
                                        <div className="space-y-2">
                                            <Label>Current Password</Label>
                                            <Input type="password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} placeholder="Enter current password" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>New Password</Label>
                                            <Input type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} placeholder="Min. 8 characters" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Confirm New Password</Label>
                                            <Input type="password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} placeholder="Repeat new password" />
                                        </div>
                                        <Button onClick={handlePasswordChange} disabled={isChangingPassword} className="gap-2">
                                            {isChangingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                                            Change Password
                                        </Button>
                                    </CardContent>
                                </Card>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </DashboardLayout>
    )
}
