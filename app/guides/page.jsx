import {  Navbar  } from "@/components/navbar"
import {  getSession  } from "@/lib/session"

export default async function GuidesPage() {
  const session = await getSession()

  return (
    <main>
      <Navbar session={session} />
      <div className="py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-8">Guides & Tutorials</h1>
          <div className="prose dark:prose-invert max-w-none">
            <h2>Attendee Guides</h2>
            <ul>
              <li>Browsing and filtering events</li>
              <li>Registering for events</li>
              <li>Managing your registrations</li>
              <li>Downloading certificates</li>
              <li>Updating your profile</li>
            </ul>

            <h2>Organiser Guides</h2>
            <ul>
              <li>Creating your first event</li>
              <li>Managing attendees</li>
              <li>Setting up payments</li>
              <li>Generating certificates</li>
              <li>Analytics and reporting</li>
            </ul>

            <h2>Admin Guides</h2>
            <ul>
              <li>Approving events</li>
              <li>Managing users</li>
              <li>Platform analytics</li>
              <li>Content moderation</li>
              <li>System settings</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  )
}

