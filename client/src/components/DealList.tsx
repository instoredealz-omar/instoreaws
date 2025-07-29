import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { generateDealClaimQR } from '../lib/qr-code';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';
import Navbar from '@/components/ui/navbar';
import Footer from '@/components/ui/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Gift, Star, MapPin, Calendar, QrCode, Calculator, Receipt, Shield, Lock, Filter, Grid, List, Store, Eye, Heart, Crown, Percent, Users, ArrowLeft } from 'lucide-react';
import { PinVerificationDialog } from '@/components/ui/pin-verification-dialog';

interface DealLocation {
  id: number;
  storeName: string;
  address: string;
  city: string;
  state: string;
  sublocation?: string;
  pincode?: string;
  phone?: string;
}

interface Deal {
  id: number | string;
  title: string;
  description: string;
  category: string;
  originalPrice: string;
  discountedPrice: string;
  discountPercentage: number;
  validUntil: string;
  vendor: {
    id: number;
    name: string;
    businessName: string;
    city: string;
    state: string;
    address: string;
  };
  locations?: DealLocation[];
  locationCount?: number;
  hasMultipleLocations?: boolean;
  isActive: boolean;
  maxRedemptions?: number;
  currentRedemptions?: number;
  viewCount?: number;
  imageUrl?: string;
  requiredMembership?: string;
  // New fields for multistore expansion
  originalDealId?: number;
  locationIndex?: number;
  singleLocation?: DealLocation;
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

const DealList = () => {
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [billingDeal, setBillingDeal] = useState<Deal | null>(null);
  const [billAmount, setBillAmount] = useState<string>('');
  const [calculatedSavings, setCalculatedSavings] = useState<number>(0);
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [pinDialogDeal, setPinDialogDeal] = useState<Deal | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [claimCodes, setClaimCodes] = useState<Record<number, string>>({});
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  // Parse category from URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(location.split('?')[1] || '');
    const category = urlParams.get('category');
    if (category) {
      setSelectedCategory(category);
    }
  }, [location]);

  // Fetch deals using TanStack Query with category and city filtering
  const { data: deals = [], isLoading, error } = useQuery<Deal[]>({
    queryKey: ['/api/deals', selectedCategory === 'all' ? '' : selectedCategory, selectedCity === 'all' ? '' : selectedCity],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory && selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }
      if (selectedCity && selectedCity !== 'all') {
        params.append('city', selectedCity);
      }
      
      const response = await fetch(`/api/deals?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch deals');
      return response.json();
    },
  });

  // Fetch categories
  const { data: categories = [] } = useQuery<Array<{id: string, name: string}>>({
    queryKey: ['/api/categories'],
  });

  // Fetch cities
  const { data: cities = [] } = useQuery<Array<{name: string, state: string}>>({
    queryKey: ['/api/cities'],
  });

  // Fetch user claims to check which deals have been claimed (only for authenticated users)
  const { data: userClaims = [], isLoading: isLoadingClaims } = useQuery<Array<{id: number, dealId: number, status: string, claimCode?: string, vendorVerified?: boolean}>>({
    queryKey: ['/api/users/claims'],
    enabled: isAuthenticated, // Only fetch when user is authenticated
    staleTime: 0, // Always fetch fresh data for claims
    retry: 3,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Calculate savings based on bill amount
  const calculateSavings = (billAmountValue: string, discountPercentage: number) => {
    const amount = parseFloat(billAmountValue);
    if (isNaN(amount) || amount <= 0) return 0;
    return (amount * discountPercentage) / 100;
  };

  // New claim deal with code mutation (corrected system)
  const claimDealMutation = useMutation({
    mutationFn: async (dealId: number): Promise<ClaimResponse> => {
      return apiRequest(`/api/deals/${dealId}/claim-with-code`, 'POST', {});
    },
    onSuccess: (data, dealId) => {
      // Store the claim code for this deal
      setClaimCodes(prev => ({
        ...prev,
        [dealId]: data.claimCode
      }));

      toast({
        title: "Deal Claimed Successfully! 🎉",
        description: `Your claim code is ${data.claimCode}. Show this code at the store.`,
        variant: "default",
      });
      
      // Refresh user claims to update UI
      queryClient.invalidateQueries({ queryKey: ["/api/users/claims"] });
    },
    onError: (error) => {
      toast({
        title: "Claim Failed",
        description: "Failed to claim deal. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Update bill amount mutation
  const updateBillMutation = useMutation({
    mutationFn: async ({ dealId, billAmount, savings }: { dealId: number, billAmount: number, savings: number }) => {
      return apiRequest(`/api/deals/${dealId}/update-bill`, 'POST', {
        billAmount,
        actualSavings: savings
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Bill Updated Successfully!",
        description: `Your actual savings of ₹${calculatedSavings.toFixed(2)} have been recorded.`,
        variant: "default",
      });
      
      // Reset and close billing dialog
      setBillingDeal(null);
      setBillAmount('');
      setCalculatedSavings(0);
      
      // Refresh user data to update dashboard
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/claims"] });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: "Failed to update bill amount. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleDealClick = (deal: Deal) => {
    const dealId = deal.originalDealId || deal.id;
    setLocation(`/deals/${dealId}`);
  };

  const closeDialog = () => {
    setSelectedDeal(null);
    setQrCode(null);
  };

  if (isLoading || (isAuthenticated && isLoadingClaims)) {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-lg text-muted-foreground">
            {isLoading ? "Loading amazing deals..." : "Loading your claimed deals..."}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="text-center space-y-4 max-w-md">
          <div className="text-red-500 text-6xl">⚠️</div>
          <h3 className="text-xl font-semibold text-red-600">Oops! Something went wrong</h3>
          <p className="text-muted-foreground">{(error as Error).message}</p>
          <Button 
            onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/deals'] })}
            variant="outline"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Expand multistore deals as separate entries
  const expandedDeals = deals.flatMap(deal => {
    if (deal.hasMultipleLocations && deal.locations && deal.locations.length > 0) {
      // Create separate deal entries for each location
      return deal.locations.map((location, index) => ({
        ...deal,
        id: `${deal.id}-${location.id}`, // Unique ID for tracking
        originalDealId: deal.id, // Keep reference to original deal
        locationIndex: index,
        singleLocation: location,
        title: `${deal.title} - ${location.storeName}`,
        vendor: {
          ...deal.vendor,
          city: location.city,
          state: location.state,
          address: location.address
        }
      }));
    }
    return [deal];
  });

  // Sort deals based on selected criteria
  const sortedDeals = [...expandedDeals].sort((a, b) => {
    switch (sortBy) {
      case 'discount':
        return b.discountPercentage - a.discountPercentage;
      case 'price':
        return parseFloat(a.discountedPrice) - parseFloat(b.discountedPrice);
      case 'ending':
        return new Date(a.validUntil).getTime() - new Date(b.validUntil).getTime();
      case 'newest':
      default:
        return (b.originalDealId || b.id) - (a.originalDealId || a.id);
    }
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar selectedCity={selectedCity} onCityChange={setSelectedCity} />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4">
            <div className="mb-4 sm:mb-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">All Deals</h1>
              <p className="text-muted-foreground mt-1 text-sm">
                Discover amazing discounts from local businesses
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedCity} onValueChange={setSelectedCity}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Cities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                {cities.map((city) => (
                  <SelectItem key={city.name} value={city.name}>
                    {city.name}, {city.state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="discount">Highest Discount</SelectItem>
                <SelectItem value="price">Lowest Price</SelectItem>
                <SelectItem value="ending">Ending Soon</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Results count */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              {sortedDeals.length} deal{sortedDeals.length !== 1 ? 's' : ''} found
            </p>
          </div>
        </div>

        {/* Deals Grid */}
        {sortedDeals.length === 0 ? (
          <div className="text-center py-12">
            <Store className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No deals found</h3>
            <p className="text-muted-foreground">
              Try adjusting your filters or check back later for new deals.
            </p>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'deal-grid' : 'grid-cols-1 max-w-4xl mx-auto space-y-4'}>
          {sortedDeals.map((deal, index) => {
            const isExpired = new Date(deal.validUntil) < new Date();
            const isLimitReached = deal.maxRedemptions && deal.currentRedemptions && 
              deal.currentRedemptions >= deal.maxRedemptions;
            const canClaim = deal.isActive && !isExpired && !isLimitReached;
            
            // Check if user has claimed this deal (use original deal ID for multistore deals)
            const dealIdToCheck = deal.originalDealId || deal.id;
            const userClaim = userClaims.find(claim => claim.dealId === dealIdToCheck);
            const hasClaimedDeal = !!userClaim;
            
            // Show Add Bill Amount button for verified/completed claims (status 'used')
            const showBillAmountButton = hasClaimedDeal && userClaim?.status === 'used';
            
            return (
              <div 
                key={`deal-${deal.id}-${index}`} 
                className="bg-card rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer border"
                onClick={() => handleDealClick(deal)}
              >
                <div className="relative">
                  {deal.imageUrl ? (
                    <img 
                      src={deal.imageUrl} 
                      alt={deal.title}
                      className="w-full h-48 object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400";
                      }}
                    />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                      <Store className="w-16 h-16 text-gray-400" />
                    </div>
                  )}
                  
                  {/* Discount Badge */}
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-red-500 text-white font-bold px-2 py-1 rounded-full animate-pulse">
                      {deal.discountPercentage}% OFF
                    </Badge>
                  </div>
                  
                  {/* View Count */}
                  <div className="absolute bottom-3 left-3 bg-black/50 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {deal.viewCount || 0}
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary" className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs px-2 py-1">
                      {deal.category}
                    </Badge>
                    <div className="flex items-center space-x-1 text-orange-500">
                      <Star className="h-4 w-4 fill-current" />
                      <span className="text-xs font-medium">Popular</span>
                    </div>
                  </div>
                  
                  <h3 className="font-bold text-foreground mb-2 line-clamp-1 text-sm">
                    {deal.title}
                  </h3>
                  
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                    {deal.description}
                  </p>
                  
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold text-green-600">
                          ₹{deal.discountedPrice}
                        </span>
                        <span className="text-xs text-muted-foreground line-through">
                          ₹{deal.originalPrice}
                        </span>
                      </div>
                      <div className="text-xs text-green-600 font-medium">
                        Save ₹{(parseFloat(deal.originalPrice) - parseFloat(deal.discountedPrice)).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons - Moved above validity section */}
                  <div className="flex flex-col gap-2">
                    {!hasClaimedDeal ? (
                      !isAuthenticated ? (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            setLocation('/login');
                          }}
                          className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 text-sm"
                          size="sm"
                        >
                          <Lock className="h-3 w-3 mr-1" />
                          Login to Claim Deal
                        </Button>
                      ) : (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            const dealIdForClaim = deal.originalDealId || deal.id;
                            claimDealMutation.mutate(dealIdForClaim);
                          }}
                          disabled={!canClaim || claimDealMutation.isPending}
                          className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-semibold py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 text-sm"
                          size="sm"
                        >
                          {claimDealMutation.isPending ? (
                            <>
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              Claiming...
                            </>
                          ) : !canClaim ? (
                            isExpired ? "⏰ Expired" : 
                            isLimitReached ? "🚫 Limit Reached" : 
                            "❌ Unavailable"
                          ) : (
                            <>
                              <Gift className="h-3 w-3 mr-1" />
                              Claim Deal
                            </>
                          )}
                        </Button>
                      )
                    ) : (
                      <div className="space-y-2">
                        <div className="text-center text-sm text-green-600 dark:text-green-400 font-medium bg-green-50 dark:bg-green-900/30 rounded-lg py-2">
                          ✅ Deal Claimed
                        </div>
                        
                        {/* Show claim code if available */}
                        {(claimCodes[deal.originalDealId || deal.id] || userClaim?.claimCode) && (
                          <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                            <div className="text-center">
                              <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">
                                Your Claim Code
                              </div>
                              <div className="text-lg font-bold text-blue-800 dark:text-blue-300 tracking-wider">
                                {claimCodes[deal.originalDealId || deal.id] || userClaim?.claimCode}
                              </div>
                              <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                Show this code at the store
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {userClaim?.status === 'claimed' && !userClaim?.vendorVerified && (
                          <div className="text-center text-sm text-amber-600 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-900/30 rounded-lg py-2">
                            📍 Visit store with your claim code
                          </div>
                        )}
                        
                        {showBillAmountButton && (
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              setBillingDeal(deal);
                            }}
                            variant="outline"
                            className="w-full border-orange-300 text-orange-600 hover:bg-orange-50 hover:border-orange-400"
                            size="sm"
                          >
                            <Receipt className="h-4 w-4 mr-2" />
                            Add Bill Amount
                          </Button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 text-sm text-muted-foreground">
                    {/* Location Display */}
                    <div className="space-y-1">
                      {deal.singleLocation ? (
                        // Display specific location for multistore deal entry
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg">
                          <div className="flex items-center gap-1 mb-1">
                            <Store className="h-3 w-3 text-blue-600" />
                            <span className="text-xs font-medium text-blue-600">
                              Store Location
                            </span>
                          </div>
                          <div className="flex items-start gap-1 text-xs">
                            <MapPin className="h-3 w-3 text-blue-500 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <div className="font-medium">{deal.singleLocation.storeName}</div>
                              <div className="text-muted-foreground">
                                {deal.singleLocation.sublocation && `${deal.singleLocation.sublocation}, `}
                                {deal.singleLocation.city}, {deal.singleLocation.state}
                                {deal.singleLocation.pincode && ` - ${deal.singleLocation.pincode}`}
                              </div>
                              {deal.singleLocation.phone && (
                                <div className="text-muted-foreground text-xs mt-1">
                                  📞 {deal.singleLocation.phone}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        // Display vendor location for single-store deals
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span className="text-xs">
                            {deal.vendor.city}, {deal.vendor.state}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Store className="h-4 w-4" />
                      <span className="font-medium">
                        {deal.vendor?.businessName || 'Vendor'}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <span>Valid until {new Date(deal.validUntil).toLocaleDateString()}</span>
                    </div>
                    {deal.maxRedemptions && (
                      <div className="flex items-center space-x-2">
                        <Gift className="h-4 w-4" />
                        <span>{deal.currentRedemptions || 0}/{deal.maxRedemptions} claimed</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        )}
      </div>
      
      <Footer />

      {/* QR Code Dialog */}
      <Dialog open={!!selectedDeal && !!qrCode} onOpenChange={closeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-green-600">
              🎉 Deal Claimed Successfully!
            </DialogTitle>
            <DialogDescription className="text-center">
              Your deal has been claimed. Show this QR code to the vendor to redeem your discount.
            </DialogDescription>
          </DialogHeader>
          
          {qrCode && (
            <div className="flex flex-col items-center space-y-4 py-4">
              <div className="p-4 bg-gradient-to-br from-green-50 to-blue-50 rounded-lg">
                <img 
                  src={qrCode} 
                  alt="Deal Claim QR Code" 
                  className="w-48 h-48 mx-auto"
                />
              </div>
              <div className="text-center space-y-2">
                <p className="font-semibold text-lg">{selectedDeal?.title}</p>
                <p className="text-sm text-muted-foreground">
                  Present this QR code at {selectedDeal?.vendor.name}
                </p>
                <div className="flex items-center justify-center space-x-2 text-green-600">
                  <QrCode className="h-4 w-4" />
                  <span className="text-sm font-medium">Scan to verify claim</span>
                </div>
              </div>
              <Button onClick={closeDialog} className="w-full">
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Bill Amount Dialog */}
      <Dialog open={!!billingDeal} onOpenChange={() => setBillingDeal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-orange-600" />
              Calculate Your Savings
            </DialogTitle>
            <DialogDescription>
              Enter the total bill amount to calculate your actual savings
            </DialogDescription>
          </DialogHeader>
          
          {billingDeal && (
            <div className="space-y-4 py-4">
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-1 text-gray-900 dark:text-gray-100">{billingDeal.title}</h3>
                <p className="text-sm text-muted-foreground">Discount: {billingDeal.discountPercentage}% OFF</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bill-amount">Total Bill Amount (₹)</Label>
                <Input
                  id="bill-amount"
                  type="number"
                  placeholder="Enter your total bill amount"
                  value={billAmount}
                  onChange={(e) => {
                    setBillAmount(e.target.value);
                    const savings = calculateSavings(e.target.value, billingDeal.discountPercentage);
                    setCalculatedSavings(savings);
                  }}
                  className="text-lg"
                />
              </div>
              
              {billAmount && calculatedSavings > 0 && (
                <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-green-700 dark:text-green-300">Your Savings:</span>
                    <span className="text-xl font-bold text-green-600 dark:text-green-400">
                      ₹{calculatedSavings.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                    {billingDeal.discountPercentage}% off ₹{billAmount}
                  </div>
                </div>
              )}
              
              <div className="flex gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setBillingDeal(null);
                    setBillAmount('');
                    setCalculatedSavings(0);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    if (calculatedSavings > 0) {
                      updateBillMutation.mutate({
                        dealId: billingDeal.id,
                        billAmount: parseFloat(billAmount),
                        savings: calculatedSavings
                      });
                    }
                  }}
                  disabled={!billAmount || calculatedSavings <= 0 || updateBillMutation.isPending}
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                >
                  {updateBillMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Receipt className="h-4 w-4 mr-2" />
                      Record Savings
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* PIN Verification Dialog */}
      <PinVerificationDialog
        open={showPinDialog}
        onOpenChange={setShowPinDialog}
        dealId={pinDialogDeal?.id || 0}
        dealTitle={pinDialogDeal?.title || ''}
        dealDiscountPercentage={pinDialogDeal?.discountPercentage || 0}
        onSuccess={async () => {
          setShowPinDialog(false);
          setPinDialogDeal(null);
          // Refresh all relevant data
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['/api/deals'] }),
            queryClient.invalidateQueries({ queryKey: ["/api/users/claims"] }),
            queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] }),
            queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] }),
          ]);
          queryClient.refetchQueries({ queryKey: ["/api/auth/me"] });
        }}
      />
    </div>
  );
};

export default DealList;