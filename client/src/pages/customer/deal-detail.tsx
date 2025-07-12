import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Heart,
  MapPin,
  Clock,
  Store,
  Eye,
  EyeOff,
  Shield,
  Copy,
  Crown,
  Zap,
  Lock,
  ArrowLeft,
  Calendar,
  Tag,
  Percent,
  Users,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { Link } from "wouter";
import { PinVerificationDialog } from "@/components/ui/pin-verification-dialog";

interface Deal {
  id: number;
  title: string;
  description: string;
  category: string;
  originalPrice: string;
  discountedPrice: string;
  discountPercentage: number;
  validUntil: string;
  isActive: boolean;
  isApproved: boolean;
  requiredMembership: string;
  verificationPin?: string;
  maxRedemptions?: number;
  currentRedemptions?: number;
  viewCount?: number;
  imageUrl?: string;
  vendor?: {
    id: number;
    businessName: string;
    city: string;
    address: string;
  };
}



interface DiscountError {
  message: string;
  requiresUpgrade: boolean;
  currentTier: string;
  suggestedTier: string;
}

const membershipColors = {
  basic: "bg-gray-100 text-gray-800",
  premium: "bg-blue-100 text-blue-800",
  ultimate: "bg-purple-100 text-purple-800",
};

const categoryColors = {
  electronics: "bg-blue-100 text-blue-800",
  fashion: "bg-pink-100 text-pink-800",
  food: "bg-green-100 text-green-800",
  restaurants: "bg-orange-100 text-orange-800",
  travel: "bg-indigo-100 text-indigo-800",
  health: "bg-red-100 text-red-800",
  education: "bg-yellow-100 text-yellow-800",
  entertainment: "bg-purple-100 text-purple-800",
};

interface DealDetailProps {
  params?: { id: string };
}

export default function DealDetail({ params }: DealDetailProps) {
  const id = params?.id;
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  

  const [isFavorite, setIsFavorite] = useState(false);
  const [showPinDialog, setShowPinDialog] = useState(false);

  // Always fetch public deal details as fallback
  const { data: deal, isLoading: isPublicLoading } = useQuery<Deal>({
    queryKey: [`/api/deals/${id}`],
    enabled: !!id,
  });

  // Check if deal is in wishlist
  const { data: wishlistCheck } = useQuery<{ inWishlist: boolean }>({
    queryKey: [`/api/wishlist/check/${id}`],
    enabled: !!id && isAuthenticated,
  });

  // Try to fetch secure deal details with membership verification (for authenticated users)
  const { data: secureDeal, error: secureError, isLoading: isSecureLoading } = useQuery<Deal & { hasAccess: boolean; membershipTier: string }>({
    queryKey: [`/api/deals/${id}/secure`],
    enabled: !!id && isAuthenticated,
    retry: false,
  });

  // Check membership access error
  const membershipError = secureError && 'response' in secureError 
    ? (secureError as any).response?.data as DiscountError 
    : null;

  // Use secure deal data if available and successful, otherwise fall back to public deal data
  const currentDeal = isAuthenticated && secureDeal ? secureDeal : deal;
  const currentLoading = isAuthenticated ? isSecureLoading && isPublicLoading : isPublicLoading;

  useEffect(() => {
    if (wishlistCheck?.inWishlist) {
      setIsFavorite(true);
    }
  }, [wishlistCheck]);

  // Increment view count when component mounts
  useEffect(() => {
    if (currentDeal && id) {
      apiRequest(`/api/deals/${id}/view`, "POST", {}).then(() => {
        // Refresh deal data after view increment
        queryClient.invalidateQueries({ queryKey: [`/api/deals/${id}`] });
      }).catch(() => {
        // Silently fail view tracking
      });
    }
  }, [currentDeal, id]);



  // Claim deal mutation
  const claimDealMutation = useMutation({
    mutationFn: async (dealId: number) => {
      return await apiRequest(`/api/deals/${dealId}/claim`, "POST", {});
    },
    onSuccess: async (data: any) => {
      toast({
        title: "Deal Claimed Successfully!",
        description: data.message || "Visit the store and verify your PIN to complete the redemption and get your savings!",
      });
      
      // Refresh deal claims data
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["/api/deals"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/users/claims"] }),
        queryClient.invalidateQueries({ queryKey: [`/api/deals/${id}`] }),
        queryClient.invalidateQueries({ queryKey: [`/api/deals/${id}/secure`] }),
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

  // Wishlist mutations
  const addToWishlistMutation = useMutation({
    mutationFn: async (dealId: number) => {
      return await apiRequest("/api/wishlist", "POST", { dealId });
    },
    onSuccess: () => {
      setIsFavorite(true);
      toast({
        title: "Added to Wishlist",
        description: "Deal saved to your wishlist",
      });
    },
  });

  const removeFromWishlistMutation = useMutation({
    mutationFn: async (dealId: number) => {
      return await apiRequest(`/api/wishlist/${dealId}`, "DELETE");
    },
    onSuccess: () => {
      setIsFavorite(false);
      toast({
        title: "Removed from Wishlist",
        description: "Deal removed from your wishlist",
      });
    },
  });

  const handleToggleFavorite = () => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please log in to add deals to wishlist",
        variant: "destructive",
      });
      return;
    }

    if (isFavorite) {
      removeFromWishlistMutation.mutate(deal!.id);
    } else {
      addToWishlistMutation.mutate(deal!.id);
    }
  };

  const handleClaimDeal = () => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please log in to claim deals",
        variant: "destructive",
      });
      return;
    }
    
    claimDealMutation.mutate(currentDeal!.id);
  };



  const canAccessDeal = () => {
    if (!user || !currentDeal) return false;
    
    // If deal requires basic membership or no specific membership, everyone can access
    if (!currentDeal.requiredMembership || currentDeal.requiredMembership === 'basic') {
      return true;
    }
    
    const membershipLevels = { basic: 1, premium: 2, ultimate: 3 };
    const userLevel = membershipLevels[user.membershipPlan as keyof typeof membershipLevels] || 1;
    const requiredLevel = membershipLevels[currentDeal.requiredMembership as keyof typeof membershipLevels] || 1;
    
    return userLevel >= requiredLevel;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (currentLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="p-6 flex items-center space-x-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span>Loading deal details...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentDeal) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Deal Not Found</h2>
            <p className="text-muted-foreground mb-4">The deal you're looking for doesn't exist.</p>
            <Link to="/customer/deals">
              <Button>Back to Deals</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isExpired = new Date(currentDeal.validUntil) < new Date();
  const isFullyRedeemed = currentDeal.maxRedemptions && (currentDeal.currentRedemptions || 0) >= currentDeal.maxRedemptions;

  // Enhanced back button handler
  const handleGoBack = () => {
    // Always redirect to home page to ensure consistent navigation
    setLocation('/');
  };

  // Show login prompt for unauthenticated users
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          {/* Back button */}
          <div className="mb-6">
            <Button 
              variant="ghost" 
              className="mb-4"
              onClick={handleGoBack}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>

          {/* Login Required Message */}
          <div className="max-w-2xl mx-auto">
            <Card className="border-teal-200 dark:border-teal-800 bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/30 dark:to-cyan-900/30 shadow-xl">
              <CardContent className="p-12 text-center">
                <div className="mb-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full blur-sm opacity-20"></div>
                    <Lock className="h-16 w-16 text-gradient bg-gradient-to-r from-yellow-500 to-amber-600 bg-clip-text text-transparent mx-auto mb-4 relative z-10" style={{color: '#d97706'}} />
                  </div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-teal-700 to-cyan-800 dark:from-teal-300 dark:to-cyan-300 bg-clip-text text-transparent mb-2">
                    Login Required to View Deal
                  </h2>
                  <p className="text-teal-700 dark:text-teal-300 text-lg">
                    Please log in or sign up to access deal details and exclusive offers
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button asChild size="lg" className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white shadow-lg">
                      <Link to="/login">
                        <Shield className="w-4 h-4 mr-2" />
                        Login
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="border-2 border-amber-400 dark:border-amber-600 text-amber-600 dark:text-amber-400 hover:bg-gradient-to-r hover:from-yellow-50 hover:to-amber-50 dark:hover:from-amber-900/30 dark:hover:to-yellow-900/30 shadow-md">
                      <Link to="/signup">
                        <Users className="w-4 h-4 mr-2" />
                        Sign Up
                      </Link>
                    </Button>
                  </div>
                  
                  <div className="mt-6 pt-6 border-t border-teal-200 dark:border-teal-800">
                    <p className="text-amber-700 dark:text-amber-300 font-semibold text-sm bg-gradient-to-r from-yellow-600 to-amber-700 dark:from-yellow-400 dark:to-amber-400 bg-clip-text text-transparent">
                      <strong>Why create an account?</strong>
                    </p>
                    <ul className="text-teal-700 dark:text-teal-300 text-sm mt-2 space-y-2">
                      <li className="flex items-center">
                        <span className="w-2 h-2 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full mr-2"></span>
                        Access exclusive deals and discounts
                      </li>
                      <li className="flex items-center">
                        <span className="w-2 h-2 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full mr-2"></span>
                        Save deals to your wishlist
                      </li>
                      <li className="flex items-center">
                        <span className="w-2 h-2 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full mr-2"></span>
                        Track your savings and claimed deals
                      </li>
                      <li className="flex items-center">
                        <span className="w-2 h-2 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full mr-2"></span>
                        Get personalized deal recommendations
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Back button */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            className="mb-4"
            onClick={handleGoBack}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Deal Image */}
          <div className="relative">
            <Card className="overflow-hidden">
              {currentDeal.imageUrl ? (
                <img
                  src={currentDeal.imageUrl}
                  alt={currentDeal.title}
                  className="w-full h-96 object-cover"
                />
              ) : (
                <div className="w-full h-96 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <Store className="w-24 h-24 text-gray-400" />
                </div>
              )}
              
              {/* Discount overlay */}
              <div className="absolute top-4 left-4">
                <Badge className="bg-red-500 text-white text-xl font-bold px-4 py-2">
                  {currentDeal.discountPercentage}% OFF
                </Badge>
              </div>

              {/* Favorite button */}
              <button
                onClick={handleToggleFavorite}
                className="absolute top-4 right-4 p-2 rounded-full bg-card/90 backdrop-blur-sm hover:bg-card transition-all duration-200"
              >
                <Heart 
                  className={`h-5 w-5 transition-colors duration-200 ${
                    isFavorite ? 'fill-red-500 text-red-500' : 'text-muted-foreground hover:text-red-500'
                  }`} 
                />
              </button>
            </Card>
          </div>

          {/* Deal Information */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-2xl mb-2">{currentDeal.title}</CardTitle>
                    <p className="text-muted-foreground mb-4">{currentDeal.description}</p>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge className={categoryColors[currentDeal.category as keyof typeof categoryColors] || "bg-gray-100 text-gray-800"}>
                        {currentDeal.category}
                      </Badge>
                      <Badge className={membershipColors[currentDeal.requiredMembership as keyof typeof membershipColors]}>
                        {currentDeal.requiredMembership}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Discount Info */}
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-bold text-green-600">{currentDeal.discountPercentage}% OFF</span>
                    <span className="text-sm text-muted-foreground">on total bill</span>
                  </div>
                  <Badge variant="secondary" className="text-sm">
                    Subscription Discount
                  </Badge>
                </div>

                <Separator />

                {/* Action Buttons - Moved above validity section */}
                <div className="space-y-4">
                  {/* Unified PIN Verification to Claim Deal Button */}
                  {canAccessDeal() ? (
                    <Button
                      onClick={() => setShowPinDialog(true)}
                      disabled={isExpired || !!isFullyRedeemed || !deal?.isActive}
                      className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white"
                      size="lg"
                    >
                      {isExpired ? (
                        "Deal Expired"
                      ) : isFullyRedeemed ? (
                        "Fully Redeemed"
                      ) : (
                        <>
                          <Shield className="w-4 h-4 mr-2" />
                          Verify with PIN to Claim Deal
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => setLocation('/customer/upgrade')}
                      className={`w-full ${
                        deal?.requiredMembership === 'ultimate' 
                          ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700' 
                          : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'
                      }`}
                      size="lg"
                    >
                      <Crown className="w-4 h-4 mr-2" />
                      Upgrade to {deal?.requiredMembership || 'Premium'}
                    </Button>
                  )}

                  {/* Deal Claiming Process Instructions - Updated for merged button */}
                  {canAccessDeal() && (
                    <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <h4 className="font-semibold text-blue-900 dark:text-blue-100">How do I claim a deal?</h4>
                      </div>
                      <p className="text-blue-800 dark:text-blue-200 text-sm">
                        Click "Verify with PIN to Claim Deal" above, then visit the store and ask for the current 4-digit PIN (changes every 30 minutes for security). Enter the PIN in the verification dialog to complete your claim and add the bill amount to track your actual savings.
                      </p>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Deal Details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span>Valid until {formatDate(currentDeal.validUntil)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Eye className="h-4 w-4 text-gray-500" />
                    <span>{currentDeal.viewCount || 0} views</span>
                  </div>
                  {currentDeal.maxRedemptions && (
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span>{currentDeal.currentRedemptions || 0}/{currentDeal.maxRedemptions} claimed</span>
                    </div>
                  )}
                </div>

                {/* Vendor Info */}
                {currentDeal.vendor && (
                  <>
                    <Separator />
                    <div className="flex items-center space-x-3">
                      <Store className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="font-medium">{currentDeal.vendor.businessName}</p>
                        <p className="text-sm text-muted-foreground flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {currentDeal.vendor.city}
                        </p>
                      </div>
                    </div>
                  </>
                )}




              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* PIN Verification Dialog */}
      <PinVerificationDialog
        open={showPinDialog}
        onOpenChange={setShowPinDialog}
        dealId={Number(id)}
        dealTitle={currentDeal?.title || ""}
        dealDiscountPercentage={currentDeal?.discountPercentage || 0}
        onSuccess={async () => {
          setShowPinDialog(false);
          // Comprehensive data refresh after successful PIN verification
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ["/api/deals"] }),
            queryClient.invalidateQueries({ queryKey: ["/api/users/claims"] }),
            queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] }),
            queryClient.invalidateQueries({ queryKey: [`/api/deals/${id}`] }),
            queryClient.invalidateQueries({ queryKey: [`/api/deals/${id}/secure`] }),
          ]);
          
          // Force refetch user data to update dashboard statistics
          queryClient.refetchQueries({ queryKey: ["/api/auth/me"] });
        }}
      />
    </div>
  );
}