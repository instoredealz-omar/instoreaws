import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Key,
  Copy,
  Eye,
  EyeOff,
  Trash2,
  CheckCircle,
  Clock,
  XCircle,
  Plus,
  Search,
  Filter,
  Download,
  AlertTriangle,
  Info,
} from "lucide-react";

export default function AdminApiKeys() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedKey, setSelectedKey] = useState<any>(null);
  const [showSecret, setShowSecret] = useState<{ [key: number]: boolean }>({});
  const [generatingKey, setGeneratingKey] = useState<number | null>(null);
  const [newGeneratedKey, setNewGeneratedKey] = useState<any>(null);
  const [showNewKeyDialog, setShowNewKeyDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch API keys
  const { data: apiKeys = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/admin/api-keys"],
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
  });

  // Fetch vendors for selection
  const { data: vendors = [] } = useQuery({
    queryKey: ["/api/admin/vendors"],
    staleTime: 60000,
  });

  // Generate new API key mutation
  const generateKeyMutation = useMutation({
    mutationFn: async (vendorId: number) => {
      const res = await apiRequest("/api/admin/api-keys/generate", "POST", { vendorId });
      return await res.json();
    },
    onSuccess: (response: any) => {
      setNewGeneratedKey(response);
      setShowNewKeyDialog(true);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/api-keys"] });
      refetch();
      
      // Show success notification about email
      toast({
        title: "✅ API Key Generated Successfully",
        description: `Email notification sent to vendor with API key details, rate limits, and security information.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to generate API key",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  // Deactivate API key mutation
  const deactivateKeyMutation = useMutation({
    mutationFn: async (apiKeyId: number) => {
      const res = await apiRequest(`/api/admin/api-keys/${apiKeyId}/deactivate`, "PATCH");
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "API Key Deactivated",
        description: "The API key has been deactivated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/api-keys"] });
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to deactivate API key",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete API key mutation
  const deleteKeyMutation = useMutation({
    mutationFn: async (apiKeyId: number) => {
      const res = await apiRequest(`/api/admin/api-keys/${apiKeyId}`, "DELETE");
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "API Key Deleted",
        description: "The API key has been permanently deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/api-keys"] });
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete API key",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  // Copy to clipboard function
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: `${label} copied to clipboard.`,
    });
  };

  // Filter API keys
  const filteredKeys = apiKeys.filter((key: any) => {
    const matchesSearch =
      searchQuery === "" ||
      key.keyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      key.vendor?.businessName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && key.isActive) ||
      (statusFilter === "inactive" && !key.isActive) ||
      (statusFilter === "expired" && key.expiresAt && new Date(key.expiresAt) < new Date());

    return matchesSearch && matchesStatus;
  });

  // Get status badge
  const getStatusBadge = (isActive: boolean, expiresAt: string | null) => {
    if (expiresAt && new Date(expiresAt) < new Date()) {
      return (
        <Badge className="bg-red-100 text-red-800">
          <XCircle className="h-3 w-3 mr-1" />
          Expired
        </Badge>
      );
    }

    return isActive ? (
      <Badge className="bg-green-100 text-green-800">
        <CheckCircle className="h-3 w-3 mr-1" />
        Active
      </Badge>
    ) : (
      <Badge className="bg-gray-100 text-gray-800">
        <Clock className="h-3 w-3 mr-1" />
        Inactive
      </Badge>
    );
  };

  // Format date
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Calculate days remaining
  const daysRemaining = (expiresAt: string | null) => {
    if (!expiresAt) return "Never";
    const diff = new Date(expiresAt).getTime() - new Date().getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? `${days} days` : "Expired";
  };

  return (
    <div className="min-h-screen flex flex-col dark:bg-dark bg-light">
      <Navbar />

      <div className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Key className="h-8 w-8 text-blue-600" />
                API Key Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Manage vendor API keys for third-party POS integration
              </p>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Generate New Key
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Generate API Key</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Select Vendor
                    </label>
                    <Select
                      onValueChange={(vendorId) => {
                        setGeneratingKey(parseInt(vendorId));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a vendor..." />
                      </SelectTrigger>
                      <SelectContent>
                        {vendors.map((vendor: any) => (
                          <SelectItem key={vendor.id} value={vendor.id.toString()}>
                            {vendor.businessName} (ID: {vendor.id})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={() => {
                      if (generatingKey) {
                        generateKeyMutation.mutate(generatingKey);
                      }
                    }}
                    disabled={!generatingKey}
                    className="w-full"
                  >
                    Generate Key
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Info Alert */}
          <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              API keys allow POS vendors to automatically verify claims and process transactions in real-time.
              Each vendor can have multiple active keys. Keys should be kept secret and rotated regularly.
            </AlertDescription>
          </Alert>
        </div>

        {/* New API Key Dialog */}
        {showNewKeyDialog && newGeneratedKey && (
          <Dialog open={showNewKeyDialog} onOpenChange={setShowNewKeyDialog}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-lg">🔐 New API Key Generated</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800 dark:text-red-200">
                    <strong>IMPORTANT:</strong> This is the only time you'll see this API key. Copy it now and store it securely. You won't be able to retrieve it later.
                  </AlertDescription>
                </Alert>

                <div>
                  <label className="block text-sm font-medium mb-2">Vendor</label>
                  <p className="text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded">
                    {newGeneratedKey?.vendor?.businessName || newGeneratedKey?.businessName || "Unknown"}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">API Key</label>
                  <div className="flex gap-2">
                    <code className="flex-1 bg-gray-900 text-gray-100 px-4 py-3 rounded font-mono text-sm break-all select-all">
                      {newGeneratedKey.apiKey}
                    </code>
                    <Button
                      onClick={() => {
                        copyToClipboard(newGeneratedKey.apiKey, "API Key");
                      }}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Created</label>
                    <p className="text-gray-700 dark:text-gray-300">
                      {new Date(newGeneratedKey.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Expires</label>
                    <p className="text-gray-700 dark:text-gray-300">
                      {newGeneratedKey.expiresAt
                        ? new Date(newGeneratedKey.expiresAt).toLocaleString()
                        : "Never"}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Rate Limit</label>
                  <p className="text-gray-700 dark:text-gray-300">
                    {newGeneratedKey.rateLimit} requests per minute
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Usage Instructions</h4>
                  <code className="block bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-x-auto whitespace-pre-wrap break-words">
                    {`curl -X POST https://your-domain.com/api/v1/claims/verify \\\n  -H "X-API-Key: ${newGeneratedKey?.apiKey || ''}" \\\n  -H "Content-Type: application/json" \\\n  -d '{"claimCode": "ABC123"}'`}
                  </code>
                </div>

                <Button
                  onClick={() => setShowNewKeyDialog(false)}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Done - I've Copied the Key
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Search by vendor name or key name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="dark:bg-gray-800 dark:border-gray-700"
              prefix={<Search className="h-4 w-4" />}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48 dark:bg-gray-800 dark:border-gray-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{apiKeys.length}</div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total API Keys</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">
                {apiKeys.filter((k: any) => k.isActive).length}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Keys</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-orange-600">
                {apiKeys.filter(
                  (k: any) => k.expiresAt && new Date(k.expiresAt) < new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000) && new Date(k.expiresAt) > new Date()
                ).length}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Expiring Soon</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-blue-600">
                {new Set(apiKeys.map((k: any) => k.vendorId)).size}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Vendors with Keys</p>
            </CardContent>
          </Card>
        </div>

        {/* API Keys Table */}
        <Card>
          <CardHeader>
            <CardTitle>API Keys</CardTitle>
            <CardDescription>
              Showing {filteredKeys.length} of {apiKeys.length} keys
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading API keys...</div>
            ) : filteredKeys.length === 0 ? (
              <div className="text-center py-8 text-gray-600 dark:text-gray-400">
                No API keys found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="dark:border-gray-700">
                      <TableHead>Vendor</TableHead>
                      <TableHead>Key Name</TableHead>
                      <TableHead>API Key</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Expires In</TableHead>
                      <TableHead>Rate Limit</TableHead>
                      <TableHead>Last Used</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredKeys.map((key: any) => (
                      <TableRow key={key.id} className="dark:border-gray-700">
                        <TableCell className="font-medium">
                          {key.vendor?.businessName || "Unknown"}
                        </TableCell>
                        <TableCell>{key.keyName}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded font-mono">
                              {showSecret[key.id]
                                ? key.apiKey?.substring(0, 10) + "..."
                                : "••••••••••"}
                            </code>
                            <button
                              onClick={() =>
                                setShowSecret({
                                  ...showSecret,
                                  [key.id]: !showSecret[key.id],
                                })
                              }
                              className="text-gray-500 hover:text-gray-700"
                            >
                              {showSecret[key.id] ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              onClick={() =>
                                copyToClipboard(key.apiKey, "API Key")
                              }
                              className="text-gray-500 hover:text-gray-700"
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(key.isActive, key.expiresAt)}</TableCell>
                        <TableCell className="text-sm">
                          {formatDate(key.createdAt)}
                        </TableCell>
                        <TableCell className="text-sm">
                          <span className={
                            key.expiresAt && new Date(key.expiresAt) < new Date()
                              ? "text-red-600"
                              : ""
                          }>
                            {daysRemaining(key.expiresAt)}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm">
                          {key.rateLimit}/min
                        </TableCell>
                        <TableCell className="text-sm">
                          {key.lastUsedAt ? formatDate(key.lastUsedAt) : "Never"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedKey(key)}
                                >
                                  Details
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>API Key Details</DialogTitle>
                                </DialogHeader>
                                {selectedKey && (
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <label className="text-sm font-medium">
                                          Vendor
                                        </label>
                                        <p className="text-gray-700 dark:text-gray-300">
                                          {selectedKey.vendor?.businessName}
                                        </p>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium">
                                          Key Name
                                        </label>
                                        <p className="text-gray-700 dark:text-gray-300">
                                          {selectedKey.keyName}
                                        </p>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium">
                                          Status
                                        </label>
                                        <p>
                                          {getStatusBadge(
                                            selectedKey.isActive,
                                            selectedKey.expiresAt
                                          )}
                                        </p>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium">
                                          Rate Limit
                                        </label>
                                        <p className="text-gray-700 dark:text-gray-300">
                                          {selectedKey.rateLimit} requests/min
                                        </p>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium">
                                          Created
                                        </label>
                                        <p className="text-gray-700 dark:text-gray-300">
                                          {formatDate(selectedKey.createdAt)}
                                        </p>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium">
                                          Expires
                                        </label>
                                        <p className="text-gray-700 dark:text-gray-300">
                                          {selectedKey.expiresAt
                                            ? formatDate(selectedKey.expiresAt)
                                            : "Never"}
                                        </p>
                                      </div>
                                    </div>

                                    {selectedKey.description && (
                                      <div>
                                        <label className="text-sm font-medium">
                                          Description
                                        </label>
                                        <p className="text-gray-700 dark:text-gray-300">
                                          {selectedKey.description}
                                        </p>
                                      </div>
                                    )}

                                    <div>
                                      <label className="text-sm font-medium">
                                        API Key (Full)
                                      </label>
                                      <div className="flex gap-2">
                                        <code className="flex-1 bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded font-mono text-xs break-all">
                                          {selectedKey.apiKey}
                                        </code>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() =>
                                            copyToClipboard(
                                              selectedKey.apiKey,
                                              "API Key"
                                            )
                                          }
                                        >
                                          <Copy className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>

                                    <div className="pt-4 border-t">
                                      <h4 className="font-medium mb-2">
                                        Usage Instructions
                                      </h4>
                                      <code className="block bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs overflow-x-auto">
                                        {`curl -X POST https://your-domain.com/api/v1/claims/verify \\\n`}
                                        {`  -H "X-API-Key: ${selectedKey.apiKey}" \\\n`}
                                        {`  -H "Content-Type: application/json" \\\n`}
                                        {`  -d '{"claimCode": "ABC123"}'`}
                                      </code>
                                    </div>
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>

                            {key.isActive && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-orange-600 hover:text-orange-700"
                                onClick={() => {
                                  if (
                                    confirm(
                                      "Are you sure you want to deactivate this key?"
                                    )
                                  ) {
                                    deactivateKeyMutation.mutate(key.id);
                                  }
                                }}
                              >
                                Deactivate
                              </Button>
                            )}

                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => {
                                if (
                                  confirm(
                                    "Are you sure? This action cannot be undone."
                                  )
                                ) {
                                  deleteKeyMutation.mutate(key.id);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security Best Practices */}
        <Card className="mt-6 border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
          <CardHeader>
            <CardTitle className="text-yellow-900 dark:text-yellow-200">
              Security Best Practices
            </CardTitle>
          </CardHeader>
          <CardContent className="text-yellow-800 dark:text-yellow-200 space-y-2 text-sm">
            <p>
              ✓ Rotate API keys regularly (every 90 days recommended)
            </p>
            <p>
              ✓ Deactivate compromised keys immediately
            </p>
            <p>
              ✓ Never share API keys via email or messaging apps
            </p>
            <p>
              ✓ Only share keys with trusted POS providers
            </p>
            <p>
              ✓ Monitor "Last Used" timestamps for unusual activity
            </p>
            <p>
              ✓ Set appropriate rate limits based on vendor volume
            </p>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}
