import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"

export default async function AttendeeLayout({ children }) {
    const session = await getSession()

    if (!session || session.role !== "attendee") {
        redirect("/auth/login")
    }

    return <>{children}</>
}
