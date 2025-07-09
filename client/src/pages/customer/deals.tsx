import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";
import DealCard from "@/components/ui/deal-card";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation, Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth, hasMembershipLevel } from "@/lib/auth";
import { 
  Search, 
  Filter, 
  Loader2,
  MapPin
} from "lucide-react";



export default function CustomerDeals() {
  const [selectedCity, setSelectedCity] = useState("Mumbai");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [location] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Parse URL parameters and handle page navigation
  useEffect(() => {
    const urlParams = new URLSearchParams(location.split('?')[1] || '');
    const category = urlParams.get('category');
    const highlight = urlParams.get('highlight');
    
    if (category) {
      setSelectedCategory(category);
    }
    
    if (highlight) {
      // Scroll to highlighted deal after component mounts
      setTimeout(() => {
        const element = document.getElementById(`deal-${highlight}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('animate-pulse');
          setTimeout(() => element.classList.remove('animate-pulse'), 2000);
        }
      }, 500);
    } else {
      // Scroll to top when navigating normally (no highlight)
      window.scrollTo(0, 0);
    }
  }, [location]);



  const { data: deals = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/deals", selectedCity, selectedCategory === "all" ? "" : selectedCategory],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCity) params.append('city', selectedCity);
      if (selectedCategory && selectedCategory !== "all") params.append('category', selectedCategory);
      
      const response = await fetch(`/api/deals?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch deals');
      return response.json();
    },
  });

  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ["/api/categories"],
  });

  const { data: wishlist = [] } = useQuery<any[]>({
    queryKey: ["/api/wishlist"],
    enabled: !!user,
  });

  const addToWishlistMutation = useMutation({
    mutationFn: async (dealId: number) => {
      return apiRequest('/api/wishlist', 'POST', { dealId });
    },
    onSuccess: () => {
      toast({
        title: "Added to favorites!",
        description: "You can view your favorites in your dashboard.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to add to favorites",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const removeFromWishlistMutation = useMutation({
    mutationFn: async (dealId: number) => {
      return apiRequest(`/api/wishlist/${dealId}`, 'DELETE');
    },
    onSuccess: () => {
      toast({
        title: "Removed from favorites",
        description: "Deal removed from your favorites.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to remove from favorites",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const claimDealMutation = useMutation({
    mutationFn: async (dealId: number) => {
      return apiRequest(`/api/deals/${dealId}/claim`, 'POST');
    },
    onSuccess: async (data: any) => {
      toast({
        title: "Deal Claimed Successfully!",
        description: data?.savingsAmount 
          ? `You saved ₹${data.savingsAmount}! Total savings: ₹${data.newTotalSavings}` 
          : "You can view your claimed deals in your dashboard.",
      });
      
      // Comprehensive data refresh to update user profile and deal listings
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["/api/deals"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/users/claims"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] }),
      ]);
      
      // Force refetch user data to update dashboard statistics
      queryClient.refetchQueries({ queryKey: ["/api/auth/me"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to claim deal",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });



  const handleClaimDeal = async (deal: any) => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Please login to claim deals.",
        variant: "destructive",
      });
      return;
    }

    // Check membership requirements
    if (!hasMembershipLevel(user, deal.requiredMembership)) {
      toast({
        title: "Upgrade required",
        description: `This deal requires ${deal.requiredMembership} membership or higher.`,
        variant: "destructive",
      });
      return;
    }

    claimDealMutation.mutate(deal.id);
  };

  const handleToggleFavorite = (dealId: number) => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Please login to add favorites.",
        variant: "destructive",
      });
      return;
    }

    const isInWishlist = wishlist?.some((item: any) => item.dealId === dealId);
    
    if (isInWishlist) {
      removeFromWishlistMutation.mutate(dealId);
    } else {
      addToWishlistMutation.mutate(dealId);
    }
  };

  // Filter and sort deals with alphabet-based search
  const filteredDeals = deals?.filter((deal: any) => {
    if (searchQuery === "") return true;
    
    const query = searchQuery.toLowerCase().trim();
    
    // Alphabet-based filtering - check if title starts with the search query
    const titleStartsWith = deal.title.toLowerCase().startsWith(query);
    const businessNameStartsWith = deal.vendor?.businessName.toLowerCase().startsWith(query);
    
    // Also include partial matches for better UX
    const titleIncludes = deal.title.toLowerCase().includes(query);
    const descriptionIncludes = deal.description.toLowerCase().includes(query);
    const businessNameIncludes = deal.vendor?.businessName.toLowerCase().includes(query);
    
    // Prioritize exact alphabet matches, but also include partial matches
    return titleStartsWith || businessNameStartsWith || titleIncludes || descriptionIncludes || businessNameIncludes;
  }) || [];

  // Sort filtered deals with alphabet-priority ordering
  const sortedDeals = [...filteredDeals].sort((a: any, b: any) => {
    // If there's a search query, prioritize alphabet matches first
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase().trim();
      const aStartsWithTitle = a.title.toLowerCase().startsWith(query);
      const bStartsWithTitle = b.title.toLowerCase().startsWith(query);
      const aStartsWithBusiness = a.vendor?.businessName.toLowerCase().startsWith(query);
      const bStartsWithBusiness = b.vendor?.businessName.toLowerCase().startsWith(query);
      
      // Prioritize deals that start with the search query
      if ((aStartsWithTitle || aStartsWithBusiness) && !(bStartsWithTitle || bStartsWithBusiness)) return -1;
      if (!(aStartsWithTitle || aStartsWithBusiness) && (bStartsWithTitle || bStartsWithBusiness)) return 1;
    }
    
    // Then apply regular sorting
    switch (sortBy) {
      case "discount":
        return b.discountPercentage - a.discountPercentage;
      case "popular":
        return b.viewCount - a.viewCount;
      case "ending":
        return new Date(a.validUntil).getTime() - new Date(b.validUntil).getTime();
      default: // newest
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar selectedCity={selectedCity} onCityChange={setSelectedCity} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-3">
            Discover Amazing Deals
          </h1>
          <div className="flex items-center text-muted-foreground">
            <MapPin className="h-4 w-4 mr-1" />
            <span>Showing deals in {selectedCity}</span>
            {selectedCategory && selectedCategory !== "all" && (
              <>
                <span className="mx-2">•</span>
                <Badge variant="secondary" className="capitalize">
                  {selectedCategory}
                </Badge>
              </>
            )}
          </div>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid md:grid-cols-5 gap-3">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search deals, vendors..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories?.map((category: any) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="discount">Highest Discount</SelectItem>
                  <SelectItem value="popular">Most Popular</SelectItem>
                  <SelectItem value="ending">Ending Soon</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() => {
                  setSelectedCategory("all");
                  setSearchQuery("");
                  setSortBy("newest");
                }}
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Deals Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading deals...</span>
          </div>
        ) : sortedDeals.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedDeals.map((deal: any) => {
              const isInWishlist = wishlist?.some((item: any) => item.dealId === deal.id);
              return (
                <div key={deal.id} id={`deal-${deal.id}`}>
                  <DealCard
                    {...deal}
                    isFavorite={isInWishlist}
                    onClaim={() => handleClaimDeal(deal)}
                    onToggleFavorite={() => handleToggleFavorite(deal.id)}
                    onView={() => {
                      window.location.href = `/deals/${deal.id}`;
                    }}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">No deals found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || (selectedCategory && selectedCategory !== "all")
                  ? "Try adjusting your search or filters"
                  : `No deals available in ${selectedCity} right now`
                }
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedCategory("all");
                  setSearchQuery("");
                }}
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Loading overlay for claim mutation */}
        {claimDealMutation.isPending && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card>
              <CardContent className="p-4 flex items-center space-x-3">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span>Claiming deal...</span>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
