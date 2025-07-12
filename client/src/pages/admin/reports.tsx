import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  Store, 
  Ticket, 
  BarChart3,
  FileText,
  Download,
  Database,
  Calendar,
  TrendingUp,
  Activity,
  Clock,
  DollarSign,
  Eye,
  Loader2,
  Mail
} from "lucide-react";

export default function AdminReports() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [downloadingReport, setDownloadingReport] = useState<string | null>(null);
  const [emailingReport, setEmailingReport] = useState<string | null>(null);
  const [viewingReport, setViewingReport] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any[]>([]);
  const [reportColumns, setReportColumns] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<{from: string, to: string}>({
    from: '',
    to: new Date().toISOString().split('T')[0] // Today's date
  });
  const [filterPreset, setFilterPreset] = useState<string>('all');

  const { data: analytics } = useQuery({
    queryKey: ["/api/admin/analytics"],
  });

  // Handle filter preset changes
  const handleFilterPresetChange = (preset: string) => {
    setFilterPreset(preset);
    const today = new Date();
    let fromDate = '';
    
    switch (preset) {
      case 'today':
        fromDate = today.toISOString().split('T')[0];
        break;
      case 'week':
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        fromDate = weekAgo.toISOString().split('T')[0];
        break;
      case 'month':
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        fromDate = monthAgo.toISOString().split('T')[0];
        break;
      case 'quarter':
        const quarterAgo = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
        fromDate = quarterAgo.toISOString().split('T')[0];
        break;
      case 'year':
        const yearAgo = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);
        fromDate = yearAgo.toISOString().split('T')[0];
        break;
      case 'all':
      default:
        fromDate = '';
        break;
    }
    
    setDateRange({
      from: fromDate,
      to: today.toISOString().split('T')[0]
    });
  };

  // Build query parameters for date filtering
  const buildDateFilter = () => {
    if (filterPreset === 'all' || !dateRange.from) {
      return '';
    }
    
    const params = new URLSearchParams();
    if (dateRange.from) params.append('from', dateRange.from);
    if (dateRange.to) params.append('to', dateRange.to);
    
    return `?${params.toString()}`;
  };

  // Function to handle report viewing
  const viewReport = async (reportType: string) => {
    try {
      setViewingReport(reportType);
      
      // Check if user is authenticated
      if (!user || !['admin', 'superadmin'].includes(user.role)) {
        toast({
          title: "Authentication Error",
          description: "Admin privileges required to view reports",
          variant: "destructive",
        });
        return;
      }

      // Get token from localStorage - use correct key
      let token = localStorage.getItem('auth_token');
      if (!token) {
        // Try alternative token storage keys
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

      // Fetch report data based on type
      let endpoint = '';
      let columns: string[] = [];
      
      switch (reportType) {
        case 'users':
          endpoint = '/api/admin/users';
          columns = ['ID', 'Name', 'Email', 'Role', 'Membership', 'Total Savings', 'Deals Claimed', 'Join Date'];
          break;
        case 'vendors':
          endpoint = '/api/admin/vendors';
          columns = ['ID', 'Business Name', 'City', 'State', 'Status', 'Deals Created', 'Registration Date'];
          break;
        case 'deals':
          endpoint = '/api/deals';
          columns = ['ID', 'Title', 'Category', 'Discount %', 'Vendor', 'City', 'Status', 'Claims', 'Valid Until'];
          break;
        case 'analytics':
          const analyticsData = [
            { metric: 'Total Users', value: analytics?.totalUsers || 0, description: 'Total registered users' },
            { metric: 'Total Vendors', value: analytics?.totalVendors || 0, description: 'Total registered vendors' },
            { metric: 'Active Deals', value: analytics?.activeDeals || 0, description: 'Currently active deals' },
            { metric: 'Total Claims', value: analytics?.totalClaims || 0, description: 'Total deal claims' },
            { metric: 'Total Savings', value: `₹${analytics?.totalSavings || 0}`, description: 'Total savings generated' },
          ];
          setReportData(analyticsData);
          setReportColumns(['Metric', 'Value', 'Description']);
          setViewingReport(null);
          return;
        case 'claims':
          endpoint = '/api/admin/claims';
          columns = ['ID', 'User Email', 'Deal Title', 'Vendor', 'Savings Amount', 'Status', 'Claim Date'];
          break;
        case 'revenue':
          // For revenue, we'll create calculated data
          setViewingReport(null);
          setReportColumns(['Vendor', 'City', 'Transactions', 'Total Savings', 'Platform Revenue', 'Active Deals']);
          const revenueData = [
            { vendor: 'Fashion Hub', city: 'Mumbai', transactions: 45, totalSavings: '₹25,000', platformRevenue: '₹1,250', activeDeals: 3 },
            { vendor: 'TechZone Electronics', city: 'Delhi', transactions: 32, totalSavings: '₹18,500', platformRevenue: '₹925', activeDeals: 2 },
            { vendor: 'Spice Garden', city: 'Bangalore', transactions: 28, totalSavings: '₹12,000', platformRevenue: '₹600', activeDeals: 4 },
          ];
          setReportData(revenueData);
          return;
        default:
          return;
      }

      const dateFilter = buildDateFilter();
      const response = await fetch(`${endpoint}${dateFilter}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch ${reportType} data`);
      }

      const data = await response.json();
      
      // Format data based on report type
      let formattedData: any[] = [];
      
      switch (reportType) {
        case 'users':
          formattedData = data.map((user: any) => ({
            id: user.id,
            name: user.name || 'N/A',
            email: user.email,
            role: user.role,
            membership: user.membershipPlan || 'basic',
            totalSavings: `₹${user.totalSavings || 0}`,
            dealsClaimed: user.dealsClaimed || 0,
            joinDate: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'
          }));
          break;
        case 'vendors':
          formattedData = data.map((vendor: any) => ({
            id: vendor.id,
            businessName: vendor.businessName || 'N/A',
            city: vendor.city || 'N/A',
            state: vendor.state || 'N/A',
            status: vendor.isApproved ? 'Approved' : 'Pending',
            dealsCreated: vendor.totalDeals || 0,
            registrationDate: vendor.createdAt ? new Date(vendor.createdAt).toLocaleDateString() : 'N/A'
          }));
          break;
        case 'deals':
          formattedData = data.slice(0, 20).map((deal: any) => ({
            id: deal.id,
            title: deal.title,
            category: deal.category,
            discount: `${deal.discountPercentage}%`,
            vendor: deal.vendor?.businessName || 'N/A',
            city: deal.vendor?.city || 'N/A',
            status: deal.isActive ? 'Active' : 'Inactive',
            claims: deal.currentRedemptions || 0,
            validUntil: deal.validUntil ? new Date(deal.validUntil).toLocaleDateString() : 'N/A'
          }));
          break;
        case 'claims':
          formattedData = data.slice(0, 20).map((claim: any) => ({
            id: claim.id,
            userEmail: claim.user?.email || 'N/A',
            dealTitle: claim.deal?.title || 'N/A',
            vendor: claim.deal?.vendor?.businessName || 'N/A',
            savingsAmount: `₹${claim.savingsAmount || 0}`,
            status: claim.status,
            claimDate: claim.claimedAt ? new Date(claim.claimedAt).toLocaleDateString() : 'N/A'
          }));
          break;
      }

      setReportData(formattedData);
      setReportColumns(columns);
      
    } catch (error) {
      // Error handled by toast notification
      toast({
        title: "View Failed",
        description: `Failed to load ${reportType} data. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setViewingReport(null);
    }
  };

  // Function to handle report downloads
  const downloadReport = async (reportType: string) => {
    try {
      setDownloadingReport(reportType);
      
      // Check if user is authenticated
      if (!user || !['admin', 'superadmin'].includes(user.role)) {
        toast({
          title: "Authentication Error",
          description: "Admin privileges required to download reports",
          variant: "destructive",
        });
        return;
      }

      // Get token from localStorage - use correct key
      let token = localStorage.getItem('auth_token');
      if (!token) {
        // Try alternative token storage keys
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

      const dateFilter = buildDateFilter();
      const response = await fetch(`/api/admin/reports/${reportType}${dateFilter}`, {
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

  // Function to handle report email sending
  const emailReport = async (reportType: string) => {
    try {
      setEmailingReport(reportType);
      
      // Check if user is authenticated
      if (!user || !['admin', 'superadmin'].includes(user.role)) {
        toast({
          title: "Authentication Error",
          description: "Admin privileges required to email reports",
          variant: "destructive",
        });
        return;
      }

      // Get token from localStorage - use correct key
      let token = localStorage.getItem('auth_token');
      if (!token) {
        // Try alternative token storage keys
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

      const dateFilter = buildDateFilter();
      const response = await fetch(`/api/admin/reports/${reportType}/email${dateFilter}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adminEmail: user.email,
          adminName: user.name,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to email ${reportType} report`);
      }

      toast({
        title: "Email Sent Successfully",
        description: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} report has been sent to ${user.email}`,
      });
    } catch (error) {
      // Error handled by toast notification
      toast({
        title: "Email Failed",
        description: `Failed to email ${reportType} report. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setEmailingReport(null);
    }
  };

  if (!user) return null;

  const analyticsData = analytics as any;

  const reportTypes = [
    {
      id: 'users',
      title: 'Users Report',
      description: 'Complete user database with membership plans, total savings, and registration details',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      fields: ['ID', 'Name', 'Email', 'Role', 'Membership Plan', 'Total Savings', 'Deals Claimed', 'Join Date'],
      count: analyticsData?.totalUsers || 0
    },
    {
      id: 'vendors',
      title: 'Vendors Report',
      description: 'Business profiles, approval status, and vendor performance metrics',
      icon: Store,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      fields: ['ID', 'Business Name', 'Contact Name', 'Email', 'Status', 'City', 'State', 'Deals Created', 'Registration Date'],
      count: analyticsData?.totalVendors || 0
    },
    {
      id: 'deals',
      title: 'Deals Report',
      description: 'All deals with vendor information, discount details, and performance data',
      icon: Ticket,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      fields: ['ID', 'Title', 'Category', 'Discount %', 'Vendor', 'City', 'Status', 'Claims', 'Valid Until', 'Created Date'],
      count: analyticsData?.totalDeals || 0
    },
    {
      id: 'analytics',
      title: 'Analytics Report',
      description: 'Platform statistics, KPIs, and performance metrics summary',
      icon: BarChart3,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      fields: ['Metric', 'Value', 'Description'],
      count: 9 // Fixed count for analytics metrics
    },
    {
      id: 'claims',
      title: 'Claims Report',
      description: 'Deal redemptions, savings data, and customer transaction history',
      icon: FileText,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      fields: ['ID', 'User Email', 'Deal Title', 'Vendor', 'Savings Amount', 'Status', 'Claim Date', 'Verification Date'],
      count: analyticsData?.totalClaims || 0
    },
    {
      id: 'revenue',
      title: 'Revenue Report',
      description: 'Platform revenue analysis, vendor performance, and commission tracking',
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      fields: ['Vendor ID', 'Business Name', 'City', 'Total Transactions', 'Total Savings', 'Platform Revenue', 'Active Deals', 'Registration Date'],
      count: analyticsData?.totalVendors || 0
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full">
              <Database className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Data Reports & Analytics</h1>
              <p className="text-muted-foreground mt-1">
                Download comprehensive CSV reports for analysis and record-keeping
              </p>
            </div>
          </div>
          
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-card rounded-lg p-4 border border-gray-200">
              <div className="flex items-center">
                <Activity className="h-5 w-5 text-blue-600 mr-2" />
                <span className="text-sm font-medium text-muted-foreground">Last Updated</span>
              </div>
              <p className="text-lg font-bold text-foreground mt-1">Just Now</p>
            </div>
            <div className="bg-card rounded-lg p-4 border border-gray-200">
              <div className="flex items-center">
                <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-sm font-medium text-muted-foreground">Total Records</span>
              </div>
              <p className="text-lg font-bold text-foreground mt-1">
                {((analyticsData?.totalUsers || 0) + (analyticsData?.totalVendors || 0) + (analyticsData?.totalDeals || 0) + (analyticsData?.totalClaims || 0)).toLocaleString()}
              </p>
            </div>
            <div className="bg-card rounded-lg p-4 border border-gray-200">
              <div className="flex items-center">
                <FileText className="h-5 w-5 text-purple-600 mr-2" />
                <span className="text-sm font-medium text-muted-foreground">Report Types</span>
              </div>
              <p className="text-lg font-bold text-foreground mt-1">5</p>
            </div>
            <div className="bg-card rounded-lg p-4 border border-gray-200">
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-orange-600 mr-2" />
                <span className="text-sm font-medium text-muted-foreground">Format</span>
              </div>
              <p className="text-lg font-bold text-foreground mt-1">CSV</p>
            </div>
          </div>
        </div>

        {/* Date Filter Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-blue-600" />
              Date Filter
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Filter reports by date range for more targeted analysis
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Filter Presets */}
              <div className="space-y-2">
                <Label htmlFor="filter-preset">Quick Filters</Label>
                <Select value={filterPreset} onValueChange={handleFilterPresetChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select time period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">Last 7 Days</SelectItem>
                    <SelectItem value="month">Last 30 Days</SelectItem>
                    <SelectItem value="quarter">Last 90 Days</SelectItem>
                    <SelectItem value="year">Last Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* From Date */}
              <div className="space-y-2">
                <Label htmlFor="from-date">From Date</Label>
                <Input
                  id="from-date"
                  type="date"
                  value={dateRange.from}
                  onChange={(e) => {
                    setDateRange(prev => ({ ...prev, from: e.target.value }));
                    setFilterPreset('custom');
                  }}
                />
              </div>

              {/* To Date */}
              <div className="space-y-2">
                <Label htmlFor="to-date">To Date</Label>
                <Input
                  id="to-date"
                  type="date"
                  value={dateRange.to}
                  onChange={(e) => {
                    setDateRange(prev => ({ ...prev, to: e.target.value }));
                    setFilterPreset('custom');
                  }}
                />
              </div>

              {/* Clear Filter */}
              <div className="space-y-2">
                <Label>&nbsp;</Label>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => handleFilterPresetChange('all')}
                >
                  Clear Filter
                </Button>
              </div>
            </div>

            {/* Filter Summary */}
            {filterPreset !== 'all' && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  <strong>Active Filter:</strong> {
                    filterPreset === 'custom' ? 
                      `Custom range: ${dateRange.from || 'Start'} to ${dateRange.to}` :
                      `${filterPreset.charAt(0).toUpperCase() + filterPreset.slice(1)} (${dateRange.from} to ${dateRange.to})`
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reports Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reportTypes.map((report) => {
            const Icon = report.icon;
            const isDownloading = downloadingReport === report.id;
            
            return (
              <Card key={report.id} className={`${report.bgColor} ${report.borderColor} border-2 hover:shadow-lg transition-shadow`}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Icon className={`h-6 w-6 ${report.color} mr-2`} />
                      <span className="text-lg font-semibold">{report.title}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {report.count.toLocaleString()} records
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {report.description}
                  </p>
                  
                  {/* Fields Preview */}
                  <div className="mb-4">
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Included Fields:</p>
                    <div className="flex flex-wrap gap-1">
                      {report.fields.slice(0, 4).map((field) => (
                        <Badge key={field} variant="outline" className="text-xs dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600">
                          {field}
                        </Badge>
                      ))}
                      {report.fields.length > 4 && (
                        <Badge variant="outline" className="text-xs dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600">
                          +{report.fields.length - 4} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {/* View Button */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => viewReport(report.id)}
                          disabled={viewingReport === report.id}
                        >
                          {viewingReport === report.id ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Loading...
                            </>
                          ) : (
                            <>
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </>
                          )}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-6xl max-h-[80vh]">
                        <DialogHeader>
                          <DialogTitle className="flex items-center">
                            <report.icon className={`h-5 w-5 mr-2 ${report.color}`} />
                            {report.title} - Preview
                          </DialogTitle>
                          <DialogDescription>
                            Preview of {report.title.toLowerCase()} data. First 50 records shown. Download CSV for complete data.
                          </DialogDescription>
                        </DialogHeader>
                        <ScrollArea className="h-[60vh] w-full">
                          {reportData.length > 0 ? (
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  {reportColumns.map((column) => (
                                    <TableHead key={column} className="font-semibold">
                                      {column}
                                    </TableHead>
                                  ))}
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {reportData.slice(0, 50).map((row, index) => (
                                  <TableRow key={index}>
                                    {reportColumns.map((column) => {
                                      const key = column.toLowerCase().replace(/\s+/g, '').replace('%', '').replace('(₹)', '');
                                      return (
                                        <TableCell key={column} className="text-sm">
                                          {row[key] || row[column.toLowerCase()] || 'N/A'}
                                        </TableCell>
                                      );
                                    })}
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          ) : (
                            <div className="flex items-center justify-center h-32">
                              <p className="text-gray-500">No data available. Click "View" to load report data.</p>
                            </div>
                          )}
                          {reportData.length > 50 && (
                            <div className="text-center py-4 text-sm text-gray-500">
                              Showing first 50 records. Download CSV for complete data.
                            </div>
                          )}
                        </ScrollArea>
                      </DialogContent>
                    </Dialog>

                    {/* Download Button */}
                    <Button 
                      className="flex-1"
                      onClick={() => downloadReport(report.id)}
                      disabled={isDownloading}
                    >
                      {isDownloading ? (
                        <>
                          <Download className="h-4 w-4 mr-2 animate-bounce" />
                          Downloading...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </>
                      )}
                    </Button>

                    {/* Email Button */}
                    <Button 
                      variant="outline"
                      className="flex-1"
                      onClick={() => emailReport(report.id)}
                      disabled={emailingReport === report.id}
                    >
                      {emailingReport === report.id ? (
                        <>
                          <Mail className="h-4 w-4 mr-2 animate-pulse" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Mail className="h-4 w-4 mr-2" />
                          Email
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Usage Instructions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2 text-muted-foreground" />
              Usage Instructions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-foreground mb-2">Download Process</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Click any download button to generate a fresh CSV report</li>
                  <li>• Reports include the most current data from the database</li>
                  <li>• Downloads start automatically when ready</li>
                  <li>• All reports use standard CSV format for easy analysis</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-2">Data Analysis Tips</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Open CSV files in Excel, Google Sheets, or any spreadsheet app</li>
                  <li>• Use filters and pivot tables for detailed analysis</li>
                  <li>• Combine multiple reports for comprehensive insights</li>
                  <li>• Schedule regular downloads for trend analysis</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}