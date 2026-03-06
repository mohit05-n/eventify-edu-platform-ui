"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, X, LogOut, Moon, Sun, LayoutDashboard } from "lucide-react"
import { useState, useEffect } from "react"
import Logo from "./logo"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { useAuth } from "./auth-context"

export function Navbar({ initialSession }) {
  const router = useRouter()
  const { session: contextSession, isLoading: contextLoading, logout, getDashboardUrl } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Use initialSession if provided, otherwise use context session
  const session = initialSession !== undefined ? initialSession : contextSession
  const isLoading = initialSession !== undefined ? false : contextLoading

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogout = async () => {
    await logout()
    setMobileMenuOpen(false)
  }

  const getNavLinks = () => {
    const baseLinks = [
      { href: "/", label: "Home" },
      { href: "/events", label: "Events" },
    ]

    if (!session) {
      return baseLinks
    }

    const roleLinks = {
      admin: [{ href: "/admin/dashboard", label: "Admin Dashboard" }],
      organiser: [
        { href: "/organiser/dashboard", label: "My Dashboard" },
        { href: "/organiser/create-event", label: "Create Event" },
      ],
      event_coordinator: [
        { href: "/coordinator/dashboard", label: "Coordinator Dashboard" },
      ],
      student_coordinator: [
        { href: "/student/dashboard", label: "My Tasks" },
      ],
      attendee: [{ href: "/attendee/dashboard", label: "My Tickets" }],
    }

    return [...baseLinks, ...(roleLinks[session.role] || [])]
  }

  return (
    <nav className="border-b border-border bg-card sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Logo size="small" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {getNavLinks().map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-foreground hover:text-primary transition-colors text-sm font-medium"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {/* Dark Mode Toggle */}
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="rounded-full"
              >
                {theme === "dark" ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </Button>
            )}
            {!isLoading && (
              <>
                {!session ? (
                  <>
                    <Button variant="outline" asChild>
                      <Link href="/auth/login">Login</Link>
                    </Button>
                    <Button asChild>
                      <Link href="/auth/register">Register</Link>
                    </Button>
                  </>
                ) : (
                  <>
                    {/* Dashboard Quick Access Button */}
                    <Button variant="outline" asChild className="gap-2">
                      <Link href={getDashboardUrl()}>
                        <LayoutDashboard className="w-4 h-4" />
                        Dashboard
                      </Link>
                    </Button>
                    <Button variant="ghost" onClick={handleLogout}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </Button>
                  </>
                )}
              </>
            )}
            {isLoading && (
              <div className="w-20 h-9 bg-muted animate-pulse rounded-md" />
            )}
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 space-y-2">
            {getNavLinks().map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block text-foreground hover:text-primary transition-colors py-2 text-sm"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="flex flex-col gap-2 pt-4">
              {mounted && (
                <Button
                  variant="outline"
                  className="w-full bg-transparent"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                >
                  {theme === "dark" ? (
                    <>
                      <Sun className="w-4 h-4 mr-2" />
                      Light Mode
                    </>
                  ) : (
                    <>
                      <Moon className="w-4 h-4 mr-2" />
                      Dark Mode
                    </>
                  )}
                </Button>
              )}
              {!isLoading && (
                <>
                  {!session ? (
                    <>
                      <Button variant="outline" asChild className="w-full bg-transparent">
                        <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}>Login</Link>
                      </Button>
                      <Button asChild className="w-full">
                        <Link href="/auth/register" onClick={() => setMobileMenuOpen(false)}>Register</Link>
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" asChild className="w-full bg-transparent gap-2">
                        <Link href={getDashboardUrl()} onClick={() => setMobileMenuOpen(false)}>
                          <LayoutDashboard className="w-4 h-4" />
                          Dashboard
                        </Link>
                      </Button>
                      <Button variant="outline" className="w-full bg-transparent" onClick={handleLogout}>
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                      </Button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
