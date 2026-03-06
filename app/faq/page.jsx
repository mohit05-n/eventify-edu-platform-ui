import {  Navbar  } from "@/components/navbar"
import {  Card, CardContent  } from "@/components/ui/card"
import {  getSession  } from "@/lib/session"

export default async function FAQPage() {
  const session = await getSession()

  const faqs = [
    {
      q: "Is EventifyEDU free to use?",
      a: "Browsing events and registering  attendee is completely free. Organisers pay based on their plan.",
    },
    {
      q: "How do I become an event organiser?",
      a: "Sign up with the organiser role and you can start creating events immediately after approval.",
    },
    {
      q: "How long does event approval take?",
      a: "Most events are approved within 24 hours. You'll receive an email notification when your event is approved.",
    },
    {
      q: "Can I get a refund if I can't attend?",
      a: "Yes, refunds are available up to 48 hours before the event starts.",
    },
    {
      q: "How do I download my certificate?",
      a: "After the event ends, certificates will be available in your dashboard under 'My Events'.",
    },
    {
      q: "Is my data secure?",
      a: "We use industry-standard encryption to protect your data. Your privacy is our priority.",
    },
  ]

  return (
    <main>
      <Navbar session={session} />
      <div className="py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-12">
            <h1 className="text-4xl font-bold">Frequently Asked Questions</h1>
            <p className="text-muted-foreground">Find answers to common questions about EventifyEDU</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <Card key={idx}>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-2">{faq.q}</h3>
                  <p className="text-sm text-muted-foreground">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}

