import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { EventCard } from "@/components/event-card"
import Link from "next/link"
import { ArrowRight, Calendar, Users, Award } from "lucide-react"
import { getSession } from "@/lib/session"
import { query } from "@/lib/db"


export default async function Home() {
  const session = await getSession()

  // Fetch featured events from database
  let featuredEvents = []
  try {
    const result = await query("SELECT * FROM events WHERE status = 'approved' LIMIT 3")
    featuredEvents = result || []
  } catch (error) {
    console.error("[v0] Error fetching events:", error)
    // Return empty array instead of mock data
    featuredEvents = []
  }

  return (
    <main>
      <Navbar session={session} />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-6 max-w-3xl mx-auto animate-fade-in">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-balance">
              Discover and Manage
              <br />
              <span className="gradient-text">Educational Events</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Connect with your academic community. Find workshops, hackathons, competitions, and more. All in one
              place.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" asChild className="hover-lift">
                <Link href="/events">
                  Browse Events <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="hover-lift">
                <Link href={session ? `/organiser/dashboard` : `/auth/register-organizer`}>Create Event</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Events */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-4 mb-12 animate-slide-in-left">
            <h2 className="text-3xl md:text-4xl font-bold">Featured Events</h2>
            <p className="text-muted-foreground max-w-2xl">
              Check out the hottest events happening on campus this semester
            </p>
          </div>

          {featuredEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredEvents.map((event, index) => (
                <div key={event.id} className="stagger-item" style={{ animationDelay: `${index * 0.15}s` }}>
                  <EventCard event={event} session={session} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No events available yet</p>
            </div>
          )}

          <div className="text-center mt-12">
            <Button size="lg" variant="outline" asChild className="hover-lift">
              <Link href="/events">View All Events</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-card border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 animate-fade-in">Why Choose EventifyEDU?</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Calendar,
                title: "Easy Scheduling",
                description: "Find events that fit your schedule with advanced filters and notifications",
              },
              {
                icon: Users,
                title: "Community Building",
                description: "Connect with peers, organize events, and grow your network",
              },
              {
                icon: Award,
                title: "Certificates",
                description: "Earn and download certificates for attended workshops and competitions",
              },
            ].map((feature, idx) => {
              const Icon = feature.icon
              return (
                <div
                  key={idx}
                  className="p-6 rounded-lg border border-border bg-background hover-lift stagger-item"
                  style={{ animationDelay: `${idx * 0.2}s` }}
                >
                  <Icon className="w-8 h-8 text-primary mb-3" />
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-primary to-secondary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold">Ready to Organize an Event?</h2>
          <p className="text-lg opacity-90 max-w-2xl mx-auto">
            Become an event organizer and reach hundreds of students interested in your events
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link href={session ? `/organiser/dashboard` : `/auth/register-organizer`}>Get Started Today</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/events" className="hover:text-foreground">
                    Events
                  </Link>
                </li>
                <li>
                  <Link href={session ? `/organiser/dashboard` : `/auth/register-organizer`} className="hover:text-foreground">
                    Organize
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-foreground">
                    Pricing
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/about" className="hover:text-foreground">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="hover:text-foreground">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-foreground">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/help" className="hover:text-foreground">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="hover:text-foreground">
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link href="/guides" className="hover:text-foreground">
                    Guides
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/privacy" className="hover:text-foreground">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-foreground">
                    Terms
                  </Link>
                </li>
                <li>
                  <Link href="/cookies" className="hover:text-foreground">
                    Cookies
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2025 EventifyEDU. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  )
}