"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { useRouter } from "next/navigation"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [session, setSession] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()

    const fetchSession = async () => {
        try {
            const res = await fetch("/api/auth/session")
            const data = await res.json()
            setSession(data.session || null)
        } catch (error) {
            console.error("[v0] Failed to fetch session:", error)
            setSession(null)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchSession()
    }, [])

    const logout = async () => {
        try {
            await fetch("/api/auth/logout", { method: "POST" })
            setSession(null)
            router.push("/")
            router.refresh()
        } catch (error) {
            console.error("[v0] Logout error:", error)
        }
    }

    const getDashboardUrl = () => {
        if (!session) return "/auth/login"

        const dashboardMap = {
            admin: "/admin/dashboard",
            organiser: "/organiser/dashboard",
            event_coordinator: "/coordinator/dashboard",
            student_coordinator: "/student/dashboard",
            attendee: "/attendee/dashboard",
        }

        return dashboardMap[session.role] || "/auth/login"
    }

    return (
        <AuthContext.Provider
            value={{
                session,
                isLoading,
                logout,
                getDashboardUrl,
                refreshSession: fetchSession,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider")
    }
    return context
}
