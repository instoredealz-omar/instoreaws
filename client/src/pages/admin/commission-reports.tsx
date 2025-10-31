import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { DollarSign, TrendingUp, MousePointer, ShoppingCart, Users, Calendar, Plus } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function CommissionReports() {
  const { toast } = useToast();
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [saleAmount, setSaleAmount] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  
  const [createPayoutDialogOpen, setCreatePayoutDialogOpen] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState("");
  const [payoutPeriodStart, setPayoutPeriodStart] = useState("");
  const [payoutPeriodEnd, setPayoutPeriodEnd] = useState("");
  const [payoutNotes, setPayoutNotes] = useState("");
  
  const [selectedPayout, setSelectedPayout] = useState<any>(null);
  const [payoutActionDialogOpen, setPayoutActionDialogOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [transactionReference, setTransactionReference] = useState("");

  const buildOverviewUrl = () => {
    const params = new URLSearchParams();
    if (dateFrom) params.append('from', dateFrom);
    if (dateTo) params.append('to', dateTo);
    const queryString = params.toString();
    return `/api/admin/commission/overview${queryString ? `?${queryString}` : ''}`;
  };

  const buildTransactionsUrl = () => {
    const params = new URLSearchParams();
    if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
    if (dateFrom) params.append('from', dateFrom);
    if (dateTo) params.append('to', dateTo);
    const queryString = params.toString();
    return `/api/admin/commission/transactions${queryString ? `?${queryString}` : ''}`;
  };

  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: [buildOverviewUrl()],
    enabled: true,
  });

  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: [buildTransactionsUrl()],
    enabled: true,
  });

  const { data: payouts, isLoading: payoutsLoading } = useQuery({
    queryKey: ['/api/admin/commission/payouts'],
    enabled: true,
  });

  const { data: vendors } = useQuery({
    queryKey: ['/api/admin/vendors'],
    enabled: true,
  });

  const confirmMutation = useMutation({
    mutationFn: async ({ id, saleAmount }: { id: number; saleAmount: string }) => {
      return await apiRequest(`/api/admin/commission/transactions/${id}/confirm`, {
        method: 'PUT',
        body: JSON.stringify({ saleAmount }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: query => 
        query.queryKey[0]?.toString().includes('/api/admin/commission/transactions') 
      });
      queryClient.invalidateQueries({ predicate: query => 
        query.queryKey[0]?.toString().includes('/api/admin/commission/overview') 
      });
      toast({
        title: "Success",
        description: "Transaction confirmed successfully",
      });
      setConfirmDialogOpen(false);
      setSelectedTransaction(null);
      setSaleAmount("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to confirm transaction",
        variant: "destructive",
      });
    },
  });

  const createPayoutMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('/api/admin/commission/payouts', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: query => 
        query.queryKey[0]?.toString().includes('/api/admin/commission/payouts') 
      });
      queryClient.invalidateQueries({ predicate: query => 
        query.queryKey[0]?.toString().includes('/api/admin/commission/transactions') 
      });
      queryClient.invalidateQueries({ predicate: query => 
        query.queryKey[0]?.toString().includes('/api/admin/commission/overview') 
      });
      toast({
        title: "Success",
        description: "Payout batch created successfully",
      });
      setCreatePayoutDialogOpen(false);
      setSelectedVendorId("");
      setPayoutPeriodStart("");
      setPayoutPeriodEnd("");
      setPayoutNotes("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create payout batch",
        variant: "destructive",
      });
    },
  });

  const updatePayoutMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await apiRequest(`/api/admin/commission/payouts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: query => 
        query.queryKey[0]?.toString().includes('/api/admin/commission/payouts') 
      });
      queryClient.invalidateQueries({ predicate: query => 
        query.queryKey[0]?.toString().includes('/api/admin/commission/transactions') 
      });
      toast({
        title: "Success",
        description: "Payout batch updated successfully",
      });
      setPayoutActionDialogOpen(false);
      setSelectedPayout(null);
      setPaymentMethod("");
      setTransactionReference("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update payout batch",
        variant: "destructive",
      });
    },
  });

  const handleConfirmTransaction = (transaction: any) => {
    setSelectedTransaction(transaction);
    setConfirmDialogOpen(true);
  };

  const handleConfirmSubmit = () => {
    if (!selectedTransaction || !saleAmount) {
      toast({
        title: "Error",
        description: "Please enter sale amount",
        variant: "destructive",
      });
      return;
    }

    confirmMutation.mutate({
      id: selectedTransaction.id,
      saleAmount,
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6 bg-white dark:bg-gray-950 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Commission Reports</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Track and manage online deal commissions</p>
        </div>
      </div>

      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <Label htmlFor="dateFrom" className="text-gray-700 dark:text-gray-300">From Date</Label>
          <Input
            id="dateFrom"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
            data-testid="input-date-from"
          />
        </div>
        <div className="flex-1">
          <Label htmlFor="dateTo" className="text-gray-700 dark:text-gray-300">To Date</Label>
          <Input
            id="dateTo"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
            data-testid="input-date-to"
          />
        </div>
        <Button 
          onClick={() => {
            setDateFrom("");
            setDateTo("");
          }}
          variant="outline"
          className="border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
          data-testid="button-clear-filters"
        >
          Clear Filters
        </Button>
      </div>

      {overviewLoading ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading overview...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                ₹{overview?.totalCommissionRevenue?.toLocaleString() || '0'}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Commission earned</p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Clicks</CardTitle>
              <MousePointer className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {overview?.totalOnlineClicks?.toLocaleString() || '0'}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Affiliate link clicks</p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Conversions</CardTitle>
              <ShoppingCart className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {overview?.totalConversions?.toLocaleString() || '0'}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Confirmed sales</p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Active Vendors</CardTitle>
              <Users className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {overview?.totalVendorsWithOnlineDeals || '0'}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">With online deals</p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Avg Commission</CardTitle>
              <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {overview?.averageCommissionRate?.toFixed(2) || '0'}%
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Average rate</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList className="bg-gray-100 dark:bg-gray-900">
          <TabsTrigger value="transactions" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 text-gray-700 dark:text-gray-300">
            Transactions
          </TabsTrigger>
          <TabsTrigger value="payouts" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 text-gray-700 dark:text-gray-300">
            Payout Batches
          </TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-gray-900 dark:text-white">Commission Transactions</CardTitle>
                  <CardDescription className="text-gray-500 dark:text-gray-400">
                    View and manage all commission transactions
                  </CardDescription>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px] bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {transactionsLoading ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading transactions...</div>
              ) : !transactions || transactions.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">No transactions found</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900">
                        <TableHead className="text-gray-700 dark:text-gray-300">ID</TableHead>
                        <TableHead className="text-gray-700 dark:text-gray-300">Vendor</TableHead>
                        <TableHead className="text-gray-700 dark:text-gray-300">Deal</TableHead>
                        <TableHead className="text-gray-700 dark:text-gray-300">Type</TableHead>
                        <TableHead className="text-gray-700 dark:text-gray-300">Sale Amount</TableHead>
                        <TableHead className="text-gray-700 dark:text-gray-300">Commission</TableHead>
                        <TableHead className="text-gray-700 dark:text-gray-300">Status</TableHead>
                        <TableHead className="text-gray-700 dark:text-gray-300">Date</TableHead>
                        <TableHead className="text-gray-700 dark:text-gray-300">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((transaction: any) => (
                        <TableRow key={transaction.id} className="border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900">
                          <TableCell className="text-gray-900 dark:text-white" data-testid={`text-transaction-id-${transaction.id}`}>
                            {transaction.id}
                          </TableCell>
                          <TableCell className="text-gray-900 dark:text-white">
                            {transaction.vendor?.businessName || 'N/A'}
                          </TableCell>
                          <TableCell className="text-gray-900 dark:text-white">
                            {transaction.deal?.title || 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={transaction.transactionType === 'conversion' ? 'default' : 'secondary'}
                              className={transaction.transactionType === 'conversion' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'}
                            >
                              {transaction.transactionType}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-900 dark:text-white">
                            {transaction.saleAmount ? `₹${parseFloat(transaction.saleAmount).toLocaleString()}` : '-'}
                          </TableCell>
                          <TableCell className="text-gray-900 dark:text-white">
                            ₹{parseFloat(transaction.commissionAmount).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                transaction.status === 'paid' ? 'default' :
                                transaction.status === 'confirmed' ? 'default' :
                                'secondary'
                              }
                              className={
                                transaction.status === 'paid' 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                  : transaction.status === 'confirmed'
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                              }
                            >
                              {transaction.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-900 dark:text-white">
                            {transaction.clickTimestamp ? new Date(transaction.clickTimestamp).toLocaleDateString() : '-'}
                          </TableCell>
                          <TableCell>
                            {transaction.transactionType === 'click' && transaction.status === 'pending' && (
                              <Button
                                size="sm"
                                onClick={() => handleConfirmTransaction(transaction)}
                                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white"
                                data-testid={`button-confirm-${transaction.id}`}
                              >
                                Confirm
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payouts" className="space-y-4">
          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Payout Batches</CardTitle>
              <CardDescription className="text-gray-500 dark:text-gray-400">
                Manage commission payout batches
              </CardDescription>
            </CardHeader>
            <CardContent>
              {payoutsLoading ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading payouts...</div>
              ) : !payouts || payouts.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">No payout batches found</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900">
                        <TableHead className="text-gray-700 dark:text-gray-300">Batch #</TableHead>
                        <TableHead className="text-gray-700 dark:text-gray-300">Vendor</TableHead>
                        <TableHead className="text-gray-700 dark:text-gray-300">Period</TableHead>
                        <TableHead className="text-gray-700 dark:text-gray-300">Conversions</TableHead>
                        <TableHead className="text-gray-700 dark:text-gray-300">Total Commission</TableHead>
                        <TableHead className="text-gray-700 dark:text-gray-300">Status</TableHead>
                        <TableHead className="text-gray-700 dark:text-gray-300">Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payouts.map((payout: any) => (
                        <TableRow key={payout.id} className="border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900">
                          <TableCell className="text-gray-900 dark:text-white font-mono text-sm" data-testid={`text-batch-${payout.id}`}>
                            {payout.batchNumber}
                          </TableCell>
                          <TableCell className="text-gray-900 dark:text-white">
                            {payout.vendor?.businessName || 'N/A'}
                          </TableCell>
                          <TableCell className="text-gray-900 dark:text-white">
                            {new Date(payout.periodStart).toLocaleDateString()} - {new Date(payout.periodEnd).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-gray-900 dark:text-white">
                            {payout.totalConversions}
                          </TableCell>
                          <TableCell className="text-gray-900 dark:text-white font-semibold">
                            ₹{parseFloat(payout.totalCommission).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={payout.status === 'paid' ? 'default' : 'secondary'}
                              className={payout.status === 'paid' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'}
                            >
                              {payout.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-900 dark:text-white">
                            {new Date(payout.generatedAt).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">Confirm Conversion</DialogTitle>
            <DialogDescription className="text-gray-500 dark:text-gray-400">
              Enter the sale amount to confirm this transaction as a conversion
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="saleAmount" className="text-gray-700 dark:text-gray-300">Sale Amount (₹)</Label>
              <Input
                id="saleAmount"
                type="number"
                value={saleAmount}
                onChange={(e) => setSaleAmount(e.target.value)}
                placeholder="Enter sale amount"
                className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
                data-testid="input-sale-amount"
              />
            </div>
            {selectedTransaction && (
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg space-y-1 text-sm">
                <p className="text-gray-700 dark:text-gray-300">
                  <span className="font-semibold">Deal:</span> {selectedTransaction.deal?.title}
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  <span className="font-semibold">Vendor:</span> {selectedTransaction.vendor?.businessName}
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  <span className="font-semibold">Click Date:</span> {new Date(selectedTransaction.clickTimestamp).toLocaleString()}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setConfirmDialogOpen(false);
                setSelectedTransaction(null);
                setSaleAmount("");
              }}
              className="border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
              data-testid="button-cancel-confirm"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmSubmit}
              disabled={confirmMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white"
              data-testid="button-submit-confirm"
            >
              {confirmMutation.isPending ? "Confirming..." : "Confirm Conversion"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
