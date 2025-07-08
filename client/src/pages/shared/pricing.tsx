import { Link } from "wouter";
import { useEffect } from "react";
import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Crown, Gift } from "lucide-react";
import { useAuth } from "@/lib/auth";

export default function Pricing() {
  const { isAuthenticated } = useAuth();

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const plans = [
    {
      name: "Basic",
      price: "Free",
      description: "Perfect for occasional shoppers",
      icon: Gift,
      features: [
        "Access to basic deals",
        "City-based offers",
        "Deal notifications",
        "Basic customer support",
        "Mobile app access"
      ],
      buttonText: "Current Plan",
      buttonVariant: "outline" as const,
      popular: false,
    },
    {
      name: "Premium",
      price: "₹8,999",
      originalPrice: "₹12,999",
      period: "/year",
      description: "Best value for regular shoppers",
      icon: Star,
      features: [
        "All Basic features",
        "Exclusive premium deals",
        "Early access to sales",
        "Digital membership card",
        "Priority customer support",
        "Unlimited deal claims",
        "Advanced deal alerts"
      ],
      buttonText: "Choose Premium",
      buttonVariant: "default" as const,
      popular: true,
      savings: "Save ₹4,000",
    },
    {
      name: "Ultimate",
      price: "₹12,999",
      period: "/year",
      description: "For serious deal hunters",
      icon: Crown,
      features: [
        "All Premium features",
        "VIP customer support",
        "Personal deal curator",
        "Unlimited deal claims",
        "Exclusive ultimate-only deals",
        "Advanced analytics dashboard",
        "Custom deal categories",
        "White-glove onboarding",
        "24/7 phone support"
      ],
      buttonText: "Choose Ultimate",
      buttonVariant: "secondary" as const,
      popular: false,
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Header */}
      <section className="bg-gradient-to-br from-primary/5 to-royal/5 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Choose Your Perfect Plan
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Unlock exclusive deals and save more with our membership plans. 
            Start with our free plan and upgrade anytime.
          </p>
        </div>
      </section>

      {/* Promotional Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
        <div className="flash-peacock rounded-2xl p-6 text-center text-white shadow-lg">
          <h3 className="text-2xl font-bold mb-2">🎉 Early Bird Offer!</h3>
          <p className="text-lg mb-2">Enjoy 1 Year Free Premium Plan – Limited Time Offer </p>
          <p className="text-sm opacity-90">New users only. </p>
        </div>
      </div>

      {/* Pricing Cards */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan) => {
              const Icon = plan.icon;
              return (
                <Card 
                  key={plan.name}
                  className={`relative ${plan.popular ? 'border-2 border-primary shadow-lg scale-105' : 'border border-gray-200'}`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-primary text-white px-4 py-1">
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="text-center">
                    <div className="w-12 h-12 mx-auto mb-4 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
                    <p className="text-gray-500 text-sm">{plan.description}</p>
                    
                    <div className="py-4">
                      <div className="flex items-center justify-center space-x-2">
                        {plan.originalPrice && (
                          <span className="text-lg text-gray-400 line-through">
                            {plan.originalPrice}
                          </span>
                        )}
                        <span className="text-4xl font-bold text-foreground">
                          {plan.price}
                        </span>
                        {plan.period && (
                          <span className="text-gray-500">{plan.period}</span>
                        )}
                      </div>
                      {plan.savings && (
                        <p className="text-sm text-success font-medium mt-1">
                          {plan.savings}
                        </p>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent>
                    <ul className="space-y-3">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <Check className="h-4 w-4 text-success mr-3 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  <CardFooter>
                    <Button 
                      className="w-full" 
                      variant={plan.buttonVariant}
                      asChild={plan.name !== "Basic"}
                      disabled={plan.name === "Basic"}
                    >
                      {plan.name === "Basic" ? (
                        <span>{plan.buttonText}</span>
                      ) : (
                        <Link href={isAuthenticated ? "/customer/dashboard" : "/signup"}>
                          {plan.buttonText}
                        </Link>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-card">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                What's included in the free promotional plan?
              </h3>
              <p className="text-muted-foreground">
                New users who sign up between August 15, 2025, and August 14, 2026, get a full year of Premium features absolutely free. This includes exclusive premium deals, early access to sales, digital membership card, and priority customer support.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Can I upgrade or downgrade my plan anytime?
              </h3>
              <p className="text-muted-foreground">
                Yes! You can upgrade your plan at any time. When you upgrade, you'll immediately get access to all the new features. Downgrades take effect at the end of your current billing cycle.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                What happens after my promotional period ends?
              </h3>
              <p className="text-muted-foreground">
                After your free Premium year ends on August 14, 2026, you'll be prompted to choose a paid plan. You can select any plan that fits your needs, or continue with our free Basic plan.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Are there any hidden fees?
              </h3>
              <p className="text-muted-foreground">
                No hidden fees! The prices you see are exactly what you'll pay. All plans include access to our mobile app, customer support, and all standard features listed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-primary/5 to-royal/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Ready to Start Saving?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of users who save money every day with Instoredealz
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link to="/signup">Start Free Today</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/customer/deals">Browse Deals</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
