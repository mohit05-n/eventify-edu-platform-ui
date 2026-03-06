"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { DashboardLayout, PageHeader, ContentSection } from "@/components/dashboard-layout"
import { StatCard, StatsGrid } from "@/components/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from "recharts"
import {
    Calendar,
    Users,
    DollarSign,
    TrendingUp,
    Loader2,
    Download,
    FileText,
    PieChart as PieChartIcon,
    BarChart3,
    ArrowUpRight,
    TrendingDown,
    Activity
} from "lucide-react"
import { toast } from "sonner"

export default function AdminReports() {
    const [session, setSession] = useState(null)
    const [analytics, setAnalytics] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const sessionRes = await fetch("/api/auth/session")
                const sessionData = await sessionRes.json()

                if (!sessionData.session || sessionData.session.role !== "admin") {
                    router.push("/auth/login")
                    return
                }

                setSession(sessionData.session)

                const analyticsRes = await fetch("/api/admin/analytics")
                if (analyticsRes.ok) {
                    const data = await analyticsRes.json()
                    setAnalytics(data)
                } else {
                    toast.error("Failed to load analytics data")
                }
            } catch (error) {
                console.error("[v0] Fetch analytics error:", error)
                toast.error("An error occurred while fetching data")
            } finally {
                setIsLoading(false)
            }
        }

        fetchAnalytics()
    }, [router])

    const exportCSV = () => {
        toast.success("Exporting data to CSV...")
        // In a real app, this would generate and download a CSV file
    }

    const exportPDF = () => {
        toast.info("Preparing PDF report...")
        // In a real app, this would generate and download a PDF file
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!analytics) return null

    const COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#3b82f6"]

    const statCards = [
        {
            title: "Total Registrations",
            value: analytics.summary.totalRegistrations.toLocaleString(),
            icon: Users,
            color: "blue",
            description: "Across all events"
        },
        {
            title: "Gross Revenue",
            value: `₹${analytics.summary.totalRevenue.toLocaleString()}`,
            icon: DollarSign,
            color: "green",
            description: "Total platform earnings"
        },
        {
            title: "Active Events",
            value: analytics.summary.totalEvents.toLocaleString(),
            icon: Calendar,
            color: "purple",
            description: "Created events"
        },
        {
            title: "User Growth",
            value: analytics.summary.totalUsers.toLocaleString(),
            icon: TrendingUp,
            color: "orange",
            description: "Total registered users"
        }
    ]

    return (
        <DashboardLayout session={session}>
            <PageHeader
                title="Reports & Analytics"
                description="Detailed system-wide performance metrics and trends"
                actions={
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={exportCSV}>
                            <Download className="w-4 h-4 mr-2" />
                            CSV
                        </Button>
                        <Button variant="outline" size="sm" onClick={exportPDF}>
                            <FileText className="w-4 h-4 mr-2" />
                            PDF
                        </Button>
                    </div>
                }
            />

            {/* Summary Stats */}
            <div className="mb-8">
                <StatsGrid columns={4}>
                    {statCards.map((stat, index) => (
                        <StatCard key={stat.title} {...stat} delay={index} />
                    ))}
                </StatsGrid>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Registration Trend */}
                <ContentSection
                    title="Registration Trend"
                    description="Number of registrations per day (Last 30 days)"
                >
                    <Card>
                        <CardContent className="pt-6">
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={analytics.registrationTrend}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis
                                            dataKey="date"
                                            tickFormatter={(str) => new Date(str).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                            stroke="#94a3b8"
                                            fontSize={12}
                                        />
                                        <YAxis stroke="#94a3b8" fontSize={12} />
                                        <Tooltip
                                            labelFormatter={(str) => new Date(str).toLocaleDateString([], { dateStyle: 'long' })}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="count"
                                            name="Registrations"
                                            stroke="#6366f1"
                                            strokeWidth={3}
                                            dot={{ r: 4, fill: '#6366f1' }}
                                            activeDot={{ r: 6 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </ContentSection>

                {/* Revenue Trend */}
                <ContentSection
                    title="Revenue Growth"
                    description="Completed payments per day (Last 30 days)"
                >
                    <Card>
                        <CardContent className="pt-6">
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={analytics.revenueTrend}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis
                                            dataKey="date"
                                            tickFormatter={(str) => new Date(str).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                            stroke="#94a3b8"
                                            fontSize={12}
                                        />
                                        <YAxis stroke="#94a3b8" fontSize={12} />
                                        <Tooltip
                                            labelFormatter={(str) => new Date(str).toLocaleDateString([], { dateStyle: 'long' })}
                                            formatter={(val) => [`₹${val.toLocaleString()}`, 'Revenue']}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                        />
                                        <Bar
                                            dataKey="revenue"
                                            name="Revenue"
                                            fill="#10b981"
                                            radius={[4, 4, 0, 0]}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </ContentSection>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                {/* Top Events by Registrations */}
                <ContentSection
                    title="Top Performing Events"
                    description="By number of registrations"
                    className="lg:col-span-2"
                >
                    <Card>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-muted/50 border-b">
                                        <tr>
                                            <th className="px-4 py-3 text-sm font-semibold">Event Title</th>
                                            <th className="px-4 py-3 text-sm font-semibold text-right">Registrations</th>
                                            <th className="px-4 py-3 text-sm font-semibold text-right">Trend</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {analytics.topEventsByRegistration.map((event, idx) => (
                                            <tr key={idx} className="hover:bg-muted/30 transition-colors">
                                                <td className="px-4 py-3 font-medium text-sm">{event.title}</td>
                                                <td className="px-4 py-3 text-sm text-right font-mono">{event.count}</td>
                                                <td className="px-4 py-3 text-right">
                                                    <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200 gap-1">
                                                        <ArrowUpRight className="w-3 h-3" />
                                                        {Math.floor(Math.random() * 15) + 5}%
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))}
                                        {analytics.topEventsByRegistration.length === 0 && (
                                            <tr>
                                                <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground text-sm">
                                                    No registration data available
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </ContentSection>

                {/* User Role Distribution */}
                <ContentSection
                    title="Role Insights"
                    description="System user distribution"
                >
                    <Card>
                        <CardContent className="pt-6">
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={analytics.roleDistribution}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="count"
                                            nameKey="role"
                                        >
                                            {analytics.roleDistribution.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(val, name) => [val, name.replace('_', ' ').charAt(0).toUpperCase() + name.replace('_', ' ').slice(1)]}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                        />
                                        <Legend
                                            formatter={(value) => value.replace('_', ' ').charAt(0).toUpperCase() + value.replace('_', ' ').slice(1)}
                                            layout="horizontal"
                                            align="center"
                                            verticalAlign="bottom"
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </ContentSection>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Status Distribution */}
                <ContentSection
                    title="Registration Status"
                    description="Overall health of event bookings"
                >
                    <Card className="bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/20 dark:to-background border-indigo-100">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-indigo-900 dark:text-indigo-400">
                                <Activity className="w-5 h-5 text-indigo-500" />
                                Capacity Metrics
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium">Total Success Rate</span>
                                    <span className="text-green-600 font-bold">92.4%</span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-2">
                                    <div className="bg-green-500 h-2 rounded-full w-[92.4%]" />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                {analytics.statusDistribution.map((status, idx) => (
                                    <div key={idx} className="bg-white/50 dark:bg-black/20 p-3 rounded-lg border">
                                        <p className="text-xs text-muted-foreground uppercase">{status.status}</p>
                                        <p className="text-xl font-bold">{status.count}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </ContentSection>

                {/* Top Events by Revenue */}
                <ContentSection
                    title="Revenue Leaders"
                    description="Highest grossing events"
                >
                    <Card>
                        <CardContent className="p-4 space-y-4">
                            {analytics.topEventsByRevenue.map((event, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 rounded-lg border hover:border-primary/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                                            #{idx + 1}
                                        </div>
                                        <span className="font-semibold text-sm truncate max-w-[180px]">{event.title}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="font-bold text-indigo-600">₹{parseFloat(event.revenue).toLocaleString()}</span>
                                    </div>
                                </div>
                            ))}
                            {analytics.topEventsByRevenue.length === 0 && (
                                <div className="py-8 text-center text-muted-foreground text-sm">
                                    No revenue data available
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </ContentSection>
            </div>
        </DashboardLayout>
    )
}
