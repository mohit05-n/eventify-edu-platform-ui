"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import {
    LayoutDashboard,
    Calendar,
    Users,
    FileText,
    DollarSign,
    Bell,
    Settings,
    ClipboardList,
    Upload,
    CheckSquare,
    BarChart3,
    FolderOpen,
    UserCheck,
    MessageSquare,
    Lock,
    Plus,
    User
} from "lucide-react"
import { cn } from "@/lib/utils"
import Logo from "./logo"

const roleNavItems = {
    admin: [
        { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/admin/users", label: "User Management", icon: Users },
        { href: "/admin/events", label: "Event Approvals", icon: Calendar },
        { href: "/admin/reports", label: "Reports & Analytics", icon: BarChart3 },
        { href: "/admin/profile", label: "My Profile", icon: User },
    ],
    organiser: [
        { href: "/organiser/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/organiser/create-event", label: "Create Event", icon: Plus },
        { href: "/organiser/events", label: "My Events", icon: Calendar },
        { href: "/organiser/coordinators", label: "Coordinators", icon: Users },
        { href: "/organiser/tasks", label: "Tasks", icon: ClipboardList },
        { href: "/organiser/notifications", label: "Notifications", icon: Bell },
        { href: "/organiser/profile", label: "My Profile", icon: User },
    ],
    event_coordinator: [
        { href: "/coordinator/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/coordinator/my-tasks", label: "My Tasks", icon: ClipboardList },
        { href: "/coordinator/events", label: "Assigned Events", icon: Calendar },
        { href: "/coordinator/tasks", label: "Task Management", icon: CheckSquare },
        { href: "/coordinator/notifications", label: "Notifications", icon: Bell },
    ],
    student_coordinator: [
        { href: "/student/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/student/tasks", label: "My Tasks", icon: ClipboardList },
        { href: "/student/notifications", label: "Notifications", icon: Bell },
    ],
    attendee: [
        { href: "/attendee/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/events", label: "Browse Events", icon: Calendar },
        { href: "/attendee/tickets", label: "My Tickets", icon: FileText },
        { href: "/attendee/certificates", label: "Certificates", icon: UserCheck },
        { href: "/attendee/profile", label: "My Profile", icon: User },
    ],
}

export function Sidebar({ session }) {
    const pathname = usePathname()
    const role = session?.role || "attendee"
    const navItems = roleNavItems[role] || roleNavItems.attendee

    const getRoleTitle = () => {
        switch (role) {
            case "admin": return "Admin Panel"
            case "organiser": return "Organizer Portal"
            case "event_coordinator": return "Coordinator Panel"
            case "student_coordinator": return "Student Portal"
            default: return "My Account"
        }
    }

    const getRoleColor = () => {
        switch (role) {
            case "admin": return "from-red-500 to-rose-600"
            case "organiser": return "from-purple-500 to-indigo-600"
            case "event_coordinator": return "from-blue-500 to-cyan-600"
            case "student_coordinator": return "from-green-500 to-emerald-600"
            default: return "from-gray-500 to-slate-600"
        }
    }

    return (
        <aside className="w-64 min-h-screen bg-card border-r border-border flex flex-col">
            {/* Role Header */}
            <div className={cn("p-6 bg-gradient-to-r text-white", getRoleColor())}>
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <div className="mb-4 bg-white/20 w-fit p-2 rounded-lg backdrop-blur-sm">
                        <Logo size="small" />
                    </div>
                    <h2 className="font-bold text-lg">{getRoleTitle()}</h2>
                    <p className="text-sm opacity-90">{session?.name || "User"}</p>
                </motion.div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1">
                {navItems.map((item, index) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/")

                    return (
                        <motion.div
                            key={item.href}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                        >
                            <Link
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                                    "hover:bg-primary/10 hover:translate-x-1",
                                    isActive
                                        ? "bg-primary/15 text-primary font-medium border-l-4 border-primary"
                                        : "text-muted-foreground"
                                )}
                            >
                                <Icon className={cn("w-5 h-5", isActive && "text-primary")} />
                                <span>{item.label}</span>
                                {isActive && (
                                    <motion.div
                                        layoutId="sidebar-active"
                                        className="ml-auto w-2 h-2 rounded-full bg-primary"
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                )}
                            </Link>
                        </motion.div>
                    )
                })}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-border">
                <p className="text-xs text-muted-foreground text-center">
                    EventifyEDU © 2025
                </p>
            </div>
        </aside>
    )
}

export default Sidebar
