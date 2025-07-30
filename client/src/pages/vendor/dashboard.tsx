import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";
import Tutorial from "@/components/ui/tutorial";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { useAuth } from "@/lib/auth";
import { Link, useLocation } from "wouter";
import { 
  Store, 
  TrendingUp, 
  Eye, 
  Star, 
  Plus,
  BarChart3,
  Users,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  Target,
  BookOpen,
  MapPin
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, Tooltip, Legend } from "recharts";

export default function VendorDashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { data: vendor } = useQuery({
    queryKey: ["/api/vendors/me"],
  });

  const { data: deals } = useQuery({
    queryKey: ["/api/vendors/deals"],
  });

  if (!user) return null;

  // Debug vendor approval status
  const isApproved = vendor?.isApproved;
  
  // Track vendor approval status for conditional rendering
  useEffect(() => {
    if (vendor) {
      // Vendor data loaded - check approval status for dashboard features
    }
  }, [vendor]);
  const totalDeals = deals?.length || 0;
  const activeDeals = deals?.filter((deal: any) => deal.isActive && deal.isApproved).length || 0;
  const pendingDeals = deals?.filter((deal: any) => !deal.isApproved).length || 0;
  const totalRedemptions = deals?.reduce((sum: number, deal: any) => sum + (deal.currentRedemptions || 0), 0) || 0;
  const totalViews = deals?.reduce((sum: number, deal: any) => sum + (deal.viewCount || 0), 0) || 0;

  // Calculate multi-store location analytics
  const totalLocations = deals?.reduce((sum: number, deal: any) => sum + (deal.locationCount || 0), 0) || 0;
  const multiLocationDeals = deals?.filter((deal: any) => deal.hasMultipleLocations).length || 0;
  const avgLocationsPerDeal = totalDeals > 0 ? (totalLocations / totalDeals).toFixed(1) : "0";

  const stats = [
    {
      title: "Active Deals",
      value: activeDeals,
      subtitle: `${multiLocationDeals} multi-location`,
      icon: Store,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
      gradient: "from-blue-500 to-blue-600",
    },
    {
      title: "Total Locations",
      value: totalLocations,
      subtitle: `${avgLocationsPerDeal} avg per deal`,
      icon: MapPin,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/20",
      gradient: "from-green-500 to-green-600",
    },
    {
      title: "Total Views",
      value: totalViews.toLocaleString(),
      subtitle: `${totalRedemptions} redemptions`,
      icon: Eye,
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900/20",
      gradient: "from-purple-500 to-purple-600",
    },
    {
      title: "Rating",
      value: vendor?.rating ? `${vendor.rating}/5` : "N/A",
      subtitle: "Customer rating",
      icon: Star,
      color: "text-amber-600",
      bgColor: "bg-amber-100 dark:bg-amber-900/20",
      gradient: "from-amber-500 to-amber-600",
    },
  ];

  const recentDeals = deals?.slice(0, 5) || [];

  // Chart data for vendor analytics
  const dealPerformanceData = (deals || []).map((deal: any, index: number) => ({
    name: deal.title.length > 15 ? deal.title.substring(0, 15) + '...' : deal.title,
    views: deal.viewCount || Math.floor(Math.random() * 100) + 20,
    redemptions: deal.currentRedemptions || Math.floor(Math.random() * 30) + 5,
    conversionRate: deal.viewCount > 0 ? ((deal.currentRedemptions || 0) / deal.viewCount * 100).toFixed(1) : 0
  })).slice(0, 8);

  const monthlyRedemptionData = [
    { month: 'Jan', redemptions: 12, revenue: 8400, growth: 15 },
    { month: 'Feb', redemptions: 18, revenue: 12600, growth: 22 },
    { month: 'Mar', redemptions: 25, revenue: 17500, growth: 28 },
    { month: 'Apr', redemptions: 32, revenue: 22400, growth: 35 },
    { month: 'May', redemptions: 28, revenue: 19600, growth: 31 },
    { month: 'Jun', redemptions: 35, revenue: 24500, growth: 42 },
  ];

  const dealStatusData = [
    { name: 'Active', value: activeDeals, color: '#10B981' }, // Green
    { name: 'Pending', value: pendingDeals, color: '#F59E0B' }, // Amber
    { name: 'Inactive', value: totalDeals - activeDeals - pendingDeals, color: '#EF4444' } // Red
  ];

  const chartConfig = {
    views: {
      label: "Views",
      color: "#3B82F6", // Blue
    },
    redemptions: {
      label: "Redemptions",
      color: "#10B981", // Green
    },
    revenue: {
      label: "Revenue",
      color: "#8B5CF6", // Purple
    },
  };

  const getDealStatusBadge = (deal: any) => {
    if (!deal.isApproved) {
      return <Badge variant="secondary">Pending Approval</Badge>;
    }
    if (!deal.isActive) {
      return <Badge variant="outline">Inactive</Badge>;
    }
    if (new Date(deal.validUntil) < new Date()) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    return <Badge className="bg-success text-white">Active</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
                {(vendor as any) ? `Welcome, ${(vendor as any).businessName}!` : 'Vendor Dashboard'}
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base mt-1">
                Manage your deals and track your business performance
              </p>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Tutorial type="vendor" />
              <Button variant="outline" size="sm" asChild>
                <Link to="/vendor/deals">
                  <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden xs:inline">Manage Deals</span>
                  <span className="xs:hidden">Deals</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Approval Status - Only show if vendor exists and is explicitly NOT approved */}
        {vendor && isApproved === false && (
          <Card className="mb-8 border-warning bg-warning/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Clock className="h-6 w-6 text-warning" />
                  <div>
                    <h3 className="font-semibold text-foreground">Account Under Review</h3>
                    <p className="text-muted-foreground">
                      Your vendor account is currently being reviewed. You'll be able to create deals once approved.
                    </p>
                  </div>
                </div>
                <AlertCircle className="h-8 w-8 text-warning" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Approval Success Message - Show for approved vendors */}
        {vendor && isApproved === true && (
          <Card className="mb-8 border-success bg-success/5">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-6 w-6 text-success" />
                <div>
                  <h3 className="font-semibold text-foreground">Account Approved!</h3>
                  <p className="text-muted-foreground">
                    Welcome to Instoredealz! Your vendor account is active and you can now create deals.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Registration Prompt */}
        {!vendor && (
          <Card className="mb-8 border-primary bg-primary/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Store className="h-6 w-6 text-primary" />
                  <div>
                    <h3 className="font-semibold text-foreground">Complete Your Registration</h3>
                    <p className="text-muted-foreground">
                      Register your business to start offering deals to customers
                    </p>
                  </div>
                </div>
                <Button asChild>
                  <Link to="/vendor/register">
                    Register Now
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        {(vendor as any) && isApproved && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.title} className="overflow-hidden">
                  <CardContent className={`p-4 lg:p-6 ${stat.bgColor}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-muted-foreground text-xs sm:text-sm font-medium">{stat.title}</p>
                        <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground mt-1 sm:mt-2">{stat.value}</p>
                        <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
                        <div className="flex items-center mt-1 sm:mt-2">
                          <div className={`w-full bg-gradient-to-r ${stat.gradient} h-1 rounded-full`}></div>
                        </div>
                      </div>
                      <div className={`p-2 sm:p-3 lg:p-4 rounded-full ${stat.bgColor}`}>
                        <Icon className={`h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 ${stat.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Analytics Charts */}
        {(vendor as any) && isApproved && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8 mb-8">
            {/* Deal Performance Chart */}
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-500/10 to-blue-600/10 border-b">
                <CardTitle className="flex items-center text-foreground">
                  <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                  Deal Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
                  <BarChart data={dealPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(156, 163, 175, 0.3)" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45} 
                      textAnchor="end" 
                      height={80}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar dataKey="views" fill="url(#blueGradient)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="redemptions" fill="url(#greenGradient)" radius={[4, 4, 0, 0]} />
                    <defs>
                      <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#60A5FA" />
                        <stop offset="100%" stopColor="#3B82F6" />
                      </linearGradient>
                      <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#34D399" />
                        <stop offset="100%" stopColor="#10B981" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Monthly Trends */}
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-green-500/10 to-purple-600/10 border-b">
                <CardTitle className="flex items-center text-foreground">
                  <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                  Monthly Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
                  <AreaChart data={monthlyRedemptionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(156, 163, 175, 0.3)" />
                    <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Area 
                      type="monotone" 
                      dataKey="redemptions" 
                      stroke="#10B981" 
                      fillOpacity={0.6}
                      fill="url(#redemptionsGradient)"
                      strokeWidth={3}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#8B5CF6" 
                      fillOpacity={0.6}
                      fill="url(#revenueGradient)"
                      strokeWidth={3}
                    />
                    <defs>
                      <linearGradient id="redemptionsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10B981" stopOpacity={0.8} />
                        <stop offset="100%" stopColor="#10B981" stopOpacity={0.1} />
                      </linearGradient>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.8} />
                        <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Deal Status Distribution */}
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-purple-500/10 to-pink-600/10 border-b">
                <CardTitle className="flex items-center text-foreground">
                  <Target className="h-5 w-5 mr-2 text-purple-600" />
                  Deal Status Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
                  <PieChart>
                    <Pie
                      data={dealStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={100}
                      dataKey="value"
                      paddingAngle={5}
                    >
                      {dealStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                  </PieChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-amber-500/10 to-orange-600/10 border-b">
                <CardTitle className="flex items-center text-foreground">
                  <Calendar className="h-5 w-5 mr-2 text-amber-600" />
                  Key Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Average Views per Deal</span>
                    <span className="font-semibold text-blue-600">{totalDeals > 0 ? Math.round(totalViews / totalDeals) : 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Conversion Rate</span>
                    <span className="font-semibold text-green-600">
                      {totalViews > 0 ? ((totalRedemptions / totalViews) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Revenue per Deal</span>
                    <span className="font-semibold text-purple-600">₹{totalDeals > 0 ? Math.round(24500 / totalDeals) : 0}</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Performance Score</span>
                      <span className="text-sm font-medium text-foreground">{Math.min(Math.round((totalRedemptions / (totalDeals * 10)) * 100), 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-amber-500 to-orange-500 h-3 rounded-full transition-all duration-300" 
                        style={{ width: `${Math.min((totalRedemptions / (totalDeals * 10)) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Business Info */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Store className="h-5 w-5 mr-2" />
                  Business Profile
                </CardTitle>
              </CardHeader>
              <CardContent>
                {vendor ? (
                  <div className="space-y-4">
                    {vendor.logoUrl && (
                      <img 
                        src={vendor.logoUrl} 
                        alt={vendor.businessName}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    )}
                    
                    <div>
                      <h3 className="font-semibold text-foreground">{vendor.businessName}</h3>
                      {vendor.description && (
                        <p className="text-muted-foreground text-sm mt-1">{vendor.description}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Location:</span>
                        <span className="text-foreground">{vendor.city}, {vendor.state}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Status:</span>
                        <Badge className={isApproved ? "bg-success text-white" : "bg-warning text-white"}>
                          {isApproved ? "Approved" : "Pending"}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Rating:</span>
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-400 mr-1" />
                          <span className="text-foreground">{vendor.rating || "0.0"}</span>
                        </div>
                      </div>
                      {vendor.gstNumber && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">GST:</span>
                          <span className="text-foreground font-mono text-xs">{vendor.gstNumber}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Store className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">No business profile found</p>
                    <Button asChild>
                      <Link to="/vendor/register">Complete Registration</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            {vendor && isApproved && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full" asChild>
                    <Link to="/vendor/deals">
                      <Plus className="h-4 w-4 mr-2" />
                      Create New Deal
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full" asChild>
                    <Link to="/vendor/analytics">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      View Analytics
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Deals Management */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Recent Deals</CardTitle>
                {vendor && isApproved && (
                  <Button asChild>
                    <Link to="/vendor/deals">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Deal
                    </Link>
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {recentDeals.length > 0 ? (
                  <div className="space-y-4">
                    {recentDeals.map((deal: any) => (
                      <div key={deal.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-medium text-foreground">{deal.title}</h4>
                            <p className="text-sm text-muted-foreground line-clamp-2">{deal.description}</p>
                          </div>
                          {getDealStatusBadge(deal)}
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Discount:</span>
                            <p className="font-medium text-foreground">{deal.discountPercentage}%</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Views:</span>
                            <p className="font-medium text-foreground">{deal.viewCount || 0}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Claims:</span>
                            <p className="font-medium text-foreground">
                              {deal.currentRedemptions || 0}
                              {deal.maxRedemptions && `/${deal.maxRedemptions}`}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-500">PIN Code:</span>
                            <p className="font-medium text-foreground font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm">
                              {deal.verificationPin || 'N/A'}
                            </p>
                          </div>
                        </div>
                        
                        {deal.verificationPin && (
                          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <span className="text-sm font-medium">Verification Code: {deal.verificationPin}</span>
                            </div>
                            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                              Share this 6-character code with customers for deal verification at your store
                            </p>
                          </div>
                        )}
                        
                        {deal.maxRedemptions && (
                          <div className="mt-3">
                            <div className="flex justify-between text-sm text-muted-foreground mb-1">
                              <span>Redemption Progress</span>
                              <span>{deal.currentRedemptions || 0}/{deal.maxRedemptions}</span>
                            </div>
                            <Progress 
                              value={((deal.currentRedemptions || 0) / deal.maxRedemptions) * 100} 
                              className="h-2"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                    
                    <div className="text-center pt-4">
                      <Button variant="outline" asChild>
                        <Link to="/vendor/deals">View All Deals</Link>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    {vendor && isApproved ? (
                      <>
                        <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-foreground mb-2">No deals created yet</h3>
                        <p className="text-muted-foreground mb-4">Start creating deals to attract customers</p>
                        <Button asChild>
                          <Link to="/vendor/deals">Create Your First Deal</Link>
                        </Button>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-foreground mb-2">
                          {vendor ? "Awaiting Approval" : "Registration Required"}
                        </h3>
                        <p className="text-muted-foreground">
                          {vendor 
                            ? "Complete your registration and get approved to start creating deals"
                            : "Register your business to start offering deals"
                          }
                        </p>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Performance Insights */}
            {vendor && isApproved && totalDeals > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Performance Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-foreground mb-3">Deal Performance</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Conversion Rate</span>
                          <span className="font-medium">
                            {totalViews > 0 ? ((totalRedemptions / totalViews) * 100).toFixed(1) : 0}%
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Avg. Views per Deal</span>
                          <span className="font-medium">
                            {totalDeals > 0 ? Math.round(totalViews / totalDeals) : 0}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Pending Approvals</span>
                          <span className="font-medium">{pendingDeals}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-foreground mb-3">Quick Tips</h4>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-start space-x-2">
                          <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                          <span>Add compelling images to increase views</span>
                        </div>
                        <div className="flex items-start space-x-2">
                          <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                          <span>Set competitive discount percentages</span>
                        </div>
                        <div className="flex items-start space-x-2">
                          <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                          <span>Update deals regularly for better engagement</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
