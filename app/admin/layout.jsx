import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"

export default async function AdminLayout({ children }) {
    const session = await getSession()

    if (!session || session.role !== "admin") {
        redirect("/auth/login")
    }

    return <>{children}</>
}
