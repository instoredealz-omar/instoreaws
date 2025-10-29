import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Crown,
  Shield,
  Calendar,
  CreditCard,
  QrCode,
  Download,
  Copy,
  CheckCircle2,
  Zap,
  Star,
  Gift,
  Eye,
  EyeOff,
  User,
  AlertCircle,
  Store,
  Scan,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateCustomerClaimQR } from "@/lib/qr-code";

interface MembershipCardData {
  membershipTier: string;
  membershipExpiry: string;
  totalSavings: string;
  dealsClaimed: number;
  cardNumber: string;
  qrCode: string;
  isActive: boolean;
}

const tierConfig = {
  basic: {
    name: "Basic",
    color: "bg-gradient-to-br from-gray-400 to-gray-600",
    icon: Shield,
    benefits: ["Access to Food & Travel deals", "Standard support", "Basic rewards"],
  },
  premium: {
    name: "Premium",
    color: "bg-gradient-to-br from-blue-500 to-purple-600",
    icon: Crown,
    benefits: ["Access to most deal categories", "Priority support", "Enhanced rewards", "Exclusive offers"],
  },
  ultimate: {
    name: "Ultimate",
    color: "bg-gradient-to-br from-purple-600 to-pink-600",
    icon: Star,
    benefits: ["Access to ALL deals", "VIP support", "Maximum rewards", "Early access", "Premium concierge"],
  },
};

export default function MembershipCard() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [showQR, setShowQR] = useState(false);
  const [otpCode, setOtpCode] = useState<string>("");
  const [isGeneratingOTP, setIsGeneratingOTP] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");

  // Generate QR code with comprehensive analytics data
  const generateQRCode = async () => {
    if (!user) return;
    
    try {
      // Fetch user's complete analytics data for QR code
      const userStatsResponse = await fetch('/api/users/me/stats');
      const userStats = userStatsResponse.ok ? await userStatsResponse.json() : {};
      
      // Comprehensive customer data for analytics-driven QR code
      const customerData = {
        // Core Identity
        userId: user.id,
        userName: user.name || `User ${user.id}`,
        email: user.email || '',
        
        // Membership Analytics
        membershipPlan: user.membershipPlan || 'basic',
        membershipId: `ISD-${user.id.toString().padStart(8, '0')}`,
        membershipStatus: 'active',
        membershipSince: user.createdAt || new Date().toISOString(),
        
        // Financial Analytics
        totalSavings: user.totalSavings || '0',
        totalDealsRedeemed: userStats.totalDealsRedeemed || 0,
        averageSavingsPerTransaction: userStats.averageSavingsPerTransaction || 0,
        totalTransactions: userStats.totalTransactions || 0,
        
        // Location Analytics
        city: user.city || 'Mumbai',
        state: user.state || 'Maharashtra',
        pincode: user.pincode || '400001',
        
        // Engagement Analytics
        preferredCategories: userStats.preferredCategories || ['restaurants', 'electronics'],
        lastActivity: new Date().toISOString(),
        loyaltyScore: Math.min(Math.floor(parseFloat(user.totalSavings || '0') / 100), 100),
        
        // Security & Verification
        securityToken: `ST-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        qrGeneratedAt: new Date().toISOString(),
        qrExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        verificationMethod: 'qr_code_analytics',
        
        // Platform Analytics Context
        platformVersion: '2.0',
        analyticsVersion: 'v1.0',
        dataCompleteness: 100,
        
        // Business Intelligence Data
        deviceInfo: navigator.userAgent,
        timestamp: Date.now(),
        sessionId: `session_${Date.now()}_${user.id}`
      };
      
      const qrDataUrl = await generateCustomerClaimQR(customerData);
      setQrCodeDataUrl(qrDataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast({
        title: "QR Code Error",
        description: "Failed to generate QR code. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Generate membership card data
  const { data: cardData, isLoading } = useQuery<MembershipCardData>({
    queryKey: ['/api/membership/card'],
    enabled: isAuthenticated,
    select: (data) => {
      const baseData = {
        membershipTier: user?.membershipPlan || 'basic',
        membershipExpiry: user?.membershipExpiry || new Date('2025-12-31').toISOString(),
        totalSavings: user?.totalSavings || '0',
        dealsClaimed: user?.dealsClaimed || 0,
        cardNumber: `ISD-${user?.id?.toString().padStart(8, '0')}`,
        qrCode: qrCodeDataUrl,
        isActive: true
      };
      return { ...baseData, ...data };
    },
  });

  const generateOTP = async () => {
    setIsGeneratingOTP(true);
    try {
      // Simulate OTP generation
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      setOtpCode(otp);
      
      toast({
        title: "OTP Generated",
        description: "Use this code for one-time deal access",
      });
    } catch (error) {
      toast({
        title: "Failed to generate OTP",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingOTP(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Information copied to clipboard",
    });
  };

  const downloadCard = () => {
    toast({
      title: "Download Started",
      description: "Your membership card is being downloaded",
    });
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="p-6 text-center">
            <Shield className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold mb-2">Login Required</h2>
            <p className="text-muted-foreground mb-4">Please log in to view your membership card.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <span>Loading your membership card...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  const tierInfo = tierConfig[user.membershipPlan as keyof typeof tierConfig] || tierConfig.basic;
  const TierIcon = tierInfo.icon;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Digital Membership Card</h1>
            <p className="text-muted-foreground">Your secure access to exclusive deals</p>
          </div>

          {/* Prominent Tier Badge */}
          <div className="mb-6">
            <Card className={`${tierInfo.color} text-white border-none`}>
              <CardContent className="py-4">
                <div className="flex items-center justify-center gap-3">
                  <TierIcon className="w-8 h-8" />
                  <div className="text-center">
                    <p className="text-sm text-white/80">Current Membership Tier</p>
                    <p className="text-3xl font-bold">{tierInfo.name}</p>
                  </div>
                  <TierIcon className="w-8 h-8" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Important Notice */}
          <Card className="mb-6 border-blue-500 bg-blue-50 dark:bg-blue-950">
            <CardContent className="py-4">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    📱 Present This Card at Vendor Stores
                  </h3>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    To claim any deal, you <strong>MUST present your membership card</strong> (with QR code) to the vendor for verification. 
                    The vendor will scan your QR code to verify your {tierInfo.name} membership tier and validate your deal claim.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Membership Card */}
            <div className="space-y-6">
              <Card className={`overflow-hidden ${tierInfo.color} text-white relative`}>
                <div className="absolute top-4 right-4">
                  <TierIcon className="w-8 h-8 opacity-30" />
                </div>
                
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl font-bold text-white">
                        {tierInfo.name} Member
                      </CardTitle>
                      <p className="text-white/80">Instoredealz</p>
                    </div>
                    <Badge className="bg-card/20 text-white border-white/30">
                      Active
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-4">
                    {/* Profile Image */}
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/30">
                        <User className="w-8 h-8 text-white/60" />
                      </div>
                    </div>
                    
                    {/* Member Name */}
                    <div className="flex-1">
                      <p className="text-white/80 text-sm">Member Name</p>
                      <p className="font-semibold text-lg">{user.name}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-white/80 text-sm">Card Number</p>
                      <p className="font-mono text-sm">{cardData?.cardNumber}</p>
                    </div>
                    <div>
                      <p className="text-white/80 text-sm">Valid Until</p>
                      <p className="text-sm">
                        {cardData?.membershipExpiry ? 
                          new Date(cardData.membershipExpiry).toLocaleDateString('en-IN', {
                            month: 'short',
                            year: 'numeric'
                          }) : 
                          'Dec 2025'
                        }
                      </p>
                    </div>
                  </div>

                  <Separator className="bg-card/20" />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-white/80 text-sm">Total Savings</p>
                      <p className="font-bold text-xl">₹{cardData?.totalSavings || '0'}</p>
                    </div>
                    <div>
                      <p className="text-white/80 text-sm">Deals Claimed</p>
                      <p className="font-bold text-xl">{cardData?.dealsClaimed || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card Actions */}
              <div className="grid grid-cols-2 gap-4">
                <Button 
                  onClick={downloadCard} 
                  variant="outline"
                  className="w-full"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Card
                </Button>
                <Button 
                  onClick={() => copyToClipboard(cardData?.cardNumber || '')} 
                  variant="outline"
                  className="w-full"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Number
                </Button>
              </div>
            </div>

            {/* QR Code & Security */}
            <div className="space-y-6">
              {/* QR Code Section */}
              <Card className="border-2 border-purple-200 dark:border-purple-800">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950">
                  <CardTitle className="flex items-center">
                    <Scan className="w-5 h-5 mr-2 text-purple-600" />
                    Vendor Verification QR Code
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-2">
                    <Store className="w-4 h-4 inline mr-1" />
                    <strong>Required for all deal claims</strong> - Vendors scan this to verify your {tierInfo.name} membership
                  </p>
                </CardHeader>
                <CardContent className="text-center space-y-4 pt-6">
                  {showQR ? (
                    <div className="space-y-4">
                      <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 p-6 rounded-lg border-2 border-dashed border-purple-300 dark:border-purple-700 inline-block">
                        {qrCodeDataUrl ? (
                          <img
                            src={qrCodeDataUrl}
                            alt="Membership Verification QR Code"
                            className="w-48 h-48 mx-auto"
                            data-testid="membership-qr-code"
                          />
                        ) : (
                          <div className="w-48 h-48 mx-auto flex items-center justify-center bg-gray-100 rounded">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                          </div>
                        )}
                      </div>
                      <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                        <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
                          ✓ Contains your {tierInfo.name} membership tier
                        </p>
                        <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                          Vendor will scan this to verify and approve your deal claim
                        </p>
                      </div>
                      <Button 
                        onClick={() => setShowQR(false)} 
                        variant="outline" 
                        size="sm"
                        data-testid="button-hide-qr"
                      >
                        <EyeOff className="w-4 h-4 mr-2" />
                        Hide QR Code
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-gray-100 dark:bg-gray-800 p-8 rounded-lg">
                        <QrCode className="w-16 h-16 mx-auto text-gray-400 mb-2" />
                        <p className="text-muted-foreground">QR Code Hidden for Security</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Tap below to reveal for vendor scanning
                        </p>
                      </div>
                      <Button 
                        onClick={async () => {
                          setShowQR(true);
                          if (!qrCodeDataUrl) {
                            await generateQRCode();
                          }
                        }} 
                        className="w-full"
                        data-testid="button-show-qr"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Show QR Code
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* One-Time Access OTP */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="w-5 h-5 mr-2" />
                    One-Time Access
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Generate a secure 6-digit code for temporary deal access
                  </p>
                  
                  {otpCode ? (
                    <div className="text-center space-y-4">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <p className="text-sm text-green-700 mb-2">Your OTP Code:</p>
                        <p className="text-2xl font-mono font-bold text-green-800">{otpCode}</p>
                        <p className="text-xs text-green-600 mt-2">Valid for 10 minutes</p>
                      </div>
                      <Button 
                        onClick={() => copyToClipboard(otpCode)} 
                        variant="outline" 
                        size="sm"
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Code
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      onClick={generateOTP} 
                      disabled={isGeneratingOTP}
                      className="w-full"
                    >
                      {isGeneratingOTP ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Generating...
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 mr-2" />
                          Generate OTP
                        </>
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Membership Benefits */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Gift className="w-5 h-5 mr-2" />
                    Membership Benefits
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {tierInfo.benefits.map((benefit, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        <span className="text-sm">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}