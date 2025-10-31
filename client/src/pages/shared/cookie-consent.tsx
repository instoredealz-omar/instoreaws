import { useEffect } from "react";
import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CookieConsent() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">Cookie Consent Policy</h1>
          <p className="text-muted-foreground">Last updated: December 2024</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>What Are Cookies?</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              Cookies are small text files that are placed on your device when you visit our website. 
              They help us provide you with a better experience by remembering your preferences and 
              understanding how you use our service.
            </p>
          </CardContent>
        </Card>

        <div className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Types of Cookies We Use</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Essential Cookies</h4>
                <p className="text-muted-foreground">
                  These cookies are necessary for the website to function properly. They enable basic 
                  functions like page navigation, security, and access to secure areas of the website.
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
                  <li>Authentication and session management</li>
                  <li>Security and fraud prevention</li>
                  <li>Shopping cart functionality</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Performance Cookies</h4>
                <p className="text-muted-foreground">
                  These cookies help us understand how visitors interact with our website by collecting 
                  and reporting information anonymously.
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
                  <li>Page load times and performance metrics</li>
                  <li>Error tracking and debugging</li>
                  <li>User interaction patterns</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Functionality Cookies</h4>
                <p className="text-muted-foreground">
                  These cookies enable the website to provide enhanced functionality and personalization.
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
                  <li>Language preferences</li>
                  <li>Location settings</li>
                  <li>Customized content based on your preferences</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Analytics Cookies</h4>
                <p className="text-muted-foreground">
                  We use analytics cookies to understand how users engage with our platform and improve our services.
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
                  <li>User behavior analysis</li>
                  <li>Traffic sources and patterns</li>
                  <li>Feature usage statistics</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Managing Your Cookie Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Browser Settings</h4>
                <p className="text-muted-foreground">
                  Most web browsers allow you to control cookies through their settings preferences. 
                  You can set your browser to refuse cookies or delete certain cookies. However, please 
                  note that if you disable cookies, some features of our website may not function properly.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Cookie Consent</h4>
                <p className="text-muted-foreground">
                  By continuing to use our website, you consent to our use of cookies as described in 
                  this policy. We will ask for your consent before placing any non-essential cookies on 
                  your device.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Third-Party Cookies</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Some cookies are placed by third-party services that appear on our pages. We do not 
                control these cookies, and you should check the third-party websites for more information 
                about these cookies.
              </p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li>Analytics providers (e.g., Google Analytics)</li>
                <li>Payment processors</li>
                <li>Social media platforms</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Us</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                If you have any questions about our use of cookies, please contact us at:
              </p>
              <p className="mt-2">
                <strong>Email:</strong> support@instoredealz.com<br />
                <strong>Phone:</strong> 90044 08584
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
}
