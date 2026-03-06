import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"

export default async function CoordinatorLayout({ children }) {
    const session = await getSession()

    if (!session || session.role !== "event_coordinator") {
        redirect("/auth/login")
    }

    return <>{children}</>
}
