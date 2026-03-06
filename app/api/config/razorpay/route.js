import { NextResponse } from "next/server"

export async function GET() {
  try {
    const keyId = process.env.RAZORPAY_KEY_ID || "rzp_test_1Oy8p6Yq7v6Q2w"

    return NextResponse.json({
      keyId,
    })
  } catch (error) {
    console.error("[v0] Get Razorpay config error:", error)
    return NextResponse.json({ error: "Failed to fetch config" }, { status: 500 })
  }
}

