import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  Filter, 
  Ticket, 
  CheckCircle,
  Clock,
  Calendar,
  User,
  Mail,
  Phone,
  DollarSign,
  TrendingDown,
  Store,
  Download,
  Loader2
} from "lucide-react";
import { format } from "date-fns";

interface ClaimedDeal {
  claimId: number;
  claimCode: string;
  claimedAt: string;
  usedAt: string | null;
  verifiedAt: string | null;
  status: string;
  vendorVerified: boolean;
  storeLocation: string | null;
  customerId: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  customerWhatsappPhone: string | null;
  customerMembership: string;
  dealId: number;
  dealTitle: string;
  dealCategory: string;
  dealType: string;
  discountPercentage: number;
  vendorId: number;
  vendorName: string;
  vendorCity: string;
  vendorState: string;
  billAmount: number;
  totalBilledAmount: number;
  savingsAmount: number;
  actualSavings: number;
}

export default function AdminClaimedDeals() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [membershipFilter, setMembershipFilter] = useState("all");
  const [vendorFilter, setVendorFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");

  const { data: claimedDeals = [], isLoading } = useQuery<ClaimedDeal[]>({
    queryKey: ["/api/admin/claimed-deals"],
  });

  const { data: allCategories = [] } = useQuery<Array<{ id: string; name: string }>>({
    queryKey: ["/api/categories"],
  });

  const filteredClaims = claimedDeals.filter((claim) => {
    const matchesSearch = searchQuery === "" || 
      claim.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      claim.customerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      claim.dealTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      claim.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      claim.claimCode.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || claim.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || claim.dealCategory === categoryFilter;
    const matchesMembership = membershipFilter === "all" || claim.customerMembership === membershipFilter;
    const matchesVendor = vendorFilter === "" || claim.vendorName?.toLowerCase().includes(vendorFilter.toLowerCase());
    const matchesLocation = locationFilter === "" || claim.storeLocation?.toLowerCase().includes(locationFilter.toLowerCase());
    
    return matchesSearch && matchesStatus && matchesCategory && matchesMembership && matchesVendor && matchesLocation;
  });

  const getStatusBadge = (status: string, verified: boolean) => {
    if (verified && status === "used") {
      return <Badge className="bg-success text-white" data-testid={`badge-status-${status}`}>
        <CheckCircle className="w-3 h-3 mr-1" />
        Verified
      </Badge>;
    }
    
    switch (status) {
      case "pending":
        return <Badge className="bg-warning text-white" data-testid={`badge-status-${status}`}>
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </Badge>;
      case "used":
      case "completed":
        return <Badge className="bg-success text-white" data-testid={`badge-status-${status}`}>
          <CheckCircle className="w-3 h-3 mr-1" />
          Used
        </Badge>;
      case "claimed":
        return <Badge className="bg-primary text-white" data-testid={`badge-status-${status}`}>
          <Ticket className="w-3 h-3 mr-1" />
          Claimed
        </Badge>;
      default:
        return <Badge variant="outline" data-testid={`badge-status-${status}`}>{status}</Badge>;
    }
  };

  const getMembershipBadge = (plan: string) => {
    const colors = {
      basic: "bg-gray-500",
      premium: "bg-royal",
      ultimate: "bg-gold",
    };
    return (
      <Badge className={`${colors[plan as keyof typeof colors] || colors.basic} text-white`} data-testid={`badge-membership-${plan}`}>
        {plan.charAt(0).toUpperCase() + plan.slice(1)}
      </Badge>
    );
  };

  const exportToCSV = () => {
    const headers = [
      'Claim ID',
      'Claim Code',
      'Customer Name',
      'Customer Email',
      'Customer Phone',
      'Customer WhatsApp',
      'Membership',
      'Deal Title',
      'Vendor',
      'Category',
      'Discount %',
      'Total Billed Amount',
      'Savings Amount',
      'Status',
      'Claimed At',
      'Verified At'
    ];

    const rows = filteredClaims.map(claim => [
      claim.claimId,
      claim.claimCode,
      claim.customerName,
      claim.customerEmail,
      claim.customerPhone || 'N/A',
      claim.customerWhatsappPhone || 'N/A',
      claim.customerMembership,
      claim.dealTitle,
      claim.vendorName,
      claim.dealCategory,
      claim.discountPercentage,
      claim.totalBilledAmount.toFixed(2),
      claim.actualSavings.toFixed(2),
      claim.status,
      claim.claimedAt ? format(new Date(claim.claimedAt), 'yyyy-MM-dd HH:mm') : 'N/A',
      claim.verifiedAt ? format(new Date(claim.verifiedAt), 'yyyy-MM-dd HH:mm') : 'N/A'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `claimed-deals-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const categories = allCategories.length > 0 
    ? allCategories.map(c => c.id)
    : Array.from(new Set(claimedDeals.map(c => c.dealCategory)));
  const totalBilledAmount = filteredClaims.reduce((sum, claim) => sum + claim.totalBilledAmount, 0);
  const totalSavings = filteredClaims.reduce((sum, claim) => sum + claim.actualSavings, 0);

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-royal/5 via-background to-gold/5 dark:from-royal/10 dark:via-background dark:to-gold/10 py-8">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-royal to-gold bg-clip-text text-transparent dark:from-royal-light dark:to-gold-light mb-2" data-testid="text-page-title">
              Claimed Deals Management
            </h1>
            <p className="text-muted-foreground" data-testid="text-page-description">
              Comprehensive overview of all claimed deals with customer information
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Claims</CardTitle>
                <Ticket className="h-4 w-4 text-royal" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-total-claims">{filteredClaims.length}</div>
                <p className="text-xs text-muted-foreground">
                  {claimedDeals.length} total claims
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Billed Amount</CardTitle>
                <DollarSign className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-total-billed">₹{totalBilledAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
                <p className="text-xs text-muted-foreground">
                  From filtered claims
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Savings</CardTitle>
                <TrendingDown className="h-4 w-4 text-gold" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-total-savings">₹{totalSavings.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
                <p className="text-xs text-muted-foreground">
                  Customer savings
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <CardTitle className="flex items-center gap-2">
                  <Ticket className="h-5 w-5 text-royal" />
                  Claimed Deals
                </CardTitle>
                <Button onClick={exportToCSV} variant="outline" data-testid="button-export-csv">
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search claims..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    data-testid="input-search"
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger data-testid="select-status-filter">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="claimed">Claimed</SelectItem>
                    <SelectItem value="used">Used</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger data-testid="select-category-filter">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.sort().map((category) => (
                      <SelectItem key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={membershipFilter} onValueChange={setMembershipFilter}>
                  <SelectTrigger data-testid="select-membership-filter">
                    <SelectValue placeholder="Filter by membership" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Memberships</SelectItem>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="ultimate">Ultimate</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Input
                  placeholder="Filter by vendor..."
                  value={vendorFilter}
                  onChange={(e) => setVendorFilter(e.target.value)}
                  data-testid="input-vendor-filter"
                />

                <Input
                  placeholder="Filter by store location..."
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  data-testid="input-location-filter"
                />

                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                    setCategoryFilter("all");
                    setMembershipFilter("all");
                    setVendorFilter("");
                    setLocationFilter("");
                  }}
                  data-testid="button-clear-filters"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Clear Filters
                </Button>
              </div>

              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-royal" />
                </div>
              ) : filteredClaims.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Ticket className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p data-testid="text-no-claims">No claimed deals found</p>
                </div>
              ) : (
                <div className="rounded-lg border border-border/50 overflow-hidden shadow-sm">
                  <Table>
                    <TableHeader className="bg-gradient-to-r from-slate-50 to-slate-50 dark:from-slate-900/50 dark:to-slate-900/50 border-b border-border/50">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors h-12 px-6 font-semibold text-foreground" onClick={() => setSearchQuery(searchQuery)}>Customer Info</TableHead>
                        <TableHead className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors h-12 px-6 font-semibold text-foreground" onClick={() => setMembershipFilter(membershipFilter)}>Membership</TableHead>
                        <TableHead className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors h-12 px-6 font-semibold text-foreground" onClick={() => setCategoryFilter(categoryFilter)}>Deal Info</TableHead>
                        <TableHead className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors h-12 px-6 font-semibold text-foreground" onClick={() => setVendorFilter(vendorFilter)}>Vendor</TableHead>
                        <TableHead className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors h-12 px-6 font-semibold text-foreground" onClick={() => setLocationFilter(locationFilter)}>Store Location</TableHead>
                        <TableHead className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors h-12 px-6 font-semibold text-foreground text-right" onClick={() => setStatusFilter(statusFilter)}>Discount %</TableHead>
                        <TableHead className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors h-12 px-6 font-semibold text-foreground text-right" onClick={() => setStatusFilter(statusFilter)}>Total Billed</TableHead>
                        <TableHead className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors h-12 px-6 font-semibold text-foreground text-right" onClick={() => setStatusFilter(statusFilter)}>Savings</TableHead>
                        <TableHead className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors h-12 px-6 font-semibold text-foreground" onClick={() => setStatusFilter(statusFilter)}>Status</TableHead>
                        <TableHead className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors h-12 px-6 font-semibold text-foreground" onClick={() => setStatusFilter(statusFilter)}>Claim Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredClaims.map((claim) => (
                        <TableRow key={claim.claimId} data-testid={`row-claim-${claim.claimId}`} className="hover:bg-blue-50 dark:hover:bg-slate-800/30 transition-colors border-b border-border/30">
                          <TableCell className="px-6 py-4">
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5">
                                <User className="h-4 w-4 text-slate-400" />
                              </div>
                              <div className="min-w-0">
                                <div className="font-semibold text-foreground text-sm" data-testid={`text-customer-name-${claim.claimId}`}>{claim.customerName}</div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1" data-testid={`text-customer-email-${claim.claimId}`}>
                                  <Mail className="h-3 w-3 flex-shrink-0" />
                                  <span className="truncate">{claim.customerEmail}</span>
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 mt-2 space-y-1">
                                  {claim.customerPhone && (
                                    <div className="flex items-center gap-1" data-testid={`text-customer-phone-${claim.claimId}`}>
                                      <Phone className="h-3 w-3 flex-shrink-0" />
                                      <span className="truncate">{claim.customerPhone}</span>
                                    </div>
                                  )}
                                  {claim.customerWhatsappPhone && (
                                    <div className="flex items-center gap-1" data-testid={`text-customer-whatsapp-${claim.claimId}`}>
                                      <Phone className="h-3 w-3 flex-shrink-0 text-success" />
                                      <span className="truncate">{claim.customerWhatsappPhone}</span>
                                    </div>
                                  )}
                                  <div className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded inline-block w-fit" data-testid={`text-customer-id-${claim.claimId}`}>
                                    ID: {claim.customerId}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            {getMembershipBadge(claim.customerMembership)}
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            <div>
                              <div className="font-semibold text-foreground text-sm" data-testid={`text-deal-title-${claim.claimId}`}>{claim.dealTitle}</div>
                              <div className="text-xs text-slate-500 dark:text-slate-400 capitalize mt-1">
                                {claim.dealCategory}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            <div className="flex items-start gap-2">
                              <Store className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                              <div className="min-w-0">
                                <div className="font-semibold text-foreground text-sm" data-testid={`text-vendor-name-${claim.claimId}`}>{claim.vendorName}</div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                  {claim.vendorCity}, {claim.vendorState}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            <div className="text-sm text-foreground" data-testid={`text-store-location-${claim.claimId}`}>
                              {claim.storeLocation || <span className="text-slate-400">-</span>}
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-4 text-right">
                            <Badge variant="secondary" className="font-semibold" data-testid={`text-discount-${claim.claimId}`}>
                              {claim.discountPercentage}%
                            </Badge>
                          </TableCell>
                          <TableCell className="px-6 py-4 text-right">
                            <div className="font-semibold text-success text-sm" data-testid={`text-billed-amount-${claim.claimId}`}>
                              ₹{claim.totalBilledAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-4 text-right">
                            <div className="font-semibold text-amber-600 dark:text-amber-400 text-sm" data-testid={`text-savings-${claim.claimId}`}>
                              ₹{(claim.actualSavings || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            {getStatusBadge(claim.status, claim.vendorVerified)}
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400" data-testid={`text-claimed-date-${claim.claimId}`}>
                              <Calendar className="h-3 w-3 flex-shrink-0" />
                              {claim.claimedAt ? format(new Date(claim.claimedAt), 'MMM dd, yyyy') : 'N/A'}
                            </div>
                            {claim.verifiedAt && (
                              <div className="text-xs text-success mt-2 font-medium" data-testid={`text-verified-date-${claim.claimId}`}>
                                ✓ Verified: {format(new Date(claim.verifiedAt), 'MMM dd')}
                              </div>
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
        </div>
      </div>
      <Footer />
    </>
  );
}
