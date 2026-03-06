"use client"

import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
    Clock,
    PlayCircle,
    Upload,
    CheckCircle,
    XCircle,
    AlertCircle
} from "lucide-react"

const statusConfig = {
    pending: {
        label: "Pending",
        color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
        icon: Clock,
        pulse: false
    },
    in_progress: {
        label: "In Progress",
        color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
        icon: PlayCircle,
        pulse: true
    },
    submitted: {
        label: "Submitted",
        color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
        icon: Upload,
        pulse: true
    },
    approved: {
        label: "Approved",
        color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
        icon: CheckCircle,
        pulse: false
    },
    rejected: {
        label: "Rejected",
        color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
        icon: XCircle,
        pulse: false
    },
    // Budget statuses
    proposed: {
        label: "Proposed",
        color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
        icon: AlertCircle,
        pulse: false
    },
    spent: {
        label: "Spent",
        color: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
        icon: CheckCircle,
        pulse: false
    }
}

export function TaskStatusBadge({ status, size = "default", showIcon = true, animated = true }) {
    const config = statusConfig[status] || statusConfig.pending
    const Icon = config.icon

    const sizeClasses = {
        sm: "text-xs px-2 py-0.5",
        default: "text-sm px-3 py-1",
        lg: "text-base px-4 py-1.5"
    }

    const iconSizes = {
        sm: "w-3 h-3",
        default: "w-4 h-4",
        lg: "w-5 h-5"
    }

    return (
        <motion.div
            initial={animated ? { scale: 0.9, opacity: 0 } : false}
            animate={animated ? { scale: 1, opacity: 1 } : false}
            whileHover={animated ? { scale: 1.05 } : undefined}
            transition={{ duration: 0.2 }}
        >
            <Badge
                className={cn(
                    "font-medium border-0 flex items-center gap-1.5",
                    sizeClasses[size],
                    config.color
                )}
            >
                {showIcon && (
                    <Icon className={cn(
                        iconSizes[size],
                        config.pulse && "animate-pulse"
                    )} />
                )}
                {config.label}
            </Badge>
        </motion.div>
    )
}

export function PriorityBadge({ priority, size = "default" }) {
    const priorityConfig = {
        low: {
            label: "Low",
            color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
        },
        medium: {
            label: "Medium",
            color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
        },
        high: {
            label: "High",
            color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
        },
        urgent: {
            label: "Urgent",
            color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
        }
    }

    const config = priorityConfig[priority] || priorityConfig.medium

    const sizeClasses = {
        sm: "text-xs px-2 py-0.5",
        default: "text-sm px-2.5 py-0.5",
        lg: "text-base px-3 py-1"
    }

    return (
        <Badge className={cn("font-medium border-0", sizeClasses[size], config.color)}>
            {config.label}
        </Badge>
    )
}

export function EventStatusBadge({ status }) {
    const eventStatusConfig = {
        draft: {
            label: "Draft",
            color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
        },
        pending: {
            label: "Pending Approval",
            color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
        },
        approved: {
            label: "Approved",
            color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
        },
        rejected: {
            label: "Rejected",
            color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
        },
        completed: {
            label: "Completed",
            color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
        },
        cancelled: {
            label: "Cancelled",
            color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
        }
    }

    const config = eventStatusConfig[status] || eventStatusConfig.draft

    return (
        <Badge className={cn("font-medium border-0", config.color)}>
            {config.label}
        </Badge>
    )
}

export default TaskStatusBadge
