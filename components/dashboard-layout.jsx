"use client"

import { Sidebar } from "@/components/sidebar"
import { Navbar } from "@/components/navbar"
import { NotificationBell } from "@/components/notification-bell"
import { motion } from "framer-motion"

export function DashboardLayout({ children, session }) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
            <Navbar initialSession={session} />
            <div className="flex">
                <Sidebar session={session} />
                <main className="flex-1 overflow-auto">
                    <div className="p-6 md:p-8">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4 }}
                        >
                            {children}
                        </motion.div>
                    </div>
                </main>
            </div>
        </div>
    )
}

export function PageHeader({ title, description, actions }) {
    return (
        <motion.div
            className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <div>
                <h1 className="text-2xl md:text-3xl font-bold">{title}</h1>
                {description && (
                    <p className="text-muted-foreground mt-1">{description}</p>
                )}
            </div>
            {actions && (
                <div className="flex items-center gap-3">
                    {actions}
                </div>
            )}
        </motion.div>
    )
}

export function ContentSection({ title, description, children, className }) {
    return (
        <motion.section
            className={className}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
        >
            {(title || description) && (
                <div className="mb-4">
                    {title && <h2 className="text-xl font-semibold">{title}</h2>}
                    {description && (
                        <p className="text-muted-foreground text-sm mt-1">{description}</p>
                    )}
                </div>
            )}
            {children}
        </motion.section>
    )
}

export default DashboardLayout
