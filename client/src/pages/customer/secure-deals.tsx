import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";
import SecureDealCard from "@/components/ui/secure-deal-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import {
  Filter,
  Grid,
  List,
  Crown,
  Star,
  ShoppingBag,
  TrendingUp,
  Users,
  Shield
} from "lucide-react";

export default function SecureDeals() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch deals with enhanced security
  const { data: deals, isLoading } = useQuery({
    queryKey: ["/api/deals", selectedCategory === "all" ? "" : selectedCategory],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory && selectedCategory !== "all") {
        params.append('category', selectedCategory);
      }
      
      const response = await fetch(`/api/deals?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch deals');
      return response.json();
    },
  });

  const { data: categories } = useQuery<Array<any>>({
    queryKey: ["/api/categories"],
  });

  // Claim deal mutation
  const claimDealMutation = useMutation({
    mutationFn: async (dealId: number) => {
      return await apiRequest(`/api/deals/${dealId}/claim`, "POST", {});
    },
    onSuccess: async (data: any, dealId) => {
      toast({
        title: "Deal Claimed Successfully!",
        description: data.message || "Visit the store and verify your PIN to complete the redemption and get your savings!",
      });
      
      // Refresh deal claims data
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["/api/deals"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/users/claims"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] }),
      ]);
    },
    onError: (error: any) => {
      toast({
        title: "Claim Failed",
        description: error.message || "Unable to claim this deal",
        variant: "destructive",
      });
    },
  });

  const handleClaimDeal = (dealId: number) => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please log in to claim deals",
        variant: "destructive",
      });
      return;
    }
    
    claimDealMutation.mutate(dealId);
  };

  // Get membership tier info
  const getMembershipInfo = () => {
    if (!user) return null;
    
    const tier = user.membershipPlan || 'basic';
    switch (tier) {
      case 'ultimate':
        return {
          name: 'Ultimate',
          icon: Crown,
          color: 'from-purple-500 to-pink-500',
          perks: ['All discount codes', 'Priority support', 'Exclusive deals']
        };
      case 'premium':
        return {
          name: 'Premium',
          icon: Star,
          color: 'from-blue-500 to-cyan-500',
          perks: ['Most discount codes', 'Early access', 'Better deals']
        };
      default:
        return {
          name: 'Basic',
          icon: ShoppingBag,
          color: 'from-gray-400 to-gray-600',
          perks: ['Limited access', 'Standard deals', 'Basic support']
        };
    }
  };

  const membershipInfo = getMembershipInfo();
  const filteredDeals = (deals as any[]) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading secure deals...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Secure Deals
              </h1>
              <p className="text-muted-foreground">
                Discover exclusive deals with tier-based discount code access
              </p>
            </div>
            
            {/* Membership status */}
            {isAuthenticated && membershipInfo && user && (
              <Card className="max-w-xs">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg bg-gradient-to-r ${membershipInfo.color}`}>
                      <membershipInfo.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold">{membershipInfo.name} Member</p>
                      <p className="text-sm text-muted-foreground">@{user.name}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-1">
                    {membershipInfo.perks.map((perk, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <Shield className="w-3 h-3 text-green-500" />
                        <span className="text-muted-foreground">{perk}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Filters and controls */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-500" />
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories?.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-1 border rounded-lg p-1">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>

            <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="w-4 h-4" />
              <span>{filteredDeals.length} deals available</span>
            </div>
          </div>

          {/* Tier-based access info */}
          {!isAuthenticated && (
            <Card className="mb-6 border-yellow-200 bg-yellow-50">
              <CardContent className="pt-6">
                <div className="text-center">
                  <Users className="w-12 h-12 mx-auto mb-3 text-yellow-600" />
                  <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                    Login to Access Discount Codes
                  </h3>
                  <p className="text-yellow-700 mb-4">
                    Sign in to view and claim exclusive discount codes based on your membership tier
                  </p>
                  <Button className="bg-yellow-600 hover:bg-yellow-700">
                    Login to Continue
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Deals grid/list */}
        {filteredDeals.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold text-muted-foreground mb-2">
                No Deals Found
              </h3>
              <p className="text-gray-500">
                {selectedCategory === "all" 
                  ? "No deals are currently available"
                  : `No deals found in the selected category`
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className={
            viewMode === "grid" 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              : "space-y-4"
          }>
            {filteredDeals.map((deal) => (
              <SecureDealCard
                key={deal.id}
                deal={deal}
                onClaim={handleClaimDeal}
                className={viewMode === "list" ? "flex" : ""}
              />
            ))}
          </div>
        )}

        {/* Membership upgrade CTA */}
        {isAuthenticated && user?.membershipPlan === 'basic' && (
          <Card className="mt-12 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <Crown className="w-12 h-12 mx-auto mb-3 text-blue-600" />
                <h3 className="text-xl font-semibold text-blue-800 mb-2">
                  Unlock More Deals
                </h3>
                <p className="text-blue-700 mb-4 max-w-2xl mx-auto">
                  Upgrade to Premium or Ultimate to access discount codes for all categories 
                  including Electronics, Health, Education and more premium deals.
                </p>
                <div className="flex gap-4 justify-center">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Star className="w-4 h-4 mr-2" />
                    Upgrade to Premium
                  </Button>
                  <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                    <Crown className="w-4 h-4 mr-2" />
                    Go Ultimate
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Footer />
    </div>
  );
}