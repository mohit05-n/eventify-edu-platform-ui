"use client"

import { motion } from "framer-motion"
import { Check, Circle, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

export function ProgressTimeline({ steps, currentStep = 0 }) {
    return (
        <div className="space-y-4">
            {steps.map((step, index) => {
                const isCompleted = index < currentStep
                const isCurrent = index === currentStep
                const isPending = index > currentStep

                return (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="flex gap-4"
                    >
                        {/* Timeline line and dot */}
                        <div className="flex flex-col items-center">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ duration: 0.3, delay: index * 0.1 + 0.2 }}
                                className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                                    isCompleted && "bg-green-500 border-green-500 text-white",
                                    isCurrent && "bg-primary border-primary text-white animate-pulse",
                                    isPending && "bg-muted border-border text-muted-foreground"
                                )}
                            >
                                {isCompleted ? (
                                    <Check className="w-5 h-5" />
                                ) : isCurrent ? (
                                    <Clock className="w-5 h-5" />
                                ) : (
                                    <Circle className="w-5 h-5" />
                                )}
                            </motion.div>
                            {index < steps.length - 1 && (
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: 40 }}
                                    transition={{ duration: 0.3, delay: index * 0.1 + 0.3 }}
                                    className={cn(
                                        "w-0.5 flex-1",
                                        isCompleted ? "bg-green-500" : "bg-border"
                                    )}
                                />
                            )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 pb-8">
                            <div className="flex items-center justify-between">
                                <h4 className={cn(
                                    "font-medium",
                                    isCompleted && "text-green-600 dark:text-green-400",
                                    isCurrent && "text-primary",
                                    isPending && "text-muted-foreground"
                                )}>
                                    {step.title}
                                </h4>
                                {step.date && (
                                    <span className="text-xs text-muted-foreground">
                                        {step.date}
                                    </span>
                                )}
                            </div>
                            {step.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                    {step.description}
                                </p>
                            )}
                            {step.content && (
                                <div className="mt-2">{step.content}</div>
                            )}
                        </div>
                    </motion.div>
                )
            })}
        </div>
    )
}

export function EventWorkflowTimeline({ event }) {
    const getWorkflowSteps = () => {
        const steps = [
            {
                title: "Event Created",
                description: "Event proposal submitted for review",
                date: event?.created_at ? new Date(event.created_at).toLocaleDateString() : null
            },
            {
                title: "Admin Review",
                description: "Pending approval from administration",
                date: null
            },
            {
                title: "Coordinators Assigned",
                description: "Event and student coordinators assigned",
                date: null
            },
            {
                title: "Tasks in Progress",
                description: "Team executing event preparation tasks",
                date: null
            },
            {
                title: "Event Day",
                description: "Event execution and management",
                date: event?.start_date ? new Date(event.start_date).toLocaleDateString() : null
            },
            {
                title: "Event Completed",
                description: "Final report and feedback collection",
                date: null
            }
        ]

        return steps
    }

    const getCurrentStep = () => {
        switch (event?.status) {
            case "draft": return 0
            case "pending": return 1
            case "approved": return 2
            case "completed": return 5
            case "cancelled": return 0
            case "rejected": return 1
            default: return 0
        }
    }

    return (
        <ProgressTimeline
            steps={getWorkflowSteps()}
            currentStep={getCurrentStep()}
        />
    )
}

export default ProgressTimeline
