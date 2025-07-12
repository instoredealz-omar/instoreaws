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
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  Filter, 
  Store, 
  CheckCircle,
  Clock,
  MapPin,
  Star,
  Eye,
  Calendar,
  Building,
  CreditCard,
  FileText,
  ExternalLink
} from "lucide-react";

export default function AdminVendors() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedVendor, setSelectedVendor] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: vendors, isLoading } = useQuery({
    queryKey: ["/api/admin/vendors"],
  });

  const { data: pendingVendors } = useQuery({
    queryKey: ["/api/admin/vendors/pending"],
  });

  const approveVendorMutation = useMutation({
    mutationFn: async (vendorId: number) => {
      return apiRequest(`/api/admin/vendors/${vendorId}/approve`, 'POST');
    },
    onSuccess: () => {
      toast({
        title: "Vendor approved successfully!",
        description: "The vendor can now start creating deals.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/vendors"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/vendors/pending"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to approve vendor",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  // Filter vendors based on search and status
  const filteredVendors = vendors?.filter((vendor: any) => {
    const matchesSearch = searchQuery === "" || 
      vendor.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.state.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "approved" && vendor.isApproved) ||
      (statusFilter === "pending" && !vendor.isApproved);
    
    return matchesSearch && matchesStatus;
  }) || [];

  const getStatusBadge = (isApproved: boolean) => {
    return isApproved ? (
      <Badge className="bg-success/10 text-success">
        <CheckCircle className="h-3 w-3 mr-1" />
        Approved
      </Badge>
    ) : (
      <Badge className="bg-red-500 text-white">
        <Clock className="h-3 w-3 mr-1" />
        Pending
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  // Calculate summary stats
  const totalVendors = vendors?.length || 0;
  const approvedVendors = vendors?.filter((v: any) => v.isApproved).length || 0;
  const pendingApprovals = pendingVendors?.length || 0;
  const avgRating = vendors?.length > 0 
    ? (vendors.reduce((sum: number, v: any) => sum + parseFloat(v.rating || "0"), 0) / vendors.length).toFixed(1)
    : "0.0";

  const stats = [
    { label: "Total Vendors", value: totalVendors, icon: Store, color: "text-primary" },
    { label: "Approved", value: approvedVendors, icon: CheckCircle, color: "text-success" },
    { label: "Pending", value: pendingApprovals, icon: Clock, color: "text-warning" },
    { label: "Avg Rating", value: avgRating, icon: Star, color: "text-royal" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Vendor Management</h1>
          <p className="text-muted-foreground mt-1">
            Review and manage vendor applications and accounts
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
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search vendors..."
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
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                }}
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Vendors Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Vendors ({filteredVendors.length})</CardTitle>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Calendar className="h-4 w-4" />
                <span>Sorted by registration date (newest first)</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2">Loading vendors...</p>
              </div>
            ) : filteredVendors.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Business</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Performance</TableHead>
                      <TableHead>Registration</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVendors.map((vendor: any) => (
                      <TableRow key={vendor.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            {vendor.logoUrl ? (
                              <img 
                                src={vendor.logoUrl} 
                                alt={vendor.businessName}
                                className="w-10 h-10 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                <Building className="h-5 w-5 text-gray-400" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-foreground">{vendor.businessName}</p>
                              {vendor.description && (
                                <p className="text-xs text-gray-500 line-clamp-1">{vendor.description}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1 text-sm">
                            <MapPin className="h-3 w-3 text-gray-400" />
                            <span>{vendor.city}, {vendor.state}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center space-x-1">
                              <Star className="h-3 w-3 text-yellow-400" />
                              <span className="text-sm font-medium">{vendor.rating || "0.0"}</span>
                            </div>
                            <div className="text-xs text-gray-500">
                              {vendor.totalDeals || 0} deals • {vendor.totalRedemptions || 0} claims
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(vendor.createdAt)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(vendor.isApproved)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setSelectedVendor(vendor)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Vendor Details - {vendor.businessName}</DialogTitle>
                                </DialogHeader>
                                
                                {selectedVendor && (
                                  <div className="space-y-6">
                                    {/* Business Info */}
                                    <div className="grid md:grid-cols-2 gap-6">
                                      <div>
                                        <h4 className="font-medium text-foreground mb-3">Business Information</h4>
                                        <div className="space-y-2 text-sm">
                                          <div className="flex justify-between">
                                            <span className="text-gray-500">Name:</span>
                                            <span className="text-foreground font-medium">{selectedVendor.businessName}</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-gray-500">Location:</span>
                                            <span className="text-foreground">{selectedVendor.city}, {selectedVendor.state}</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-gray-500">Rating:</span>
                                            <div className="flex items-center">
                                              <Star className="h-4 w-4 text-yellow-400 mr-1" />
                                              <span className="text-foreground">{selectedVendor.rating || "0.0"}</span>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                      
                                      <div>
                                        <h4 className="font-medium text-foreground mb-3">Registration Details</h4>
                                        <div className="space-y-2 text-sm">
                                          <div className="flex justify-between">
                                            <span className="text-gray-500">PAN:</span>
                                            <span className="text-foreground font-mono">{selectedVendor.panNumber}</span>
                                          </div>
                                          {selectedVendor.gstNumber && (
                                            <div className="flex justify-between">
                                              <span className="text-gray-500">GST:</span>
                                              <span className="text-foreground font-mono text-xs">{selectedVendor.gstNumber}</span>
                                            </div>
                                          )}
                                          <div className="flex justify-between">
                                            <span className="text-gray-500">Registered:</span>
                                            <span className="text-foreground">{formatDate(selectedVendor.createdAt)}</span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    {/* Address */}
                                    {selectedVendor.address && (
                                      <div>
                                        <h4 className="font-medium text-foreground mb-2">Business Address</h4>
                                        <p className="text-muted-foreground text-sm">{selectedVendor.address}</p>
                                      </div>
                                    )}
                                    
                                    {/* Description */}
                                    {selectedVendor.description && (
                                      <div>
                                        <h4 className="font-medium text-foreground mb-2">Description</h4>
                                        <p className="text-muted-foreground text-sm">{selectedVendor.description}</p>
                                      </div>
                                    )}
                                    
                                    {/* Performance */}
                                    <div>
                                      <h4 className="font-medium text-foreground mb-3">Performance</h4>
                                      <div className="grid grid-cols-3 gap-4 text-center">
                                        <div>
                                          <p className="text-2xl font-bold text-primary">{selectedVendor.totalDeals || 0}</p>
                                          <p className="text-xs text-gray-500">Total Deals</p>
                                        </div>
                                        <div>
                                          <p className="text-2xl font-bold text-success">{selectedVendor.totalRedemptions || 0}</p>
                                          <p className="text-xs text-gray-500">Redemptions</p>
                                        </div>
                                        <div>
                                          <p className="text-2xl font-bold text-warning">{selectedVendor.rating || "0.0"}</p>
                                          <p className="text-xs text-gray-500">Rating</p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>
                            
                            {!vendor.isApproved && (
                              <Button
                                size="sm"
                                onClick={() => approveVendorMutation.mutate(vendor.id)}
                                disabled={approveVendorMutation.isPending}
                              >
                                {approveVendorMutation.isPending ? "Approving..." : "Approve"}
                              </Button>
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
                <Store className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No vendors found</h3>
                <p className="text-muted-foreground">
                  {searchQuery || statusFilter !== "all"
                    ? "Try adjusting your search or filters"
                    : "No vendors registered yet"
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Approvals Highlight */}
        {pendingApprovals > 0 && (
          <Card className="mt-8 border-warning bg-warning/5">
            <CardHeader>
              <CardTitle className="flex items-center text-warning">
                <Clock className="h-5 w-5 mr-2" />
                Pending Approvals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-foreground font-medium">{pendingApprovals} vendors awaiting approval</p>
                  <p className="text-muted-foreground text-sm">
                    Review applications to help businesses start offering deals
                  </p>
                </div>
                <Button
                  onClick={() => setStatusFilter("pending")}
                  className="bg-warning text-white hover:bg-warning/90"
                >
                  Review Pending
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Footer />
    </div>
  );
}
