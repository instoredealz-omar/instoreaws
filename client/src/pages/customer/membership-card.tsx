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
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

  // Generate membership card data
  const { data: cardData, isLoading } = useQuery<MembershipCardData>({
    queryKey: ['/api/membership/card'],
    enabled: isAuthenticated,
    select: (data) => ({
      membershipTier: user?.membershipPlan || 'basic',
      membershipExpiry: user?.membershipExpiry || new Date('2025-12-31').toISOString(),
      totalSavings: user?.totalSavings || '0',
      dealsClaimed: user?.dealsClaimed || 0,
      cardNumber: `ISD-${user?.id?.toString().padStart(8, '0')}`,
      qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(JSON.stringify({
        userId: user?.id,
        membershipTier: user?.membershipPlan,
        cardNumber: `ISD-${user?.id?.toString().padStart(8, '0')}`,
        expiry: user?.membershipExpiry,
        timestamp: Date.now()
      }))}`,
      isActive: true,
      ...data
    }),
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
                      {user.profileImage ? (
                        <img
                          src={user.profileImage}
                          alt={user.name}
                          className="w-16 h-16 rounded-full object-cover border-2 border-white/30"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/30">
                          <User className="w-8 h-8 text-white/60" />
                        </div>
                      )}
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
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <QrCode className="w-5 h-5 mr-2" />
                    Secure QR Code
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  {showQR ? (
                    <div className="space-y-4">
                      <div className="bg-card p-4 rounded-lg border-2 border-dashed border-gray-300 inline-block">
                        <img
                          src={cardData?.qrCode}
                          alt="Membership QR Code"
                          className="w-48 h-48 mx-auto"
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Show this QR code to vendors for instant deal verification
                      </p>
                      <Button 
                        onClick={() => setShowQR(false)} 
                        variant="outline" 
                        size="sm"
                      >
                        <EyeOff className="w-4 h-4 mr-2" />
                        Hide QR Code
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-gray-100 p-8 rounded-lg">
                        <QrCode className="w-16 h-16 mx-auto text-gray-400 mb-2" />
                        <p className="text-muted-foreground">QR Code Hidden for Security</p>
                      </div>
                      <Button 
                        onClick={() => setShowQR(true)} 
                        className="w-full"
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