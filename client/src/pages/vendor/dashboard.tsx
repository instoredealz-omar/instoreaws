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
  BookOpen
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
  
  // Add debug logging for vendor approval status
  useEffect(() => {
    if (vendor) {
      console.log('Vendor data loaded:', {
        businessName: vendor.businessName,
        isApproved: vendor.isApproved,
        vendorId: vendor.id,
        approvalStatus: typeof vendor.isApproved
      });
    }
  }, [vendor]);
  const totalDeals = deals?.length || 0;
  const activeDeals = deals?.filter((deal: any) => deal.isActive && deal.isApproved).length || 0;
  const pendingDeals = deals?.filter((deal: any) => !deal.isApproved).length || 0;
  const totalRedemptions = deals?.reduce((sum: number, deal: any) => sum + (deal.currentRedemptions || 0), 0) || 0;
  const totalViews = deals?.reduce((sum: number, deal: any) => sum + (deal.viewCount || 0), 0) || 0;

  const stats = [
    {
      title: "Active Deals",
      value: activeDeals,
      icon: Store,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Total Redemptions",
      value: totalRedemptions,
      icon: TrendingUp,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      title: "Total Views",
      value: totalViews.toLocaleString(),
      icon: Eye,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      title: "Rating",
      value: vendor?.rating ? `${vendor.rating}/5` : "N/A",
      icon: Star,
      color: "text-royal",
      bgColor: "bg-royal/10",
    },
  ];

  const recentDeals = deals?.slice(0, 5) || [];

  // Chart data for vendor analytics
  const dealPerformanceData = (deals || []).map((deal: any) => ({
    name: deal.title.length > 15 ? deal.title.substring(0, 15) + '...' : deal.title,
    views: deal.viewCount || 0,
    redemptions: deal.currentRedemptions || 0,
    conversionRate: deal.viewCount > 0 ? ((deal.currentRedemptions || 0) / deal.viewCount * 100).toFixed(1) : 0
  })).slice(0, 8);

  const monthlyRedemptionData = [
    { month: 'Jan', redemptions: 12, revenue: 8400 },
    { month: 'Feb', redemptions: 18, revenue: 12600 },
    { month: 'Mar', redemptions: 25, revenue: 17500 },
    { month: 'Apr', redemptions: 32, revenue: 22400 },
    { month: 'May', redemptions: 28, revenue: 19600 },
    { month: 'Jun', redemptions: 35, revenue: 24500 },
  ];

  const dealStatusData = [
    { name: 'Active', value: activeDeals, color: 'hsl(var(--chart-2))' },
    { name: 'Pending', value: pendingDeals, color: 'hsl(var(--chart-3))' },
    { name: 'Inactive', value: totalDeals - activeDeals - pendingDeals, color: 'hsl(var(--chart-6))' }
  ];

  const chartConfig = {
    views: {
      label: "Views",
      color: "hsl(var(--chart-1))",
    },
    redemptions: {
      label: "Redemptions",
      color: "hsl(var(--chart-2))",
    },
    revenue: {
      label: "Revenue",
      color: "hsl(var(--chart-4))",
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
              const gradientClass = index === 0 ? 'stat-card-primary' : 
                                   index === 1 ? 'stat-card-success' : 
                                   index === 2 ? 'stat-card-warning' : 'stat-card-danger';
              return (
                <div key={stat.title} className={`stat-card ${gradientClass} rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 shadow-lg`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/80 text-xs sm:text-sm font-medium">{stat.title}</p>
                      <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mt-1 sm:mt-2">{stat.value}</p>
                      <div className="flex items-center mt-1 sm:mt-2">
                        <span className="text-white/90 text-xs sm:text-sm">{stat.change}</span>
                        {stat.changeType === 'increase' ? (
                          <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-white/90 ml-1" />
                        ) : (
                          <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-white/90 ml-1 rotate-180" />
                        )}
                      </div>
                    </div>
                    <div className="bg-card/20 p-2 sm:p-3 lg:p-4 rounded-full backdrop-blur-sm">
                      <Icon className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-white" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Analytics Charts */}
        {(vendor as any) && isApproved && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8 mb-8">
            {/* Deal Performance Chart */}
            <div className="glass-card">
              <div className="p-4 sm:p-6 border-b border-gray-200/50">
                <h3 className="text-base sm:text-lg font-semibold gradient-text flex items-center">
                  <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-600" />
                  Deal Performance
                </h3>
              </div>
              <div className="p-4 sm:p-6">
                <ChartContainer config={chartConfig} className="min-h-[250px] sm:min-h-[300px] w-full overflow-hidden">
                  <BarChart data={dealPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(156, 163, 175, 0.3)" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45} 
                      textAnchor="end" 
                      height={80}
                      tick={{ fill: '#6B7280', fontSize: 12 }}
                    />
                    <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} />
                    <ChartTooltip 
                      content={<ChartTooltipContent />}
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid rgba(0, 0, 0, 0.1)',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                      }}
                    />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar dataKey="views" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="redemptions" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </div>
            </div>

            {/* Monthly Trends */}
            <div className="glass-card">
              <div className="p-4 sm:p-6 border-b border-gray-200/50">
                <h3 className="text-base sm:text-lg font-semibold gradient-text flex items-center">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-green-600" />
                  Monthly Performance
                </h3>
              </div>
              <div className="p-4 sm:p-6">
                <ChartContainer config={chartConfig} className="min-h-[250px] sm:min-h-[300px] w-full overflow-hidden">
                  <LineChart data={monthlyRedemptionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(156, 163, 175, 0.3)" />
                    <XAxis dataKey="month" tick={{ fill: '#6B7280', fontSize: 12 }} />
                    <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} />
                    <ChartTooltip 
                      content={<ChartTooltipContent />}
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid rgba(0, 0, 0, 0.1)',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                      }}
                    />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Line type="monotone" dataKey="redemptions" stroke="hsl(var(--chart-2))" strokeWidth={3} dot={{ fill: 'hsl(var(--chart-2))', strokeWidth: 2, r: 4 }} />
                    <Line type="monotone" dataKey="revenue" stroke="hsl(var(--chart-4))" strokeWidth={3} dot={{ fill: 'hsl(var(--chart-4))', strokeWidth: 2, r: 4 }} />
                  </LineChart>
                </ChartContainer>
              </div>
            </div>

            {/* Deal Status Distribution */}
            <div className="glass-card">
              <div className="p-4 sm:p-6 border-b border-gray-200/50">
                <h3 className="text-base sm:text-lg font-semibold gradient-text flex items-center">
                  <Target className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-purple-600" />
                  Deal Status Distribution
                </h3>
              </div>
              <div className="p-4 sm:p-6">
                <ChartContainer config={chartConfig} className="min-h-[250px] sm:min-h-[300px] w-full overflow-hidden">
                  <PieChart>
                    <Pie
                      data={dealStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={90}
                      dataKey="value"
                      paddingAngle={3}
                    >
                      {dealStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip 
                      content={<ChartTooltipContent />}
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid rgba(0, 0, 0, 0.1)',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                      }}
                    />
                    <ChartLegend content={<ChartLegendContent />} />
                  </PieChart>
                </ChartContainer>
              </div>
            </div>

            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Key Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Average Views per Deal</span>
                    <span className="font-semibold">{totalDeals > 0 ? Math.round(totalViews / totalDeals) : 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Conversion Rate</span>
                    <span className="font-semibold">
                      {totalViews > 0 ? ((totalRedemptions / totalViews) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Revenue per Deal</span>
                    <span className="font-semibold">₹{totalDeals > 0 ? Math.round(24500 / totalDeals) : 0}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full" 
                      style={{ width: `${Math.min((totalRedemptions / (totalDeals * 10)) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500">Performance Score: {Math.min(Math.round((totalRedemptions / (totalDeals * 10)) * 100), 100)}%</p>
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
                            <span className="text-gray-500">Valid Until:</span>
                            <p className="font-medium text-foreground">
                              {new Date(deal.validUntil).toLocaleDateString('en-IN')}
                            </p>
                          </div>
                        </div>
                        
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
