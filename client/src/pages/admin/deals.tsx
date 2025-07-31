import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  Filter, 
  Ticket, 
  CheckCircle,
  Clock,
  MapPin,
  Eye,
  Calendar,
  Store,
  Tag,
  TrendingUp,
  X,
  AlertCircle,
  ExternalLink
} from "lucide-react";

export default function AdminDeals() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedDeal, setSelectedDeal] = useState<any>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all deals
  const { data: allDeals, isLoading: allDealsLoading } = useQuery({
    queryKey: ["/api/admin/deals", refreshTrigger],
    queryFn: async () => {
      const timestamp = Date.now();
      const response = await fetch(`/api/admin/deals?_=${timestamp}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Cache-Control': 'no-cache',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch all deals');
      }
      return response.json();
    },
    staleTime: 0,
    cacheTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
  });

  // Fetch pending deals
  const { data: pendingDeals, isLoading: pendingDealsLoading, refetch } = useQuery({
    queryKey: ["/api/admin/deals/pending", refreshTrigger],
    queryFn: async () => {
      // Force fresh request with cache-busting parameter
      const timestamp = Date.now();
      const response = await fetch(`/api/admin/deals/pending?_=${timestamp}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Cache-Control': 'no-cache',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch pending deals');
      }
      return response.json();
    },
    staleTime: 0,
    cacheTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
  });

  const isLoading = allDealsLoading || pendingDealsLoading;

  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
  });

  const approveDealMutation = useMutation({
    mutationFn: async (dealId: number) => {
      return apiRequest(`/api/admin/deals/${dealId}/approve`, 'POST');
    },
    onSuccess: async () => {
      toast({
        title: "Deal approved successfully!",
        description: "The deal is now live and available to customers.",
      });
      // Force immediate refresh by both updating trigger and calling refetch
      setRefreshTrigger(prev => prev + 1);
      await refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to approve deal",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const rejectDealMutation = useMutation({
    mutationFn: async ({ dealId, reason }: { dealId: number; reason: string }) => {
      return apiRequest(`/api/admin/deals/${dealId}/reject`, 'POST', { reason });
    },
    onSuccess: async () => {
      toast({
        title: "Deal rejected successfully!",
        description: "The vendor has been notified about the rejection.",
      });
      // Force immediate refresh by both updating trigger and calling refetch
      setRefreshTrigger(prev => prev + 1);
      await refetch();
      setRejectDialogOpen(false);
      setRejectionReason("");
      setSelectedDeal(null);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to reject deal",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const handleRejectDeal = () => {
    if (!selectedDeal || !rejectionReason.trim()) {
      toast({
        title: "Rejection reason required",
        description: "Please provide a reason for rejecting this deal.",
        variant: "destructive",
      });
      return;
    }
    
    rejectDealMutation.mutate({
      dealId: selectedDeal.id,
      reason: rejectionReason.trim(),
    });
  };

  const updateDealMutation = useMutation({
    mutationFn: async ({ dealId, updates }: { dealId: number; updates: any }) => {
      return apiRequest(`/api/admin/deals/${dealId}`, 'PUT', updates);
    },
    onSuccess: () => {
      toast({
        title: "Deal updated successfully!",
        description: "The deal's membership requirement has been changed.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/deals/pending"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update deal",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  // Get the correct dataset based on status filter
  const getDealsToFilter = () => {
    if (statusFilter === "pending") {
      return pendingDeals || [];
    } else if (statusFilter === "all") {
      return allDeals || [];
    } else if (statusFilter === "approved") {
      return (allDeals || []).filter((deal: any) => deal.isApproved);
    } else if (statusFilter === "active") {
      return (allDeals || []).filter((deal: any) => deal.isApproved && deal.isActive);
    }
    return [];
  };

  // Filter deals based on search and filters
  const filteredDeals = getDealsToFilter().filter((deal: any) => {
    const matchesSearch = searchQuery === "" || 
      deal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deal.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deal.vendor?.businessName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === "all" || deal.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const getStatusBadge = (deal: any) => {
    if (!deal.isApproved) {
      return (
        <Badge className="bg-red-500 text-white">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      );
    }
    if (!deal.isActive) {
      return <Badge variant="outline">Inactive</Badge>;
    }
    if (new Date(deal.validUntil) < new Date()) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    return (
      <Badge className="bg-success/10 text-success">
        <CheckCircle className="h-3 w-3 mr-1" />
        Approved
      </Badge>
    );
  };

  const getCategoryBadge = (category: string) => {
    const colors = {
      fashion: "bg-saffron/10 text-saffron",
      electronics: "bg-primary/10 text-primary",
      travel: "bg-success/10 text-success",
      food: "bg-warning/10 text-warning",
      home: "bg-royal/10 text-royal",
      fitness: "bg-secondary/10 text-secondary",
    };
    
    return (
      <Badge className={colors[category as keyof typeof colors] || "bg-gray-100 text-gray-700"}>
        {category.charAt(0).toUpperCase() + category.slice(1)}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatPrice = (price: string | null) => {
    if (!price) return "N/A";
    return `₹${parseFloat(price).toLocaleString('en-IN')}`;
  };

  // Calculate summary stats
  const totalPending = pendingDeals?.length || 0;
  const highDiscountDeals = pendingDeals?.filter((d: any) => d.discountPercentage >= 50).length || 0;
  const premiumDeals = pendingDeals?.filter((d: any) => d.requiredMembership === "premium" || d.requiredMembership === "ultimate").length || 0;
  const avgDiscount = pendingDeals?.length > 0 
    ? Math.round(pendingDeals.reduce((sum: number, d: any) => sum + d.discountPercentage, 0) / pendingDeals.length)
    : 0;

  const stats = [
    { label: "Pending Approval", value: totalPending, icon: Clock, color: "text-warning" },
    { label: "High Discount (50%+)", value: highDiscountDeals, icon: TrendingUp, color: "text-success" },
    { label: "Premium Deals", value: premiumDeals, icon: Tag, color: "text-royal" },
    { label: "Avg Discount", value: `${avgDiscount}%`, icon: Ticket, color: "text-primary" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Deal Management</h1>
          <p className="text-muted-foreground mt-1">
            Review and approve deals submitted by vendors
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm">{stat.label}</p>
                      <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    </div>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
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
              <div className="md:col-span-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search deals..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending Approval</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="active">Active Deals</SelectItem>
                  <SelectItem value="all">All Deals</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories?.map((category: any) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("pending");
                  setCategoryFilter("all");
                }}
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Deals Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              {statusFilter === "pending" ? "Pending Deals" : 
               statusFilter === "approved" ? "Approved Deals" :
               statusFilter === "active" ? "Active Deals" : "All Deals"} ({filteredDeals.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2">Loading deals...</p>
              </div>
            ) : filteredDeals.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Deal</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Discount</TableHead>
                      <TableHead>Membership</TableHead>
                      <TableHead>Validity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDeals.map((deal: any) => (
                      <TableRow key={deal.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            {deal.imageUrl ? (
                              <img 
                                src={deal.imageUrl} 
                                alt={deal.title}
                                className="w-12 h-12 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                                <Ticket className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-foreground line-clamp-1">{deal.title}</p>
                              <p className="text-xs text-gray-500 line-clamp-2">{deal.description}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Store className="h-4 w-4 text-gray-400" />
                            <div>
                              <p className="font-medium text-foreground">{deal.vendor?.businessName}</p>
                              <p className="text-xs text-gray-500">{deal.vendor?.city}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getCategoryBadge(deal.category)}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-bold text-lg text-primary">{deal.discountPercentage}%</p>
                            {deal.originalPrice && deal.discountedPrice && (
                              <div className="text-xs text-gray-500">
                                <span className="line-through">{formatPrice(deal.originalPrice)}</span>
                                <span className="ml-1 text-success font-medium">{formatPrice(deal.discountedPrice)}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="flex items-center space-x-1 text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>{formatDate(deal.validUntil)}</span>
                            </div>
                            {deal.maxRedemptions && (
                              <p className="text-xs text-gray-500 mt-1">
                                Limit: {deal.maxRedemptions}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(deal)}
                          <div className="mt-1">
                            <Badge variant="outline" className="text-xs">
                              {deal.requiredMembership}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setSelectedDeal(deal)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Deal Review - {deal.title}</DialogTitle>
                                </DialogHeader>
                                
                                {selectedDeal && (
                                  <div className="space-y-6">
                                    {/* Deal Image */}
                                    {selectedDeal.imageUrl && (
                                      <div>
                                        <img 
                                          src={selectedDeal.imageUrl} 
                                          alt={selectedDeal.title}
                                          className="w-full h-48 object-cover rounded-lg"
                                        />
                                      </div>
                                    )}
                                    
                                    {/* Deal Info */}
                                    <div className="grid md:grid-cols-2 gap-6">
                                      <div>
                                        <h4 className="font-medium text-foreground mb-3">Deal Information</h4>
                                        <div className="space-y-2 text-sm">
                                          <div>
                                            <span className="text-gray-500">Title:</span>
                                            <p className="text-foreground font-medium">{selectedDeal.title}</p>
                                          </div>
                                          <div>
                                            <span className="text-gray-500">Description:</span>
                                            <p className="text-foreground">{selectedDeal.description}</p>
                                          </div>
                                          <div>
                                            <span className="text-gray-500">Category:</span>
                                            <p className="text-foreground capitalize">{selectedDeal.category}</p>
                                          </div>
                                          <div>
                                            <span className="text-gray-500">Discount:</span>
                                            <p className="text-foreground font-bold">{selectedDeal.discountPercentage}%</p>
                                          </div>
                                          {selectedDeal.discountCode && (
                                            <div>
                                              <span className="text-gray-500">Promo Code:</span>
                                              <p className="text-foreground font-mono">{selectedDeal.discountCode}</p>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      
                                      <div>
                                        <h4 className="font-medium text-foreground mb-3">Vendor Information</h4>
                                        <div className="space-y-2 text-sm">
                                          <div>
                                            <span className="text-gray-500">Business:</span>
                                            <p className="text-foreground font-medium">{selectedDeal.vendor?.businessName}</p>
                                          </div>
                                          <div>
                                            <span className="text-gray-500">Location:</span>
                                            <p className="text-foreground">{selectedDeal.vendor?.city}, {selectedDeal.vendor?.state}</p>
                                          </div>
                                          <div>
                                            <span className="text-gray-500">Rating:</span>
                                            <div className="flex items-center">
                                              <TrendingUp className="h-4 w-4 text-yellow-400 mr-1" />
                                              <span className="text-foreground">{selectedDeal.vendor?.rating || "0.0"}</span>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    {/* Membership Tier Management */}
                                    <div className="border-t pt-4">
                                      <h4 className="font-medium text-foreground mb-3">Membership Requirements</h4>
                                      <div className="space-y-3">
                                        <div>
                                          <label className="text-sm font-medium text-gray-700">Required Membership Tier</label>
                                          <Select 
                                            defaultValue={selectedDeal.requiredMembership || "basic"}
                                            onValueChange={(value) => {
                                              updateDealMutation.mutate({
                                                dealId: selectedDeal.id,
                                                updates: { requiredMembership: value }
                                              });
                                            }}
                                          >
                                            <SelectTrigger className="mt-2">
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="basic">Basic</SelectItem>
                                              <SelectItem value="premium">Premium</SelectItem>
                                              <SelectItem value="ultimate">Ultimate</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                                          <p className="font-medium mb-1">Current setting: {selectedDeal.requiredMembership || "basic"}</p>
                                          <p>Changing this will affect who can access this deal. Premium and Ultimate deals are only visible to subscribers.</p>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    {/* Pricing */}
                                    {selectedDeal.originalPrice && selectedDeal.discountedPrice && (
                                      <div>
                                        <h4 className="font-medium text-foreground mb-3">Pricing</h4>
                                        <div className="grid grid-cols-3 gap-4 text-center">
                                          <div>
                                            <p className="text-lg font-bold text-gray-400 line-through">
                                              {formatPrice(selectedDeal.originalPrice)}
                                            </p>
                                            <p className="text-xs text-gray-500">Original Price</p>
                                          </div>
                                          <div>
                                            <p className="text-lg font-bold text-success">
                                              {formatPrice(selectedDeal.discountedPrice)}
                                            </p>
                                            <p className="text-xs text-gray-500">Discounted Price</p>
                                          </div>
                                          <div>
                                            <p className="text-lg font-bold text-primary">
                                              {formatPrice((parseFloat(selectedDeal.originalPrice) - parseFloat(selectedDeal.discountedPrice)).toString())}
                                            </p>
                                            <p className="text-xs text-gray-500">You Save</p>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                    
                                    {/* Terms */}
                                    <div>
                                      <h4 className="font-medium text-foreground mb-3">Terms & Conditions</h4>
                                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                                        <div className="space-y-2">
                                          <div className="flex justify-between">
                                            <span className="text-gray-500">Valid Until:</span>
                                            <span className="text-foreground">{formatDate(selectedDeal.validUntil)}</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-gray-500">Max Redemptions:</span>
                                            <span className="text-foreground">{selectedDeal.maxRedemptions || "Unlimited"}</span>
                                          </div>
                                        </div>
                                        <div className="space-y-2">
                                          <div className="flex justify-between">
                                            <span className="text-gray-500">Required Membership:</span>
                                            <span className="text-foreground capitalize">{selectedDeal.requiredMembership}</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-gray-500">Current Claims:</span>
                                            <span className="text-foreground">{selectedDeal.currentRedemptions || 0}</span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>
                            
                            {!deal.isApproved && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => approveDealMutation.mutate(deal.id)}
                                  disabled={approveDealMutation.isPending}
                                >
                                  {approveDealMutation.isPending ? "Approving..." : "Approve"}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => {
                                    setSelectedDeal(deal);
                                    setRejectDialogOpen(true);
                                  }}
                                  disabled={rejectDealMutation.isPending}
                                >
                                  Reject
                                </Button>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  {searchQuery || categoryFilter !== "all" ? "No deals found" : "No pending deals"}
                </h3>
                <p className="text-muted-foreground">
                  {searchQuery || categoryFilter !== "all"
                    ? "Try adjusting your search or filters"
                    : "All deals have been reviewed"
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Approval Guidelines */}
        <Card className="mt-8 border-primary bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center text-primary">
              <AlertCircle className="h-5 w-5 mr-2" />
              Deal Approval Guidelines
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6 text-sm">
              <div>
                <h4 className="font-medium text-foreground mb-2">✅ Approve deals that:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Have clear, accurate descriptions</li>
                  <li>• Offer genuine value to customers</li>
                  <li>• Include proper terms and conditions</li>
                  <li>• Come from verified vendors</li>
                  <li>• Have reasonable redemption limits</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-2">❌ Reject deals that:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Have misleading or false information</li>
                  <li>• Offer unrealistic discounts</li>
                  <li>• Lack proper business verification</li>
                  <li>• Violate platform policies</li>
                  <li>• Have inappropriate content</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reject Deal Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Deal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-4">
                Please provide a reason for rejecting this deal. The vendor will be notified about the rejection.
              </p>
              <Textarea
                placeholder="Enter rejection reason..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setRejectDialogOpen(false);
                  setRejectionReason("");
                  setSelectedDeal(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleRejectDeal}
                disabled={rejectDealMutation.isPending || !rejectionReason.trim()}
              >
                {rejectDealMutation.isPending ? "Rejecting..." : "Reject Deal"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
