import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer, ComposedChart, Line, Area, AreaChart } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, MapPin, Target, Users, ChartBar } from 'lucide-react';

interface LocationAnalyticsData {
  sublocationStats: Array<{ sublocation: string; city: string; state: string; dealCount: number; claimCount: number }>;
  cityDealDistribution: Array<{ city: string; state: string; totalDeals: number; totalClaims: number }>;
  areaPerformance: Array<{ area: string; city: string; conversionRate: number; averageSavings: number }>;
}

interface VendorLocationAnalyticsData {
  storePerformance: Array<{ storeName: string; sublocation: string; city: string; dealCount: number; claimCount: number; revenue: number }>;
  cityBreakdown: Array<{ city: string; state: string; storeCount: number; totalDeals: number; totalClaims: number }>;
}

interface LocationAnalyticsChartsProps {
  data: LocationAnalyticsData;
  isLoading?: boolean;
}

interface VendorLocationAnalyticsChartsProps {
  data: VendorLocationAnalyticsData;
  isLoading?: boolean;
}

const CHART_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7300'];

export function LocationAnalyticsCharts({ data, isLoading }: LocationAnalyticsChartsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-1/2"></div>
              <div className="h-3 bg-muted rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Prepare data for charts
  const sublocationChartData = data.sublocationStats.slice(0, 10).map(stat => ({
    name: `${stat.sublocation}, ${stat.city}`,
    deals: stat.dealCount,
    claims: stat.claimCount,
    conversionRate: stat.dealCount > 0 ? ((stat.claimCount / stat.dealCount) * 100).toFixed(1) : 0
  }));

  const cityDistributionData = data.cityDealDistribution.slice(0, 8).map((city, index) => ({
    name: city.city,
    deals: city.totalDeals,
    claims: city.totalClaims,
    fill: CHART_COLORS[index % CHART_COLORS.length]
  }));

  const areaPerformanceData = data.areaPerformance.slice(0, 10).map(area => ({
    name: `${area.area}, ${area.city}`,
    conversionRate: Number(area.conversionRate.toFixed(1)),
    avgSavings: Number(area.averageSavings.toFixed(0))
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sublocation Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-500" />
              Top Performing Areas
            </CardTitle>
            <CardDescription>
              Deal distribution and claims by sublocation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={sublocationChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  fontSize={10}
                />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-background border rounded-lg p-3 shadow-lg">
                          <p className="font-medium text-sm">{label}</p>
                          {payload.map((entry, index) => (
                            <p key={index} className="text-xs" style={{ color: entry.color }}>
                              {entry.name}: {entry.value}
                              {entry.dataKey === 'conversionRate' && '%'}
                            </p>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="deals" fill="#8884d8" name="Total Deals" />
                <Bar yAxisId="left" dataKey="claims" fill="#82ca9d" name="Claims" />
                <Line yAxisId="right" type="monotone" dataKey="conversionRate" stroke="#ff7300" name="Conversion %" />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* City Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-500" />
              City Deal Distribution
            </CardTitle>
            <CardDescription>
              Deal distribution across major cities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={cityDistributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="deals"
                >
                  {cityDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Area Performance Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-500" />
            Area Performance Analytics
          </CardTitle>
          <CardDescription>
            Conversion rates and average savings by area
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart data={areaPerformanceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={100}
                fontSize={10}
              />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-background border rounded-lg p-3 shadow-lg">
                        <p className="font-medium text-sm">{label}</p>
                        {payload.map((entry, index) => (
                          <p key={index} className="text-xs" style={{ color: entry.color }}>
                            {entry.name}: {entry.value}
                            {entry.dataKey === 'conversionRate' && '%'}
                            {entry.dataKey === 'avgSavings' && '₹'}
                          </p>
                        ))}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
              <Area yAxisId="left" type="monotone" dataKey="conversionRate" stackId="1" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} name="Conversion Rate %" />
              <Bar yAxisId="right" dataKey="avgSavings" fill="#82ca9d" name="Avg Savings (₹)" />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-xs text-muted-foreground">Total Areas</p>
                <p className="text-lg font-bold">{data.sublocationStats.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-xs text-muted-foreground">Active Cities</p>
                <p className="text-lg font-bold">{data.cityDealDistribution.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <ChartBar className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-xs text-muted-foreground">Avg Conversion</p>
                <p className="text-lg font-bold">
                  {data.areaPerformance.length > 0 
                    ? (data.areaPerformance.reduce((sum, area) => sum + area.conversionRate, 0) / data.areaPerformance.length).toFixed(1)
                    : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-xs text-muted-foreground">Total Claims</p>
                <p className="text-lg font-bold">
                  {data.cityDealDistribution.reduce((sum, city) => sum + city.totalClaims, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function VendorLocationAnalyticsCharts({ data, isLoading }: VendorLocationAnalyticsChartsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-1/2"></div>
              <div className="h-3 bg-muted rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Prepare data for vendor charts
  const storePerformanceData = data.storePerformance.slice(0, 10).map(store => ({
    name: `${store.storeName}\n${store.sublocation}`,
    deals: store.dealCount,
    claims: store.claimCount,
    revenue: store.revenue,
    conversionRate: store.dealCount > 0 ? ((store.claimCount / store.dealCount) * 100).toFixed(1) : 0
  }));

  const cityBreakdownData = data.cityBreakdown.map((city, index) => ({
    name: city.city,
    stores: city.storeCount,
    deals: city.totalDeals,
    claims: city.totalClaims,
    fill: CHART_COLORS[index % CHART_COLORS.length]
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Store Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-500" />
              Store Performance
            </CardTitle>
            <CardDescription>
              Performance metrics for each store location
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={storePerformanceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  fontSize={10}
                />
                <YAxis />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-background border rounded-lg p-3 shadow-lg">
                          <p className="font-medium text-sm">{label.replace('\n', ' - ')}</p>
                          {payload.map((entry, index) => (
                            <p key={index} className="text-xs" style={{ color: entry.color }}>
                              {entry.name}: {entry.value}
                              {entry.dataKey === 'revenue' && '₹'}
                            </p>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                <Bar dataKey="deals" fill="#8884d8" name="Total Deals" />
                <Bar dataKey="claims" fill="#82ca9d" name="Claims" />
                <Bar dataKey="revenue" fill="#ffc658" name="Revenue (₹)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* City Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-500" />
              City Breakdown
            </CardTitle>
            <CardDescription>
              Store and deal distribution by city
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={cityBreakdownData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value} stores`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="stores"
                >
                  {cityBreakdownData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Revenue by Location */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-500" />
            Revenue by Location
          </CardTitle>
          <CardDescription>
            Revenue performance across store locations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={storePerformanceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={100}
                fontSize={10}
              />
              <YAxis />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-background border rounded-lg p-3 shadow-lg">
                        <p className="font-medium text-sm">{label.replace('\n', ' - ')}</p>
                        {payload.map((entry, index) => (
                          <p key={index} className="text-xs" style={{ color: entry.color }}>
                            Revenue: ₹{entry.value}
                          </p>
                        ))}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-xs text-muted-foreground">Total Stores</p>
                <p className="text-lg font-bold">{data.storePerformance.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-xs text-muted-foreground">Active Cities</p>
                <p className="text-lg font-bold">{data.cityBreakdown.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <ChartBar className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-xs text-muted-foreground">Total Revenue</p>
                <p className="text-lg font-bold">
                  ₹{data.storePerformance.reduce((sum, store) => sum + store.revenue, 0).toFixed(0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-xs text-muted-foreground">Total Claims</p>
                <p className="text-lg font-bold">
                  {data.storePerformance.reduce((sum, store) => sum + store.claimCount, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}