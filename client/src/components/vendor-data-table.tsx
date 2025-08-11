import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Building, 
  MapPin, 
  Star, 
  Calendar, 
  Search, 
  Filter,
  Eye,
  CheckCircle,
  Clock,
  User,
  Phone,
  Mail,
  CreditCard,
  FileText,
  Globe
} from "lucide-react";

interface VendorDataTableProps {
  vendorId?: number;
  showFilters?: boolean;
  compact?: boolean;
}

export default function VendorDataTable({ vendorId, showFilters = true, compact = false }: VendorDataTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedVendor, setSelectedVendor] = useState<any>(null);

  // Fetch vendor data based on vendorId or get all vendors for admin view
  const { data: vendorData, isLoading } = useQuery({
    queryKey: vendorId ? ["/api/vendors", vendorId] : ["/api/vendors/me"],
    enabled: true,
  });

  // If vendorId is provided, fetch specific vendor data
  const { data: specificVendor } = useQuery({
    queryKey: ["/api/admin/vendors", vendorId],
    enabled: !!vendorId,
  });

  // Get vendor deals data
  const { data: vendorDeals } = useQuery({
    queryKey: ["/api/vendors/deals"],
    enabled: !vendorId, // Only fetch deals for current vendor (when vendorId is not provided)
  });

  // Use appropriate data source
  const vendors = vendorId && specificVendor ? [specificVendor] : vendorData ? [vendorData] : [];

  // Filter vendors based on search and status (for multi-vendor view)
  const filteredVendors = vendors?.filter((vendor: any) => {
    if (!vendor) return false;
    
    const matchesSearch = searchQuery === "" || 
      vendor.businessName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.state?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "approved" && vendor.isApproved) ||
      (statusFilter === "pending" && !vendor.isApproved);
    
    return matchesSearch && matchesStatus;
  }) || [];

  const getStatusBadge = (vendor: any) => {
    if (vendor.isApproved) {
      return (
        <Badge className="bg-success/10 text-success">
          <CheckCircle className="h-3 w-3 mr-1" />
          Approved
        </Badge>
      );
    } else {
      return (
        <Badge variant="secondary">
          <Clock className="h-3 w-3 mr-1" />
          Pending Approval
        </Badge>
      );
    }
  };

  const formatDate = (dateString: string | Date) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const VendorDetailsDialog = ({ vendor }: { vendor: any }) => (
    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center">
          <Building className="h-5 w-5 mr-2" />
          {vendor.businessName} - Complete Details
        </DialogTitle>
      </DialogHeader>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* Business Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center">
              <Building className="h-4 w-4 mr-2" />
              Business Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Business Name:</span>
              <span className="text-sm font-medium">{vendor.businessName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Vendor ID:</span>
              <span className="text-sm font-medium">#{vendor.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Status:</span>
              {getStatusBadge(vendor)}
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Rating:</span>
              <div className="flex items-center">
                <Star className="h-3 w-3 text-yellow-500 mr-1" />
                <span className="text-sm">{vendor.rating || "0"}/5</span>
              </div>
            </div>
            {vendor.description && (
              <div>
                <span className="text-sm text-muted-foreground">Description:</span>
                <p className="text-sm mt-1">{vendor.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center">
              <User className="h-4 w-4 mr-2" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">User ID:</span>
              <span className="text-sm font-medium">#{vendor.userId}</span>
            </div>
            {vendor.companyWebsite && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Website:</span>
                <a 
                  href={vendor.companyWebsite} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline flex items-center"
                >
                  <Globe className="h-3 w-3 mr-1" />
                  Visit Website
                </a>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Registered:</span>
              <span className="text-sm">{formatDate(vendor.createdAt)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Location Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center">
              <MapPin className="h-4 w-4 mr-2" />
              Location Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">City:</span>
              <span className="text-sm font-medium">{vendor.city}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">State:</span>
              <span className="text-sm font-medium">{vendor.state}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Pincode:</span>
              <span className="text-sm font-medium">{vendor.pincode}</span>
            </div>
            {vendor.address && (
              <div>
                <span className="text-sm text-muted-foreground">Full Address:</span>
                <p className="text-sm mt-1">{vendor.address}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Legal & Tax Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              Legal & Tax Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">PAN Number:</span>
              <span className="text-sm font-medium font-mono">{vendor.panNumber}</span>
            </div>
            {vendor.gstNumber && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">GST Number:</span>
                <span className="text-sm font-medium font-mono">{vendor.gstNumber}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm flex items-center">
              <Star className="h-4 w-4 mr-2" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{vendor.totalDeals || 0}</p>
                <p className="text-sm text-muted-foreground">Total Deals</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-success">{vendor.totalRedemptions || 0}</p>
                <p className="text-sm text-muted-foreground">Redemptions</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-warning">{vendor.rating || "0"}</p>
                <p className="text-sm text-muted-foreground">Average Rating</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DialogContent>
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-2">Loading vendor data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!vendors.length) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No vendor data found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters - Only show if enabled and not in compact mode */}
      {showFilters && !compact && vendors.length > 1 && (
        <Card>
          <CardContent className="p-4">
            <div className="grid md:grid-cols-3 gap-4">
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
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vendor Data Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building className="h-5 w-5 mr-2" />
            Vendor Information {filteredVendors.length > 0 && `(${filteredVendors.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business Details</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status & Performance</TableHead>
                  <TableHead>Registration</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVendors.map((vendor: any) => (
                  <TableRow key={vendor.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{vendor.businessName}</div>
                        <div className="text-sm text-muted-foreground flex items-center">
                          <Building className="h-3 w-3 mr-1" />
                          ID: #{vendor.id}
                        </div>
                        {vendor.gstNumber && (
                          <div className="text-xs text-muted-foreground">
                            GST: {vendor.gstNumber}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center text-sm">
                          <MapPin className="h-3 w-3 mr-1" />
                          {vendor.city}, {vendor.state}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          PIN: {vendor.pincode}
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="space-y-2">
                        {getStatusBadge(vendor)}
                        <div className="flex items-center text-sm">
                          <Star className="h-3 w-3 text-yellow-500 mr-1" />
                          {vendor.rating || "0"}/5
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {vendor.totalDeals || 0} deals • {vendor.totalRedemptions || 0} redemptions
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center text-sm">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatDate(vendor.createdAt)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          User ID: #{vendor.userId}
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-right">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
                        </DialogTrigger>
                        <VendorDetailsDialog vendor={vendor} />
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}