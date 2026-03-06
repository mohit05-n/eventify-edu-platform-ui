"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { DashboardLayout, PageHeader, ContentSection } from "@/components/dashboard-layout"
import { StatCard, StatsGrid } from "@/components/stat-card"
import { EventStatusBadge } from "@/components/task-status-badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import {
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar
} from "recharts"
import {
  CheckCircle,
  XCircle,
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  Search,
  Loader2,
  Shield,
  Eye,
  Lock,
  UserCheck,
  AlertCircle,
  BarChart3
} from "lucide-react"
import Link from "next/link"

export default function AdminDashboard() {
  const [session, setSession] = useState(null)
  const [pendingEvents, setPendingEvents] = useState([])
  const [users, setUsers] = useState([])
  const [stats, setStats] = useState({ totalEvents: 0, totalUsers: 0, totalRevenue: 0, totalRegistrations: 0 })
  const [categoryData, setCategoryData] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTab, setSelectedTab] = useState("events")
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/session")
        const data = await response.json()

        if (!data.session || data.session.role !== "admin") {
          router.push("/auth/login")
          return
        }

        setSession(data.session)
        await Promise.all([
          fetchPendingEvents(),
          fetchUsers(),
          fetchStats(),
          fetchCategoryStats()
        ])
      } catch (error) {
        console.error("[v0] Auth check error:", error)
        router.push("/auth/login")
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router])

  const fetchPendingEvents = async () => {
    try {
      const response = await fetch("/api/events/filter?status=pending")
      if (response.ok) {
        const data = await response.json()
        setPendingEvents(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error("[v0] Fetch pending events error:", error)
    }
  }

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

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/events/stats")
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error("[v0] Fetch stats error:", error)
    }
  }

  const fetchCategoryStats = async () => {
    try {
      const response = await fetch("/api/events/category-stats")
      if (response.ok) {
        const data = await response.json()
        setCategoryData(data.categories || [])
      }
    } catch (error) {
      console.error("[v0] Fetch category stats error:", error)
    }
  }

  const handleApprove = async (eventId) => {
    try {
      const response = await fetch(`/api/events/${eventId}/approve`, { method: "POST" })
      if (response.ok) {
        toast.success("Event approved successfully!")
        await fetchPendingEvents()
      }
    } catch (error) {
      toast.error("Failed to approve event")
      console.error("[v0] Approve event error:", error)
    }
  }

  const handleReject = async (eventId) => {
    try {
      const response = await fetch(`/api/events/${eventId}/reject`, { method: "POST" })
      if (response.ok) {
        toast.success("Event rejected")
        await fetchPendingEvents()
      }
    } catch (error) {
      toast.error("Failed to reject event")
      console.error("[v0] Reject event error:", error)
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

  const statCards = [
    {
      title: "Total Users",
      value: users.length.toString(),
      icon: Users,
      color: "blue",
      description: "Registered users"
    },
    {
      title: "Total Events",
      value: stats.totalEvents?.toString() || "0",
      icon: Calendar,
      color: "purple",
      description: "All events"
    },
    {
      title: "Pending Approvals",
      value: pendingEvents.length.toString(),
      icon: AlertCircle,
      color: "orange",
      description: "Awaiting review"
    },
    {
      title: "Total Revenue",
      value: `₹${stats.totalRevenue?.toLocaleString() || 0}`,
      icon: DollarSign,
      color: "green",
      description: "Platform earnings"
    }
  ]

  const userRoleData = [
    { name: "Admins", value: users.filter(u => u.role === "admin").length, fill: "#ef4444" },
    { name: "Organizers", value: users.filter(u => u.role === "organiser").length, fill: "#a855f7" },
    { name: "Coordinators", value: users.filter(u => u.role === "event_coordinator").length, fill: "#3b82f6" },
    { name: "Students", value: users.filter(u => u.role === "student_coordinator").length, fill: "#22c55e" },
    { name: "Attendees", value: users.filter(u => u.role === "attendee").length, fill: "#6b7280" },
  ]

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
        title="Admin Dashboard"
        description="Manage platform events, users, and system settings"
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Shield className="w-3 h-3" />
              Administrator
            </Badge>
          </div>
        }
      />

      {/* Stats */}
      <div className="mb-8">
        <StatsGrid columns={4}>
          {statCards.map((stat, index) => (
            <StatCard key={stat.title} {...stat} delay={index} />
          ))}
        </StatsGrid>
      </div>

      {/* User Role Statistics */}
      <ContentSection
        title="User Management Overview"
        description="Breakdown of registered users by role"
        className="mb-8"
      >
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200">
              <CardContent className="p-4 text-center">
                <Shield className="w-8 h-8 mx-auto mb-2 text-red-600" />
                <p className="text-2xl font-bold text-red-800 dark:text-red-400">
                  {users.filter(u => u.role === "admin").length}
                </p>
                <p className="text-sm text-red-600 font-medium">Admins</p>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200">
              <CardContent className="p-4 text-center">
                <UserCheck className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                <p className="text-2xl font-bold text-purple-800 dark:text-purple-400">
                  {users.filter(u => u.role === "organiser").length}
                </p>
                <p className="text-sm text-purple-600 font-medium">Organisers</p>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200">
              <CardContent className="p-4 text-center">
                <Users className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <p className="text-2xl font-bold text-blue-800 dark:text-blue-400">
                  {users.filter(u => u.role === "event_coordinator").length}
                </p>
                <p className="text-sm text-blue-600 font-medium">Event Coordinators</p>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200">
              <CardContent className="p-4 text-center">
                <Users className="w-8 h-8 mx-auto mb-2 text-green-600" />
                <p className="text-2xl font-bold text-green-800 dark:text-green-400">
                  {users.filter(u => u.role === "student_coordinator").length}
                </p>
                <p className="text-sm text-green-600 font-medium">Student Coordinators</p>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20 border-gray-200">
              <CardContent className="p-4 text-center">
                <Users className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-400">
                  {users.filter(u => u.role === "attendee").length}
                </p>
                <p className="text-sm text-gray-600 font-medium">Attendees</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </ContentSection>


      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Approvals */}
        <div className="lg:col-span-2 space-y-6">
          <ContentSection
            title="Pending Event Approvals"
            description={`${pendingEvents.length} events awaiting your review`}
          >
            <Card>
              <CardHeader className="pb-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search events..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {pendingEvents.length > 0 ? (
                  <div className="divide-y divide-border">
                    {pendingEvents
                      .filter(e => e.title?.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map((event, index) => (
                        <motion.div
                          key={event.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="p-4 hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex gap-3 flex-1">
                              <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                                {event.image_url ? (
                                  <img
                                    src={event.image_url}
                                    alt={event.title}
                                    className="w-full h-full object-cover"
                                    onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                                  />
                                ) : null}
                                <div className={`w-full h-full items-center justify-center ${event.image_url ? 'hidden' : 'flex'}`}>
                                  <Calendar className="w-6 h-6 text-muted-foreground" />
                                </div>
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-medium">{event.title}</h4>
                                  <Badge variant="outline">{event.category}</Badge>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <span>{new Date(event.start_date).toLocaleDateString()}</span>
                                  <span>{event.location}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Link href={`/events/${event.id}`}>
                                <Button variant="outline" size="sm">
                                  <Eye className="w-4 h-4 mr-1" />
                                  Review
                                </Button>
                              </Link>
                              <Button
                                size="sm"
                                onClick={() => handleApprove(event.id)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleReject(event.id)}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500 opacity-50" />
                    <p>No pending approvals!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </ContentSection>

          {/* User Distribution Chart */}
          <ContentSection title="User Distribution" description="Users by role">
            <Card>
              <CardContent className="p-6">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={userRoleData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => value > 0 ? `${name}: ${value}` : ""}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {userRoleData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </ContentSection>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <ContentSection title="Quick Actions">
            <Card>
              <CardContent className="p-4 space-y-2">
                <Link href="/admin/users" className="block">
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Users className="w-4 h-4" />
                    Manage Users
                  </Button>
                </Link>
                <Link href="/admin/reports" className="block">
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <BarChart3 className="w-4 h-4" />
                    View Reports
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </ContentSection>

          {/* Recent Users */}
          <ContentSection title="Recent Users" description="Latest registered users">
            <Card>
              <CardContent className="p-0">
                {users.length > 0 ? (
                  <div className="divide-y divide-border">
                    {users.slice(0, 5).map((user, index) => (
                      <motion.div
                        key={user.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-3 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-medium">{user.name?.charAt(0) || "U"}</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                        <Badge className={getRoleBadgeColor(user.role)}>
                          {user.role?.replace("_", " ")}
                        </Badge>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-muted-foreground text-sm">
                    No users found
                  </div>
                )}
              </CardContent>
            </Card>
          </ContentSection>

          {/* Event Categories */}
          <ContentSection title="Event Categories">
            <Card>
              <CardContent className="p-6">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </ContentSection>
        </div>
      </div>
    </DashboardLayout>
  )
}
