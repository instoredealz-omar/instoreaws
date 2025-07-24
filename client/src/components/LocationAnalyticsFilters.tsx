import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Filter, MapPin, Calendar, Download, BarChart3 } from 'lucide-react';

interface LocationFilterOptions {
  city?: string;
  state?: string;
  sublocation?: string;
  dateRange?: string;
  minDeals?: number;
  minClaims?: number;
}

interface LocationAnalyticsFiltersProps {
  onFilterChange: (filters: LocationFilterOptions) => void;
  availableCities: string[];
  availableStates: string[];
  availableSublocations: string[];
  isLoading?: boolean;
  onExport?: () => void;
}

export function LocationAnalyticsFilters({ 
  onFilterChange, 
  availableCities, 
  availableStates, 
  availableSublocations,
  isLoading,
  onExport 
}: LocationAnalyticsFiltersProps) {
  const [filters, setFilters] = useState<LocationFilterOptions>({});

  const handleFilterUpdate = (key: keyof LocationFilterOptions, value: string | number | undefined) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    setFilters({});
    onFilterChange({});
  };

  const activeFilterCount = Object.values(filters).filter(v => v !== undefined && v !== '').length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-blue-500" />
            Location Analytics Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFilterCount} active
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            {onExport && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onExport}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearFilters}
              disabled={activeFilterCount === 0}
            >
              Clear All
            </Button>
          </div>
        </CardTitle>
        <CardDescription>
          Filter location analytics data by geographic and performance criteria
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {/* Geographic Filters */}
          <div className="space-y-2">
            <Label htmlFor="state-filter" className="text-sm font-medium">State</Label>
            <Select
              value={filters.state || ''}
              onValueChange={(value) => handleFilterUpdate('state', value || undefined)}
            >
              <SelectTrigger id="state-filter">
                <SelectValue placeholder="All States" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All States</SelectItem>
                {availableStates.map((state) => (
                  <SelectItem key={state} value={state}>{state}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="city-filter" className="text-sm font-medium">City</Label>
            <Select
              value={filters.city || ''}
              onValueChange={(value) => handleFilterUpdate('city', value || undefined)}
            >
              <SelectTrigger id="city-filter">
                <SelectValue placeholder="All Cities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Cities</SelectItem>
                {availableCities.map((city) => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sublocation-filter" className="text-sm font-medium">Area/Sublocation</Label>
            <Select
              value={filters.sublocation || ''}
              onValueChange={(value) => handleFilterUpdate('sublocation', value || undefined)}
            >
              <SelectTrigger id="sublocation-filter">
                <SelectValue placeholder="All Areas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Areas</SelectItem>
                {availableSublocations.map((sublocation) => (
                  <SelectItem key={sublocation} value={sublocation}>{sublocation}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Performance Filters */}
          <div className="space-y-2">
            <Label htmlFor="date-range" className="text-sm font-medium">Date Range</Label>
            <Select
              value={filters.dateRange || ''}
              onValueChange={(value) => handleFilterUpdate('dateRange', value || undefined)}
            >
              <SelectTrigger id="date-range">
                <SelectValue placeholder="All Time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Time</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="90d">Last 90 Days</SelectItem>
                <SelectItem value="1y">Last Year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="min-deals" className="text-sm font-medium">Min Deals</Label>
            <Input
              id="min-deals"
              type="number"
              placeholder="0"
              value={filters.minDeals || ''}
              onChange={(e) => handleFilterUpdate('minDeals', e.target.value ? parseInt(e.target.value) : undefined)}
              min={0}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="min-claims" className="text-sm font-medium">Min Claims</Label>
            <Input
              id="min-claims"
              type="number"
              placeholder="0"
              value={filters.minClaims || ''}
              onChange={(e) => handleFilterUpdate('minClaims', e.target.value ? parseInt(e.target.value) : undefined)}
              min={0}
            />
          </div>
        </div>

        {/* Active Filters Display */}
        {activeFilterCount > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Active Filters:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {filters.state && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  State: {filters.state}
                </Badge>
              )}
              {filters.city && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  City: {filters.city}
                </Badge>
              )}
              {filters.sublocation && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Area: {filters.sublocation}
                </Badge>
              )}
              {filters.dateRange && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {filters.dateRange === '7d' && 'Last 7 Days'}
                  {filters.dateRange === '30d' && 'Last 30 Days'}
                  {filters.dateRange === '90d' && 'Last 90 Days'}
                  {filters.dateRange === '1y' && 'Last Year'}
                </Badge>
              )}
              {filters.minDeals && (
                <Badge variant="outline">
                  Min Deals: {filters.minDeals}+
                </Badge>
              )}
              {filters.minClaims && (
                <Badge variant="outline">
                  Min Claims: {filters.minClaims}+
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export interface LocationReportFilters {
  city?: string;
  state?: string;
  sublocation?: string;
  dateRange?: string;
  reportType: 'summary' | 'detailed' | 'performance' | 'trends';
  format: 'csv' | 'pdf' | 'excel';
}

interface LocationReportGeneratorProps {
  onGenerateReport: (filters: LocationReportFilters) => void;
  availableCities: string[];
  availableStates: string[];
  availableSublocations: string[];
  isGenerating?: boolean;
}

export function LocationReportGenerator({ 
  onGenerateReport, 
  availableCities, 
  availableStates, 
  availableSublocations,
  isGenerating 
}: LocationReportGeneratorProps) {
  const [reportFilters, setReportFilters] = useState<LocationReportFilters>({
    reportType: 'summary',
    format: 'csv'
  });

  const handleReportUpdate = (key: keyof LocationReportFilters, value: string) => {
    setReportFilters(prev => ({ ...prev, [key]: value }));
  };

  const generateReport = () => {
    onGenerateReport(reportFilters);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5 text-green-500" />
          Generate Location Report
        </CardTitle>
        <CardDescription>
          Create detailed reports based on location analytics data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div className="space-y-2">
            <Label htmlFor="report-type" className="text-sm font-medium">Report Type</Label>
            <Select
              value={reportFilters.reportType}
              onValueChange={(value) => handleReportUpdate('reportType', value)}
            >
              <SelectTrigger id="report-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="summary">Summary Report</SelectItem>
                <SelectItem value="detailed">Detailed Analysis</SelectItem>
                <SelectItem value="performance">Performance Report</SelectItem>
                <SelectItem value="trends">Trend Analysis</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="report-format" className="text-sm font-medium">Format</Label>
            <Select
              value={reportFilters.format}
              onValueChange={(value) => handleReportUpdate('format', value)}
            >
              <SelectTrigger id="report-format">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="excel">Excel</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="report-city" className="text-sm font-medium">Filter by City</Label>
            <Select
              value={reportFilters.city || ''}
              onValueChange={(value) => handleReportUpdate('city', value)}
            >
              <SelectTrigger id="report-city">
                <SelectValue placeholder="All Cities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Cities</SelectItem>
                {availableCities.map((city) => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="report-date-range" className="text-sm font-medium">Date Range</Label>
            <Select
              value={reportFilters.dateRange || ''}
              onValueChange={(value) => handleReportUpdate('dateRange', value)}
            >
              <SelectTrigger id="report-date-range">
                <SelectValue placeholder="All Time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Time</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="90d">Last 90 Days</SelectItem>
                <SelectItem value="1y">Last Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button 
          onClick={generateReport}
          disabled={isGenerating}
          className="w-full md:w-auto"
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
              Generating Report...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Generate Report
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}