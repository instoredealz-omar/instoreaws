import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";
import { 
  BarChart3, 
  TrendingUp, 
  Eye, 
  Target, 
  Clock, 
  DollarSign,
  ArrowLeft,
  Calendar,
  Users,
  Star,
  Filter,
  Download,
  RefreshCw,
  Zap,
  Activity,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  AlertCircle,
  CheckCircle,
  XCircle,
  Settings,
  Info
} from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  Area,
  AreaChart,
  ComposedChart,
  ReferenceLine
} from 'recharts';

export default function VendorAnalytics() {
  const { user } = useAuth();
  
  // State for interactivity
  const [timeRange, setTimeRange] = useState("30d");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [chartType, setChartType] = useState("bar");
  const [refreshing, setRefreshing] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedDeal, setSelectedDeal] = useState<any>(null);

  // Fetch deals data
  const { data: deals = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/vendors/deals"],
  });

  const dealsArray = Array.isArray(deals) ? deals : [];

  // Auto-refresh functionality
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
      setAnimationKey(prev => prev + 1);
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [refetch]);

  // Manual refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setAnimationKey(prev => prev + 1);
    setTimeout(() => setRefreshing(false), 1000);
  };

  // Calculate analytics data
  const totalDeals = dealsArray.length;
  const activeDeals = dealsArray.filter((deal: any) => deal.isActive && deal.isApproved).length;
  const pendingDeals = dealsArray.filter((deal: any) => !deal.isApproved).length;
  const totalViews = dealsArray.reduce((sum: number, deal: any) => sum + (deal.viewCount || 0), 0);
  const totalClaims = dealsArray.reduce((sum: number, deal: any) => sum + (deal.currentRedemptions || 0), 0);
  
  // Calculate conversion rate
  const conversionRate = totalViews > 0 ? ((totalClaims / totalViews) * 100).toFixed(1) : "0.0";
  
  // Calculate estimated revenue based on deals
  const estimatedRevenue = dealsArray.reduce((sum: number, deal: any) => {
    const discount = deal.discountPercentage || 0;
    const avgOrderValue = 1000; // Assume average order value
    const dealRevenue = (avgOrderValue * discount / 100) * (deal.currentRedemptions || 0);
    return sum + dealRevenue;
  }, 0);

  // Performance data for charts
  const dealPerformanceData = dealsArray
    .filter((deal: any) => selectedCategory === "all" || deal.category === selectedCategory)
    .slice(0, 10)
    .map((deal: any) => ({
      name: deal.title.substring(0, 15) + (deal.title.length > 15 ? '...' : ''),
      views: deal.viewCount || 0,
      claims: deal.currentRedemptions || 0,
      discount: deal.discountPercentage || 0,
      revenue: ((deal.discountPercentage || 0) * 10 * (deal.currentRedemptions || 0))
    }));

  // Color palettes for charts
  const CHART_COLORS = {
    primary: ['#3B82F6', '#1D4ED8', '#1E3A8A', '#312E81'],
    success: ['#10B981', '#059669', '#047857', '#065F46'],
    warning: ['#F59E0B', '#D97706', '#B45309', '#92400E'],
    error: ['#EF4444', '#DC2626', '#B91C1C', '#991B1B'],
    purple: ['#8B5CF6', '#7C3AED', '#6D28D9', '#5B21B6'],
    pink: ['#EC4899', '#DB2777', '#BE185D', '#9D174D'],
    gradient: ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444']
  };

  // Monthly performance data with colors
  const monthlyData = [
    { month: 'Jan', views: 18500, claims: 1200, revenue: 45000, color: CHART_COLORS.gradient[0] },
    { month: 'Feb', views: 21200, claims: 1450, revenue: 52000, color: CHART_COLORS.gradient[1] },
    { month: 'Mar', views: 19800, claims: 1350, revenue: 48000, color: CHART_COLORS.gradient[2] },
    { month: 'Apr', views: 24600, claims: 1680, revenue: 58000, color: CHART_COLORS.gradient[3] },
    { month: 'May', views: 26400, claims: 1820, revenue: 63000, color: CHART_COLORS.gradient[4] },
    { month: 'Jun', views: 23800, claims: 1590, revenue: 55000, color: CHART_COLORS.gradient[0] }
  ];

  // Deal status distribution with vibrant colors
  const dealStatusData = [
    { name: 'Active', value: activeDeals, color: CHART_COLORS.success[0] },
    { name: 'Pending', value: pendingDeals, color: CHART_COLORS.warning[0] },
    { name: 'Expired', value: Math.max(0, totalDeals - activeDeals - pendingDeals), color: CHART_COLORS.error[0] }
  ];

  // Category performance
  const categoryData = dealsArray.reduce((acc: any, deal: any) => {
    const category = deal.category || 'Other';
    if (!acc[category]) {
      acc[category] = { category, deals: 0, claims: 0, views: 0, value: 0 };
    }
    acc[category].deals += 1;
    acc[category].claims += deal.currentRedemptions || 0;
    acc[category].views += deal.viewCount || 0;
    acc[category].value += (deal.discountPercentage || 0) * (deal.currentRedemptions || 0);
    return acc;
  }, {});

  const categoryChartData = Object.values(categoryData);



  // Color schemes
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];
  const GRADIENT_COLORS = {
    primary: 'from-blue-500 to-purple-600',
    success: 'from-green-500 to-emerald-600',
    warning: 'from-yellow-500 to-orange-600',
    danger: 'from-red-500 to-pink-600'
  };

  // Get unique categories for filter
  const categories = ["all", ...new Set(dealsArray.map((deal: any) => deal.category).filter(Boolean))];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">Loading analytics...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" asChild>
                <Link to="/vendor/dashboard">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Analytics Dashboard</h1>
                <p className="text-muted-foreground">Track your deal performance and business metrics</p>
              </div>
            </div>
            <Badge variant="secondary" className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              Last 30 days
            </Badge>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Deals</p>
                  <p className="text-2xl font-bold text-foreground">{totalDeals}</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Target className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {activeDeals} active, {pendingDeals} pending
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Views</p>
                  <p className="text-2xl font-bold text-foreground">{totalViews.toLocaleString()}</p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Eye className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <p className="text-xs text-green-600 mt-2">+12% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Claims</p>
                  <p className="text-2xl font-bold text-foreground">{totalClaims}</p>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <p className="text-xs text-purple-600 mt-2">+8% conversion rate</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Est. Revenue</p>
                  <p className="text-2xl font-bold text-foreground">₹{estimatedRevenue.toLocaleString()}</p>
                </div>
                <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
              <p className="text-xs text-yellow-600 mt-2">+15% from last month</p>
            </CardContent>
          </Card>
        </div>

        {/* Interactive Controls */}
        <div className="flex flex-wrap gap-4 mb-8 p-4 bg-card rounded-lg border">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>
                    {cat === "all" ? "All Categories" : cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Select value={chartType} onValueChange={setChartType}>
              <SelectTrigger className="w-28">
                <SelectValue placeholder="Chart Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bar">Bar Chart</SelectItem>
                <SelectItem value="line">Line Chart</SelectItem>
                <SelectItem value="area">Area Chart</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={handleRefresh} 
            disabled={refreshing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>

          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>

        {/* Interactive Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            {/* Real-time Performance Charts */}
            <div className="grid lg:grid-cols-2 gap-8">
              <Card className="transition-all duration-300 hover:shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center">
                    <Activity className="h-5 w-5 mr-2" />
                    Deal Performance
                  </CardTitle>
                  <Badge variant="outline" className="animate-pulse">
                    <Zap className="h-3 w-3 mr-1" />
                    Live
                  </Badge>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    {chartType === "bar" ? (
                      <BarChart data={dealPerformanceData} key={animationKey}>
                        <defs>
                          <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.8} />
                            <stop offset="100%" stopColor="#1E40AF" stopOpacity={0.3} />
                          </linearGradient>
                          <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10B981" stopOpacity={0.8} />
                            <stop offset="100%" stopColor="#047857" stopOpacity={0.3} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.3} />
                        <XAxis 
                          dataKey="name" 
                          angle={-45} 
                          textAnchor="end" 
                          height={80}
                          fontSize={11}
                          stroke="#6B7280"
                        />
                        <YAxis fontSize={11} stroke="#6B7280" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1F2937', 
                            border: '1px solid #374151',
                            borderRadius: '8px',
                            color: '#F9FAFB'
                          }}
                        />
                        <Bar dataKey="views" fill="url(#blueGradient)" name="Views" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="claims" fill="url(#greenGradient)" name="Claims" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    ) : chartType === "line" ? (
                      <LineChart data={dealPerformanceData} key={animationKey}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.3} />
                        <XAxis dataKey="name" fontSize={11} stroke="#6B7280" />
                        <YAxis fontSize={11} stroke="#6B7280" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1F2937', 
                            border: '1px solid #374151',
                            borderRadius: '8px',
                            color: '#F9FAFB'
                          }}
                        />
                        <Line type="monotone" dataKey="views" stroke="#3B82F6" strokeWidth={4} dot={{ fill: '#3B82F6', r: 6 }} />
                        <Line type="monotone" dataKey="claims" stroke="#10B981" strokeWidth={4} dot={{ fill: '#10B981', r: 6 }} />
                      </LineChart>
                    ) : (
                      <AreaChart data={dealPerformanceData} key={animationKey}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.3} />
                        <XAxis dataKey="name" fontSize={11} stroke="#6B7280" />
                        <YAxis fontSize={11} stroke="#6B7280" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1F2937', 
                            border: '1px solid #374151',
                            borderRadius: '8px',
                            color: '#F9FAFB'
                          }}
                        />
                        <Area type="monotone" dataKey="views" stackId="1" stroke="#3B82F6" fill="url(#blueGradient)" fillOpacity={0.8} />
                        <Area type="monotone" dataKey="claims" stackId="1" stroke="#10B981" fill="url(#greenGradient)" fillOpacity={0.8} />
                      </AreaChart>
                    )}
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="transition-all duration-300 hover:shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <LineChartIcon className="h-5 w-5 mr-2" />
                    Monthly Growth Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <ComposedChart data={monthlyData} key={animationKey}>
                      <defs>
                        <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.8} />
                          <stop offset="100%" stopColor="#1E40AF" stopOpacity={0.3} />
                        </linearGradient>
                        <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10B981" stopOpacity={0.8} />
                          <stop offset="100%" stopColor="#047857" stopOpacity={0.3} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.3} />
                      <XAxis dataKey="month" fontSize={11} stroke="#6B7280" />
                      <YAxis fontSize={11} stroke="#6B7280" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1F2937', 
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#F9FAFB'
                        }}
                      />
                      <Legend />
                      <Bar dataKey="views" fill="url(#blueGradient)" name="Views" radius={[4, 4, 0, 0]} />
                      <Line type="monotone" dataKey="claims" stroke="#10B981" strokeWidth={4} name="Claims" dot={{ fill: '#10B981', r: 6 }} />
                      <Line type="monotone" dataKey="revenue" stroke="#F59E0B" strokeWidth={4} name="Revenue" dot={{ fill: '#F59E0B', r: 6 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Interactive Category Analysis */}
            <div className="grid lg:grid-cols-2 gap-8">
              <Card className="transition-all duration-300 hover:shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <PieChartIcon className="h-5 w-5 mr-2" />
                    Category Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie
                        data={categoryChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ category, percent }) => `${category} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="deals"
                      >
                        {categoryChartData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1F2937', 
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#F9FAFB'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="transition-all duration-300 hover:shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Top Performing Deals</CardTitle>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    View All
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {dealsArray.slice(0, 6).map((deal: any, index: number) => (
                      <Dialog key={deal.id}>
                        <DialogTrigger asChild>
                          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-lg cursor-pointer hover:shadow-md transition-all duration-200 border border-slate-200 dark:border-slate-600">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                {index + 1}
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-sm">{deal.title.substring(0, 30)}...</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="outline" className="text-xs">
                                    {deal.category}
                                  </Badge>
                                  <Badge variant={deal.isActive ? "default" : "secondary"} className="text-xs">
                                    {deal.isActive ? "Active" : "Inactive"}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium">{deal.viewCount || 0} views</p>
                              <p className="text-xs text-muted-foreground">{deal.currentRedemptions || 0} claims</p>
                            </div>
                          </div>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>{deal.title}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Views</Label>
                                <p className="text-2xl font-bold">{deal.viewCount || 0}</p>
                              </div>
                              <div>
                                <Label>Claims</Label>
                                <p className="text-2xl font-bold">{deal.currentRedemptions || 0}</p>
                              </div>
                            </div>
                            <div>
                              <Label>Conversion Rate</Label>
                              <p className="text-lg font-semibold">
                                {deal.viewCount > 0 ? ((deal.currentRedemptions / deal.viewCount) * 100).toFixed(1) : 0}%
                              </p>
                            </div>
                            <div>
                              <Label>Discount</Label>
                              <p className="text-lg font-semibold">{deal.discountPercentage}%</p>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-600">{conversionRate}%</p>
                    <p className="text-sm text-muted-foreground">Conversion Rate</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-blue-600">{(totalViews / totalDeals || 0).toFixed(0)}</p>
                    <p className="text-sm text-muted-foreground">Avg. Views per Deal</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-purple-600">{(totalClaims / totalDeals || 0).toFixed(1)}</p>
                    <p className="text-sm text-muted-foreground">Avg. Claims per Deal</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            {/* Growth Metrics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Monthly Growth</p>
                      <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">+24.5%</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-blue-600" />
                  </div>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">vs last month</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-700 dark:text-green-300">Customer Retention</p>
                      <p className="text-2xl font-bold text-green-800 dark:text-green-200">87.3%</p>
                    </div>
                    <Users className="h-8 w-8 text-green-600" />
                  </div>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">repeat customers</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Avg. Order Value</p>
                      <p className="text-2xl font-bold text-purple-800 dark:text-purple-200">₹1,247</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-purple-600" />
                  </div>
                  <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">+15% increase</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-orange-700 dark:text-orange-300">Peak Hours</p>
                      <p className="text-2xl font-bold text-orange-800 dark:text-orange-200">6-8 PM</p>
                    </div>
                    <Clock className="h-8 w-8 text-orange-600" />
                  </div>
                  <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">highest activity</p>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Growth Charts */}
            <div className="grid lg:grid-cols-2 gap-8">
              <Card className="transition-all duration-300 hover:shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <LineChartIcon className="h-5 w-5 mr-2" />
                    6-Month Growth Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={[
                      { month: 'Jan', deals: 12, customers: 156, revenue: 24500 },
                      { month: 'Feb', deals: 18, customers: 234, revenue: 36200 },
                      { month: 'Mar', deals: 25, customers: 318, revenue: 48900 },
                      { month: 'Apr', deals: 32, customers: 425, revenue: 65400 },
                      { month: 'May', deals: 41, customers: 567, revenue: 82100 },
                      { month: 'Jun', deals: 48, customers: 689, revenue: 98700 }
                    ]} key={animationKey}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.3} />
                      <XAxis dataKey="month" fontSize={11} stroke="#6B7280" />
                      <YAxis fontSize={11} stroke="#6B7280" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1F2937', 
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#F9FAFB'
                        }}
                      />
                      <Legend />
                      <Area type="monotone" dataKey="deals" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} name="Active Deals" />
                      <Area type="monotone" dataKey="customers" stackId="2" stroke="#10B981" fill="#10B981" fillOpacity={0.6} name="New Customers" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="transition-all duration-300 hover:shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Weekly Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <ComposedChart data={[
                      { day: 'Mon', views: 145, claims: 32, conversion: 22.1 },
                      { day: 'Tue', views: 189, claims: 45, conversion: 23.8 },
                      { day: 'Wed', views: 234, claims: 58, conversion: 24.8 },
                      { day: 'Thu', views: 198, claims: 52, conversion: 26.3 },
                      { day: 'Fri', views: 267, claims: 72, conversion: 27.0 },
                      { day: 'Sat', views: 321, claims: 89, conversion: 27.7 },
                      { day: 'Sun', views: 289, claims: 81, conversion: 28.0 }
                    ]} key={animationKey}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.3} />
                      <XAxis dataKey="day" fontSize={11} stroke="#6B7280" />
                      <YAxis fontSize={11} stroke="#6B7280" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1F2937', 
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#F9FAFB'
                        }}
                      />
                      <Legend />
                      <Bar dataKey="views" fill="#3B82F6" name="Views" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="claims" fill="#10B981" name="Claims" radius={[4, 4, 0, 0]} />
                      <Line type="monotone" dataKey="conversion" stroke="#F59E0B" strokeWidth={3} name="Conversion %" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Category Growth Analysis */}
            <Card className="transition-all duration-300 hover:shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Category Growth Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { category: 'Fashion', growth: '+45%', deals: 15, color: 'bg-pink-100 dark:bg-pink-900/20 text-pink-700 dark:text-pink-300' },
                    { category: 'Electronics', growth: '+32%', deals: 12, color: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' },
                    { category: 'Food & Dining', growth: '+28%', deals: 8, color: 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300' },
                    { category: 'Beauty', growth: '+41%', deals: 10, color: 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300' },
                    { category: 'Home & Garden', growth: '+19%', deals: 6, color: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300' },
                    { category: 'Sports', growth: '+25%', deals: 7, color: 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300' }
                  ].map((item, index) => (
                    <div key={index} className={`p-4 rounded-lg ${item.color}`}>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">{item.category}</h4>
                        <Badge variant="secondary" className="text-xs">{item.deals} deals</Badge>
                      </div>
                      <p className="text-2xl font-bold">{item.growth}</p>
                      <p className="text-xs opacity-75">monthly growth</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Growth Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Star className="h-5 w-5 mr-2" />
                  Growth Insights & Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-blue-800 dark:text-blue-200">Strong Growth Momentum</h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300">Your deals are gaining 24.5% more views month-over-month. Fashion category leads with 45% growth.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <Users className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-green-800 dark:text-green-200">High Customer Retention</h4>
                      <p className="text-sm text-green-700 dark:text-green-300">87.3% of customers return for more deals. Consider loyalty programs to reach 90%+.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <DollarSign className="h-5 w-5 text-purple-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-purple-800 dark:text-purple-200">Revenue Optimization</h4>
                      <p className="text-sm text-purple-700 dark:text-purple-300">Average order value increased by 15%. Weekend deals show 28% higher conversion rates.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <Clock className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-orange-800 dark:text-orange-200">Peak Performance Hours</h4>
                      <p className="text-sm text-orange-700 dark:text-orange-300">6-8 PM shows highest activity. Schedule new deals during these hours for maximum impact.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insights">
            <Card>
              <CardHeader>
                <CardTitle>AI-Powered Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold">High Engagement Alert</h4>
                      <p className="text-sm text-muted-foreground">Your fashion category deals are performing 40% better than average</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold">Optimization Tip</h4>
                      <p className="text-sm text-muted-foreground">Consider increasing discount percentage to boost conversion rates</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold">Market Opportunity</h4>
                      <p className="text-sm text-muted-foreground">Electronics category has high demand but low supply in your area</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
}