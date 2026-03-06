"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { DashboardLayout, PageHeader, ContentSection } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    Users,
    Search,
    Mail,
    Phone,
    Building,
    Loader2,
    Shield,
    UserCircle,
    GraduationCap
} from "lucide-react"

export default function AdminUsersPage() {
    const [session, setSession] = useState(null)
    const [users, setUsers] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [roleFilter, setRoleFilter] = useState("all")
    const router = useRouter()

    useEffect(() => {
        const checkAuthAndFetch = async () => {
            try {
                const sessionResponse = await fetch("/api/auth/session")
                const sessionData = await sessionResponse.json()

                if (!sessionData.session || sessionData.session.role !== "admin") {
                    router.push("/auth/login")
                    return
                }

                setSession(sessionData.session)
                await fetchUsers()
            } catch (error) {
                console.error("[v0] Auth check error:", error)
                router.push("/auth/login")
            } finally {
                setIsLoading(false)
            }
        }

        checkAuthAndFetch()
    }, [router])

    const fetchUsers = async () => {
        try {
            const response = await fetch("/api/users")
            if (response.ok) {
                const data = await response.json()
                setUsers(Array.isArray(data) ? data : [])
            }
        } catch (error) {
            console.error("[v0] Fetch users error:", error)
        }
    }

    const getRoleIcon = (role) => {
        switch (role) {
            case "admin": return <Shield className="w-4 h-4" />
            case "organiser": return <UserCircle className="w-4 h-4" />
            case "event_coordinator": return <Users className="w-4 h-4" />
            case "student_coordinator": return <GraduationCap className="w-4 h-4" />
            default: return <UserCircle className="w-4 h-4" />
        }
    }

    const getRoleBadgeColor = (role) => {
        switch (role) {
            case "admin": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
            case "organiser": return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
            case "event_coordinator": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
            case "student_coordinator": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
            default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
        }
    }

    const filteredUsers = users.filter(user => {
        const matchesSearch =
            user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesRole = roleFilter === "all" || user.role === roleFilter
        return matchesSearch && matchesRole
    })

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
                title="User Management"
                description={`Manage all ${users.length} users on the platform`}
            />

            {/* Filters */}
            <div className="mb-6 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="organiser">Organizer</SelectItem>
                        <SelectItem value="event_coordinator">Event Coordinator</SelectItem>
                        <SelectItem value="student_coordinator">Student Coordinator</SelectItem>
                        <SelectItem value="attendee">Attendee</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                {[
                    { label: "Admins", count: users.filter(u => u.role === "admin").length, color: "bg-red-500" },
                    { label: "Organizers", count: users.filter(u => u.role === "organiser").length, color: "bg-purple-500" },
                    { label: "Coordinators", count: users.filter(u => u.role === "event_coordinator").length, color: "bg-blue-500" },
                    { label: "Students", count: users.filter(u => u.role === "student_coordinator").length, color: "bg-green-500" },
                    { label: "Attendees", count: users.filter(u => u.role === "attendee").length, color: "bg-gray-500" },
                ].map((stat) => (
                    <Card key={stat.label}>
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${stat.color}`} />
                            <div>
                                <div className="text-2xl font-bold">{stat.count}</div>
                                <div className="text-sm text-muted-foreground">{stat.label}</div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Users Table */}
            <Card>
                <CardContent className="p-0">
                    {filteredUsers.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="text-left p-4 font-medium">User</th>
                                        <th className="text-left p-4 font-medium">Email</th>
                                        <th className="text-left p-4 font-medium">Phone</th>
                                        <th className="text-left p-4 font-medium">College</th>
                                        <th className="text-left p-4 font-medium">Role</th>
                                        <th className="text-left p-4 font-medium">Joined</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {filteredUsers.map((user, index) => (
                                        <motion.tr
                                            key={user.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: index * 0.02 }}
                                            className="hover:bg-muted/30"
                                        >
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                        <span className="text-sm font-medium">{user.name?.charAt(0) || 'U'}</span>
                                                    </div>
                                                    <span className="font-medium">{user.name}</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Mail className="w-4 h-4 text-muted-foreground" />
                                                    {user.email}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Phone className="w-4 h-4 text-muted-foreground" />
                                                    {user.phone || '-'}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Building className="w-4 h-4 text-muted-foreground" />
                                                    {user.college || '-'}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <Badge className={`gap-1 ${getRoleBadgeColor(user.role)}`}>
                                                    {getRoleIcon(user.role)}
                                                    {user.role?.replace("_", " ")}
                                                </Badge>
                                            </td>
                                            <td className="p-4 text-sm text-muted-foreground">
                                                {new Date(user.created_at).toLocaleDateString()}
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-12 text-muted-foreground">
                            No users found matching your filters
                        </div>
                    )}
                </CardContent>
            </Card>
        </DashboardLayout>
    )
}
