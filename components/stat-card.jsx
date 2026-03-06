"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function StatCard({
    title,
    value,
    icon: Icon,
    description,
    trend,
    trendValue,
    color = "primary",
    delay = 0
}) {
    const colorClasses = {
        primary: "text-primary",
        secondary: "text-secondary",
        accent: "text-accent",
        green: "text-green-500",
        blue: "text-blue-500",
        purple: "text-purple-500",
        orange: "text-orange-500",
        red: "text-red-500"
    }

    const bgColorClasses = {
        primary: "bg-primary/10",
        secondary: "bg-secondary/10",
        accent: "bg-accent/10",
        green: "bg-green-500/10",
        blue: "bg-blue-500/10",
        purple: "bg-purple-500/10",
        orange: "bg-orange-500/10",
        red: "bg-red-500/10"
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: delay * 0.1 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
        >
            <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">{title}</p>
                            <motion.p
                                className={cn("text-3xl font-bold", colorClasses[color])}
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.5, delay: delay * 0.1 + 0.2, type: "spring" }}
                            >
                                {value}
                            </motion.p>
                            {description && (
                                <p className="text-xs text-muted-foreground">{description}</p>
                            )}
                            {trend && (
                                <div className={cn(
                                    "flex items-center gap-1 text-sm font-medium",
                                    trend === "up" ? "text-green-500" : "text-red-500"
                                )}>
                                    <motion.span
                                        initial={{ x: -10, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ delay: delay * 0.1 + 0.4 }}
                                    >
                                        {trend === "up" ? "↑" : "↓"}
                                    </motion.span>
                                    {trendValue}
                                </div>
                            )}
                        </div>
                        {Icon && (
                            <motion.div
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{
                                    duration: 0.5,
                                    delay: delay * 0.1 + 0.1,
                                    type: "spring",
                                    stiffness: 200
                                }}
                                className={cn("p-3 rounded-xl", bgColorClasses[color])}
                            >
                                <Icon className={cn("w-6 h-6", colorClasses[color])} />
                            </motion.div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    )
}

export function StatsGrid({ children, columns = 4 }) {
    const gridClasses = {
        2: "grid-cols-1 md:grid-cols-2",
        3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
        4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
    }

    return (
        <div className={cn("grid gap-6", gridClasses[columns] || gridClasses[4])}>
            {children}
        </div>
    )
}

export default StatCard
