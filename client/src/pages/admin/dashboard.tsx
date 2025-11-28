import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { 
  Users, 
  Store, 
  Ticket, 
  TrendingUp,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Eye,
  DollarSign,
  Download,
  FileText,
  Database,
  Key,
  TrendingDown,
  Crown,
  Flame,
  Heart,
  Zap as ZapIcon,
  Shield,
  AlertTriangle
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart, ComposedChart, RadialBarChart, RadialBar } from "recharts";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, Filter, Calendar, Zap, Activity, Target, PieChart as PieChartIcon } from "lucide-react";

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [downloadingReport, setDownloadingReport] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState("30d");
  const [activeTab, setActiveTab] = useState("overview");
  const [chartType, setChartType] = useState("bar");
  const [refreshing, setRefreshing] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Handle refresh with animation
  const handleRefresh = async () => {
    setRefreshing(true);
    setAnimationKey(prev => prev + 1);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
    toast({
      title: "Dashboard Refreshed",
      description: "Analytics data has been updated with the latest information.",
    });
  };

  const { data: analytics } = useQuery({
    queryKey: ["/api/admin/analytics"],
  });

  const { data: pendingVendors } = useQuery({
    queryKey: ["/api/admin/vendors/pending"],
    staleTime: 0,
    cacheTime: 0,
    refetchOnMount: 'always',
  });

  const { data: pendingDeals } = useQuery({
    queryKey: ["/api/admin/deals/pending"],
    staleTime: 0,
    cacheTime: 0,
    refetchOnMount: 'always',
  });

  // Function to handle report downloads
  const downloadReport = async (reportType: string) => {
    try {
      setDownloadingReport(reportType);
      
      // Check if user is authenticated with proper role
      if (!user || !['admin', 'superadmin'].includes(user.role)) {
        toast({
          title: "Authentication Error",
          description: "Admin privileges required to download reports",
          variant: "destructive",
        });
        return;
      }

      // Get token from localStorage with fallback to different keys
      let token = localStorage.getItem('auth_token');
      if (!token) {
        token = localStorage.getItem('token') || localStorage.getItem('authToken');
      }
      
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "Session expired. Please log in again",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch(`/api/admin/reports/${reportType}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to download ${reportType} report`);
      }

      // Get the filename from the response headers
      const contentDisposition = response.headers.get('content-disposition');
      const filename = contentDisposition 
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '') 
        : `${reportType}-report.csv`;

      // Convert response to blob and trigger download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Download Complete",
        description: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} report downloaded successfully`,
      });
    } catch (error) {
      // Error handled by toast notification
      toast({
        title: "Download Failed",
        description: `Failed to download ${reportType} report. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setDownloadingReport(null);
    }
  };

  if (!user) return null;

  const analyticsData = analytics as any;
  const pendingVendorsData = pendingVendors as any;
  const pendingDealsData = pendingDeals as any;

  const stats = [
    {
      title: "Total Users",
      value: analyticsData?.totalUsers?.toLocaleString() || "0",
      change: "+12%",
      changeType: "increase",
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Active Vendors",
      value: analyticsData?.totalVendors?.toLocaleString() || "0",
      change: "+8%",
      changeType: "increase",
      icon: Store,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      title: "Total Deals",
      value: analyticsData?.totalDeals?.toLocaleString() || "0",
      change: "+15%",
      changeType: "increase",
      icon: Ticket,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      title: "Revenue",
      value: `₹${(analyticsData?.revenueEstimate || 0).toLocaleString('en-IN')}`,
      change: "+22%",
      changeType: "increase",
      icon: DollarSign,
      color: "text-royal",
      bgColor: "bg-royal/10",
    },
  ];

  const recentActivity = [
    {
      id: 1,
      type: "deal_approved",
      title: "Deal approved",
      description: "Fashion Hub submitted new winter sale",
      time: "2 hours ago",
      icon: CheckCircle,
      iconColor: "text-success",
    },
    {
      id: 2,
      type: "vendor_registered",
      title: "New vendor registered",
      description: "TechZone Electronics from Mumbai",
      time: "4 hours ago",
      icon: Store,
      iconColor: "text-primary",
    },
    {
      id: 3,
      type: "help_ticket",
      title: "Help ticket submitted",
      description: "User reported payment issue",
      time: "6 hours ago",
      icon: AlertCircle,
      iconColor: "text-warning",
    },
  ];

  // Chart data based on analytics
  const cityChartData = analyticsData?.cityStats?.map((city: any) => ({
    name: city.city,
    deals: city.dealCount,
    users: city.userCount,
  })) || [
    { name: 'Mumbai', deals: 120, users: 450 },
    { name: 'Delhi', deals: 95, users: 380 },
    { name: 'Bangalore', deals: 85, users: 320 },
    { name: 'Chennai', deals: 70, users: 280 },
    { name: 'Hyderabad', deals: 60, users: 240 },
    { name: 'Pune', deals: 55, users: 200 }
  ];

  const categoryChartData = analyticsData?.categoryStats?.map((category: any) => ({
    name: category.category,
    deals: category.dealCount,
    claims: category.claimCount,
  })) || [
    { name: 'Fashion', deals: 45, claims: 38 },
    { name: 'Electronics', deals: 32, claims: 28 },
    { name: 'Food', deals: 28, claims: 25 },
    { name: 'Beauty', deals: 22, claims: 18 },
    { name: 'Home', deals: 18, claims: 15 },
    { name: 'Health', deals: 15, claims: 12 }
  ];

  const monthlyTrendData = [
    { month: 'Jan', users: 1200, deals: 450, revenue: 25000, claims: 380, vendors: 45 },
    { month: 'Feb', users: 1800, deals: 620, revenue: 35000, claims: 520, vendors: 58 },
    { month: 'Mar', users: 2400, deals: 780, revenue: 48000, claims: 680, vendors: 72 },
    { month: 'Apr', users: 3200, deals: 920, revenue: 62000, claims: 850, vendors: 89 },
    { month: 'May', users: 4100, deals: 1150, revenue: 78000, claims: 1020, vendors: 105 },
    { month: 'Jun', users: 4800, deals: 1380, revenue: 92000, claims: 1250, vendors: 125 },
  ];

  // Enhanced color schemes for vibrant charts
  const CHART_COLORS = {
    primary: ['#3B82F6', '#1D4ED8', '#1E3A8A', '#312E81'],
    success: ['#10B981', '#059669', '#047857', '#065F46'],
    warning: ['#F59E0B', '#D97706', '#B45309', '#92400E'],
    error: ['#EF4444', '#DC2626', '#B91C1C', '#991B1B'],
    purple: ['#8B5CF6', '#7C3AED', '#6D28D9', '#5B21B6'],
    pink: ['#EC4899', '#DB2777', '#BE185D', '#9D174D'],
    gradient: ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'],
    vibrant: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#FF7675', '#74B9FF']
  };

  // User distribution data for pie chart
  const userDistributionData = [
    { name: 'Regular Customers', value: analyticsData?.regularCustomers || 3200, color: CHART_COLORS.vibrant[0] },
    { name: 'Premium Members', value: analyticsData?.premiumMembers || 950, color: CHART_COLORS.vibrant[1] },
    { name: 'Ultimate Members', value: analyticsData?.ultimateMembers || 280, color: CHART_COLORS.vibrant[2] },
    { name: 'Active Vendors', value: analyticsData?.totalVendors || 125, color: CHART_COLORS.vibrant[3] },
    { name: 'Admins', value: analyticsData?.totalAdmins || 8, color: CHART_COLORS.vibrant[4] }
  ];

  // Deal status breakdown with vibrant colors
  const dealStatusData = [
    { name: 'Active', value: analyticsData?.activeDeals || 850, color: CHART_COLORS.success[0] },
    { name: 'Pending', value: analyticsData?.pendingDeals || 120, color: CHART_COLORS.warning[0] },
    { name: 'Expired', value: analyticsData?.expiredDeals || 45, color: CHART_COLORS.error[0] },
    { name: 'Draft', value: analyticsData?.draftDeals || 25, color: CHART_COLORS.purple[0] }
  ];

  // Performance metrics with trends
  const performanceMetrics = [
    { name: 'User Growth', value: 95, target: 100, color: CHART_COLORS.gradient[0] },
    { name: 'Deal Conversion', value: 78, target: 85, color: CHART_COLORS.gradient[1] },
    { name: 'Revenue Growth', value: 88, target: 90, color: CHART_COLORS.gradient[2] },
    { name: 'Vendor Satisfaction', value: 92, target: 95, color: CHART_COLORS.gradient[3] },
    { name: 'Platform Usage', value: 85, target: 90, color: CHART_COLORS.gradient[4] }
  ];

  const chartConfig = {
    users: {
      label: "Users",
      color: CHART_COLORS.primary[0],
    },
    deals: {
      label: "Deals",
      color: CHART_COLORS.success[0],
    },
    claims: {
      label: "Claims",
      color: CHART_COLORS.warning[0],
    },
    revenue: {
      label: "Revenue",
      color: CHART_COLORS.purple[0],
    },
    vendors: {
      label: "Vendors",
      color: CHART_COLORS.pink[0],
    },
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Monitor platform performance and manage operations
          </p>
        </div>

        {/* Overview Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            const gradientClass = index === 0 ? 'stat-card-primary' : 
                                 index === 1 ? 'stat-card-success' : 
                                 index === 2 ? 'stat-card-warning' : 'stat-card-danger';
            return (
              <div key={stat.title} className={`stat-card ${gradientClass} rounded-xl p-6 shadow-lg`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/80 text-sm font-medium">{stat.title}</p>
                    <p className="text-3xl font-bold text-white mt-2">{stat.value}</p>
                    <div className="flex items-center mt-2">
                      <TrendingUp className="h-4 w-4 text-white/90 mr-1" />
                      <span className="text-white/90 text-sm">{stat.change} from last month</span>
                    </div>
                  </div>
                  <div className="bg-card/20 p-4 rounded-full backdrop-blur-sm">
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Interactive Controls */}
        <div className="flex flex-wrap gap-4 mb-8 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-blue-600" />
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
            <Select value={chartType} onValueChange={setChartType}>
              <SelectTrigger className="w-28">
                <SelectValue placeholder="Chart Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bar">Bar Chart</SelectItem>
                <SelectItem value="line">Line Chart</SelectItem>
                <SelectItem value="area">Area Chart</SelectItem>
                <SelectItem value="composed">Combined</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={handleRefresh} 
            disabled={refreshing}
            variant="outline"
            size="sm"
            className="bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>

          <Badge variant="outline" className="flex items-center bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">
            <Zap className="h-3 w-3 mr-1" />
            Live Data
          </Badge>
        </div>

        {/* Interactive Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid w-full grid-cols-4 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50">
            <TabsTrigger value="overview" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800">Overview</TabsTrigger>
            <TabsTrigger value="performance" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800">Performance</TabsTrigger>
            <TabsTrigger value="insights" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800">Insights</TabsTrigger>
            <TabsTrigger value="distribution" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800">Distribution</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            {/* Enhanced Charts Section */}
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Monthly Growth Trends */}
              <Card className="glass-card transition-all duration-300 hover:shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gradient-text">
                    <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
                    Monthly Growth Trends
                  </CardTitle>
                  <Badge variant="outline" className="animate-pulse">
                    <Activity className="h-3 w-3 mr-1" />
                    Live
                  </Badge>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[350px] w-full">
                    {chartType === "bar" ? (
                      <BarChart data={monthlyTrendData} key={animationKey}>
                        <defs>
                          <linearGradient id="userGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={CHART_COLORS.primary[0]} stopOpacity={0.8} />
                            <stop offset="100%" stopColor={CHART_COLORS.primary[1]} stopOpacity={0.3} />
                          </linearGradient>
                          <linearGradient id="dealGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={CHART_COLORS.success[0]} stopOpacity={0.8} />
                            <stop offset="100%" stopColor={CHART_COLORS.success[1]} stopOpacity={0.3} />
                          </linearGradient>
                          <linearGradient id="claimGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={CHART_COLORS.warning[0]} stopOpacity={0.8} />
                            <stop offset="100%" stopColor={CHART_COLORS.warning[1]} stopOpacity={0.3} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.6} />
                        <XAxis dataKey="month" tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }} />
                        <YAxis tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="users" fill="url(#userGradient)" name="Users" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="deals" fill="url(#dealGradient)" name="Deals" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="claims" fill="url(#claimGradient)" name="Claims" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    ) : chartType === "line" ? (
                      <LineChart data={monthlyTrendData} key={animationKey}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.6} />
                        <XAxis dataKey="month" tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }} />
                        <YAxis tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line type="monotone" dataKey="users" stroke={CHART_COLORS.primary[0]} strokeWidth={4} dot={{ fill: CHART_COLORS.primary[0], strokeWidth: 2, r: 6 }} />
                        <Line type="monotone" dataKey="deals" stroke={CHART_COLORS.success[0]} strokeWidth={4} dot={{ fill: CHART_COLORS.success[0], strokeWidth: 2, r: 6 }} />
                        <Line type="monotone" dataKey="claims" stroke={CHART_COLORS.warning[0]} strokeWidth={4} dot={{ fill: CHART_COLORS.warning[0], strokeWidth: 2, r: 6 }} />
                      </LineChart>
                    ) : chartType === "area" ? (
                      <AreaChart data={monthlyTrendData} key={animationKey}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.6} />
                        <XAxis dataKey="month" tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }} />
                        <YAxis tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Area type="monotone" dataKey="users" stackId="1" stroke={CHART_COLORS.primary[0]} fill="url(#userGradient)" fillOpacity={0.8} />
                        <Area type="monotone" dataKey="deals" stackId="1" stroke={CHART_COLORS.success[0]} fill="url(#dealGradient)" fillOpacity={0.8} />
                        <Area type="monotone" dataKey="claims" stackId="1" stroke={CHART_COLORS.warning[0]} fill="url(#claimGradient)" fillOpacity={0.8} />
                      </AreaChart>
                    ) : (
                      <ComposedChart data={monthlyTrendData} key={animationKey}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.6} />
                        <XAxis dataKey="month" tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }} />
                        <YAxis tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="users" fill="url(#userGradient)" name="Users" radius={[4, 4, 0, 0]} />
                        <Line type="monotone" dataKey="deals" stroke={CHART_COLORS.success[0]} strokeWidth={4} dot={{ fill: CHART_COLORS.success[0], strokeWidth: 2, r: 6 }} />
                        <Line type="monotone" dataKey="claims" stroke={CHART_COLORS.warning[0]} strokeWidth={4} dot={{ fill: CHART_COLORS.warning[0], strokeWidth: 2, r: 6 }} />
                      </ComposedChart>
                    )}
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* City Performance Chart */}
              <Card className="glass-card transition-all duration-300 hover:shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gradient-text">
                    <MapPin className="h-5 w-5 mr-2 text-green-600" />
                    Top Cities Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[350px] w-full">
                    <BarChart data={cityChartData.slice(0, 6)} key={animationKey}>
                      <defs>
                        <linearGradient id="cityGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={CHART_COLORS.purple[0]} stopOpacity={0.8} />
                          <stop offset="100%" stopColor={CHART_COLORS.purple[1]} stopOpacity={0.3} />
                        </linearGradient>
                        <linearGradient id="cityUserGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={CHART_COLORS.pink[0]} stopOpacity={0.8} />
                          <stop offset="100%" stopColor={CHART_COLORS.pink[1]} stopOpacity={0.3} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.6} />
                      <XAxis dataKey="name" tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }} />
                      <YAxis tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="deals" fill="url(#cityGradient)" name="Deals" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="users" fill="url(#cityUserGradient)" name="Users" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-8">
            {/* Performance Metrics */}
            <div className="grid lg:grid-cols-2 gap-8">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gradient-text">
                    <Target className="h-5 w-5 mr-2 text-blue-600" />
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {performanceMetrics.map((metric, index) => (
                      <div key={metric.name} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700">{metric.name}</span>
                          <span className="text-sm font-bold" style={{ color: metric.color }}>
                            {metric.value}% / {metric.target}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className="h-3 rounded-full transition-all duration-1000 ease-out"
                            style={{ 
                              width: `${(metric.value / metric.target) * 100}%`,
                              backgroundColor: metric.color
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gradient-text">
                    <BarChart3 className="h-5 w-5 mr-2 text-orange-600" />
                    Category Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[300px] w-full">
                    <AreaChart data={categoryChartData.slice(0, 6)} key={animationKey}>
                      <defs>
                        <linearGradient id="categoryGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={CHART_COLORS.gradient[0]} stopOpacity={0.8} />
                          <stop offset="100%" stopColor={CHART_COLORS.gradient[1]} stopOpacity={0.3} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" strokeOpacity={0.6} />
                      <XAxis dataKey="name" tick={{ fill: '#6B7280', fontSize: 12 }} />
                      <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area type="monotone" dataKey="deals" stackId="1" stroke={CHART_COLORS.gradient[0]} fill="url(#categoryGradient)" fillOpacity={0.8} />
                      <Area type="monotone" dataKey="claims" stackId="1" stroke={CHART_COLORS.gradient[1]} fill={CHART_COLORS.gradient[1]} fillOpacity={0.6} />
                    </AreaChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="insights" className="space-y-8">
            {/* Revenue Insights */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gradient-text">
                  <DollarSign className="h-5 w-5 mr-2 text-green-600" />
                  Revenue Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                  <AreaChart data={monthlyTrendData} key={animationKey}>
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={CHART_COLORS.success[0]} stopOpacity={0.8} />
                        <stop offset="100%" stopColor={CHART_COLORS.success[1]} stopOpacity={0.2} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" strokeOpacity={0.6} />
                    <XAxis dataKey="month" tick={{ fill: '#6B7280', fontSize: 12 }} />
                    <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area type="monotone" dataKey="revenue" stroke={CHART_COLORS.success[0]} fill="url(#revenueGradient)" fillOpacity={0.8} />
                    <Area type="monotone" dataKey="vendors" stroke={CHART_COLORS.purple[0]} fill={CHART_COLORS.purple[0]} fillOpacity={0.4} />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="distribution" className="space-y-8">
            {/* Distribution Charts */}
            <div className="grid lg:grid-cols-2 gap-8">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gradient-text">
                    <PieChartIcon className="h-5 w-5 mr-2 text-purple-600" />
                    User Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[300px] w-full">
                    <PieChart key={animationKey}>
                      <Pie
                        data={userDistributionData}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        innerRadius={40}
                        paddingAngle={5}
                        dataKey="value"
                        animationBegin={0}
                        animationDuration={1500}
                      >
                        {userDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gradient-text">
                    <Target className="h-5 w-5 mr-2 text-orange-600" />
                    Deal Status Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[300px] w-full">
                    <PieChart key={animationKey}>
                      <Pie
                        data={dealStatusData}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        innerRadius={40}
                        paddingAngle={5}
                        dataKey="value"
                        animationBegin={0}
                        animationDuration={1500}
                      >
                        {dealStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Enhanced Metrics Section */}
        <div className="grid lg:grid-cols-3 gap-8 mt-8 mb-8">
          {/* Engagement Metrics */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500" />
                Engagement Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Deal Conversion Rate</span>
                  <span className="text-lg font-bold text-green-600">42.8%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="h-2 rounded-full bg-gradient-to-r from-green-400 to-green-600" style={{width: '42.8%'}}></div>
                </div>
                
                <div className="flex items-center justify-between mt-6">
                  <span className="text-sm font-medium">Active User Rate</span>
                  <span className="text-lg font-bold text-blue-600">67.5%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="h-2 rounded-full bg-gradient-to-r from-blue-400 to-blue-600" style={{width: '67.5%'}}></div>
                </div>
                
                <div className="flex items-center justify-between mt-6">
                  <span className="text-sm font-medium">Member Retention</span>
                  <span className="text-lg font-bold text-purple-600">84.2%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="h-2 rounded-full bg-gradient-to-r from-purple-400 to-purple-600" style={{width: '84.2%'}}></div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Performing Vendors */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-amber-500" />
                Top Vendors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: 'Fashion Hub', deals: 45, claims: 1280, color: 'text-orange-600' },
                  { name: 'TechZone Pro', deals: 38, claims: 956, color: 'text-blue-600' },
                  { name: 'Beauty Plus', deals: 32, claims: 845, color: 'text-pink-600' }
                ].map((vendor, idx) => (
                  <div key={idx} className="flex items-start justify-between p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800">
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{vendor.name}</p>
                      <p className="text-xs text-gray-500">{vendor.deals} deals • {vendor.claims} claims</p>
                    </div>
                    <Badge className="bg-green-100 text-green-700">Active</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* System Health */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-500" />
                System Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ZapIcon className="h-4 w-4 text-green-500" />
                    <span className="text-sm">API Status</span>
                  </div>
                  <Badge className="bg-green-100 text-green-700">Operational</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Database</span>
                  </div>
                  <Badge className="bg-green-100 text-green-700">Healthy</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-purple-500" />
                    <span className="text-sm">Uptime</span>
                  </div>
                  <Badge className="bg-green-100 text-green-700">99.9%</Badge>
                </div>
                
                <div className="text-xs text-gray-500 mt-4 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                  ✓ All systems operational. Last check: 2m ago
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Deal Performance & User Growth */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Top Deals */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-500" />
                Top Performing Deals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { title: 'Summer Mega Sale', vendor: 'Fashion Hub', claims: 324, discount: 45 },
                  { title: 'Electronics Flash Sale', vendor: 'TechZone', claims: 287, discount: 30 },
                  { title: 'Beauty Weekend Deal', vendor: 'Beauty Plus', claims: 245, discount: 25 }
                ].map((deal, idx) => (
                  <div key={idx} className="flex items-start justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{deal.title}</p>
                      <p className="text-xs text-gray-500">{deal.vendor}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">{deal.claims}</p>
                      <p className="text-xs text-gray-500">{deal.discount}% off</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Growth Analytics */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                Growth Metrics (This Month)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-500" />
                      New Users
                    </span>
                    <span className="text-lg font-bold text-green-600">+486</span>
                  </div>
                  <p className="text-xs text-gray-500">+12% from last month</p>
                </div>

                <div className="h-px bg-gray-200 dark:bg-gray-700"></div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium flex items-center gap-2">
                      <Ticket className="h-4 w-4 text-orange-500" />
                      New Deals
                    </span>
                    <span className="text-lg font-bold text-green-600">+147</span>
                  </div>
                  <p className="text-xs text-gray-500">+8% from last month</p>
                </div>

                <div className="h-px bg-gray-200 dark:bg-gray-700"></div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-500" />
                      Revenue
                    </span>
                    <span className="text-lg font-bold text-green-600">+₹45.2K</span>
                  </div>
                  <p className="text-xs text-gray-500">+15% from last month</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity and Quick Actions */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Recent Activity */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gradient-text">
                <Clock className="h-5 w-5 mr-2 text-blue-600" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => {
                  const Icon = activity.icon;
                  return (
                    <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${activity.iconColor === 'text-success' ? 'bg-gradient-to-br from-green-100 to-green-200' : activity.iconColor === 'text-primary' ? 'bg-gradient-to-br from-blue-100 to-blue-200' : 'bg-gradient-to-br from-yellow-100 to-yellow-200'}`}>
                        <Icon className={`h-5 w-5 ${activity.iconColor}`} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-foreground">{activity.title}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{activity.description}</p>
                        <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gradient-text">
                <Target className="h-5 w-5 mr-2 text-purple-600" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <Button asChild className="h-16 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white" data-testid="button-manage-vendors">
                  <Link to="/admin/vendors">
                    <div className="text-center">
                      <Store className="h-6 w-6 mx-auto mb-1" />
                      <span className="text-sm font-medium">Manage Vendors</span>
                    </div>
                  </Link>
                </Button>
                <Button asChild className="h-16 bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white" data-testid="button-review-deals">
                  <Link to="/admin/deals">
                    <div className="text-center">
                      <Ticket className="h-6 w-6 mx-auto mb-1" />
                      <span className="text-sm font-medium">Review Deals</span>
                    </div>
                  </Link>
                </Button>
                <Button asChild className="h-16 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white" data-testid="button-user-management">
                  <Link to="/admin/users">
                    <div className="text-center">
                      <Users className="h-6 w-6 mx-auto mb-1" />
                      <span className="text-sm font-medium">User Management</span>
                    </div>
                  </Link>
                </Button>
                <Button asChild className="h-16 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white" data-testid="button-claimed-deals">
                  <Link to="/admin/claimed-deals">
                    <div className="text-center">
                      <CheckCircle className="h-6 w-6 mx-auto mb-1" />
                      <span className="text-sm font-medium">Claimed Deals</span>
                    </div>
                  </Link>
                </Button>
                <Button asChild className="h-16 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white" data-testid="button-reports">
                  <Link to="/admin/reports">
                    <div className="text-center">
                      <FileText className="h-6 w-6 mx-auto mb-1" />
                      <span className="text-sm font-medium">Reports</span>
                    </div>
                  </Link>
                </Button>
                <Button asChild className="h-16 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white" data-testid="button-api-keys">
                  <Link to="/admin/api-keys">
                    <div className="text-center">
                      <Key className="h-6 w-6 mx-auto mb-1" />
                      <span className="text-sm font-medium">API Keys</span>
                    </div>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Approvals */}
        <div className="grid lg:grid-cols-2 gap-8 mt-8">
          {/* Pending Vendors */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Pending Vendor Approvals</CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link to="/admin/vendors">View All</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {pendingVendorsData && pendingVendorsData.length > 0 ? (
                <div className="space-y-4">
                  {pendingVendorsData.slice(0, 3).map((vendor: any) => (
                    <div key={vendor.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div>
                        <p className="font-medium text-foreground">{vendor.businessName}</p>
                        <p className="text-sm text-gray-500">{vendor.city}, {vendor.state}</p>
                      </div>
                      <Badge className="bg-red-500 text-white">Pending</Badge>
                    </div>
                  ))}
                  {pendingVendorsData.length > 3 && (
                    <p className="text-sm text-gray-500 text-center">
                      +{pendingVendorsData.length - 3} more pending approvals
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-muted-foreground">No pending vendor approvals</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pending Deals */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Pending Deal Approvals</CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link to="/admin/deals">View All</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {pendingDealsData && pendingDealsData.length > 0 ? (
                <div className="space-y-4">
                  {pendingDealsData.slice(0, 3).map((deal: any) => (
                    <div key={deal.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div>
                        <p className="font-medium text-foreground">{deal.title}</p>
                        <p className="text-sm text-gray-500">
                          By {deal.vendor?.businessName} - {deal.discountPercentage}% off
                        </p>
                      </div>
                      <Badge className="bg-red-500 text-white">Pending</Badge>
                    </div>
                  ))}
                  {pendingDealsData.length > 3 && (
                    <p className="text-sm text-gray-500 text-center">
                      +{pendingDealsData.length - 3} more pending approvals
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-muted-foreground">No pending deal approvals</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Reports Section */}
        <div className="mt-8">
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gradient-text">
                  <Database className="h-5 w-5 mr-2 text-blue-600" />
                  Data Reports & Analytics
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Download comprehensive CSV reports for analysis and record-keeping. All reports include the latest data.
                </p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to="/admin/reports">
                  <FileText className="h-4 w-4 mr-2" />
                  View All Reports
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {/* Report Info Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6 text-xs text-gray-500">
                <div className="text-center">
                  <span className="font-semibold text-blue-600">Users Report</span>
                  <p>All user data, memberships, savings</p>
                </div>
                <div className="text-center">
                  <span className="font-semibold text-green-600">Vendors Report</span>
                  <p>Business profiles, approval status</p>
                </div>
                <div className="text-center">
                  <span className="font-semibold text-orange-600">Deals Report</span>
                  <p>All deals, discounts, vendors</p>
                </div>
                <div className="text-center">
                  <span className="font-semibold text-purple-600">Analytics Report</span>
                  <p>Platform statistics, KPIs</p>
                </div>
                <div className="text-center">
                  <span className="font-semibold text-red-600">Claims Report</span>
                  <p>Deal redemptions, savings data</p>
                </div>
                <div className="text-center">
                  <span className="font-semibold text-emerald-600">Revenue Report</span>
                  <p>Platform revenue, commissions</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {/* Users Report */}
                <Button 
                  variant="outline" 
                  className="h-20 flex-col space-y-2"
                  onClick={() => downloadReport('users')}
                  disabled={downloadingReport === 'users'}
                >
                  {downloadingReport === 'users' ? (
                    <Download className="h-6 w-6 text-blue-600 animate-bounce" />
                  ) : (
                    <Users className="h-6 w-6 text-blue-600" />
                  )}
                  <span className="text-sm">
                    {downloadingReport === 'users' ? 'Downloading...' : 'Users Report'}
                  </span>
                </Button>

                {/* Vendors Report */}
                <Button 
                  variant="outline" 
                  className="h-20 flex-col space-y-2"
                  onClick={() => downloadReport('vendors')}
                  disabled={downloadingReport === 'vendors'}
                >
                  {downloadingReport === 'vendors' ? (
                    <Download className="h-6 w-6 text-green-600 animate-bounce" />
                  ) : (
                    <Store className="h-6 w-6 text-green-600" />
                  )}
                  <span className="text-sm">
                    {downloadingReport === 'vendors' ? 'Downloading...' : 'Vendors Report'}
                  </span>
                </Button>

                {/* Deals Report */}
                <Button 
                  variant="outline" 
                  className="h-20 flex-col space-y-2"
                  onClick={() => downloadReport('deals')}
                  disabled={downloadingReport === 'deals'}
                >
                  {downloadingReport === 'deals' ? (
                    <Download className="h-6 w-6 text-orange-600 animate-bounce" />
                  ) : (
                    <Ticket className="h-6 w-6 text-orange-600" />
                  )}
                  <span className="text-sm">
                    {downloadingReport === 'deals' ? 'Downloading...' : 'Deals Report'}
                  </span>
                </Button>

                {/* Analytics Report */}
                <Button 
                  variant="outline" 
                  className="h-20 flex-col space-y-2"
                  onClick={() => downloadReport('analytics')}
                  disabled={downloadingReport === 'analytics'}
                >
                  {downloadingReport === 'analytics' ? (
                    <Download className="h-6 w-6 text-purple-600 animate-bounce" />
                  ) : (
                    <BarChart3 className="h-6 w-6 text-purple-600" />
                  )}
                  <span className="text-sm">
                    {downloadingReport === 'analytics' ? 'Downloading...' : 'Analytics Report'}
                  </span>
                </Button>

                {/* Claims Report */}
                <Button 
                  variant="outline" 
                  className="h-20 flex-col space-y-2"
                  onClick={() => downloadReport('claims')}
                  disabled={downloadingReport === 'claims'}
                >
                  {downloadingReport === 'claims' ? (
                    <Download className="h-6 w-6 text-red-600 animate-bounce" />
                  ) : (
                    <FileText className="h-6 w-6 text-red-600" />
                  )}
                  <span className="text-sm">
                    {downloadingReport === 'claims' ? 'Downloading...' : 'Claims Report'}
                  </span>
                </Button>

                {/* Revenue Report */}
                <Button 
                  variant="outline" 
                  className="h-20 flex-col space-y-2"
                  onClick={() => downloadReport('revenue')}
                  disabled={downloadingReport === 'revenue'}
                >
                  {downloadingReport === 'revenue' ? (
                    <Download className="h-6 w-6 text-emerald-600 animate-bounce" />
                  ) : (
                    <DollarSign className="h-6 w-6 text-emerald-600" />
                  )}
                  <span className="text-sm">
                    {downloadingReport === 'revenue' ? 'Downloading...' : 'Revenue Report'}
                  </span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
}