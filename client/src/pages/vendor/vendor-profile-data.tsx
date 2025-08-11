import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";
import VendorDataTable from "@/components/vendor-data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { Link } from "wouter";
import { 
  Building, 
  TrendingUp, 
  Plus,
  BarChart3,
  AlertCircle,
  CheckCircle,
  Clock,
  User,
  MapPin,
  Star,
  Calendar,
  CreditCard,
  Store
} from "lucide-react";

export default function VendorProfileData() {
  const { user } = useAuth();

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { data: vendor, isLoading: vendorLoading } = useQuery({
    queryKey: ["/api/vendors/me"],
  });

  const { data: deals, isLoading: dealsLoading } = useQuery({
    queryKey: ["/api/vendors/deals"],
  });

  if (!user) return null;

  const isApproved = vendor?.isApproved;
  const totalDeals = deals?.length || 0;
  const activeDeals = deals?.filter((deal: any) => deal.isActive && deal.isApproved).length || 0;
  const pendingDeals = deals?.filter((deal: any) => !deal.isApproved).length || 0;
  const totalRedemptions = deals?.reduce((sum: number, deal: any) => sum + (deal.currentRedemptions || 0), 0) || 0;

  const getStatusBadge = () => {
    if (!vendor) return null;
    
    if (vendor.isApproved) {
      return (
        <Badge className="bg-success/10 text-success">
          <CheckCircle className="h-4 w-4 mr-1" />
          Approved & Active
        </Badge>
      );
    } else {
      return (
        <Badge variant="secondary">
          <Clock className="h-4 w-4 mr-1" />
          Pending Admin Approval
        </Badge>
      );
    }
  };

  // Quick stats for vendor overview
  const quickStats = [
    {
      title: "Account Status",
      value: getStatusBadge(),
      icon: isApproved ? CheckCircle : Clock,
      color: isApproved ? "text-success" : "text-warning",
    },
    {
      title: "Total Deals",
      value: totalDeals,
      subtitle: `${activeDeals} active`,
      icon: Store,
      color: "text-blue-600",
    },
    {
      title: "Total Redemptions",
      value: totalRedemptions,
      subtitle: "Customer claims",
      icon: TrendingUp,
      color: "text-green-600",
    },
    {
      title: "Vendor Rating",
      value: vendor?.rating ? `${vendor.rating}/5` : "N/A",
      subtitle: "Customer feedback",
      icon: Star,
      color: "text-amber-600",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Vendor Profile & Data</h1>
              <p className="text-muted-foreground mt-1">
                Complete overview of your business registration and performance
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {isApproved && (
                <Link href="/vendor/deals">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Deal
                  </Button>
                </Link>
              )}
              <Link href="/vendor/dashboard">
                <Button variant="outline">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Status Alert */}
        {vendor && !vendor.isApproved && (
          <Card className="mb-8 border-yellow-200 dark:border-yellow-800">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <AlertCircle className="h-6 w-6 text-warning" />
                <div>
                  <h3 className="font-semibold text-foreground">Account Under Review</h3>
                  <p className="text-muted-foreground text-sm">
                    Your vendor application is currently being reviewed by our admin team. 
                    You'll be notified once approved and can then start creating deals.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {quickStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                      <div className="mt-2">
                        {typeof stat.value === 'object' ? stat.value : (
                          <>
                            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                            {stat.subtitle && (
                              <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Business Overview */}
        {vendor && (
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Building className="h-5 w-5 mr-2" />
                  Business Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Business Name:</span>
                  <span className="text-sm font-medium">{vendor.businessName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Vendor ID:</span>
                  <span className="text-sm font-medium">#{vendor.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">User ID:</span>
                  <span className="text-sm font-medium">#{vendor.userId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Registration:</span>
                  <span className="text-sm">
                    {vendor.createdAt ? new Date(vendor.createdAt).toLocaleDateString('en-IN') : 'N/A'}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Location Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">City:</span>
                  <span className="text-sm font-medium">{vendor.city}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">State:</span>
                  <span className="text-sm font-medium">{vendor.state}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Pincode:</span>
                  <span className="text-sm font-medium">{vendor.pincode}</span>
                </div>
                {vendor.address && (
                  <div>
                    <span className="text-sm text-muted-foreground">Address:</span>
                    <p className="text-sm mt-1">{vendor.address}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Tax Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">PAN Number:</span>
                  <span className="text-sm font-medium font-mono">{vendor.panNumber}</span>
                </div>
                {vendor.gstNumber && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">GST Number:</span>
                    <span className="text-sm font-medium font-mono">{vendor.gstNumber}</span>
                  </div>
                )}
                {vendor.companyWebsite && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Website:</span>
                    <a 
                      href={vendor.companyWebsite} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      Visit Website
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Comprehensive Vendor Data Table */}
        <VendorDataTable 
          showFilters={false} 
          compact={false}
        />

        {/* Action Items */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Next Steps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {!isApproved ? (
                  <div className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <div>
                      <h4 className="font-medium text-foreground">Awaiting Admin Approval</h4>
                      <p className="text-sm text-muted-foreground">
                        Your application is under review. Approval typically takes 1-2 business days.
                      </p>
                    </div>
                    <Clock className="h-6 w-6 text-warning" />
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    <Link href="/vendor/deals">
                      <Button className="w-full" size="lg">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Your First Deal
                      </Button>
                    </Link>
                    <Link href="/vendor/profile">
                      <Button variant="outline" className="w-full" size="lg">
                        <User className="h-4 w-4 mr-2" />
                        Update Profile
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}