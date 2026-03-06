import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"

const SECRET_KEY = new TextEncoder().encode(
    process.env.JWT_SECRET || "eventifyedu-secret-key-change-in-production"
)

const COOKIE_NAME = "session"

export async function createSession(payload) {
    const token = await new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("7d")
        .setIssuedAt()
        .sign(SECRET_KEY)

    const cookieStore = await cookies()
    cookieStore.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: "/",
    })

    return token
}

export async function getSession() {
    try {
        const cookieStore = await cookies()
        const token = cookieStore.get(COOKIE_NAME)?.value

        if (!token) return null

        const { payload } = await jwtVerify(token, SECRET_KEY)
        return payload
    } catch (error) {
        console.error("[v0] Session verification error:", error)
        return null
    }
}

export async function deleteSession() {
    const cookieStore = await cookies()
    cookieStore.delete(COOKIE_NAME)
}
