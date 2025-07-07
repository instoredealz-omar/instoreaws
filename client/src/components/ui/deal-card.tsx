import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import NearbyDealsSection from "./nearby-deals";
import { MapPin, Clock, Eye, Heart, ExternalLink, Shield, Star, Users, Calendar, Tag, Info, Navigation, Crown, Lock } from "lucide-react";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";

interface DealCardProps {
  id: number;
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  imageUrl?: string;
  discountPercentage: number;
  originalPrice?: string;
  discountedPrice?: string;
  validUntil: string;
  currentRedemptions: number;
  maxRedemptions?: number;
  viewCount: number;
  vendor?: {
    businessName: string;
    city: string;
    state: string;
    rating?: number;
    description?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
  };
  requiredMembership: string;
  distance?: number;

  terms?: string;
  isActive?: boolean;
  isFavorite?: boolean;
  onClaim?: () => void;
  onView?: () => void;
  onToggleFavorite?: () => void;
}

export default function DealCard({
  id,
  title,
  description,
  category,
  subcategory,
  imageUrl,
  discountPercentage,
  originalPrice,
  discountedPrice,
  validUntil,
  currentRedemptions,
  maxRedemptions,
  viewCount,
  vendor,
  requiredMembership,
  distance,

  terms,
  isActive = true,
  isFavorite = false,
  onClaim,
  onView,
  onToggleFavorite,
}: DealCardProps) {
  const [isFlashing, setIsFlashing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const { user } = useAuth();
  const [, navigate] = useLocation();

  // Check if user can access this deal based on membership
  const canAccessDeal = () => {
    if (!user) return false;
    
    // If deal requires basic membership or no specific membership, everyone can access
    if (!requiredMembership || requiredMembership === 'basic') {
      return true;
    }
    
    const membershipLevels = { basic: 1, premium: 2, ultimate: 3 };
    const userLevel = membershipLevels[user.membershipPlan as keyof typeof membershipLevels] || 1;
    const requiredLevel = membershipLevels[requiredMembership as keyof typeof membershipLevels] || 1;
    
    return userLevel >= requiredLevel;
  };

  // Get suggested upgrade tier
  const getSuggestedTier = () => {
    if (requiredMembership === 'ultimate') return 'ultimate';
    if (requiredMembership === 'premium') return 'premium';
    // Never suggest 'basic' since it's free - default to premium for any other case
    return 'premium';
  };

  useEffect(() => {
    // Flash effect for high discount percentages
    if (discountPercentage >= 40) {
      const interval = setInterval(() => {
        setIsFlashing(prev => !prev);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [discountPercentage]);
  const categoryColors = {
    fashion: "bg-saffron/10 text-saffron",
    electronics: "bg-primary/10 text-primary",
    travel: "bg-success/10 text-success",
    food: "bg-warning/10 text-warning",
    home: "bg-royal/10 text-royal",
    fitness: "bg-secondary/10 text-secondary",
  };

  const membershipColors = {
    basic: "bg-gray-100 text-gray-800 border-gray-200",
    premium: "bg-blue-50 text-blue-700 border-blue-200",
    ultimate: "bg-purple-50 text-purple-700 border-purple-200",
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Function to format subcategory display
  const formatSubcategory = (subcategoryString?: string) => {
    if (!subcategoryString) return null;
    
    // Parse the subcategory format: "key:value"
    const parts = subcategoryString.split(':');
    if (parts.length === 2) {
      return parts[1]; // Return just the subcategory name
    }
    return subcategoryString; // Return as-is if not in expected format
  };

  const redemptionPercentage = maxRedemptions 
    ? (currentRedemptions / maxRedemptions) * 100 
    : 0;

  // Handle get directions
  const handleGetDirections = () => {
    if (!vendor) return;
    
    const { businessName, city, state, address, latitude, longitude } = vendor;
    
    // If we have coordinates, use them for precise location
    if (latitude && longitude) {
      const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
      window.open(mapsUrl, '_blank');
    } else {
      // Fallback to address or business name + city
      const location = address ? `${address}, ${city}, ${state}` : `${businessName}, ${city}, ${state}`;
      const encodedLocation = encodeURIComponent(location);
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedLocation}`;
      window.open(mapsUrl, '_blank');
    }
  };

  return (
    <Card className="deal-card h-full flex flex-col" onClick={onView}>
      {/* Image */}
      <div className="relative h-48 overflow-hidden rounded-t-lg">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400";
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="text-4xl mb-2">🎁</div>
              <div className="text-sm">Deal Available</div>
            </div>
          </div>
        )}
        
        <div className="absolute top-12 left-2 space-y-1">
          <Badge className={`${categoryColors[category as keyof typeof categoryColors]} border-0`}>
            {category}
          </Badge>
          {subcategory && formatSubcategory(subcategory) && (
            <Badge className="bg-green-100 text-green-800 border-0 text-xs block">
              {formatSubcategory(subcategory)}
            </Badge>
          )}
        </div>
        <div className={`absolute top-2 right-2 rounded-full px-2 py-1 text-xs font-semibold transition-all duration-300 ${
          isFlashing 
            ? 'bg-red-500 text-white shadow-lg scale-110' 
            : 'bg-card/90 backdrop-blur-sm text-foreground'
        }`}>
          {discountPercentage}% OFF
        </div>
        
        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite?.();
          }}
          className="absolute top-2 left-2 p-1.5 rounded-full bg-card/80 backdrop-blur-sm hover:bg-card transition-all duration-200"
        >
          <Heart 
            className={`h-4 w-4 transition-colors duration-200 ${
              isFavorite ? 'fill-red-500 text-red-500' : 'text-muted-foreground hover:text-red-500'
            }`} 
          />
        </button>
        {viewCount > 0 && (
          <div className="absolute bottom-2 right-2 bg-black/70 text-white rounded px-2 py-1 text-xs flex items-center space-x-1">
            <Eye className="h-3 w-3" />
            <span>{viewCount}</span>
          </div>
        )}
      </div>

      <CardContent className="flex-1 p-4">
        <div className="space-y-3">
          {/* Title and Description */}
          <div>
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-foreground line-clamp-2 flex-1">{title}</h3>
              {requiredMembership !== 'basic' && (
                <Badge 
                  className={`text-xs ${
                    requiredMembership === 'premium' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-purple-100 text-purple-800'
                  }`}
                >
                  <Crown className="h-3 w-3 mr-1" />
                  {requiredMembership}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{description}</p>
          </div>

          {/* Vendor Info */}
          {vendor && (
            <div className="flex items-center text-sm text-gray-500">
              <MapPin className="h-3 w-3 mr-1" />
              <span>{vendor.businessName}, {vendor.city}</span>
            </div>
          )}



          {/* Validity and Redemptions */}
          <div className="space-y-2">
            <div className="flex items-center text-sm text-gray-500">
              <Clock className="h-3 w-3 mr-1" />
              <span>Valid until {formatDate(validUntil)}</span>
            </div>
            

          </div>

          {/* Nearby Deals and Membership Requirement */}
          <div className="flex items-center justify-between">
            <Badge className={`${membershipColors[requiredMembership as keyof typeof membershipColors]} text-xs`}>
              {requiredMembership ? 
                requiredMembership.charAt(0).toUpperCase() + requiredMembership.slice(1) + ' Required' : 
                'No Membership Required'
              }
            </Badge>
            {vendor && distance && (
              <div className="flex items-center text-xs text-gray-500">
                <MapPin className="h-3 w-3 mr-1" />
                <span>{distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`} away</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 space-y-2">
        {/* Action Buttons */}
        <div className="flex gap-2 w-full">
          {user && !canAccessDeal() ? (
            // Show upgrade button for premium/ultimate deals - these can stay on the card for immediate action
            <Button 
              onClick={(e) => {
                e.stopPropagation();
                navigate('/customer/upgrade');
              }}
              className={`flex-1 ${
                getSuggestedTier() === 'ultimate' 
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700' 
                  : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'
              }`}
              size="sm"
            >
              <Crown className="h-4 w-4 mr-2" />
              Upgrade to {getSuggestedTier()}
            </Button>
          ) : (
            // Always show View button - users can claim from the detailed view
            <Button 
              onClick={onView}
              className="flex-1"
              size="sm"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View Details
            </Button>
          )}
        </div>

        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogTrigger asChild>
            <div style={{ display: 'none' }}></div>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Tag className="h-5 w-5" />
                <span>{title}</span>
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Deal Image */}
              {imageUrl && (
                <div className="relative">
                  <img 
                    src={imageUrl} 
                    alt={title}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  <div className="absolute top-4 right-4 bg-red-500 text-white rounded-full px-3 py-1 text-sm font-semibold">
                    {discountPercentage}% OFF
                  </div>
                </div>
              )}

              {/* Deal Information */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Deal Details</h3>
                    <p className="text-gray-700">{description}</p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Category:</span>
                      <Badge className={`${categoryColors[category as keyof typeof categoryColors]} border-0`}>
                        {category}
                      </Badge>
                    </div>
                    
                    {subcategory && formatSubcategory(subcategory) && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Service Type:</span>
                        <Badge className="bg-green-100 text-green-800 border-0">
                          {formatSubcategory(subcategory)}
                        </Badge>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Discount:</span>
                      <span className="font-semibold text-red-600">{discountPercentage}% OFF on total bill</span>
                    </div>



                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Valid Until:</span>
                      <span className="font-medium">{formatDate(validUntil)}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Membership:</span>
                      <Badge className={`${membershipColors[requiredMembership as keyof typeof membershipColors]} text-xs`}>
                        {requiredMembership ? 
                          requiredMembership.charAt(0).toUpperCase() + requiredMembership.slice(1) : 
                          'None'
                        }
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Vendor Information */}
                  {vendor && (
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Vendor Details</h3>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">{vendor.businessName}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">{vendor.city}, {vendor.state}</div>
                        {vendor.rating && (
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
                            <span className="text-sm font-medium">{vendor.rating}/5</span>
                          </div>
                        )}
                        {vendor.description && (
                          <p className="text-sm text-muted-foreground mt-2">{vendor.description}</p>
                        )}
                      </div>
                    </div>
                  )}


                </div>
              </div>

              <Separator />



              {/* Terms and Conditions */}
              {terms && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-foreground flex items-center">
                    <Info className="h-5 w-5 mr-2" />
                    Terms & Conditions
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <p className="text-sm text-gray-700 dark:text-gray-300">{terms}</p>
                  </div>
                </div>
              )}

              {/* Nearby Deals Section */}
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Nearby Similar Deals
                </h3>
                <NearbyDealsSection dealId={id} />
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <Button 
                  className="flex-1"
                  onClick={() => {
                    setShowModal(false);
                    onView?.();
                  }}
                >
                  View Deal Details
                </Button>
                {vendor && (
                  <Button 
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleGetDirections();
                    }}
                  >
                    <Navigation className="h-4 w-4 mr-2" />
                    Directions
                  </Button>
                )}
                <Button 
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite?.();
                  }}
                >
                  <Heart className={`h-4 w-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>


      </CardFooter>
    </Card>
  );
}
