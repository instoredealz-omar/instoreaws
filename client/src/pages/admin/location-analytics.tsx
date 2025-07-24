import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LocationAnalyticsCharts } from '@/components/LocationAnalyticsCharts';
import { LocationAnalyticsFilters, LocationReportGenerator, LocationReportFilters } from '@/components/LocationAnalyticsFilters';
import { MapPin, BarChart3, TrendingUp, Download, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface LocationAnalyticsData {
  sublocationStats: Array<{ sublocation: string; city: string; state: string; dealCount: number; claimCount: number }>;
  cityDealDistribution: Array<{ city: string; state: string; totalDeals: number; totalClaims: number }>;
  areaPerformance: Array<{ area: string; city: string; conversionRate: number; averageSavings: number }>;
}

export default function AdminLocationAnalytics() {
  const [activeTab, setActiveTab] = useState("overview");
  const [filters, setFilters] = useState({});
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Fetch location analytics data
  const { data: locationData, isLoading: isLocationLoading, refetch: refetchLocation } = useQuery<LocationAnalyticsData>({
    queryKey: ['/api/admin/location-analytics', filters],
    enabled: true,
  });

  // Fetch regular analytics for comparison
  const { data: analyticsData, isLoading: isAnalyticsLoading } = useQuery({
    queryKey: ['/api/admin/analytics'],
    enabled: true,
  });

  const isLoading = isLocationLoading || isAnalyticsLoading;

  // Extract unique values for filters
  const availableCities = locationData?.cityDealDistribution.map(city => city.city) || [];
  const availableStates = [...new Set(locationData?.cityDealDistribution.map(city => city.state))] || [];
  const availableSublocations = locationData?.sublocationStats.map(stat => stat.sublocation) || [];

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
  };

  const handleRefresh = () => {
    refetchLocation();
    toast({
      title: "Data Refreshed",
      description: "Location analytics data has been updated.",
    });
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    toast({
      title: "Export Started",
      description: "Your location analytics data is being prepared for download.",
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

  const totalAreas = locationData?.sublocationStats.length || 0;
  const totalCities = locationData?.cityDealDistribution.length || 0;
  const avgConversion = locationData?.areaPerformance.length > 0 
    ? (locationData.areaPerformance.reduce((sum, area) => sum + area.conversionRate, 0) / locationData.areaPerformance.length).toFixed(1)
    : '0';
  const totalLocationClaims = locationData?.cityDealDistribution.reduce((sum, city) => sum + city.totalClaims, 0) || 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Location Analytics</h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive location-based performance analytics and insights
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
              <MapPin className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Active Areas</p>
                <p className="text-2xl font-bold">{totalAreas}</p>
                <p className="text-xs text-muted-foreground">Sublocations tracked</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Cities</p>
                <p className="text-2xl font-bold">{totalCities}</p>
                <p className="text-xs text-muted-foreground">With active deals</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Avg Conversion</p>
                <p className="text-2xl font-bold">{avgConversion}%</p>
                <p className="text-xs text-muted-foreground">Across all areas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Download className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Claims</p>
                <p className="text-2xl font-bold">{totalLocationClaims}</p>
                <p className="text-xs text-muted-foreground">Location-based</p>
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
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <LocationAnalyticsCharts 
            data={locationData || { sublocationStats: [], cityDealDistribution: [], areaPerformance: [] }} 
            isLoading={isLoading} 
          />
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Areas</CardTitle>
                <CardDescription>Areas with highest conversion rates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {locationData?.areaPerformance
                    .sort((a, b) => b.conversionRate - a.conversionRate)
                    .slice(0, 5)
                    .map((area, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                        <div>
                          <p className="font-medium">{area.area}</p>
                          <p className="text-sm text-muted-foreground">{area.city}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant={area.conversionRate > 50 ? "default" : "secondary"}>
                            {area.conversionRate.toFixed(1)}%
                          </Badge>
                          <p className="text-xs text-muted-foreground">₹{area.averageSavings.toFixed(0)} avg</p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>City Performance Rankings</CardTitle>
                <CardDescription>Cities ranked by total deal activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {locationData?.cityDealDistribution
                    .sort((a, b) => b.totalDeals - a.totalDeals)
                    .slice(0, 5)
                    .map((city, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                        <div>
                          <p className="font-medium">{city.city}</p>
                          <p className="text-sm text-muted-foreground">{city.state}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{city.totalDeals}</p>
                          <p className="text-xs text-muted-foreground">{city.totalClaims} claims</p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Sublocation Distribution</CardTitle>
                <CardDescription>All sublocations with deal and claim statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Sublocation</th>
                        <th className="text-left p-2">City</th>
                        <th className="text-left p-2">State</th>
                        <th className="text-right p-2">Deals</th>
                        <th className="text-right p-2">Claims</th>
                        <th className="text-right p-2">Conversion</th>
                      </tr>
                    </thead>
                    <tbody>
                      {locationData?.sublocationStats.map((stat, index) => (
                        <tr key={index} className="border-b hover:bg-muted/50">
                          <td className="p-2 font-medium">{stat.sublocation}</td>
                          <td className="p-2">{stat.city}</td>
                          <td className="p-2">{stat.state}</td>
                          <td className="p-2 text-right">{stat.dealCount}</td>
                          <td className="p-2 text-right">{stat.claimCount}</td>
                          <td className="p-2 text-right">
                            <Badge variant={
                              stat.dealCount > 0 
                                ? ((stat.claimCount / stat.dealCount) * 100) > 50 
                                  ? "default" 
                                  : "secondary"
                                : "outline"
                            }>
                              {stat.dealCount > 0 
                                ? ((stat.claimCount / stat.dealCount) * 100).toFixed(1)
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
          </div>
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