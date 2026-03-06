"use client";

import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, IndianRupee, Calendar, MapPin, CreditCard, Users } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback, Suspense } from "react";
import { useToast } from "@/hooks/use-toast";
import Script from "next/script";

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const eventId = searchParams.get('eventId');
  const registrationId = searchParams.get('registrationId');
  const bookingId = searchParams.get('bookingId');

  const [event, setEvent] = useState(null);
  const [session, setSession] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch session
        const sessionResponse = await fetch('/api/auth/session');
        const sessionData = await sessionResponse.json();

        if (!sessionData.session) {
          toast({
            title: "Please Login",
            description: "You need to be logged in to complete payment",
            variant: "destructive",
          });
          router.push('/auth/login');
          return;
        }
        setSession(sessionData.session);

        // Check required params
        if (!eventId || (!registrationId && !bookingId)) {
          toast({
            title: "Invalid Request",
            description: "Missing event or registration information",
            variant: "destructive",
          });
          router.push('/events');
          return;
        }

        // Fetch registrations/participants
        const regUrl = bookingId
          ? `/api/registrations/get?bookingId=${bookingId}`
          : `/api/registrations/get`; // For single, we'll find by registrationId

        const regRes = await fetch(regUrl);
        const regData = await regRes.json();

        let targetParticipants = [];
        if (bookingId) {
          targetParticipants = regData;
        } else {
          const singleReg = regData.find(r => String(r.id) === String(registrationId));
          if (singleReg) targetParticipants = [singleReg];
        }

        if (targetParticipants.length === 0) {
          toast({
            title: "Registration Not Found",
            description: "We couldn't find your registration details.",
            variant: "destructive",
          });
          router.push('/events');
          return;
        }
        setParticipants(targetParticipants);

        // Fetch event details
        const response = await fetch(`/api/events/${eventId}`);
        if (!response.ok) {
          router.push('/events');
          return;
        }

        const eventData = await response.json();
        setEvent(eventData);
      } catch (err) {
        console.error('Error fetching data:', err);
        router.push('/events');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [eventId, registrationId, bookingId, router, toast]);

  const handlePayment = useCallback(async () => {
    if (!razorpayLoaded) {
      toast({
        title: "Please Wait",
        description: "Payment gateway is loading...",
      });
      return;
    }

    try {
      setIsProcessing(true);

      // Create payment order
      const orderResponse = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId: eventId,
          registrationId: registrationId,
          bookingId: bookingId
        }),
      });

      if (!orderResponse.ok) {
        const orderData = await orderResponse.json();
        throw new Error(orderData.error || 'Failed to create payment order');
      }

      const order = await orderResponse.json();

      // Configure Razorpay options
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency || "INR",
        name: 'EventifyEDU',
        description: bookingId
          ? `Booking for ${participants.length} tickets - ${event?.title}`
          : `Registration for ${event?.title}`,
        order_id: order.id,
        handler: async function (response) {
          try {
            // Verify payment on server
            const verifyResponse = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                registrationId: registrationId,
                bookingId: bookingId
              }),
            });

            if (verifyResponse.ok) {
              setPaymentSuccess(true);
              toast({
                title: "Payment Successful! 🎉",
                description: "Your registration is confirmed!",
              });
            } else {
              const verifyData = await verifyResponse.json();
              throw new Error(verifyData.error || 'Payment verification failed');
            }
          } catch (err) {
            console.error('Payment verification error:', err);
            toast({
              title: "Payment Verification Failed",
              description: err.message,
              variant: "destructive",
            });
          } finally {
            setIsProcessing(false);
          }
        },
        prefill: {
          name: session?.name || '',
          email: session?.email || '',
          contact: session?.phone || '',
        },
        notes: {
          eventId: eventId,
          registrationId: registrationId,
          bookingId: bookingId
        },
        theme: {
          color: '#6366f1',
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
            toast({
              title: "Payment Cancelled",
              description: "You can try again when ready",
            });
          }
        }
      };

      // Open Razorpay checkout
      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', function (response) {
        setIsProcessing(false);
        toast({
          title: "Payment Failed",
          description: response.error.description || "Something went wrong with the payment",
          variant: "destructive",
        });
      });
      razorpay.open();

    } catch (err) {
      console.error('Payment error:', err);
      toast({
        title: "Payment Failed",
        description: err.message,
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  }, [razorpayLoaded, eventId, registrationId, bookingId, event, session, participants, router, toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card className="max-w-md mx-auto text-center p-8">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">Payment Successful!</h2>
            <p className="text-muted-foreground mb-6">
              You have successfully registered for <strong>{event?.title}</strong>
            </p>
            <div className="flex flex-col gap-3">
              <Button onClick={() => router.push('/events')} variant="outline" className="w-full">
                Browse More Events
              </Button>
              <Button onClick={() => router.push('/attendee/tickets')} className="w-full">
                View My Tickets
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const basePrice = event?.price ? parseFloat(event.price) : 0;
  const totalPrice = basePrice * participants.length;

  return (
    <>
      {/* Load Razorpay Script */}
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => setRazorpayLoaded(true)}
        onError={() => {
          toast({
            title: "Error Loading Payment Gateway",
            description: "Please refresh the page and try again",
            variant: "destructive",
          });
        }}
        strategy="lazyOnload"
      />

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <Navbar />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="mb-4"
            >
              ← Back to Event
            </Button>
            <h1 className="text-3xl font-bold">Complete Your Registration</h1>
            <p className="text-muted-foreground mt-1">Secure payment powered by Razorpay</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Event Summary */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Event Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {event?.image_url && (
                    <img
                      src={event.image_url}
                      alt={event.title}
                      className="w-full h-40 object-cover rounded-lg"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  )}
                  <div>
                    <h3 className="font-semibold text-lg">{event?.title}</h3>
                    <Badge variant="secondary" className="mt-1 capitalize">{event?.category}</Badge>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    {event?.start_date && new Date(event.start_date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>

                  {event?.location && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      {event.location}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Participants List */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Participants ({participants.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {participants.map((p, i) => (
                    <div key={i} className="flex justify-between items-start py-2 border-b last:border-0">
                      <div>
                        <p className="font-medium">{p.participant_name || session?.name}</p>
                        <p className="text-xs text-muted-foreground">{p.participant_email || session?.email}</p>
                      </div>
                      <Badge variant="outline">Attendee</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Payment Summary */}
            <Card className="h-fit sticky top-24">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Tickets x {participants.length}</span>
                    <span className="font-medium">₹{basePrice.toFixed(2)} ea</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Registration Fee (Subtotal)</span>
                    <span className="font-medium">₹{totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Platform Fee</span>
                    <span className="font-medium">₹0.00</span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-green-600 dark:text-green-400">
                    <span className="">Digital Delivery</span>
                    <span className="font-medium">Free</span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center text-xl font-bold">
                    <span>Grand Total</span>
                    <span className="flex items-center text-primary">
                      <IndianRupee className="w-5 h-5" />
                      {totalPrice.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Attendee Info */}
                <div className="bg-muted/50 rounded-lg p-4 space-y-1">
                  <h4 className="font-medium text-xs text-muted-foreground uppercase tracking-wider">Booking Account:</h4>
                  <p className="font-semibold text-sm">{session?.name}</p>
                  <p className="text-xs text-muted-foreground">{session?.email}</p>
                </div>

                <Button
                  className="w-full h-12 text-lg font-bold shadow-lg shadow-indigo-200 dark:shadow-none transition-all hover:scale-[1.02] active:scale-[0.98]"
                  onClick={handlePayment}
                  disabled={isProcessing || !razorpayLoaded}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Processing...
                    </>
                  ) : !razorpayLoaded ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Loading Gateway...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-5 w-5" />
                      Pay ₹{totalPrice.toFixed(2)}
                    </>
                  )}
                </Button>

                <p className="text-[10px] text-center text-muted-foreground px-4 leading-relaxed">
                  By proceeding, you agree to our <strong>Terms and Conditions</strong>.
                  All payments are processed securely via SSL encryption.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}