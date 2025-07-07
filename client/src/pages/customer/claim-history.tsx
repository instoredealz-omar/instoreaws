import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { 
  Search, 
  Calendar,
  MapPin, 
  Clock, 
  TrendingUp,
  PiggyBank,
  Ticket,
  Filter,
  FileText,
  Receipt,
  Calculator,
  Loader2
} from "lucide-react";

export default function ClaimHistory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [billingClaim, setBillingClaim] = useState<any>(null);
  const [billAmount, setBillAmount] = useState<string>('');
  const [calculatedSavings, setCalculatedSavings] = useState<number>(0);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: claims = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/users/claims"],
  });

  const { data: userDetails } = useQuery({
    queryKey: ["/api/auth/me"],
  });

  // Calculate savings based on bill amount
  const calculateSavings = (billAmountValue: string, discountPercentage: number) => {
    const amount = parseFloat(billAmountValue);
    if (isNaN(amount) || amount <= 0) return 0;
    return (amount * discountPercentage) / 100;
  };

  // Update bill amount mutation
  const updateBillMutation = useMutation({
    mutationFn: async ({ dealId, billAmount, savings }: { dealId: number, billAmount: number, savings: number }) => {
      return apiRequest(`/api/deals/${dealId}/update-bill`, 'POST', {
        billAmount,
        actualSavings: savings
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Bill Updated Successfully!",
        description: `Your actual savings of ₹${calculatedSavings.toFixed(2)} have been recorded.`,
        variant: "default",
      });
      
      // Reset and close billing dialog
      setBillingClaim(null);
      setBillAmount('');
      setCalculatedSavings(0);
      
      // Refresh user data to update dashboard
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/claims"] });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: "Failed to update bill amount. Please try again.",
        variant: "destructive",
      });
    }
  });

  if (!user) return null;

  const currentUser = userDetails || user;

  // Filter and sort claims
  const filteredClaims = (claims || []).filter((claim: any) => {
    const matchesSearch = searchQuery === "" || 
      claim.deal?.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      claim.vendor?.businessName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === "all" || claim.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const sortedClaims = [...filteredClaims].sort((a: any, b: any) => {
    switch (sortBy) {
      case "savings":
        return parseFloat(b.savingsAmount) - parseFloat(a.savingsAmount);
      case "oldest":
        return new Date(a.claimedAt).getTime() - new Date(b.claimedAt).getTime();
      default: // newest
        return new Date(b.claimedAt).getTime() - new Date(a.claimedAt).getTime();
    }
  });

  // Calculate summary stats
  const totalSavings = (claims || []).reduce((sum: number, claim: any) => sum + parseFloat(claim.savingsAmount), 0);
  const usedClaims = (claims || []).filter((claim: any) => claim.status === "used").length;
  const pendingClaims = (claims || []).filter((claim: any) => claim.status === "claimed").length;

  const summaryStats = [
    {
      title: "Total Claims",
      value: (claims || []).length,
      icon: Ticket,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Total Savings",
      value: `₹${totalSavings.toLocaleString('en-IN')}`,
      icon: PiggyBank,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      title: "Used Claims",
      value: usedClaims,
      icon: TrendingUp,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      title: "Pending Claims",
      value: pendingClaims,
      icon: Clock,
      color: "text-saffron",
      bgColor: "bg-saffron/10",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "used":
        return "bg-success text-white";
      case "expired":
        return "bg-destructive text-white";
      default:
        return "bg-warning text-white";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-4">Claim History</h1>
          <p className="text-muted-foreground">
            Track all your claimed deals and savings in one place
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {summaryStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm">{stat.title}</p>
                      <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    </div>
                    <div className={`${stat.bgColor} p-3 rounded-lg`}>
                      <Icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="grid md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search claims..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="claimed">Claimed</SelectItem>
                  <SelectItem value="used">Used</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="savings">Highest Savings</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Claims List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Your Claims ({sortedClaims.length})</span>
              <Button variant="outline" asChild>
                <Link to="/customer/deals">Browse More Deals</Link>
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2">Loading claims...</p>
              </div>
            ) : sortedClaims.length > 0 ? (
              <div className="space-y-4">
                {sortedClaims.map((claim: any) => (
                  <div key={claim.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        {/* Deal Image */}
                        {claim.deal?.imageUrl && (
                          <img 
                            src={claim.deal.imageUrl} 
                            alt={claim.deal.title}
                            className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                          />
                        )}
                        
                        {/* Deal Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground mb-1">
                            {claim.deal?.title || "Deal not available"}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                            {claim.deal?.description}
                          </p>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              Claimed {formatDate(claim.claimedAt)}
                            </span>
                            {claim.vendor && (
                              <span className="flex items-center">
                                <MapPin className="h-3 w-3 mr-1" />
                                {claim.vendor.businessName}, {claim.vendor.city}
                              </span>
                            )}
                            {claim.usedAt && (
                              <span className="flex items-center">
                                <TrendingUp className="h-3 w-3 mr-1" />
                                Used {formatDate(claim.usedAt)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Savings and Status */}
                      <div className="text-right flex-shrink-0 ml-4">
                        <div className="mb-2">
                          {claim.actualSavings && parseFloat(claim.actualSavings) > 0 ? (
                            <div>
                              <p className="text-lg font-bold text-success">
                                Actual Saved ₹{parseFloat(claim.actualSavings).toLocaleString('en-IN')}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Bill: ₹{parseFloat(claim.billAmount).toLocaleString('en-IN')}
                              </p>
                            </div>
                          ) : claim.savingsAmount && parseFloat(claim.savingsAmount) > 0 ? (
                            <p className="text-lg font-bold text-success">
                              Saved ₹{parseFloat(claim.savingsAmount).toLocaleString('en-IN')}
                            </p>
                          ) : (
                            <p className="text-lg font-bold text-orange-600">
                              Add Bill Amount
                            </p>
                          )}
                        </div>
                        <Badge className={getStatusColor(claim.status)}>
                          {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
                        </Badge>
                        
                        {/* Add Bill Amount Button for used claims without bill amount */}
                        {claim.status === 'used' && !claim.billAmount && (
                          <Button
                            onClick={() => setBillingClaim(claim)}
                            variant="outline"
                            className="mt-2 w-full border-orange-300 text-orange-600 hover:bg-orange-50 hover:border-orange-400"
                            size="sm"
                          >
                            <Receipt className="h-4 w-4 mr-2" />
                            Add Bill Amount
                          </Button>
                        )}
                        
                        {claim.deal?.discountCode && (
                          <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
                            <span className="font-mono">{claim.deal.discountCode}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  {searchQuery || filterStatus !== "all" ? "No claims found" : "No claims yet"}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || filterStatus !== "all" 
                    ? "Try adjusting your search or filters"
                    : "Start claiming deals to see your history here"
                  }
                </p>
                <Button asChild>
                  <Link to="/customer/deals">Browse Deals</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bill Amount Dialog */}
      <Dialog open={!!billingClaim} onOpenChange={() => setBillingClaim(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-orange-600" />
              Calculate Your Savings
            </DialogTitle>
            <DialogDescription>
              Enter the total bill amount to calculate your actual savings
            </DialogDescription>
          </DialogHeader>
          
          {billingClaim && (
            <div className="space-y-4 py-4">
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-1 text-gray-900 dark:text-gray-100">{billingClaim.deal?.title}</h3>
                <p className="text-sm text-muted-foreground">Discount: {billingClaim.deal?.discountPercentage}% OFF</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bill-amount">Total Bill Amount (₹)</Label>
                <Input
                  id="bill-amount"
                  type="number"
                  placeholder="Enter your total bill amount"
                  value={billAmount}
                  onChange={(e) => {
                    setBillAmount(e.target.value);
                    const savings = calculateSavings(e.target.value, billingClaim.deal?.discountPercentage || 0);
                    setCalculatedSavings(savings);
                  }}
                  className="text-lg"
                />
              </div>
              
              {billAmount && calculatedSavings > 0 && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-green-700 dark:text-green-300">Your Savings:</span>
                    <span className="text-xl font-bold text-green-600 dark:text-green-400">
                      ₹{calculatedSavings.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                    {billingClaim.deal?.discountPercentage}% off ₹{billAmount}
                  </div>
                </div>
              )}
              
              <div className="flex gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setBillingClaim(null);
                    setBillAmount('');
                    setCalculatedSavings(0);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    if (calculatedSavings > 0) {
                      updateBillMutation.mutate({
                        dealId: billingClaim.deal?.id,
                        billAmount: parseFloat(billAmount),
                        savings: calculatedSavings
                      });
                    }
                  }}
                  disabled={!billAmount || calculatedSavings <= 0 || updateBillMutation.isPending}
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                >
                  {updateBillMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Receipt className="h-4 w-4 mr-2" />
                      Record Savings
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
