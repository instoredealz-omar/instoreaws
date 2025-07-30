import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Package, 
  Receipt, 
  Globe, 
  Monitor,
  Plus,
  Edit,
  Trash2,
  DollarSign,
  ShoppingCart,
  Users,
  TrendingUp,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  Settings,
  Terminal,
  CreditCard,
  Calculator
} from "lucide-react";

interface InventoryItem {
  id: number;
  productCode: string;
  productName: string;
  category: string;
  stockQuantity: number;
  unitPrice: number;
  minStockLevel: number;
  isActive: boolean;
}

interface Bill {
  id: number;
  billNumber: string;
  customerName: string;
  totalAmount: number;
  paymentStatus: string;
  createdAt: string;
}

interface GDSConnection {
  id: number;
  connectionName: string;
  gdsProvider: string;
  isActive: boolean;
  isTestMode: boolean;
  lastSyncAt: string | null;
}

interface PosAnalytics {
  totalSales: number;
  totalTransactions: number;
  inventoryItems: number;
  gdsTransactions: number;
  activeTerminals: number;
  salesGrowth: number;
  topProducts: Array<{ name: string; sales: number; quantity: number }>;
}

export default function EnhancedPOSDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [showAddInventory, setShowAddInventory] = useState(false);
  const [showCreateBill, setShowCreateBill] = useState(false);
  const [showAddGDS, setShowAddGDS] = useState(false);

  // New inventory item form state
  const [newInventoryItem, setNewInventoryItem] = useState({
    productCode: '',
    productName: '',
    category: '',
    stockQuantity: 0,
    unitPrice: 0,
    minStockLevel: 5
  });

  // New bill form state
  const [newBill, setNewBill] = useState({
    customerName: '',
    items: [],
    paymentMethod: 'CASH',
    notes: ''
  });

  // New GDS connection form state
  const [newGDSConnection, setNewGDSConnection] = useState({
    connectionName: '',
    gdsProvider: 'AMADEUS',
    apiEndpoint: '',
    username: '',
    password: '',
    isTestMode: true
  });

  // Fetch inventory data
  const { data: inventory = [], isLoading: inventoryLoading } = useQuery({
    queryKey: ['/api/pos/inventory'],
    queryFn: async () => {
      try {
        const response = await apiRequest('/api/pos/inventory', { method: 'GET' });
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Error fetching inventory:', error);
        return [];
      }
    }
  });

  // Fetch bills data
  const { data: bills = [], isLoading: billsLoading } = useQuery({
    queryKey: ['/api/pos/bills'],
    queryFn: async () => {
      try {
        const response = await apiRequest('/api/pos/bills', { method: 'GET' });
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Error fetching bills:', error);
        return [];
      }
    }
  });

  // Fetch GDS connections
  const { data: gdsConnections = [], isLoading: gdsLoading } = useQuery({
    queryKey: ['/api/pos/gds/connections'],
    queryFn: async () => {
      try {
        const response = await apiRequest('/api/pos/gds/connections', { method: 'GET' });
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Error fetching GDS connections:', error);
        return [];
      }
    }
  });

  // Fetch POS analytics
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['/api/pos/analytics', activeTab],
    queryFn: async () => {
      try {
        const response = await apiRequest(`/api/pos/analytics?type=${activeTab}`, { method: 'GET' });
        const data = await response.json();
        return data || {};
      } catch (error) {
        console.error('Error fetching analytics:', error);
        return {};
      }
    }
  });

  // Add inventory item mutation
  const addInventoryMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('/api/pos/inventory', {
        method: 'POST',
        body: data
      });
      return await response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Inventory item added successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/pos/inventory'] });
      setShowAddInventory(false);
      setNewInventoryItem({ productCode: '', productName: '', category: '', stockQuantity: 0, unitPrice: 0, minStockLevel: 5 });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add inventory item", variant: "destructive" });
    }
  });

  // Create bill mutation
  const createBillMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('/api/pos/bills', {
        method: 'POST',
        body: data
      });
      return await response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Bill created successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/pos/bills'] });
      setShowCreateBill(false);
      setNewBill({ customerName: '', items: [], paymentMethod: 'CASH', notes: '' });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create bill", variant: "destructive" });
    }
  });

  // Add GDS connection mutation
  const addGDSMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('/api/pos/gds/connections', {
        method: 'POST',
        body: data
      });
      return await response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "GDS connection added successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/pos/gds/connections'] });
      setShowAddGDS(false);
      setNewGDSConnection({ connectionName: '', gdsProvider: 'AMADEUS', apiEndpoint: '', username: '', password: '', isTestMode: true });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add GDS connection", variant: "destructive" });
    }
  });

  const handleAddInventory = () => {
    console.log('Add inventory button clicked, current state:', showAddInventory);
    addInventoryMutation.mutate(newInventoryItem);
  };

  const handleCreateBill = () => {
    console.log('Create bill button clicked, current state:', showCreateBill);
    createBillMutation.mutate(newBill);
  };

  const handleAddGDS = () => {
    console.log('Add GDS button clicked, current state:', showAddGDS);
    addGDSMutation.mutate(newGDSConnection);
  };

  const handleOpenInventoryDialog = () => {
    console.log('Opening inventory dialog, current state:', showAddInventory);
    alert('Inventory button clicked! Check console for logs.');
    setShowAddInventory(true);
    console.log('After setting state:', true);
  };

  const handleOpenBillDialog = () => {
    console.log('Opening bill dialog, current state:', showCreateBill);
    alert('Bill button clicked! Check console for logs.');
    setShowCreateBill(true);
    console.log('After setting state:', true);
  };

  const handleOpenGDSDialog = () => {
    console.log('Opening GDS dialog, current state:', showAddGDS);
    alert('GDS button clicked! Check console for logs.');
    setShowAddGDS(true);
    console.log('After setting state:', true);
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Enhanced POS Dashboard</h1>
          <p className="text-muted-foreground">Comprehensive Point of Sale Management System</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="gds">GDS</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{(analytics as any)?.totalSales?.toLocaleString() || '0'}</div>
                <p className="text-xs text-muted-foreground">
                  +{(analytics as any)?.salesGrowth || 0}% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Transactions</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(analytics as any)?.totalTransactions || 0}</div>
                <p className="text-xs text-muted-foreground">Active transactions</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Inventory Items</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(analytics as any)?.inventoryItems || 0}</div>
                <p className="text-xs text-muted-foreground">Products in stock</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">GDS Bookings</CardTitle>
                <Globe className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(analytics as any)?.gdsTransactions || 0}</div>
                <p className="text-xs text-muted-foreground">Travel bookings</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common POS operations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button onClick={handleOpenInventoryDialog} className="h-20 flex-col">
                  <Package className="h-6 w-6 mb-2" />
                  Add Product
                </Button>
                <Button onClick={handleOpenBillDialog} className="h-20 flex-col">
                  <Receipt className="h-6 w-6 mb-2" />
                  Create Bill
                </Button>
                <Button onClick={handleOpenGDSDialog} className="h-20 flex-col">
                  <Globe className="h-6 w-6 mb-2" />
                  Add GDS
                </Button>
                <Button onClick={() => setActiveTab('analytics')} variant="outline" className="h-20 flex-col">
                  <BarChart3 className="h-6 w-6 mb-2" />
                  View Reports
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inventory Tab */}
        <TabsContent value="inventory" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Inventory Management</h2>
              <p className="text-muted-foreground">Manage your product inventory</p>
            </div>
            <Button onClick={handleOpenInventoryDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Product Inventory</CardTitle>
              <CardDescription>Current stock levels and product information</CardDescription>
            </CardHeader>
            <CardContent>
              {inventoryLoading ? (
                <div className="text-center py-8">Loading inventory...</div>
              ) : (
                <div className="space-y-4">
                  {inventory.map((item: InventoryItem) => (
                    <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-semibold">{item.productName}</h3>
                        <p className="text-sm text-muted-foreground">Code: {item.productCode} | Category: {item.category}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-sm">Stock: {item.stockQuantity}</span>
                          <span className="text-sm">Price: ₹{item.unitPrice.toLocaleString()}</span>
                          <Badge variant={item.stockQuantity <= item.minStockLevel ? "destructive" : "default"}>
                            {item.stockQuantity <= item.minStockLevel ? "Low Stock" : "In Stock"}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Billing Management</h2>
              <p className="text-muted-foreground">Create and manage customer bills</p>
            </div>
            <Button onClick={handleOpenBillDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Create Bill
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Bills</CardTitle>
              <CardDescription>Latest billing transactions</CardDescription>
            </CardHeader>
            <CardContent>
              {billsLoading ? (
                <div className="text-center py-8">Loading bills...</div>
              ) : (
                <div className="space-y-4">
                  {bills.map((bill: Bill) => (
                    <div key={bill.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-semibold">{bill.billNumber}</h3>
                        <p className="text-sm text-muted-foreground">Customer: {bill.customerName}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-sm font-medium">₹{bill.totalAmount.toLocaleString()}</span>
                          <Badge variant={bill.paymentStatus === 'PAID' ? "default" : "destructive"}>
                            {bill.paymentStatus}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(bill.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Receipt className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* GDS Tab */}
        <TabsContent value="gds" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Global Distribution System</h2>
              <p className="text-muted-foreground">Manage travel booking integrations</p>
            </div>
            <Button onClick={handleOpenGDSDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Connection
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>GDS Connections</CardTitle>
              <CardDescription>Active travel booking system integrations</CardDescription>
            </CardHeader>
            <CardContent>
              {gdsLoading ? (
                <div className="text-center py-8">Loading GDS connections...</div>
              ) : (
                <div className="space-y-4">
                  {gdsConnections.map((connection: GDSConnection) => (
                    <div key={connection.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-semibold">{connection.connectionName}</h3>
                        <p className="text-sm text-muted-foreground">Provider: {connection.gdsProvider}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <Badge variant={connection.isActive ? "default" : "secondary"}>
                            {connection.isActive ? "Active" : "Inactive"}
                          </Badge>
                          <Badge variant="outline">
                            {connection.isTestMode ? "Test Mode" : "Live Mode"}
                          </Badge>
                          {connection.lastSyncAt && (
                            <span className="text-xs text-muted-foreground">
                              Last sync: {new Date(connection.lastSyncAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Globe className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">POS Analytics</h2>
            <p className="text-muted-foreground">Performance insights and reporting</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Products</CardTitle>
                <CardDescription>Best selling items</CardDescription>
              </CardHeader>
              <CardContent>
                {((analytics as any)?.topProducts || []).map((product: any, index: number) => (
                  <div key={index} className="flex justify-between items-center py-2">
                    <span className="font-medium">{product.name}</span>
                    <div className="text-right">
                      <div className="font-bold">₹{product.sales.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">{product.quantity} sold</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
                <CardDescription>Transaction breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Cash</span>
                    <span className="font-bold">35%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Card</span>
                    <span className="font-bold">45%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>UPI</span>
                    <span className="font-bold">20%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Inventory Dialog */}
      <Dialog open={showAddInventory} onOpenChange={setShowAddInventory}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
            <DialogDescription>Add a new item to your inventory</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="productCode">Product Code</Label>
              <Input
                id="productCode"
                value={newInventoryItem.productCode}
                onChange={(e) => setNewInventoryItem({...newInventoryItem, productCode: e.target.value})}
                placeholder="e.g., ELEC001"
              />
            </div>
            <div>
              <Label htmlFor="productName">Product Name</Label>
              <Input
                id="productName"
                value={newInventoryItem.productName}
                onChange={(e) => setNewInventoryItem({...newInventoryItem, productName: e.target.value})}
                placeholder="e.g., Samsung Galaxy S23"
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select 
                value={newInventoryItem.category} 
                onValueChange={(value) => setNewInventoryItem({...newInventoryItem, category: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Electronics">Electronics</SelectItem>
                  <SelectItem value="Fashion">Fashion</SelectItem>
                  <SelectItem value="Food">Food & Beverages</SelectItem>
                  <SelectItem value="Home">Home & Garden</SelectItem>
                  <SelectItem value="Travel">Travel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="stockQuantity">Stock Quantity</Label>
                <Input
                  id="stockQuantity"
                  type="number"
                  value={newInventoryItem.stockQuantity}
                  onChange={(e) => setNewInventoryItem({...newInventoryItem, stockQuantity: parseInt(e.target.value) || 0})}
                  placeholder="50"
                />
              </div>
              <div>
                <Label htmlFor="unitPrice">Unit Price (₹)</Label>
                <Input
                  id="unitPrice"
                  type="number"
                  value={newInventoryItem.unitPrice}
                  onChange={(e) => setNewInventoryItem({...newInventoryItem, unitPrice: parseInt(e.target.value) || 0})}
                  placeholder="79999"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="minStockLevel">Minimum Stock Level</Label>
              <Input
                id="minStockLevel"
                type="number"
                value={newInventoryItem.minStockLevel}
                onChange={(e) => setNewInventoryItem({...newInventoryItem, minStockLevel: parseInt(e.target.value) || 5})}
                placeholder="5"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddInventory(false)}>Cancel</Button>
              <Button 
                onClick={handleAddInventory}
                disabled={addInventoryMutation.isPending}
              >
                {addInventoryMutation.isPending ? "Adding..." : "Add Product"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Bill Dialog */}
      <Dialog open={showCreateBill} onOpenChange={setShowCreateBill}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Bill</DialogTitle>
            <DialogDescription>Generate a bill for customer transaction</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="customerName">Customer Name</Label>
              <Input
                id="customerName"
                value={newBill.customerName}
                onChange={(e) => setNewBill({...newBill, customerName: e.target.value})}
                placeholder="John Doe"
              />
            </div>
            <div>
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select 
                value={newBill.paymentMethod} 
                onValueChange={(value) => setNewBill({...newBill, paymentMethod: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="CARD">Card</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                  <SelectItem value="WALLET">Wallet</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input
                id="notes"
                value={newBill.notes}
                onChange={(e) => setNewBill({...newBill, notes: e.target.value})}
                placeholder="Additional notes..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateBill(false)}>Cancel</Button>
              <Button 
                onClick={handleCreateBill}
                disabled={createBillMutation.isPending}
              >
                {createBillMutation.isPending ? "Creating..." : "Create Bill"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add GDS Connection Dialog */}
      <Dialog open={showAddGDS} onOpenChange={setShowAddGDS}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add GDS Connection</DialogTitle>
            <DialogDescription>Connect to a Global Distribution System</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="connectionName">Connection Name</Label>
              <Input
                id="connectionName"
                value={newGDSConnection.connectionName}
                onChange={(e) => setNewGDSConnection({...newGDSConnection, connectionName: e.target.value})}
                placeholder="Amadeus Travel API"
              />
            </div>
            <div>
              <Label htmlFor="gdsProvider">GDS Provider</Label>
              <Select 
                value={newGDSConnection.gdsProvider} 
                onValueChange={(value) => setNewGDSConnection({...newGDSConnection, gdsProvider: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select GDS provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AMADEUS">Amadeus</SelectItem>
                  <SelectItem value="SABRE">Sabre</SelectItem>
                  <SelectItem value="TRAVELPORT">Travelport</SelectItem>
                  <SelectItem value="GALILEO">Galileo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="apiEndpoint">API Endpoint</Label>
              <Input
                id="apiEndpoint"
                value={newGDSConnection.apiEndpoint}
                onChange={(e) => setNewGDSConnection({...newGDSConnection, apiEndpoint: e.target.value})}
                placeholder="https://api.amadeus.com/v2"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={newGDSConnection.username}
                  onChange={(e) => setNewGDSConnection({...newGDSConnection, username: e.target.value})}
                  placeholder="API Username"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={newGDSConnection.password}
                  onChange={(e) => setNewGDSConnection({...newGDSConnection, password: e.target.value})}
                  placeholder="API Password"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddGDS(false)}>Cancel</Button>
              <Button 
                onClick={handleAddGDS}
                disabled={addGDSMutation.isPending}
              >
                {addGDSMutation.isPending ? "Adding..." : "Add Connection"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}