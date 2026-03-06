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
import { toast } from "sonner"
import {
    User, Mail, Users, Calendar, Edit2, Save, X, Lock,
    Camera, Loader2, Shield, BarChart3, CheckCircle, TrendingUp
} from "lucide-react"

const PERMISSIONS = [
    { label: "Approve / Reject Events", granted: true },
    { label: "Manage Users", granted: true },
    { label: "View Platform Analytics", granted: true },
    { label: "Issue Certificates", granted: true },
    { label: "Access Financial Reports", granted: true },
    { label: "System Configuration", granted: false },
]

export default function AdminProfilePage() {
    const router = useRouter()
    const [session, setSession] = useState(null)
    const [profile, setProfile] = useState(null)
    const [stats, setStats] = useState({ totalUsers: 0, totalEvents: 0, totalOrganisers: 0, totalRegistrations: 0 })
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
                if (!sessionData.session || sessionData.session.role !== "admin") { router.push("/auth/login"); return }
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
            setEditForm({ name: data.user.name || "" })
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

    const tabs = [{ id: "overview", label: "Overview", icon: User }, { id: "stats", label: "Platform Stats", icon: BarChart3 }, { id: "permissions", label: "Permissions", icon: Shield }, { id: "security", label: "Security", icon: Lock }]

    if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>

    const initials = profile?.name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "A"

    return (
        <DashboardLayout session={session}>
            <PageHeader title="Admin Profile" description="Manage your administrator account and view platform statistics" />
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Sidebar */}
                <div className="space-y-4">
                    <Card className="overflow-hidden">
                        <div className="h-20 bg-gradient-to-r from-red-500 to-rose-600" />
                        <CardContent className="p-4 -mt-12">
                            <div className="relative w-20 h-20 mx-auto mb-3">
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt="Avatar" className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg" />
                                ) : (
                                    <div className="w-20 h-20 rounded-full border-4 border-white shadow-lg bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white text-2xl font-bold">{initials}</div>
                                )}
                                <button onClick={() => fileInputRef.current?.click()} disabled={uploadingAvatar} className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary text-white rounded-full flex items-center justify-center hover:bg-primary/90 shadow">
                                    {uploadingAvatar ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                                </button>
                                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                            </div>
                            <div className="text-center">
                                <p className="font-bold text-lg">{profile?.name}</p>
                                <Badge className="mt-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Administrator</Badge>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Platform Summary */}
                    {[
                        { label: "Total Users", value: stats.totalUsers || 0, icon: Users, color: "text-blue-600" },
                        { label: "Total Events", value: stats.totalEvents || 0, icon: Calendar, color: "text-purple-600" },
                        { label: "Organisers", value: stats.totalOrganisers || 0, icon: TrendingUp, color: "text-green-600" },
                        { label: "Registrations", value: stats.totalRegistrations || 0, icon: CheckCircle, color: "text-orange-600" },
                    ].map((s) => {
                        const Icon = s.icon; return (
                            <Card key={s.label}><CardContent className="p-4 flex items-center gap-3">
                                <Icon className={`w-5 h-5 ${s.color} flex-shrink-0`} />
                                <div><p className="text-xs text-muted-foreground">{s.label}</p><p className={`font-bold text-lg ${s.color}`}>{s.value}</p></div>
                            </CardContent></Card>
                        )
                    })}

                    <Card><CardContent className="p-4 space-y-2">
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Account Info</p>
                        <div><p className="text-xs text-muted-foreground">Member Since</p><p className="text-sm font-medium">{profile?.created_at ? new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "—"}</p></div>
                        <div><p className="text-xs text-muted-foreground">Last Login</p><p className="text-sm font-medium">{profile?.last_login_at ? new Date(profile.last_login_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}</p></div>
                    </CardContent></Card>
                </div>

                {/* Right */}
                <div className="lg:col-span-3 space-y-4">
                    <div className="flex gap-1 p-1 bg-muted rounded-xl overflow-x-auto">
                        {tabs.map((tab) => {
                            const Icon = tab.icon; return (
                                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.id ? "bg-white dark:bg-card shadow text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                                    <Icon className="w-4 h-4" /><span className="hidden sm:inline">{tab.label}</span>
                                </button>
                            )
                        })}
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>

                            {activeTab === "overview" && (
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between">
                                        <CardTitle>Admin Information</CardTitle>
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
                                                <Label>Role</Label>
                                                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg"><Shield className="w-4 h-4 text-red-500" /><Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Administrator</Badge></div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Account Created</Label>
                                                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg"><Calendar className="w-4 h-4 text-muted-foreground" /><span className="text-sm">{profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "—"}</span></div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {activeTab === "stats" && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {[
                                        { label: "Total Registered Users", value: stats.totalUsers || 0, icon: Users, desc: "Across all roles", gradient: "from-blue-500 to-blue-600" },
                                        { label: "Total Events", value: stats.totalEvents || 0, icon: Calendar, desc: "Created on platform", gradient: "from-purple-500 to-purple-600" },
                                        { label: "Active Organizers", value: stats.totalOrganisers || 0, icon: TrendingUp, desc: "Registered organizers", gradient: "from-green-500 to-green-600" },
                                        { label: "Total Registrations", value: stats.totalRegistrations || 0, icon: CheckCircle, desc: "Confirmed registrations", gradient: "from-orange-500 to-orange-600" },
                                    ].map((s) => {
                                        const Icon = s.icon; return (
                                            <Card key={s.label} className="overflow-hidden">
                                                <div className={`h-1.5 bg-gradient-to-r ${s.gradient}`} />
                                                <CardContent className="p-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center flex-shrink-0`}>
                                                            <Icon className="w-6 h-6 text-white" />
                                                        </div>
                                                        <div>
                                                            <p className="text-3xl font-bold">{s.value.toLocaleString()}</p>
                                                            <p className="text-sm font-medium">{s.label}</p>
                                                            <p className="text-xs text-muted-foreground">{s.desc}</p>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        )
                                    })}
                                </div>
                            )}

                            {activeTab === "permissions" && (
                                <Card>
                                    <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="w-5 h-5 text-red-500" /> Account Permissions</CardTitle></CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {PERMISSIONS.map((perm) => (
                                                <div key={perm.label} className={`flex items-center justify-between p-4 rounded-lg border ${perm.granted ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800" : "bg-muted/30 border-muted"}`}>
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${perm.granted ? "bg-green-100 dark:bg-green-900/30" : "bg-gray-100 dark:bg-gray-900/30"}`}>
                                                            {perm.granted ? <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" /> : <X className="w-4 h-4 text-gray-400" />}
                                                        </div>
                                                        <span className={`font-medium text-sm ${perm.granted ? "text-green-800 dark:text-green-200" : "text-muted-foreground"}`}>{perm.label}</span>
                                                    </div>
                                                    <Badge variant={perm.granted ? "default" : "secondary"} className={perm.granted ? "bg-green-600 hover:bg-green-700" : ""}>
                                                        {perm.granted ? "Granted" : "N/A"}
                                                    </Badge>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {activeTab === "security" && (
                                <Card>
                                    <CardHeader><CardTitle className="flex items-center gap-2"><Lock className="w-5 h-5 text-red-500" /> Change Password</CardTitle></CardHeader>
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
