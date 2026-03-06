import {  Navbar  } from "@/components/navbar"
import {  Card, CardContent  } from "@/components/ui/card"
import {  getSession  } from "@/lib/session"

export default async function AboutPage() {
  const session = await getSession()

  return (
    <main>
      <Navbar session={session} />

      <div className="py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold">About EventifyEDU</h1>
            <p className="text-lg text-muted-foreground">Building the future of educational event management</p>
          </div>

          <div className="prose prose-sm dark:prose-invert max-w-none">
            <h2>Our Mission</h2>
            <p>
              EventifyEDU is dedicated to making event discovery and management seamless for educational institutions.
              We believe that every student should have easy access to enriching experiences like workshops, hackathons,
              and conferences.
            </p>

            <h2>Our Story</h2>
            <p>
              Founded in 2024, EventifyEDU w to solve a simple problem w centralized platform for
              educational events. We started with a vision to connect students with opportunities and help organizers
              manage events efficiently.
            </p>

            <h2>Our Values</h2>
            <ul>
              <li>Accessibility - Making events discoverable for everyone</li>
              <li>Community - Building connections between students and organizers</li>
              <li>Innovation - Continuously improving our platform</li>
              <li>Transparency - Being honest and clear in all our dealings</li>
            </ul>

            <h2>What We Do</h2>
            <p>
              We provide a comprehensive platform for managing educational events. From registration to certificate
              distribution, EventifyEDU handles the entire event lifecycle. Our tools help organizers save time and
              attendees find the right events.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            {[
              { number: "10K+", label: "Events Hosted" },
              { number: "100K+", label: "Active Users" },
              { number: "50+", label: "Colleges & Universities" },
            ].map((stat, idx) => (
              <Card key={idx}>
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl font-bold text-primary">{stat.number}</div>
                  <p className="text-sm text-muted-foreground mt-2">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}

