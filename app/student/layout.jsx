import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"

export default async function StudentLayout({ children }) {
    const session = await getSession()

    if (!session || session.role !== "student_coordinator") {
        redirect("/auth/login")
    }

    return <>{children}</>
}
