import {  Navbar  } from "@/components/navbar"
import {  getSession  } from "@/lib/session"

export default async function PrivacyPage() {
  const session = await getSession()

  return (
    <main>
      <Navbar session={session} />
      <div className="py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
          <div className="prose dark:prose-invert max-w-none text-sm">
            <h2>Introduction</h2>
            <p>
              EventifyEDU ("Company", "we", "our", or "us") operates the EventifyEDU website and mobile application.
              This page informs you of our policies regarding the collection, use, and disclosure of personal data when
              you use our service.
            </p>

            <h2>Information Collection and Use</h2>
            <p>We collect several different types of information for various purposes:</p>
            <ul>
              <li>Personal Data, email address, phone number, college/institution</li>
              <li>Usage Data type, IP address, pages visited, time and date of visits</li>
              <li>Payment Information securely through Razorpay</li>
            </ul>

            <h2>Security of Data</h2>
            <p>
              The security of your data is important to us but remember that no method of transmission over the Internet
              is 100% secure. While we strive to use commercially acceptable means to protect your personal data, we
              cannot guarantee its absolute security.
            </p>

            <h2>Changes to This Privacy Policy</h2>
            <p>
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new
              Privacy Policy on this page and updating the "Last Updated" date at the top of this Privacy Policy.
            </p>

            <h2>Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, please contact us at privacy@eventifyedu.com</p>
          </div>
        </div>
      </div>
    </main>
  )
}

