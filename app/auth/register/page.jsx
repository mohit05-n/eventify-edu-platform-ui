"use client"

import React from "react"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import Link from "next/link"
import { useState } from "react"
import { AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import Logo from "@/components/logo"

export default function RegisterPage() {
  const router = useRouter()

  return (
    <main>
      <Navbar />

      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-2 text-center">
            <Logo size="xl" className="mx-auto mb-4" />
            <h1 className="text-3xl font-bold">Create Account</h1>
            <p className="text-muted-foreground">Join EventifyEDU and start discovering events</p>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">User Type</label>
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    type="button"
                    size="lg"
                    variant="outline"
                    onClick={() => router.push('/auth/register-attendee')}
                    className="h-auto py-6"
                  >
                    <div className="flex flex-col items-center">
                      <div className="font-medium">Attendee</div>
                      <div className="text-xs text-muted-foreground mt-1">Browse & attend events</div>
                    </div>
                  </Button>
                  <Button
                    type="button"
                    size="lg"
                    variant="outline"
                    onClick={() => router.push('/auth/register-organizer')}
                    className="h-auto py-6"
                  >
                    <div className="flex flex-col items-center">
                      <div className="font-medium">Organizer</div>
                      <div className="text-xs text-muted-foreground mt-1">Create & manage events</div>
                    </div>
                  </Button>
                </div>
              </div>

              <p className="text-center text-sm text-muted-foreground py-2">
                Select your user type to continue with registration.
              </p>
            </div>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-primary hover font-medium">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
