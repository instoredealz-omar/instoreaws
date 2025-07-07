import { useState } from "react";

// Declare Razorpay for TypeScript
declare global {
  interface Window {
    Razorpay: any;
  }
}
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";
import { 
  Crown, 
  Check, 
  Star, 
  Shield, 
  Zap,
  ArrowLeft,
  Sparkles,
  Users,
  Target
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const membershipPlans = [
  {
    id: 'basic',
    name: 'Basic',
    price: 0,
    period: 'Forever',
    description: 'Get started with basic features',
    color: 'bg-gray-100 text-gray-800',
    icon: Users,
    features: [
      'Browse all deals',
      'Basic customer support',
      'Deal notifications',
      'Wishlist functionality'
    ],
    limitations: [
      'No discount codes',
      'Limited deal access',
      'No premium deals'
    ],
    popular: false
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 8999,
    period: 'year',
    description: 'Perfect for regular deal hunters',
    color: 'bg-blue-100 text-blue-800',
    icon: Star,
    features: [
      'All Basic features',
      'Access to discount codes',
      'Premium deals access',
      'Priority customer support',
      'Deal recommendations',
      'Early access to new deals'
    ],
    limitations: [
      'Some premium categories restricted'
    ],
    popular: true
  },
  {
    id: 'ultimate',
    name: 'Ultimate',
    price: 12999,
    period: 'year',
    description: 'For the ultimate deal experience',
    color: 'bg-purple-100 text-purple-800',
    icon: Crown,
    features: [
      'All Premium features',
      'Unlimited discount codes',
      'Access to all premium categories',
      'VIP customer support',
      'Exclusive ultimate deals',
      'Personal deal concierge',
      'Custom deal alerts',
      'Cashback on purchases'
    ],
    limitations: [],
    popular: false
  }
];

export default function UpgradeMembership() {
  const { user, updateUser } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const upgradeMutation = useMutation({
    mutationFn: async (planId: string) => {
      return await apiRequest(`/api/users/upgrade-membership`, "POST", {
        membershipPlan: planId
      });
    },
    onSuccess: (data, planId) => {
      updateUser({ membershipPlan: planId });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      
      toast({
        title: "Membership Upgraded!",
        description: `Welcome to ${membershipPlans.find(p => p.id === planId)?.name} membership!`,
      });
      
      setTimeout(() => {
        navigate("/customer/dashboard");
      }, 2000);
    },
    onError: (error: any) => {
      toast({
        title: "Upgrade Failed",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const handleUpgrade = (planId: string) => {
    if (planId === 'basic') {
      toast({
        title: "Already on Basic",
        description: "You're already on the basic plan.",
        variant: "destructive",
      });
      return;
    }

    if (user?.membershipPlan === planId) {
      toast({
        title: "Already Subscribed",
        description: `You're already on the ${planId} plan.`,
        variant: "destructive",
      });
      return;
    }

    const selectedPlanData = membershipPlans.find(p => p.id === planId);
    if (!selectedPlanData || selectedPlanData.price === 0) {
      // Free plan - direct upgrade
      setSelectedPlan(planId);
      upgradeMutation.mutate(planId);
      return;
    }

    // For paid plans, redirect to payment gateway
    setSelectedPlan(planId);
    initiatePayment(selectedPlanData);
  };

  const initiatePayment = (plan: any) => {
    // Check if Razorpay is loaded
    if (typeof window.Razorpay === 'undefined') {
      toast({
        title: "Payment Gateway Not Available",
        description: "Please refresh the page and try again.",
        variant: "destructive",
      });
      return;
    }

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_XXXXXXXXXXXXXXX', // Test key ID
      amount: plan.price * 100, // Amount in paise
      currency: 'INR',
      name: 'Instoredealz',
      description: `${plan.name} Membership Upgrade`,
      image: '/logo.png', // Your company logo
      handler: function (response: any) {
        // Payment successful
        toast({
          title: "Payment Successful!",
          description: "Processing your membership upgrade...",
        });
        
        // Call backend to verify payment and upgrade membership
        upgradeMutation.mutate(plan.id);
      },
      prefill: {
        name: user?.name || '',
        email: user?.email || '',
        contact: user?.phone || ''
      },
      notes: {
        membershipPlan: plan.id,
        userId: user?.id
      },
      theme: {
        color: '#3b82f6'
      },
      modal: {
        ondismiss: function() {
          toast({
            title: "Payment Cancelled",
            description: "Your membership upgrade was cancelled.",
            variant: "destructive",
          });
        }
      }
    };

    const razorpay = new window.Razorpay(options);
    razorpay.open();
  };

  const getCurrentPlanIndex = () => {
    return membershipPlans.findIndex(plan => plan.id === user?.membershipPlan) || 0;
  };

  const isCurrentPlan = (planId: string) => {
    return user?.membershipPlan === planId;
  };

  const isDowngrade = (planId: string) => {
    const currentIndex = getCurrentPlanIndex();
    const targetIndex = membershipPlans.findIndex(plan => plan.id === planId);
    return targetIndex < currentIndex;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <Button variant="outline" size="sm" asChild className="mr-4">
              <Link to="/customer/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <div className="flex items-center">
              <Crown className="h-8 w-8 text-purple-600 mr-3" />
              <h1 className="text-4xl font-bold text-foreground">Upgrade Your Membership</h1>
            </div>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Unlock exclusive deals, discount codes, and premium features with our membership plans
          </p>
          {user?.membershipPlan && (
            <div className="mt-4">
              <Badge className="bg-blue-100 text-blue-800 text-sm px-3 py-1">
                Current Plan: {membershipPlans.find(p => p.id === user.membershipPlan)?.name || 'Basic'}
              </Badge>
            </div>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {membershipPlans.map((plan, index) => {
            const IconComponent = plan.icon;
            const isCurrent = isCurrentPlan(plan.id);
            const isDowngradeOption = isDowngrade(plan.id);
            
            return (
              <Card 
                key={plan.id} 
                className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg ${
                  plan.popular ? 'border-2 border-blue-500 shadow-lg' : ''
                } ${isCurrent ? 'ring-2 ring-green-500' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute top-0 left-0 right-0 bg-blue-500 text-white text-center py-2 text-sm font-medium">
                    Most Popular
                  </div>
                )}
                {isCurrent && (
                  <div className="absolute top-0 left-0 right-0 bg-green-500 text-white text-center py-2 text-sm font-medium">
                    Current Plan
                  </div>
                )}

                <CardHeader className={`text-center ${plan.popular || isCurrent ? 'pt-12' : 'pt-6'}`}>
                  <div className="flex items-center justify-center mb-4">
                    <div className={`p-3 rounded-full ${plan.color}`}>
                      <IconComponent className="h-8 w-8" />
                    </div>
                  </div>
                  <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                  <div className="text-3xl font-bold text-foreground">
                    ₹{plan.price}
                    {plan.price > 0 && <span className="text-sm font-normal text-muted-foreground">/{plan.period}</span>}
                  </div>
                  <p className="text-muted-foreground">{plan.description}</p>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Features */}
                  <div>
                    <h4 className="font-semibold text-foreground mb-3">What's included:</h4>
                    <ul className="space-y-2">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center">
                          <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Limitations */}
                  {plan.limitations.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-foreground mb-3">Limitations:</h4>
                      <ul className="space-y-2">
                        {plan.limitations.map((limitation, limitIndex) => (
                          <li key={limitIndex} className="flex items-center">
                            <div className="h-4 w-4 border border-gray-300 rounded mr-3 flex-shrink-0" />
                            <span className="text-sm text-gray-500">{limitation}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <Separator />

                  {/* Action Button */}
                  <Button
                    className={`w-full ${
                      isCurrent 
                        ? 'bg-green-500 hover:bg-green-600' 
                        : isDowngradeOption
                        ? 'bg-gray-500 hover:bg-gray-600'
                        : plan.popular
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : 'bg-gray-900 hover:bg-gray-800'
                    }`}
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={isCurrent || upgradeMutation.isPending}
                  >
                    {upgradeMutation.isPending && selectedPlan === plan.id ? (
                      "Upgrading..."
                    ) : isCurrent ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Current Plan
                      </>
                    ) : isDowngradeOption ? (
                      "Downgrade"
                    ) : (
                      <>
                        <Zap className="h-4 w-4 mr-2" />
                        {plan.price === 0 ? 'Keep Free' : `Upgrade to ${plan.name}`}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Benefits Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-center flex items-center justify-center">
              <Sparkles className="h-6 w-6 mr-2 text-purple-600" />
              Why Upgrade?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div>
                <Shield className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Exclusive Access</h3>
                <p className="text-muted-foreground text-sm">Get access to discount codes and premium deals that save you money</p>
              </div>
              <div>
                <Target className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Personalized Experience</h3>
                <p className="text-muted-foreground text-sm">Receive tailored deal recommendations based on your preferences</p>
              </div>
              <div>
                <Crown className="h-12 w-12 text-purple-500 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">VIP Treatment</h3>
                <p className="text-muted-foreground text-sm">Priority support and early access to the best deals before anyone else</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold">Can I cancel my membership anytime?</h4>
              <p className="text-muted-foreground text-sm">Yes, you can cancel your membership at any time. You'll continue to have access until the end of your billing period.</p>
            </div>
            <div>
              <h4 className="font-semibold">What happens to my discount codes if I downgrade?</h4>
              <p className="text-muted-foreground text-sm">Any discount codes you've already accessed will remain valid, but you won't be able to access new ones without the required membership level.</p>
            </div>
            <div>
              <h4 className="font-semibold">Are there any setup fees?</h4>
              <p className="text-muted-foreground text-sm">No, there are no setup fees. You only pay the monthly subscription price for your chosen plan.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}