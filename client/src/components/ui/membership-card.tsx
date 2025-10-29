import { QrCode, User } from "lucide-react";
import { generateCustomerClaimQR } from "@/lib/qr-code";
import { useEffect, useState } from "react";

interface MembershipCardProps {
  userName: string;
  membershipId: string;
  membershipPlan: string;
  expiryDate?: string;
  totalSavings: string;
  isPromotionalUser?: boolean;
  userId: number;
  profileImage?: string;
  userEmail?: string;
  userPhone?: string;
}

export default function MembershipCard({
  userName,
  membershipId,
  membershipPlan,
  expiryDate,
  totalSavings,
  isPromotionalUser,
  userId,
  profileImage,
  userEmail,
  userPhone,
}: MembershipCardProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");

  useEffect(() => {
    const generateQR = async () => {
      try {
        const qrCode = await generateCustomerClaimQR({
          userId,
          userName,
          email: userEmail || `user${userId}@instoredealz.com`,
          membershipPlan,
          membershipId,
          phone: userPhone,
          totalSavings
        });
        setQrCodeUrl(qrCode);
      } catch (error) {
        console.error('Error generating QR code:', error);
        // Fallback QR code
        setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(membershipId)}`);
      }
    };
    
    generateQR();
  }, [userId, membershipId, userName, userEmail, membershipPlan, userPhone, totalSavings]);

  const getPlanColor = (plan: string | null | undefined) => {
    if (!plan) return "bg-gradient-to-br from-gray-600 to-gray-700";
    
    switch (plan.toLowerCase()) {
      case "premium":
        return "membership-card"; // Uses CSS class with gradient
      case "ultimate":
        return "bg-gradient-to-br from-royal to-purple-600";
      default:
        return "bg-gradient-to-br from-gray-600 to-gray-700";
    }
  };

  const formatSavings = (savings: string) => {
    const amount = parseFloat(savings);
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    } else if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(1)}K`;
    }
    return `₹${amount.toFixed(0)}`;
  };

  return (
    <div className={`${getPlanColor(membershipPlan)} rounded-2xl text-white p-6 relative overflow-hidden`}>
      {/* Background Pattern */}
      <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
        <div className="w-full h-full bg-card rounded-full transform translate-x-16 -translate-y-16" />
      </div>
      <div className="absolute bottom-0 left-0 w-24 h-24 opacity-10">
        <div className="w-full h-full bg-card rounded-full transform -translate-x-12 translate-y-12" />
      </div>

      {/* Prominent Tier Badge */}
      <div className="mb-4 text-center relative z-10">
        <div className="bg-white/20 backdrop-blur-sm rounded-lg py-2 px-4 inline-block border border-white/30">
          <p className="text-white/90 text-xs uppercase tracking-wider mb-1">Membership Tier</p>
          <h2 className="text-2xl font-bold text-white uppercase tracking-wide">
            {membershipPlan}
          </h2>
        </div>
      </div>

      {/* Card Header */}
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="flex items-center space-x-3">
          {/* Profile Image */}
          <div className="flex-shrink-0">
            {profileImage ? (
              <img
                src={profileImage}
                alt={userName}
                className="w-12 h-12 rounded-full object-cover border-2 border-white/30"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/30">
                <User className="w-6 h-6 text-white/60" />
              </div>
            )}
          </div>
          
          {/* User Info */}
          <div>
            <h3 className="text-lg font-semibold">
              {userName}
            </h3>
            {isPromotionalUser && (
              <div className="bg-success text-white text-xs px-2 py-1 rounded-full mt-1 inline-block">
                🎉 Promotional Plan
              </div>
            )}
            <p className="text-blue-100 text-sm mt-1">ID: {membershipId}</p>
          </div>
        </div>
        <div className="bg-card p-2 rounded" title="Show this QR code to vendors">
          {qrCodeUrl ? (
            <img src={qrCodeUrl} alt="Membership Verification QR Code" className="w-16 h-16" data-testid="card-qr-code" />
          ) : (
            <div className="w-16 h-16 bg-gray-200 flex items-center justify-center">
              <QrCode className="h-8 w-8 text-gray-500" />
            </div>
          )}
        </div>
      </div>

      {/* Card Footer */}
      <div className="border-t border-blue-300 pt-4 relative z-10">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-blue-100">
              {expiryDate ? `Valid until: ${new Date(expiryDate).toLocaleDateString('en-IN')}` : "Lifetime validity"}
            </p>
            <p className="text-sm text-blue-100">
              Total Savings: {formatSavings(totalSavings)}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{formatSavings(totalSavings)}</div>
            <div className="text-xs text-blue-100">Saved</div>
          </div>
        </div>
      </div>

      {/* Promotional Banner */}
      {isPromotionalUser && expiryDate && (
        <div className="absolute top-2 left-2 right-2 bg-success/20 backdrop-blur-sm rounded-lg p-2 border border-success/30">
          <p className="text-xs text-center font-medium">
            Free Premium Plan until {new Date(expiryDate).toLocaleDateString('en-IN')}
          </p>
        </div>
      )}
    </div>
  );
}
