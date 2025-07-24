import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VendorLocationAnalyticsCharts } from '@/components/LocationAnalyticsCharts';
import { LocationAnalyticsFilters, LocationReportGenerator, LocationReportFilters } from '@/components/LocationAnalyticsFilters';
import { MapPin, Store, TrendingUp, Download, RefreshCw, IndianRupee } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface VendorLocationAnalyticsData {
  storePerformance: Array<{ storeName: string; sublocation: string; city: string; dealCount: number; claimCount: number; revenue: number }>;
  cityBreakdown: Array<{ city: string; state: string; storeCount: number; totalDeals: number; totalClaims: number }>;
}

export default function VendorLocationAnalytics() {
  const [activeTab, setActiveTab] = useState("overview");
  const [filters, setFilters] = useState({});
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Fetch vendor location analytics data
  const { data: locationData, isLoading: isLocationLoading, refetch: refetchLocation } = useQuery<VendorLocationAnalyticsData>({
    queryKey: ['/api/vendors/location-analytics', filters],
    enabled: true,
  });

  const isLoading = isLocationLoading;

  // Extract unique values for filters
  const availableCities = locationData?.cityBreakdown.map(city => city.city) || [];
  const availableStates = [...new Set(locationData?.cityBreakdown.map(city => city.state))] || [];
  const availableSublocations = locationData?.storePerformance.map(store => store.sublocation) || [];

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
  };

  const handleRefresh = () => {
    refetchLocation();
    toast({
      title: "Data Refreshed",
      description: "Store location analytics data has been updated.",
    });
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    toast({
      title: "Export Started",
      description: "Your store analytics data is being prepared for download.",
    });
  };

  const handleGenerateReport = async (reportFilters: LocationReportFilters) => {
    setIsGeneratingReport(true);
    try {
      // TODO: Implement report generation API call
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      
      toast({
        title: "Report Generated",
        description: `Your ${reportFilters.reportType} report in ${reportFilters.format.toUpperCase()} format is ready for download.`,
      });
    } catch (error) {
      toast({
        title: "Report Generation Failed",
        description: "There was an error generating your report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-muted rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  const totalStores = locationData?.storePerformance.length || 0;
  const totalCities = locationData?.cityBreakdown.length || 0;
  const totalRevenue = locationData?.storePerformance.reduce((sum, store) => sum + store.revenue, 0) || 0;
  const totalClaims = locationData?.storePerformance.reduce((sum, store) => sum + store.claimCount, 0) || 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Store Location Analytics</h1>
          <p className="text-muted-foreground mt-2">
            Performance insights for all your store locations
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Store className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Stores</p>
                <p className="text-2xl font-bold">{totalStores}</p>
                <p className="text-xs text-muted-foreground">Active locations</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Cities</p>
                <p className="text-2xl font-bold">{totalCities}</p>
                <p className="text-xs text-muted-foreground">Market presence</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <IndianRupee className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">₹{totalRevenue.toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">All locations</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Claims</p>
                <p className="text-2xl font-bold">{totalClaims}</p>
                <p className="text-xs text-muted-foreground">Across all stores</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <LocationAnalyticsFilters
        onFilterChange={handleFilterChange}
        availableCities={availableCities}
        availableStates={availableStates}
        availableSublocations={availableSublocations}
        isLoading={isLoading}
        onExport={handleExport}
      />

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="stores">Store Details</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <VendorLocationAnalyticsCharts 
            data={locationData || { storePerformance: [], cityBreakdown: [] }} 
            isLoading={isLoading} 
          />
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Stores</CardTitle>
                <CardDescription>Stores with highest revenue</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {locationData?.storePerformance
                    .sort((a, b) => b.revenue - a.revenue)
                    .slice(0, 5)
                    .map((store, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                        <div>
                          <p className="font-medium">{store.storeName}</p>
                          <p className="text-sm text-muted-foreground">{store.sublocation}, {store.city}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">₹{store.revenue.toFixed(0)}</p>
                          <p className="text-xs text-muted-foreground">{store.claimCount} claims</p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>City Performance</CardTitle>
                <CardDescription>Performance by city</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {locationData?.cityBreakdown
                    .sort((a, b) => b.totalClaims - a.totalClaims)
                    .map((city, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                        <div>
                          <p className="font-medium">{city.city}</p>
                          <p className="text-sm text-muted-foreground">{city.state}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{city.storeCount} stores</p>
                          <p className="text-xs text-muted-foreground">{city.totalDeals} deals, {city.totalClaims} claims</p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="stores" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Store Performance Details</CardTitle>
              <CardDescription>Detailed performance metrics for each store location</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Store Name</th>
                      <th className="text-left p-2">Location</th>
                      <th className="text-left p-2">City</th>
                      <th className="text-right p-2">Deals</th>
                      <th className="text-right p-2">Claims</th>
                      <th className="text-right p-2">Revenue</th>
                      <th className="text-right p-2">Conversion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {locationData?.storePerformance.map((store, index) => (
                      <tr key={index} className="border-b hover:bg-muted/50">
                        <td className="p-2 font-medium">{store.storeName}</td>
                        <td className="p-2">{store.sublocation}</td>
                        <td className="p-2">{store.city}</td>
                        <td className="p-2 text-right">{store.dealCount}</td>
                        <td className="p-2 text-right">{store.claimCount}</td>
                        <td className="p-2 text-right">₹{store.revenue.toFixed(0)}</td>
                        <td className="p-2 text-right">
                          <Badge variant={
                            store.dealCount > 0 
                              ? ((store.claimCount / store.dealCount) * 100) > 50 
                                ? "default" 
                                : "secondary"
                              : "outline"
                          }>
                            {store.dealCount > 0 
                              ? ((store.claimCount / store.dealCount) * 100).toFixed(1)
                              : 0}%
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <LocationReportGenerator
            onGenerateReport={handleGenerateReport}
            availableCities={availableCities}
            availableStates={availableStates}
            availableSublocations={availableSublocations}
            isGenerating={isGeneratingReport}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}