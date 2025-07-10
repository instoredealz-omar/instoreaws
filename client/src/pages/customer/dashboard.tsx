import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";
import MembershipCard from "@/components/ui/membership-card";
import DealCard from "@/components/ui/deal-card";
import Tutorial from "@/components/ui/tutorial";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { Link, useLocation } from "wouter";
import { 
  Ticket, 
  PiggyBank, 
  Heart, 
  Trophy, 
  TrendingUp,
  Clock,
  MapPin,
  Gift,
  BookOpen,
  Navigation
} from "lucide-react";

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { data: userDetails } = useQuery({
    queryKey: ["/api/auth/me"],
  });

  const { data: claims } = useQuery({
    queryKey: ["/api/users/claims"],
  });

  const { data: featuredDeals } = useQuery({
    queryKey: ["/api/deals"],
  });

  if (!user) return null;

  const currentUser = userDetails || user;
  // Sort claims by most recent first (claimedAt timestamp) before taking the first 5
  const recentClaims = claims
    ?.sort((a: any, b: any) => new Date(b.claimedAt).getTime() - new Date(a.claimedAt).getTime())
    ?.slice(0, 5) || [];
  const topDeals = featuredDeals?.slice(0, 4) || [];

  const stats = [
    {
      title: "Deals Claimed",
      value: currentUser.dealsClaimed || 0,
      icon: Ticket,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      title: "Money Saved",
      value: `₹${parseFloat(currentUser.totalSavings || "0").toLocaleString('en-IN')}`,
      icon: PiggyBank,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      title: "Favorite Category",
      value: "Fashion",
      icon: Heart,
      color: "text-saffron",
      bgColor: "bg-saffron/10",
    },
    {
      title: "City Rank",
      value: "#12",
      icon: Trophy,
      color: "text-royal",
      bgColor: "bg-royal/10",
    },
  ];

  const handleViewDeal = (dealId: number) => {
    navigate(`/deals/${dealId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Welcome Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Welcome back, {currentUser.name}!
              </h1>
              <p className="text-muted-foreground mt-1">
                Your savings dashboard is ready. Discover new deals and track your progress.
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Tutorial type="customer" />
              <Button variant="outline" size="sm" asChild>
                <Link to="/customer/deals">
                  <Ticket className="h-4 w-4 mr-2" />
                  Browse Deals
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Promotional Banner for promotional users */}
        {currentUser.isPromotionalUser && (
          <div className="mb-6">
            <div className="promotional-banner rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold mb-2 flex items-center">
                    <Gift className="h-5 w-5 mr-2" />
                    🎉 You're on our Free Premium Plan!
                  </h3>
                  <p className="text-green-100">
                    Enjoy all Premium features until {new Date(currentUser.membershipExpiry).toLocaleDateString('en-IN')}
                  </p>
                </div>
                <Button variant="secondary" asChild>
                  <Link to="/customer/upgrade">Upgrade Now</Link>
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Membership Card */}
          <div className="lg:col-span-1">
            <MembershipCard
              userName={currentUser.name}
              membershipId={`ISD-2024-${String(currentUser.id).padStart(3, '0')}`}
              membershipPlan={currentUser.membershipPlan}
              expiryDate={currentUser.membershipExpiry}
              totalSavings={currentUser.totalSavings || "0"}
              isPromotionalUser={currentUser.isPromotionalUser}
              userId={currentUser.id}
            />
          </div>
          
          {/* Right Column - Stats Grid */}
          <div className="lg:col-span-2">
            <div className="grid md:grid-cols-2 gap-4">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                const gradientClasses = [
                  'bg-gradient-to-br from-blue-400 to-blue-600',
                  'bg-gradient-to-br from-green-400 to-green-600', 
                  'bg-gradient-to-br from-pink-400 to-pink-600',
                  'bg-gradient-to-br from-purple-400 to-purple-600'
                ];
                const gradientClass = gradientClasses[index % gradientClasses.length];
                
                return (
                  <div key={stat.title} className={`${gradientClass} rounded-xl p-6 shadow-lg transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-xl`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white/90 text-sm font-medium">{stat.title}</p>
                        <p className="text-3xl font-bold text-white mt-2">{stat.value}</p>
                      </div>
                      <div className="bg-card/20 p-3 rounded-full backdrop-blur-sm">
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recent Claims History */}
        <div className="mt-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl">Recent Claims</CardTitle>
              <Button variant="outline" asChild>
                <Link to="/customer/claims">View All</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {recentClaims.length > 0 ? (
                <div className="space-y-4">
                  {recentClaims.map((claim: any) => (
                    <div key={claim.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-4">
                        {claim.deal?.imageUrl && (
                          <img 
                            src={claim.deal.imageUrl} 
                            alt={claim.deal.title}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        )}
                        <div>
                          <p className="font-medium text-foreground">
                            {claim.deal?.title || "Deal not available"}
                          </p>
                          <div className="flex items-center text-sm text-gray-500 space-x-4">
                            <span className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {new Date(claim.claimedAt).toLocaleDateString('en-IN')}
                            </span>
                            {claim.vendor && (
                              <span className="flex items-center">
                                <MapPin className="h-3 w-3 mr-1" />
                                {claim.vendor.city}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-success">
                          {claim.actualSavings && parseFloat(claim.actualSavings) > 0 ? (
                            `Saved ₹${parseFloat(claim.actualSavings).toLocaleString('en-IN')}`
                          ) : claim.savingsAmount && parseFloat(claim.savingsAmount) > 0 ? (
                            `Saved ₹${parseFloat(claim.savingsAmount).toLocaleString('en-IN')}`
                          ) : (
                            'Add bill amount'
                          )}
                        </p>
                        <Badge 
                          variant={claim.status === "used" ? "default" : "secondary"}
                          className="mt-1"
                        >
                          {claim.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Ticket className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No claims yet</h3>
                  <p className="text-muted-foreground mb-4">Start claiming deals to see your history here</p>
                  <Button asChild>
                    <Link to="/customer/deals">Browse Deals</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Featured Deals */}
        {topDeals.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-foreground flex items-center">
                <TrendingUp className="h-6 w-6 mr-2 text-saffron" />
                Trending Deals
              </h2>
              <Button variant="outline" asChild>
                <Link to="/customer/deals">View All Deals</Link>
              </Button>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {topDeals.map((deal: any) => (
                <DealCard
                  key={deal.id}
                  {...deal}
                  onView={() => handleViewDeal(deal.id)}
                  onClaim={() => handleViewDeal(deal.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">Quick Actions</h2>
          <div className="grid md:grid-cols-4 gap-4">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/customer/deals")}>
              <CardContent className="p-4 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Ticket className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Browse Deals</h3>
                <p className="text-sm text-muted-foreground">Discover new deals in your city</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/customer/nearby-deals")}>
              <CardContent className="p-4 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Navigation className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Nearby Deals</h3>
                <p className="text-sm text-muted-foreground">Find deals close to your location</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/customer/claims")}>
              <CardContent className="p-4 text-center">
                <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <PiggyBank className="h-6 w-6 text-success" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">My Savings</h3>
                <p className="text-sm text-muted-foreground">Track your savings history</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/customer/upgrade")}>
              <CardContent className="p-4 text-center">
                <div className="w-12 h-12 bg-royal/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Trophy className="h-6 w-6 text-royal" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Upgrade Plan</h3>
                <p className="text-sm text-muted-foreground">Get more exclusive deals</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
