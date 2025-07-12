import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  Users, 
  Database, 
  Activity, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  BarChart3,
  Settings,
  Key,
  Globe,
  Loader2
} from 'lucide-react';

const AdminDashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Check admin access
  if (!isAuthenticated || !['admin', 'superadmin'].includes(user?.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Access denied. Admin privileges required.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Fetch admin login data
  const { data: adminLogins, isLoading: adminLoginsLoading, error: adminLoginsError } = useQuery({
    queryKey: ['/api/magic/admin-login'],
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch API generation data
  const { data: apiGenerations, isLoading: apiGenerationsLoading, error: apiGenerationsError } = useQuery({
    queryKey: ['/api/magic/api-generation'],
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch claim deals data
  const { data: claimDeals, isLoading: claimDealsLoading, error: claimDealsError } = useQuery({
    queryKey: ['/api/magic/claim-deals/admin'],
    retry: 1,
    staleTime: 2 * 60 * 1000, // 2 minutes for more frequent updates
  });

  // Calculate overview statistics
  const totalAdminLogins = Array.isArray(adminLogins) ? adminLogins.length : 0;
  const totalApiKeys = Array.isArray(apiGenerations) ? apiGenerations.length : 0;
  const totalClaims = Array.isArray(claimDeals) ? claimDeals.length : 0;
  const pendingClaims = Array.isArray(claimDeals) ? claimDeals.filter(claim => claim.status === 'pending').length : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Welcome back, {user?.name || user?.email}
              </p>
            </div>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Admin Logins</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalAdminLogins}</div>
              <p className="text-xs text-muted-foreground">Active admin accounts</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">API Keys</CardTitle>
              <Key className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalApiKeys}</div>
              <p className="text-xs text-muted-foreground">Generated API keys</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Claims</CardTitle>
              <BarChart3 className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalClaims}</div>
              <p className="text-xs text-muted-foreground">Deal claims processed</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Claims</CardTitle>
              <Clock className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingClaims}</div>
              <p className="text-xs text-muted-foreground">Awaiting review</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center justify-center space-x-1 md:space-x-2 text-xs md:text-sm">
              <Activity className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Overview</span>
              <span className="sm:hidden">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="admin-logins" className="flex items-center justify-center space-x-1 md:space-x-2 text-xs md:text-sm">
              <Users className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Admin Logins</span>
              <span className="sm:hidden">Logins</span>
            </TabsTrigger>
            <TabsTrigger value="api-keys" className="flex items-center justify-center space-x-1 md:space-x-2 text-xs md:text-sm">
              <Key className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">API Keys</span>
              <span className="sm:hidden">Keys</span>
            </TabsTrigger>
            <TabsTrigger value="claims" className="flex items-center justify-center space-x-1 md:space-x-2 text-xs md:text-sm">
              <BarChart3 className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Claims</span>
              <span className="sm:hidden">Claims</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-blue-500" />
                    <span>System Activity</span>
                  </CardTitle>
                  <CardDescription>Recent system performance metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Admin Login Success Rate</span>
                      <Badge variant="success">98.5%</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">API Response Time</span>
                      <Badge variant="default">45ms</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Claims Processing</span>
                      <Badge variant={pendingClaims > 5 ? "destructive" : "success"}>
                        {pendingClaims > 5 ? "Attention Needed" : "On Track"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Globe className="h-5 w-5 text-green-500" />
                    <span>External API Status</span>
                  </CardTitle>
                  <CardDescription>Connection status to external services</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Instoredealz API</span>
                      <div className="flex items-center space-x-2">
                        <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-green-600">Connected</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Payment Gateway</span>
                      <div className="flex items-center space-x-2">
                        <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-green-600">Active</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">SMS Service</span>
                      <div className="flex items-center space-x-2">
                        <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
                        <span className="text-sm text-yellow-600">Limited</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Admin Logins Tab */}
          <TabsContent value="admin-logins" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Admin Login Management</CardTitle>
                <CardDescription>Manage administrator access and login credentials</CardDescription>
              </CardHeader>
              <CardContent>
                {adminLoginsLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    <span className="ml-2">Loading admin login data...</span>
                  </div>
                ) : adminLoginsError ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Failed to load admin login data: {adminLoginsError.message}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">Admin Accounts ({totalAdminLogins})</h3>
                      <Button size="sm">
                        <Users className="h-4 w-4 mr-2" />
                        Add Admin
                      </Button>
                    </div>
                    
                    {Array.isArray(adminLogins) && adminLogins.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Last Login</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {adminLogins.slice(0, 10).map((admin, index) => (
                            <TableRow key={admin.id || index}>
                              <TableCell>{admin.id || index + 1}</TableCell>
                              <TableCell>{admin.email || admin.username || 'N/A'}</TableCell>
                              <TableCell>
                                <Badge variant={admin.role === 'superadmin' ? 'destructive' : 'default'}>
                                  {admin.role || 'admin'}
                                </Badge>
                              </TableCell>
                              <TableCell>{admin.lastLogin || admin.createdAt || 'N/A'}</TableCell>
                              <TableCell>
                                <Badge variant={admin.isActive !== false ? 'success' : 'secondary'}>
                                  {admin.isActive !== false ? 'Active' : 'Inactive'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Button variant="outline" size="sm">Edit</Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        No admin login data available
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* API Keys Tab */}
          <TabsContent value="api-keys" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>API Key Management</CardTitle>
                <CardDescription>Generate and manage API keys for external integrations</CardDescription>
              </CardHeader>
              <CardContent>
                {apiGenerationsLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-green-500" />
                    <span className="ml-2">Loading API generation data...</span>
                  </div>
                ) : apiGenerationsError ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Failed to load API generation data: {apiGenerationsError.message}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">API Keys ({totalApiKeys})</h3>
                      <Button size="sm">
                        <Key className="h-4 w-4 mr-2" />
                        Generate Key
                      </Button>
                    </div>
                    
                    {Array.isArray(apiGenerations) && apiGenerations.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {apiGenerations.slice(0, 10).map((api, index) => (
                            <TableRow key={api.id || index}>
                              <TableCell>{api.id || index + 1}</TableCell>
                              <TableCell>{api.name || api.apiName || 'API Key'}</TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {api.type || api.apiType || 'General'}
                                </Badge>
                              </TableCell>
                              <TableCell>{api.createdAt || api.generatedAt || 'N/A'}</TableCell>
                              <TableCell>
                                <Badge variant={api.isActive !== false ? 'success' : 'secondary'}>
                                  {api.isActive !== false ? 'Active' : 'Inactive'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Button variant="outline" size="sm">Manage</Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        No API generation data available
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Claims Tab */}
          <TabsContent value="claims" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Deal Claims Management</CardTitle>
                <CardDescription>Monitor and manage deal claims across the platform</CardDescription>
              </CardHeader>
              <CardContent>
                {claimDealsLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                    <span className="ml-2">Loading claim deals data...</span>
                  </div>
                ) : claimDealsError ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Failed to load claim deals data: {claimDealsError.message}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">Recent Claims ({totalClaims})</h3>
                      <div className="flex space-x-2">
                        <Badge variant={pendingClaims > 0 ? "destructive" : "success"}>
                          {pendingClaims} Pending
                        </Badge>
                        <Button size="sm">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve All
                        </Button>
                      </div>
                    </div>
                    
                    {Array.isArray(claimDeals) && claimDeals.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Claim ID</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Membership ID</TableHead>
                            <TableHead>Deal</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {claimDeals.slice(0, 10).map((claim, index) => (
                            <TableRow key={claim.id || index}>
                              <TableCell>{claim.id || `C${index + 1}`}</TableCell>
                              <TableCell>{claim.customerName || claim.user || 'Customer'}</TableCell>
                              <TableCell className="font-mono text-sm">
                                {claim.membershipId || `ISD-${(claim.userId || index + 1).toString().padStart(8, '0')}`}
                              </TableCell>
                              <TableCell className="max-w-xs truncate">
                                {claim.dealTitle || claim.deal || 'Deal Title'}
                              </TableCell>
                              <TableCell>₹{claim.amount || claim.savingsAmount || '0'}</TableCell>
                              <TableCell>{claim.claimedAt || claim.date || 'N/A'}</TableCell>
                              <TableCell>
                                <Badge 
                                  variant={
                                    claim.status === 'approved' ? 'success' :
                                    claim.status === 'pending' ? 'default' :
                                    claim.status === 'rejected' ? 'destructive' : 'secondary'
                                  }
                                >
                                  {claim.status || 'claimed'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-1">
                                  <Button variant="outline" size="sm">Approve</Button>
                                  <Button variant="outline" size="sm">Reject</Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        No claim deals data available
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;