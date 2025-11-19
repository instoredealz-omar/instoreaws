import { useState, useEffect, useRef } from "react";
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
  ExternalLink as LinkIcon,
} from "lucide-react";
import { Link } from "wouter";
import { PinVerificationDialog } from "@/components/ui/pin-verification-dialog";
import { ClaimDealDialog } from "@/components/ui/claim-deal-dialog";

interface DealLocation {
  id: number;
  storeName: string;
  address: string;
  city: string;
  state: string;
  pincode?: string;
  phone?: string;
}

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
  locations?: DealLocation[];
  locationCount?: number;
  hasMultipleLocations?: boolean;
  dealType?: string;
  affiliateLink?: string;
  vendor?: {
    id: number;
    businessName: string;
    city: string;
    address: string;
  };
}

interface ClaimResponse {
  id: number;
  dealId: number;
  userId: number;
  savingsAmount: string;
  claimedAt: string;
  claimCode: string;
  codeExpiresAt: string;
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
  const [showClaimDialog, setShowClaimDialog] = useState(false);
  const [claimCode, setClaimCode] = useState<string | null>(null);

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

  // Track if we've already incremented view count for this deal
  const viewCountedRef = useRef<number | null>(null);

  // Increment view count when component mounts (only once per deal)
  useEffect(() => {
    if (currentDeal && id && viewCountedRef.current !== id) {
      viewCountedRef.current = id;
      apiRequest(`/api/deals/${id}/view`, "POST", {}).catch(() => {
        // Silently fail view tracking
      });
    }
  }, [currentDeal, id]);



  // Fetch user claims to check if this deal has been claimed
  const { data: userClaims = [], refetch: refetchClaims } = useQuery<Array<{id: number, dealId: number, status: string, claimCode?: string, vendorVerified?: boolean, claimedAt?: string}>>({
    queryKey: ['/api/users/claims'],
    enabled: isAuthenticated,
    staleTime: 0,
    retry: 3,
    refetchOnMount: true,
  });

  // Check if current deal has been claimed - Allow multiple claims with same code
  const userClaims_forDeal = userClaims.filter(claim => claim.dealId === Number(id));
  const userClaim = userClaims_forDeal.sort((a, b) => b.id - a.id)[0]; // Get most recent claim
  const hasClaimedDeal = false; // Allow multiple claims - same code will be reused

  // Simple claim for online and offline deals
  const simpleClaimMutation = useMutation({
    mutationFn: async (dealId: number): Promise<any> => {
      const response = await apiRequest(`/api/deals/${dealId}/claim`, 'POST', {});
      return await response.json();
    },
    onSuccess: (data) => {
      // Different messages for online vs offline deals
      if (data.dealType === 'online') {
        toast({
          title: "Online Deal Claimed! 🎉",
          description: data.message || "Your claim code has been generated. Visit the vendor website to redeem.",
          variant: "default",
        });
        
        // For online deals, open affiliate link if available
        if (data.affiliateLink) {
          setTimeout(() => {
            window.open(data.affiliateLink, '_blank');
          }, 1000);
        }
      } else {
        // For offline deals, show instructions
        toast({
          title: "Deal Claimed! 🎉",
          description: data.message || "At checkout, ask the vendor for their 6-digit verification code and your bill amount.",
          variant: "default",
          duration: 8000, // Show longer for offline deals
        });
        
        // Show PIN dialog for entering the vendor's code
        setTimeout(() => {
          setShowClaimDialog(true);
        }, 500);
      }
      
      // Refresh user data and claims
      setTimeout(async () => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["/api/users/claims"] }),
          queryClient.invalidateQueries({ queryKey: [`/api/deals/${id}`] }),
          queryClient.invalidateQueries({ queryKey: [`/api/deals/${id}/secure`] }),
          queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] })
        ]);
        refetchClaims();
        queryClient.refetchQueries({ queryKey: ["/api/auth/me"] });
      }, 500);
    },
    onError: (error: any) => {
      toast({
        title: "Claim Failed",
        description: error.message || "Failed to claim deal. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Claim deal with bill amount and PIN (for offline deals)
  const claimDealMutation = useMutation({
    mutationFn: async ({ dealId, billAmount, pin }: { dealId: number; billAmount: number; pin: string }): Promise<any> => {
      const response = await apiRequest(`/api/deals/${dealId}/claim-with-bill`, 'POST', { billAmount, pin });
      return await response.json();
    },
    onSuccess: (data) => {
      setShowClaimDialog(false);
      
      toast({
        title: "Deal Claimed Successfully! 🎉",
        description: `You saved ₹${data.savingsAmount}! Your savings have been added to your account.`,
        variant: "default",
      });
      
      // Refresh user data and claims
      setTimeout(async () => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["/api/users/claims"] }),
          queryClient.invalidateQueries({ queryKey: [`/api/deals/${id}`] }),
          queryClient.invalidateQueries({ queryKey: [`/api/deals/${id}/secure`] }),
          queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] })
        ]);
        refetchClaims();
        queryClient.refetchQueries({ queryKey: ["/api/auth/me"] });
      }, 500);
    },
    onError: (error: any) => {
      toast({
        title: "Claim Failed",
        description: error.message || "Failed to claim deal. Please try again.",
        variant: "destructive",
      });
    }
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
    
    // Claim the deal first (both online and offline)
    // The mutation will handle showing the PIN dialog for offline deals
    simpleClaimMutation.mutate(currentDeal!.id);
  };

  const handleClaimSubmit = (billAmount: number, pin: string) => {
    claimDealMutation.mutate({ dealId: currentDeal!.id, billAmount, pin });
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

  // No authentication check needed for viewing deal details
  // Authentication is only required for actions like claiming or adding to wishlist

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

                {/* Online Deal Information with Claim Code and Affiliate Link */}
                {currentDeal.dealType === 'online' && userClaim && userClaim.claimCode && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-6 space-y-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Tag className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <h4 className="font-semibold text-blue-900 dark:text-blue-100 text-lg">Online Deal - Claim Code</h4>
                    </div>
                    
                    {/* Claim Code Display */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border-2 border-blue-300 dark:border-blue-700">
                      <p className="text-sm text-muted-foreground mb-2">Your Claim Code:</p>
                      <div className="flex items-center justify-between gap-4">
                        <code className="text-3xl font-bold tracking-wider text-blue-600 dark:text-blue-400" data-testid="text-claim-code">
                          {userClaim.claimCode}
                        </code>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(userClaim.claimCode || '');
                            toast({
                              title: "Copied!",
                              description: "Claim code copied to clipboard",
                            });
                          }}
                          data-testid="button-copy-claim-code"
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Code
                        </Button>
                      </div>
                    </div>

                    {/* Affiliate Link Button */}
                    {currentDeal.affiliateLink && (
                      <div className="space-y-2">
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                          Use this code on the vendor's website to get your discount:
                        </p>
                        <Button
                          onClick={() => window.open(currentDeal.affiliateLink, '_blank')}
                          className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                          size="lg"
                          data-testid="button-visit-affiliate-link"
                        >
                          <LinkIcon className="w-4 h-4 mr-2" />
                          Visit Vendor Website
                        </Button>
                      </div>
                    )}

                    {/* Instructions */}
                    <div className="text-sm text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/50 rounded p-3">
                      <strong>How to redeem:</strong>
                      <ol className="list-decimal list-inside mt-2 space-y-1">
                        <li>Copy the claim code above</li>
                        <li>Click "Visit Vendor Website" button</li>
                        <li>Apply the code at checkout to get {currentDeal.discountPercentage}% off</li>
                        <li>Your savings will be tracked automatically</li>
                      </ol>
                    </div>
                  </div>
                )}

                <Separator />

                {/* Action Buttons - Moved above validity section */}
                <div className="space-y-4">
                  {/* Unified PIN Verification to Claim Deal Button */}
                  {!isAuthenticated ? (
                    <Button
                      onClick={() => setLocation('/login')}
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                      size="lg"
                    >
                      <Lock className="w-4 h-4 mr-2" />
                      Login to Claim Deal
                    </Button>
                  ) : canAccessDeal() ? (
                    <div className="space-y-4">
                        {/* Claim Deal Button */}
                        <Button
                          onClick={handleClaimDeal}
                          disabled={isExpired || !!isFullyRedeemed || !deal?.isActive || simpleClaimMutation.isPending || claimDealMutation.isPending}
                          className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white"
                          size="lg"
                          data-testid="button-claim-deal"
                        >
                          {isExpired ? (
                            "Deal Expired"
                          ) : isFullyRedeemed ? (
                            "Fully Redeemed"
                          ) : simpleClaimMutation.isPending || claimDealMutation.isPending ? (
                            "Claiming..."
                          ) : (
                            <>
                              {currentDeal?.dealType === 'online' ? (
                                <>
                                  <LinkIcon className="w-4 h-4 mr-2" />
                                  Claim Online Deal
                                </>
                              ) : (
                                <>
                                  <Shield className="w-4 h-4 mr-2" />
                                  Claim Deal
                                </>
                              )}
                            </>
                          )}
                        </Button>

                        {/* Show success message if user has claimed and it's verified */}
                        {userClaim && userClaim.vendorVerified && (
                          <div className="text-center text-sm text-green-600 dark:text-green-400 font-medium bg-green-50 dark:bg-green-900/30 rounded-lg py-3">
                            ✅ Deal claimed successfully! Check your dashboard for savings.
                          </div>
                        )}
                      </div>
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

                  {/* Deal Claiming Process Instructions */}
                  {canAccessDeal() && !userClaim && (
                    <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        {currentDeal?.dealType === 'online' ? (
                          <LinkIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        ) : (
                          <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        )}
                        <h4 className="font-semibold text-blue-900 dark:text-blue-100">How do I claim this deal?</h4>
                      </div>
                      <p className="text-blue-800 dark:text-blue-200 text-sm">
                        {currentDeal?.dealType === 'online' ? (
                          <>Click "Claim Online Deal" to get your unique code. You'll be redirected to the vendor's website where you can use the code at checkout to get your discount!</>
                        ) : (
                          <>Visit the store and click "Claim Deal" at checkout. Enter your billed amount and ask the vendor for 6-character verification code to complete the claim. Your savings will be automatically added to your account!</>
                        )}
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

                {/* Vendor & Location Info */}
                {currentDeal.vendor && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <Store className="h-5 w-5 text-gray-500" />
                        <div className="flex-1">
                          <p className="font-medium">{currentDeal.vendor.businessName}</p>
                          {currentDeal.hasMultipleLocations && (
                            <Badge variant="secondary" className="mt-1 text-xs">
                              Available at {currentDeal.locationCount} locations
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {/* Store Locations */}
                      {currentDeal.locations && currentDeal.locations.length > 0 ? (
                        <div className="ml-8 space-y-2">
                          <h4 className="font-medium text-sm text-foreground">Store Locations:</h4>
                          <div className="space-y-2">
                            {currentDeal.locations.map((location) => (
                              <div key={location.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                                <div className="flex items-start space-x-2">
                                  <MapPin className="h-4 w-4 text-blue-500 mt-0.5" />
                                  <div className="flex-1">
                                    <p className="font-medium text-sm">{location.storeName}</p>
                                    <p className="text-xs text-muted-foreground">{location.address}</p>
                                    <p className="text-xs text-muted-foreground">{location.city}, {location.state} {location.pincode}</p>
                                    {location.phone && (
                                      <p className="text-xs text-blue-600 mt-1">📞 {location.phone}</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="ml-8">
                          <p className="text-sm text-muted-foreground flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {currentDeal.vendor.city}
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                )}




              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Claim Deal Dialog */}
      <ClaimDealDialog
        open={showClaimDialog}
        onOpenChange={setShowClaimDialog}
        dealTitle={currentDeal?.title || ""}
        discountPercentage={currentDeal?.discountPercentage || 0}
        onSubmit={handleClaimSubmit}
        isLoading={claimDealMutation.isPending}
      />

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