import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Check } from "lucide-react"
import { getSession } from "@/lib/session"
import Link from "next/link"

export default async function PricingPage() {
  const session = await getSession()

  const plans = [
    {
      name: "Attendee",
      price: "Free",
      description: "Perfect for discovering and attending events",
      features: [
        "Browse all events",
        "Register for events",
        "Download certificates",
        "Event notifications",
        "Community access",
      ],
    },
    {
      name: "Organiser",
      price: "₹999",
      period: "/month",
      description: "Create and manage your own events",
      features: [
        "Create unlimited events",
        "Event analytics",
        "Attendee management",
        "Email notifications",
        "Certificate generation",
        "Payment integration",
      ],
      highlighted: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "For large organizations and institutions",
      features: [
        "Everything in Organiser",
        "API access",
        "Custom branding",
        "Dedicated support",
        "Advanced analytics",
        "White-label solution",
      ],
    },
  ]

  return (
    <main>
      <Navbar session={session} />

      <div className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h1 className="text-4xl md:text-5xl font-bold">Simple, Transparent Pricing</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Choose the plan that works best for you</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan, idx) => (
              <Card key={idx} className={`${plan.highlighted ? "border-primary shadow-lg" : ""} relative`}>
                {plan.highlighted && (
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-primary to-secondary text-white px-4 py-2 rounded-t-lg text-center text-sm font-semibold">
                    Most Popular
                  </div>
                )}
                <CardHeader className={plan.highlighted ? "pt-16" : ""}>
                  <h3 className="text-2xl font-bold">{plan.name}</h3>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    {plan.period && <span className="text-muted-foreground ml-2">{plan.period}</span>}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <Check className="w-5 h-5 text-secondary flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full" variant={plan.highlighted ? "default" : "outline"} asChild>
                    <Link href={session ? "/organiser/dashboard" : "/auth/register"}>Get Started</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}

