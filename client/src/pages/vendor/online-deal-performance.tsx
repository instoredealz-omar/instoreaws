import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MousePointer, ShoppingCart, DollarSign, TrendingUp, Eye, Package } from "lucide-react";

export default function OnlineDealPerformance() {
  const { data: performance, isLoading: performanceLoading } = useQuery({
    queryKey: ['/api/vendor/commission/performance'],
    enabled: true,
  });

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['/api/vendor/commission/summary'],
    enabled: true,
  });

  const conversionRate = summary?.totalClicks > 0 
    ? ((summary?.totalConversions || 0) / summary.totalClicks * 100).toFixed(2) 
    : '0.00';

  return (
    <div className="container mx-auto p-6 space-y-6 bg-white dark:bg-gray-950 min-h-screen">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Online Deal Performance</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Track your affiliate marketing performance</p>
      </div>

      {summaryLoading ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading summary...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Clicks</CardTitle>
              <MousePointer className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {summary?.totalClicks?.toLocaleString() || '0'}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Affiliate link clicks</p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Conversions</CardTitle>
              <ShoppingCart className="h-4 w-4 text-green-600 dark:text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {summary?.totalConversions?.toLocaleString() || '0'}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{conversionRate}% conversion rate</p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Est. Commission</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                ₹{summary?.estimatedCommission?.toLocaleString() || '0'}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Pending confirmation</p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Confirmed Commission</CardTitle>
              <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                ₹{summary?.confirmedCommission?.toLocaleString() || '0'}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Ready for payout</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">Deal Performance Breakdown</CardTitle>
          <CardDescription className="text-gray-500 dark:text-gray-400">
            Performance metrics for each online deal
          </CardDescription>
        </CardHeader>
        <CardContent>
          {performanceLoading ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading performance data...</div>
          ) : !performance || performance.length === 0 ? (
            <div className="text-center py-8 space-y-3">
              <Package className="h-16 w-16 text-gray-400 dark:text-gray-600 mx-auto" />
              <div className="text-gray-500 dark:text-gray-400">
                <p className="font-medium">No online deals found</p>
                <p className="text-sm mt-1">Create online deals with affiliate links to track performance here</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900">
                    <TableHead className="text-gray-700 dark:text-gray-300">Deal</TableHead>
                    <TableHead className="text-gray-700 dark:text-gray-300">Clicks</TableHead>
                    <TableHead className="text-gray-700 dark:text-gray-300">Conversions</TableHead>
                    <TableHead className="text-gray-700 dark:text-gray-300">Conv. Rate</TableHead>
                    <TableHead className="text-gray-700 dark:text-gray-300">Est. Revenue</TableHead>
                    <TableHead className="text-gray-700 dark:text-gray-300">Est. Commission</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {performance.map((deal: any) => {
                    const dealConversionRate = deal.clicks > 0 
                      ? ((deal.conversions / deal.clicks) * 100).toFixed(2) 
                      : '0.00';
                    
                    return (
                      <TableRow key={deal.dealId} className="border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900">
                        <TableCell className="font-medium text-gray-900 dark:text-white" data-testid={`text-deal-${deal.dealId}`}>
                          {deal.dealTitle}
                        </TableCell>
                        <TableCell className="text-gray-900 dark:text-white">
                          <div className="flex items-center gap-2">
                            <MousePointer className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                            {deal.clicks.toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-900 dark:text-white">
                          <div className="flex items-center gap-2">
                            <ShoppingCart className="h-4 w-4 text-green-500 dark:text-green-400" />
                            {deal.conversions.toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="secondary"
                            className={
                              parseFloat(dealConversionRate) >= 5 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : parseFloat(dealConversionRate) >= 2
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                            }
                          >
                            {dealConversionRate}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-900 dark:text-white">
                          ₹{deal.estimatedRevenue.toLocaleString()}
                        </TableCell>
                        <TableCell className="font-semibold text-gray-900 dark:text-white">
                          ₹{deal.estimatedCommission.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">Understanding Commission</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Eye className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                Clicks
              </h4>
              <p className="text-gray-600 dark:text-gray-400">
                Number of customers who clicked on your affiliate link to visit the vendor's website
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-green-600 dark:text-green-400" />
                Conversions
              </h4>
              <p className="text-gray-600 dark:text-gray-400">
                Confirmed purchases made by customers after clicking your link
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                Estimated Commission
              </h4>
              <p className="text-gray-600 dark:text-gray-400">
                Pending commission from clicks that haven't been confirmed as sales yet
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                Confirmed Commission
              </h4>
              <p className="text-gray-600 dark:text-gray-400">
                Commission from confirmed sales, ready for payout processing
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
