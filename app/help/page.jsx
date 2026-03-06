import {  Navbar  } from "@/components/navbar"
import {  getSession  } from "@/lib/session"

export default async function HelpPage() {
  const session = await getSession()

  return (
    <main>
      <Navbar session={session} />
      <div className="py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-8">Help Center</h1>
          <div className="prose dark:prose-invert max-w-none">
            <h2>Getting Started</h2>
            <p>Welcome to EventifyEDU! Here you'll find everything you need to know about using our platform.</p>

            <h2>How to Find Events</h2>
            <p>Browse our events page to discover exciting workshops, hackathons, and conferences near you.</p>

            <h2>How to Register for an Event</h2>
            <p>
              Click on any event to see details, then click the register button to sign up. You'll receive a
              confirmation email.
            </p>

            <h2>Creating Your First Event</h2>
            <p>
              If you're an organiser, go to your dashboard and click "Create Event". Fill in the details and submit for
              approval.
            </p>

            <h2>Payment & Refunds</h2>
            <p>We accept Razorpay payments for paid events. Refunds are processed within 5-7 business days.</p>

            <h2>Downloading Certificates</h2>
            <p>After attending an event, certificates will be available in your dashboard for download.</p>
          </div>
        </div>
      </div>
    </main>
  )
}

