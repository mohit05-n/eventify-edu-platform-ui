import {  Navbar  } from "@/components/navbar"
import {  getSession  } from "@/lib/session"

export default async function TermsPage() {
  const session = await getSession()

  return (
    <main>
      <Navbar session={session} />
      <div className="py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
          <div className="prose dark:prose-invert max-w-none text-sm">
            <h2>Acceptance of Terms</h2>
            <p>
              By accessing and using the EventifyEDU platform, you accept and agree to be bound by the terms and
              provision of this agreement.
            </p>

            <h2>Use License</h2>
            <p>
              Permission is granted to temporarily download one copy of the materials (information or software) on
              EventifyEDU platform for personal, non-commercial transitory viewing only. This is the grant of a license,
              not a transfer of title, and under this license you may not:
            </p>
            <ul>
              <li>Modifying or copying the materials</li>
              <li>Using the materials for any commercial purpose or for any public display</li>
              <li>Attempting to decompile or reverse engineer any software contained on the platform</li>
              <li>Removing any copyright or other proprietary notations from the materials</li>
              <li>Transferring the materials to another person or "mirroring" the materials on any other server</li>
            </ul>

            <h2>Disclaimer</h2>
            <p>
              The materials on EventifyEDU platform are provided on an '' basis. EventifyEDU makes no warranties,
              expressed or implied, and hereby disclaims and negates all other warranties including, without limitation,
              implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement
              of intellectual property or other violation of rights.
            </p>

            <h2>Limitations</h2>
            <p>
              In no event shall EventifyEDU or its suppliers be liable for any damages (including, without limitation,
              damages for loss of data or profit, or due to business interruption) arising out of the use or inability
              to use the materials on EventifyEDU platform.
            </p>

            <h2>Contact Us</h2>
            <p>If you have any questions about these Terms of Service, please contact us at legal@eventifyedu.com</p>
          </div>
        </div>
      </div>
    </main>
  )
}

