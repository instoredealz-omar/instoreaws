import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";

import { Link } from "wouter";
import { 
  TrendingUp, 
  BarChart3, 
  Eye, 
  DollarSign, 
  Zap, 
  Users, 
  Target,
  CheckCircle,
  ArrowRight,
  Star,
  Clock,
  Shield,
  IndianRupee
} from "lucide-react";

export default function VendorBenefits() {
  const benefits = [
    {
      icon: Users,
      title: "Increased Footfall",
      description: "Drive more customers to your physical store location",
      details: "Attract nearby customers actively looking for deals in your area"
    },
    {
      icon: BarChart3,
      title: "Performance Analytics Dashboard",
      description: "Track your discount campaigns and customer engagement",
      details: "Monitor deal performance, customer demographics, and ROI metrics"
    },
    {
      icon: Eye,
      title: "GPS-based Store Visibility",
      description: "Be discovered by nearby customers automatically",
      details: "Location-based discovery helps customers find your deals when they're close"
    },
    {
      icon: Shield,
      title: "Secure PIN Verification",
      description: "Protect your business with verified redemptions",
      details: "PIN-based verification ensures only genuine customers redeem deals"
    },
    {
      icon: Zap,
      title: "Easy Deal Setup",
      description: "Create and manage discounts with simple tools",
      details: "User-friendly interface to create compelling deals in minutes"
    },
    {
      icon: Target,
      title: "Targeted Customer Reach",
      description: "Connect with customers actively seeking deals",
      details: "Reach motivated buyers who are ready to make purchases"
    }
  ];

  const howItWorks = [
    {
      step: "1",
      title: "Sign Up & Get Verified",
      description: "Register your business and complete our quick verification process"
    },
    {
      step: "2", 
      title: "Create Your Deals",
      description: "Set up attractive discounts and special offers for your products or services"
    },
    {
      step: "3",
      title: "Customers Discover & Claim",
      description: "Local customers find your deals and visit your store to redeem them"
    },
    {
      step: "4",
      title: "Track & Optimize",
      description: "Monitor performance and adjust your deals for maximum impact"
    }
  ];

  const stats = [
    { value: "95%", label: "Increase in foot traffic" },
    { value: "50+", label: "Cities covered" },
    { value: "10,000+", label: "Active customers" },
    { value: "₹0", label: "Platform fees" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
                  <section className="bg-gradient-to-br from-green-600 to-green-700 text-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
                      <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div>
                          <h1 className="text-4xl lg:text-5xl font-bold mb-6">
                            Drive More Foot Traffic With Exclusive In-Store Deals
                          </h1>
                          <p className="text-xl text-green-100 mb-8">
                            Join our vendor network and reach high-intent customers. 
                            Increase sales with zero commission fees.
                          </p>
                          <div className="flex flex-col sm:flex-row gap-4 mb-8">
                            <Button size="lg" variant="secondary" asChild>
                              <Link to="/vendor/register">
                                Become a Vendor
                                <ArrowRight className="ml-2 h-5 w-5" />
                              </Link>
                            </Button>
              </div>
              <div className="flex items-center text-green-200">
                <TrendingUp className="h-5 w-5 mr-2" />
                <span>Average 95% increase in foot traffic</span>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="bg-card/10 backdrop-blur-sm rounded-2xl p-8">
                <div className="bg-card rounded-lg p-6 shadow-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-800">Store Analytics</h3>
                    <Badge variant="secondary">Live</Badge>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Today's Visitors</span>
                      <span className="font-bold text-green-600">+127</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Deal Claims</span>
                      <span className="font-bold text-blue-600">23</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Revenue</span>
                      <span className="font-bold text-purple-600">₹12,450</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-foreground mb-2">
                  {stat.value}
                </div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vendor Benefits Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Vendor Benefits</h2>
            <p className="text-xl text-muted-foreground">
              Everything you need to grow your business and attract more customers
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-8">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-6">
                      <Icon className="h-6 w-6 text-green-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-3">
                      {benefit.title}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {benefit.description}
                    </p>
                    <p className="text-sm text-gray-500">
                      {benefit.details}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground">
              Get started in 4 simple steps
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-green-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                  {step.step}
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  {step.title}
                </h3>
                <p className="text-muted-foreground">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-6">
                Why Choose InstoreDealz?
              </h2>
              <div className="space-y-4">
                <div className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-green-600 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-foreground">No Setup Fees</h4>
                    <p className="text-muted-foreground">Get started completely free with no hidden charges</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-green-600 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-foreground">Real-time Analytics</h4>
                    <p className="text-muted-foreground">Track performance and customer engagement instantly</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-green-600 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-foreground">24/7 Support</h4>
                    <p className="text-muted-foreground">Get help whenever you need it from our dedicated team</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-green-600 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-foreground">Easy Integration</h4>
                    <p className="text-muted-foreground">Simple setup that works with your existing systems</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-card border rounded-2xl p-8 shadow-sm">
              <div className="text-center">
                <Star className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Trusted by 1000+ Vendors
                </h3>
                <p className="text-muted-foreground mb-6">
                  Join successful businesses already growing with InstoreDealz
                </p>
                <div className="flex items-center justify-center space-x-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-500 fill-current" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">4.8/5 average rating</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-green-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Grow Your Business?
          </h2>
          <p className="text-xl text-green-100 mb-8">
            Join thousands of vendors already increasing their foot traffic and sales
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link to="/vendor/register">
                Start Free Today
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-white border-white hover:bg-card hover:text-green-700">
              Schedule Demo
            </Button>
          </div>
          <p className="text-sm text-green-200 mt-4">
            <Clock className="h-4 w-4 inline mr-1" />
            Setup takes less than 10 minutes
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}