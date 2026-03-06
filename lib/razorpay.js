// Import the Razorpay SDK
import Razorpay from "razorpay";

// Check if Razorpay keys are configured (check both possible env variable names)
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

// Initialize Razorpay instance only if keys are available
let razorpay = null;
if (RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: RAZORPAY_KEY_ID,
    key_secret: RAZORPAY_KEY_SECRET,
  });
}

export async function createRazorpayOrder(amount, eventId, registrationId, bookingId = null) {
  // Check if Razorpay is configured
  if (!razorpay) {
    console.error("[v0] Razorpay keys not configured");
    throw new Error("Payment gateway not configured. Please contact support.");
  }

  if (!amount || amount <= 0) {
    throw new Error("Invalid payment amount");
  }

  try {
    // Prepare order data
    const orderData = {
      amount: Math.round(amount * 100), // Convert to paise
      currency: "INR",
      receipt: `rcpt_${bookingId || registrationId}`.slice(0, 40),
      notes: {
        eventId: eventId.toString(),
        registrationId: registrationId.toString(),
        bookingId: bookingId ? bookingId.toString() : "",
      },
    };

    // Create order using Razorpay SDK
    const order = await razorpay.orders.create(orderData);

    return {
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      notes: order.notes,
    };
  } catch (error) {
    console.error("[v0] Razorpay order creation error:", error);
    throw new Error("Failed to create payment order: " + (error.message || "Unknown error"));
  }
}


export async function verifyRazorpayPayment(
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
) {
  try {
    // Import crypto for signature verification
    const crypto = await import("crypto");

    // Create the string to be signed
    const body = razorpayOrderId + "|" + razorpayPaymentId;

    // Create HMAC hash using the key secret
    const expectedSignature = crypto.default
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    // Compare signatures
    const isVerified = expectedSignature === razorpaySignature;

    return isVerified;
  } catch (error) {
    console.error("[v0] Razorpay payment verification error:", error);
    return false;
  }
}

// Export the razorpay instance for direct use if needed
export { razorpay };
