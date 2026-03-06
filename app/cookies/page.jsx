import {  Navbar  } from "@/components/navbar"
import {  getSession  } from "@/lib/session"

export default async function CookiesPage() {
  const session = await getSession()

  return (
    <main>
      <Navbar session={session} />
      <div className="py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-8">Cookie Policy</h1>
          <div className="prose dark:prose-invert max-w-none text-sm">
            <h2>What are Cookies?</h2>
            <p>
              Cookies are small text files that are placed on your device when you visit our website. They help us
              remember your preferences and improve your experience on EventifyEDU.
            </p>

            <h2>Types of Cookies We Use</h2>
            <ul>
              <li>
                <strong>Session Cookies:</strong> These cookies expire when you close your browser. We use them to keep
                you logged in.
              </li>
              <li>
                <strong>Persistent Cookies:</strong> These cookies remain on your device for a longer period. We use
                them to remember your preferences.
              </li>
              <li>
                <strong>Analytics Cookies:</strong> We use these to understand how you use our platform and improve it.
              </li>
            </ul>

            <h2>Your Cookie Choices</h2>
            <p>
              Most web browsers allow you to control cookies through your browser settings. You can choose to reject or
              delete cookies, but this may affect your ability to use EventifyEDU.
            </p>

            <h2>Contact Us</h2>
            <p>If you have any questions about our use of cookies, please contact us at privacy@eventifyedu.com</p>
          </div>
        </div>
      </div>
    </main>
  )
}

