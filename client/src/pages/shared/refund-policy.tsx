import { useEffect } from "react";
import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function RefundPolicy() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">Refund Policy</h1>
          <p className="text-muted-foreground">Last updated: December 2024</p>
        </div>

        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This refund policy applies to membership subscriptions and premium features on Instoredealz. 
            Deal claims and redemptions are subject to individual vendor policies.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Membership Refund Policy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">14-Day Money-Back Guarantee</h4>
              <p className="text-muted-foreground">
                We offer a 14-day money-back guarantee on all new membership purchases. If you're not 
                satisfied with your membership for any reason, you can request a full refund within 14 
                days of your initial purchase.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Conditions for Refund</h4>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li>Refund request must be made within 14 days of purchase</li>
                <li>Account must not have claimed more than 5 deals</li>
                <li>No evidence of fraudulent activity or abuse</li>
                <li>Original payment method must still be valid</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Cancellations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Monthly Subscriptions</h4>
                <p className="text-muted-foreground">
                  You can cancel your monthly subscription at any time. Upon cancellation:
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
                  <li>You will retain access until the end of your current billing period</li>
                  <li>No refund will be issued for partial months</li>
                  <li>Auto-renewal will be disabled</li>
                  <li>You can resubscribe at any time</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Annual Subscriptions</h4>
                <p className="text-muted-foreground">
                  Annual subscriptions can be cancelled, but refunds are prorated based on usage:
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
                  <li>Full refund if cancelled within 14 days with minimal usage</li>
                  <li>Prorated refund for unused months after 14 days</li>
                  <li>No refund after 6 months of active membership</li>
                  <li>Processing fee may apply to prorated refunds</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Deal Claim Refunds</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Vendor-Specific Policies</h4>
                <p className="text-muted-foreground">
                  Deal claims and redemptions are subject to individual vendor refund policies. 
                  Instoredealz does not process refunds for deals directly. Please contact the vendor 
                  for any issues with claimed deals.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Platform Support</h4>
                <p className="text-muted-foreground">
                  While we don't handle vendor refunds directly, we can assist with:
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
                  <li>Mediating disputes between customers and vendors</li>
                  <li>Reversing claim codes if not used</li>
                  <li>Providing vendor contact information</li>
                  <li>Investigating fraudulent or misleading deals</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How to Request a Refund</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Step 1: Contact Support</h4>
                <p className="text-muted-foreground">
                  Email us at support@instoredealz.com with your refund request. Include:
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
                  <li>Your account email address</li>
                  <li>Order/Transaction ID</li>
                  <li>Reason for refund request</li>
                  <li>Date of purchase</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Step 2: Verification</h4>
                <p className="text-muted-foreground">
                  Our team will verify your request and check eligibility based on our refund policy. 
                  This typically takes 1-2 business days.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Step 3: Processing</h4>
                <p className="text-muted-foreground">
                  Once approved, refunds are processed within 5-7 business days. The refund will be 
                  credited to your original payment method.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Non-Refundable Items</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                The following items and services are non-refundable:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li>Promotional or discounted memberships</li>
                <li>Gift cards and promotional codes</li>
                <li>One-time service fees</li>
                <li>Expired subscriptions (over 6 months old)</li>
                <li>Accounts terminated for policy violations</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                For any questions regarding refunds or to submit a refund request, please contact us:
              </p>
              <div className="space-y-2">
                <p><strong>Email:</strong> support@instoredealz.com</p>
                <p><strong>Phone:</strong> 90044 08584</p>
                <p><strong>Business Hours:</strong> Monday - Saturday, 9:00 AM - 6:00 PM IST</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
}
