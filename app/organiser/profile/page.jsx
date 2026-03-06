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
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import {
    User, Mail, Phone, Building2, Calendar, Star, Users,
    Edit2, Save, X, Lock, Camera, Loader2, CheckCircle,
    BarChart3, Shield
} from "lucide-react"

export default function OrganiserProfilePage() {
    const router = useRouter()
    const [session, setSession] = useState(null)
    const [profile, setProfile] = useState(null)
    const [stats, setStats] = useState({ events: [], totalEvents: 0, active: 0, completed: 0, totalParticipants: 0, avgRating: null })
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
                if (!sessionData.session || sessionData.session.role !== "organiser") { router.push("/auth/login"); return }
                setSession(sessionData.session)
                await loadProfile()
            } catch { router.push("/auth/login") }
            finally { setIsLoading(false) }
        }
        init()
    }, [router])

    const loadProfile = async () => {
        const res = await fetch("/api/profile")
        if (res.ok) {
            const data = await res.json()
            setProfile(data.user)
            setAvatarUrl(data.user.profile_picture || null)
            setStats(data.stats || {})
            setEditForm({ name: data.user.name || "", phone: data.user.phone || "", bio: data.user.bio || "", organization_name: data.user.organization_name || "", college: data.user.college || "" })
        }
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            const res = await fetch("/api/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editForm) })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            toast.success("Profile updated!"); setIsEditing(false); await loadProfile()
        } catch (err) { toast.error(err.message) }
        finally { setIsSaving(false) }
    }

    const handlePasswordChange = async () => {
        if (passwordForm.newPassword !== passwordForm.confirmPassword) { toast.error("Passwords do not match"); return }
        setIsChangingPassword(true)
        try {
            const res = await fetch("/api/profile/password", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword }) })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            toast.success("Password changed!"); setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
        } catch (err) { toast.error(err.message) }
        finally { setIsChangingPassword(false) }
    }

    const handleAvatarUpload = async (e) => {
        const file = e.target.files?.[0]; if (!file) return
        const localPreview = URL.createObjectURL(file)
        setAvatarUrl(localPreview)
        setUploadingAvatar(true)
        try {
            const formData = new FormData(); formData.append("file", file)
            const res = await fetch("/api/profile/upload-avatar", { method: "POST", body: formData })
            const data = await res.json(); if (!res.ok) throw new Error(data.error)
            setAvatarUrl(data.url + "?t=" + Date.now())
            toast.success("Profile picture updated!")
        } catch (err) {
            setAvatarUrl(profile?.profile_picture || null)
            toast.error(err.message)
        } finally {
            setUploadingAvatar(false)
            if (fileInputRef.current) fileInputRef.current.value = ""
        }
    }

    const tabs = [{ id: "overview", label: "Overview", icon: User }, { id: "events", label: "Events", icon: Calendar }, { id: "security", label: "Security", icon: Lock }]

    if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>

    const initials = profile?.name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "O"

    return (
        <DashboardLayout session={session}>
            <PageHeader title="Organizer Profile" description="Manage your organization details and account settings" />
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Sidebar */}
                <div className="space-y-4">
                    <Card className="overflow-hidden">
                        <div className="h-20 bg-gradient-to-r from-purple-500 to-indigo-600" />
                        <CardContent className="p-4 -mt-12">
                            <div className="relative w-20 h-20 mx-auto mb-3">
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt="Avatar" className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg" />
                                ) : (
                                    <div className="w-20 h-20 rounded-full border-4 border-white shadow-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold">{initials}</div>
                                )}
                                <button onClick={() => fileInputRef.current?.click()} disabled={uploadingAvatar} className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary text-white rounded-full flex items-center justify-center hover:bg-primary/90 shadow">
                                    {uploadingAvatar ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                                </button>
                                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                            </div>
                            <div className="text-center">
                                <p className="font-bold text-lg">{profile?.name}</p>
                                {profile?.organization_name && <p className="text-sm text-muted-foreground">{profile.organization_name}</p>}
                                <Badge className="mt-1 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">Organizer</Badge>
                            </div>
                        </CardContent>
                    </Card>
                    {[
                        { label: "Total Events", value: stats.totalEvents || 0, color: "text-purple-600", icon: Calendar },
                        { label: "Active Events", value: stats.active || 0, color: "text-green-600", icon: CheckCircle },
                        { label: "Completed", value: stats.completed || 0, color: "text-blue-600", icon: BarChart3 },
                        { label: "Participants", value: stats.totalParticipants || 0, color: "text-orange-600", icon: Users },
                        { label: "Avg. Rating", value: stats.avgRating ? `${stats.avgRating} ★` : "N/A", color: "text-yellow-600", icon: Star },
                    ].map((s) => {
                        const Icon = s.icon; return (
                            <Card key={s.label}><CardContent className="p-4 flex items-center gap-3"><Icon className={`w-5 h-5 ${s.color} flex-shrink-0`} /><div><p className="text-xs text-muted-foreground">{s.label}</p><p className={`font-bold text-lg ${s.color}`}>{s.value}</p></div></CardContent></Card>
                        )
                    })}
                    <Card><CardContent className="p-4 space-y-2">
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Account Info</p>
                        <div><p className="text-xs text-muted-foreground">Member Since</p><p className="text-sm font-medium">{profile?.created_at ? new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "—"}</p></div>
                        <div><p className="text-xs text-muted-foreground">Last Login</p><p className="text-sm font-medium">{profile?.last_login_at ? new Date(profile.last_login_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}</p></div>
                    </CardContent></Card>
                </div>

                {/* Main Content */}
                <div className="lg:col-span-3 space-y-4">
                    <div className="flex gap-1 p-1 bg-muted rounded-xl">
                        {tabs.map((tab) => {
                            const Icon = tab.icon; return (
                                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? "bg-white dark:bg-card shadow text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                                    <Icon className="w-4 h-4" />{tab.label}
                                </button>
                            )
                        })}
                    </div>
                    <AnimatePresence mode="wait">
                        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                            {activeTab === "overview" && (
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between">
                                        <CardTitle>Organization Profile</CardTitle>
                                        {!isEditing ? (
                                            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="gap-2"><Edit2 className="w-4 h-4" /> Edit</Button>
                                        ) : (
                                            <div className="flex gap-2">
                                                <Button size="sm" onClick={handleSave} disabled={isSaving} className="gap-2">{isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save</Button>
                                                <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}><X className="w-4 h-4" /></Button>
                                            </div>
                                        )}
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {[
                                                { label: "Full Name", field: "name", icon: User, placeholder: "Your name" },
                                                { label: "Organization", field: "organization_name", icon: Building2, placeholder: "Organization name" },
                                                { label: "Phone", field: "phone", icon: Phone, placeholder: "+91 9876543210" },
                                                { label: "College", field: "college", icon: Building2, placeholder: "Institution" },
                                            ].map((f) => {
                                                const Icon2 = f.icon; return (
                                                    <div key={f.field} className="space-y-2">
                                                        <Label>{f.label}</Label>
                                                        {f.field === "email" || !isEditing ? (
                                                            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg"><Icon2 className="w-4 h-4 text-muted-foreground" /><span className="text-sm">{profile?.[f.field] || "Not set"}</span></div>
                                                        ) : (
                                                            <Input value={editForm[f.field] || ""} onChange={(e) => setEditForm({ ...editForm, [f.field]: e.target.value })} placeholder={f.placeholder} />
                                                        )}
                                                    </div>
                                                )
                                            })}
                                            <div className="sm:col-span-2 space-y-2">
                                                <Label>Email</Label>
                                                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg"><Mail className="w-4 h-4 text-muted-foreground" /><span className="text-sm">{profile?.email || "—"}</span></div>
                                            </div>
                                            <div className="sm:col-span-2 space-y-2">
                                                <Label>Bio</Label>
                                                {isEditing ? (
                                                    <Textarea value={editForm.bio} onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })} placeholder="Tell participants about yourself..." rows={4} />
                                                ) : (
                                                    <div className="p-3 bg-muted/50 rounded-lg min-h-[80px]"><p className="text-sm">{profile?.bio || "No bio added yet."}</p></div>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                            {activeTab === "events" && (
                                <Card>
                                    <CardHeader><CardTitle className="flex items-center gap-2"><Calendar className="w-5 h-5 text-purple-500" /> My Events</CardTitle></CardHeader>
                                    <CardContent>
                                        {stats.events?.length > 0 ? (
                                            <div className="space-y-3">
                                                {stats.events.map((event) => {
                                                    const isCompleted = new Date(event.end_date) < new Date()
                                                    const isActive = event.status === "approved" && !isCompleted
                                                    return (
                                                        <div key={event.id} className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isActive ? "bg-green-100 dark:bg-green-900/30" : isCompleted ? "bg-gray-100 dark:bg-gray-900/30" : "bg-yellow-100 dark:bg-yellow-900/30"}`}>
                                                                <Calendar className={`w-5 h-5 ${isActive ? "text-green-600" : isCompleted ? "text-gray-500" : "text-yellow-600"}`} />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-medium truncate">{event.title}</p>
                                                                <p className="text-sm text-muted-foreground">{new Date(event.start_date).toLocaleDateString()} • {event.current_capacity || 0} participants</p>
                                                            </div>
                                                            <Badge variant="outline" className={`capitalize ${isActive ? "text-green-700 border-green-200" : isCompleted ? "text-gray-600 border-gray-200" : "text-yellow-700 border-yellow-200"}`}>
                                                                {isCompleted ? "Completed" : event.status}
                                                            </Badge>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        ) : <p className="text-center text-muted-foreground py-6">No events created yet</p>}
                                    </CardContent>
                                </Card>
                            )}
                            {activeTab === "security" && (
                                <Card>
                                    <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="w-5 h-5 text-red-500" /> Change Password</CardTitle></CardHeader>
                                    <CardContent className="space-y-4 max-w-md">
                                        {[{ label: "Current Password", field: "currentPassword" }, { label: "New Password", field: "newPassword", hint: "Min. 8 characters" }, { label: "Confirm New Password", field: "confirmPassword" }].map((f) => (
                                            <div key={f.field} className="space-y-2">
                                                <Label>{f.label}</Label>
                                                <Input type="password" value={passwordForm[f.field]} onChange={(e) => setPasswordForm({ ...passwordForm, [f.field]: e.target.value })} placeholder={f.hint || `Enter ${f.label.toLowerCase()}`} />
                                            </div>
                                        ))}
                                        <Button onClick={handlePasswordChange} disabled={isChangingPassword} className="gap-2">
                                            {isChangingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />} Change Password
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
