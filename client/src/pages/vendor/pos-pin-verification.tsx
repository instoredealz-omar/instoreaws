import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { PinInput } from "@/components/ui/pin-input";
import MobileQRScanner from "@/components/ui/mobile-qr-scanner";
import { 
  ShoppingCart, 
  CreditCard, 
  Receipt, 
  Terminal, 
  DollarSign, 
  Users, 
  TrendingUp,
  Power,
  PowerOff,
  Scan,
  Calculator,
  UserCheck,
  QrCode,
  Loader2,
  Package,
  Barcode,
  FileText,
  Truck,
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3,
  Database,
  Network,
  Globe,
  Settings,
  Plus,
  Minus,
  Edit,
  Trash2,
  Shield,
  Key,
  Clock,
  Search,
  Filter,
  RefreshCw,
  ArrowLeft
} from "lucide-react";
import { Link } from 'wouter';

interface Deal {
  id: number;
  title: string;
  description: string;
  category: string;
  discountPercentage: number;
  originalPrice: string;
  discountedPrice: string;
  verificationPin: string;
  isActive: boolean;
  isApproved: boolean;
  vendorId: number;
}

interface PosSession {
  id: number;
  vendorId: number;
  terminalId: string;
  sessionToken: string;
  isActive: boolean;
  startedAt: Date;
  endedAt: Date | null;
  totalTransactions: number;
  totalAmount: string;
}

interface PinVerificationTransaction {
  id: number;
  dealId: number;
  dealTitle: string;
  customerName: string;
  verificationPin: string;
  billAmount: number;
  discountAmount: number;
  finalAmount: number;
  paymentMethod: string;
  status: 'verified' | 'pending' | 'failed';
  verifiedAt: Date;
}

interface PosState {
  activeSession: PosSession | null;
  currentTransaction: {
    deal: Deal | null;
    pin: string;
    customerName: string;
    billAmount: number;
    discountAmount: number;
    finalAmount: number;
    paymentMethod: 'cash' | 'card' | 'upi' | 'wallet';
  } | null;
  recentTransactions: PinVerificationTransaction[];
}

export default function POSPinVerification() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [posState, setPosState] = useState<PosState>({
    activeSession: null,
    currentTransaction: null,
    recentTransactions: []
  });

  const [terminalId, setTerminalId] = useState('PIN_TERMINAL_001');
  const [activeTab, setActiveTab] = useState("verification");
  const [pinInput, setPinInput] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [billAmount, setBillAmount] = useState('');
  const [isProcessingTransaction, setIsProcessingTransaction] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showBillDialog, setShowBillDialog] = useState(false);

  // Fetch vendor deals
  const { data: deals = [], isLoading: dealsLoading } = useQuery<Deal[]>({
    queryKey: ['/api/deals/vendor'],
    queryFn: async () => {
      const response = await apiRequest('/api/deals/vendor');
      return response as Deal[];
    }
  });

  // Fetch active POS session
  const { data: activeSession } = useQuery<PosSession | null>({
    queryKey: ['/api/pos/sessions/active', terminalId],
    queryFn: async () => {
      try {
        const response = await apiRequest(`/api/pos/sessions/active?terminalId=${terminalId}`);
        return response as PosSession;
      } catch {
        return null;
      }
    }
  });

  // Start POS Session
  const startSessionMutation = useMutation<PosSession, Error, void>({
    mutationFn: async () => {
      const response = await apiRequest('/api/pos/sessions', {
        method: 'POST',
        body: { terminalId }
      });
      return response as PosSession;
    },
    onSuccess: (session) => {
      setPosState(prev => ({ ...prev, activeSession: session }));
      toast({
        title: "POS Session Started",
        description: `Terminal ${terminalId} is now active`,
        variant: "default"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/pos/sessions/active'] });
    }
  });

  // End POS Session
  const endSessionMutation = useMutation<PosSession, Error, number>({
    mutationFn: async (sessionId: number) => {
      const response = await apiRequest(`/api/pos/sessions/${sessionId}/end`, {
        method: 'POST'
      });
      return response as PosSession;
    },
    onSuccess: () => {
      setPosState(prev => ({ ...prev, activeSession: null, currentTransaction: null }));
      toast({
        title: "POS Session Ended",
        description: "Terminal session has been closed",
        variant: "default"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/pos/sessions/active'] });
    }
  });

  // PIN Verification Mutation
  const verifyPinMutation = useMutation<{ valid: boolean; dealId: number }, Error, { dealId: number; pin: string }>({
    mutationFn: async ({ dealId, pin }: { dealId: number; pin: string }) => {
      const response = await apiRequest(`/api/deals/${dealId}/verify-pin`, {
        method: 'POST',
        body: { pin }
      });
      return response as { valid: boolean; dealId: number };
    },
    onSuccess: (data, variables) => {
      const deal = deals.find((d: Deal) => d.id === variables.dealId);
      if (deal) {
        setSelectedDeal(deal);
        setShowBillDialog(true);
        toast({
          title: "PIN Verified Successfully!",
          description: `Deal: ${deal.title} - ${deal.discountPercentage}% discount verified`,
          variant: "default"
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "PIN Verification Failed",
        description: error.message || "Invalid PIN entered",
        variant: "destructive"
      });
      setPinInput('');
    }
  });

  // Process Transaction Mutation
  const processTransactionMutation = useMutation<PinVerificationTransaction, Error, any>({
    mutationFn: async (transactionData: any) => {
      const response = await apiRequest('/api/pos/transactions', {
        method: 'POST',
        body: transactionData
      });
      return response as PinVerificationTransaction;
    },
    onSuccess: (transaction) => {
      setPosState(prev => ({
        ...prev,
        currentTransaction: null,
        recentTransactions: [transaction, ...prev.recentTransactions.slice(0, 9)]
      }));
      setSelectedDeal(null);
      setShowBillDialog(false);
      setBillAmount('');
      setCustomerName('');
      setPinInput('');
      
      toast({
        title: "Transaction Completed!",
        description: `Receipt #${transaction.id} - Savings: ₹${transaction.discountAmount}`,
        variant: "default"
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/pos/transactions'] });
    }
  });

  // Handle PIN verification
  const handlePinVerification = () => {
    if (pinInput.length !== 6) {
      toast({
        title: "Invalid PIN Length",
        description: "Please enter a 6-character verification code",
        variant: "destructive"
      });
      return;
    }

    // Find deal by PIN
    const deal = Array.isArray(deals) ? deals.find((d: Deal) => d.verificationPin === pinInput.toUpperCase()) : null;
    if (deal) {
      verifyPinMutation.mutate({ dealId: deal.id, pin: pinInput });
    } else {
      toast({
        title: "PIN Not Found",
        description: "No active deal found with this verification code",
        variant: "destructive"
      });
      setPinInput('');
    }
  };

  // Handle transaction completion
  const handleCompleteTransaction = () => {
    if (!selectedDeal || !billAmount || !customerName) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const billValue = parseFloat(billAmount);
    const discountAmount = (billValue * selectedDeal.discountPercentage) / 100;
    const finalAmount = billValue - discountAmount;

    const transactionData = {
      sessionId: posState.activeSession?.id,
      dealId: selectedDeal.id,
      customerName,
      transactionType: 'pin_verification',
      amount: billValue,
      savingsAmount: discountAmount,
      finalAmount,
      pinVerified: true,
      paymentMethod: posState.currentTransaction?.paymentMethod || 'cash',
      status: 'completed',
      notes: `PIN: ${pinInput} - Discount: ${selectedDeal.discountPercentage}%`
    };

    processTransactionMutation.mutate(transactionData);
  };

  // Filter deals based on search
  const filteredDeals = Array.isArray(deals) ? deals.filter((deal: Deal) => 
    deal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    deal.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    deal.verificationPin.includes(searchQuery.toUpperCase())
  ) : [];

  useEffect(() => {
    if (activeSession) {
      setPosState(prev => ({ ...prev, activeSession }));
    }
  }, [activeSession]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/vendor/dashboard">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">POS PIN Verification System</h1>
            <p className="text-muted-foreground">6-Character Alphanumeric Deal Verification</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {posState.activeSession ? (
            <Badge variant="default" className="px-4 py-2">
              <Terminal className="h-4 w-4 mr-2" />
              {terminalId} Active
            </Badge>
          ) : (
            <Badge variant="secondary" className="px-4 py-2">
              <PowerOff className="h-4 w-4 mr-2" />
              Offline
            </Badge>
          )}
          
          {posState.activeSession ? (
            <Button 
              variant="destructive" 
              onClick={() => endSessionMutation.mutate(posState.activeSession!.id)}
              disabled={endSessionMutation.isPending}
            >
              <Power className="h-4 w-4 mr-2" />
              End Session
            </Button>
          ) : (
            <Button 
              onClick={() => startSessionMutation.mutate()}
              disabled={startSessionMutation.isPending}
            >
              <Power className="h-4 w-4 mr-2" />
              Start Session
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="verification">PIN Verification</TabsTrigger>
          <TabsTrigger value="deals">Active Deals</TabsTrigger>
          <TabsTrigger value="transactions">Recent Transactions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="verification" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Enter Verification Code
                </CardTitle>
                <CardDescription>
                  Enter the 6-character alphanumeric code provided by the customer
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <Label className="text-sm font-medium mb-2 block">
                    6-Character Verification Code
                  </Label>
                  <PinInput
                    value={pinInput}
                    onChange={setPinInput}
                    onComplete={(completedPin: string) => {
                      if (completedPin.length === 6) {
                        setPinInput(completedPin);
                        setTimeout(() => handlePinVerification(), 100);
                      }
                    }}
                    disabled={verifyPinMutation.isPending}
                    className="justify-center"
                  />
                </div>

                {pinInput.length === 6 && !verifyPinMutation.isPending && (
                  <div className="flex items-center justify-center gap-2 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm">Code entered, ready to verify</span>
                  </div>
                )}

                {verifyPinMutation.isPending && (
                  <div className="flex items-center justify-center gap-2 text-blue-600">
                    <Loader2 className="animate-spin w-4 h-4" />
                    <span className="text-sm">Verifying code...</span>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button 
                    className="flex-1" 
                    onClick={handlePinVerification}
                    disabled={pinInput.length !== 6 || verifyPinMutation.isPending}
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Verify PIN
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => setShowQRScanner(true)}
                  >
                    <QrCode className="h-4 w-4 mr-2" />
                    Scan QR
                  </Button>
                </div>

                <Button 
                  variant="ghost" 
                  className="w-full" 
                  onClick={() => setPinInput('')}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Clear Input
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Session Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {posState.recentTransactions.length}
                    </div>
                    <div className="text-sm text-blue-700 dark:text-blue-300">Transactions Today</div>
                  </div>
                  
                  <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      ₹{posState.recentTransactions.reduce((sum, t) => sum + t.discountAmount, 0).toFixed(0)}
                    </div>
                    <div className="text-sm text-green-700 dark:text-green-300">Total Savings</div>
                  </div>
                  
                  <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {Array.isArray(deals) ? deals.filter((d: Deal) => d.isActive).length : 0}
                    </div>
                    <div className="text-sm text-purple-700 dark:text-purple-300">Active Deals</div>
                  </div>
                  
                  <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {posState.activeSession ? 'ONLINE' : 'OFFLINE'}
                    </div>
                    <div className="text-sm text-orange-700 dark:text-orange-300">Terminal Status</div>
                  </div>
                </div>

                {posState.activeSession && (
                  <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Session Started:</div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {new Date(posState.activeSession.startedAt).toLocaleString()}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="deals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Active Deals
              </CardTitle>
              <CardDescription>
                All active deals with their verification codes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search deals or codes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredDeals.map((deal: Deal) => (
                  <div 
                    key={deal.id}
                    className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-gray-100">{deal.title}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{deal.category}</div>
                      <div className="text-sm text-green-600 dark:text-green-400 font-medium">
                        {deal.discountPercentage}% OFF
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <Badge variant="outline" className="font-mono text-lg">
                        {deal.verificationPin}
                      </Badge>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        ₹{deal.originalPrice} → ₹{deal.discountedPrice}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Recent Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {posState.recentTransactions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No transactions yet
                  </div>
                ) : (
                  posState.recentTransactions.map((transaction) => (
                    <div 
                      key={transaction.id}
                      className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-gray-100">{transaction.dealTitle}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Customer: {transaction.customerName}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(transaction.verifiedAt).toLocaleString()}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="font-medium text-gray-900 dark:text-gray-100">₹{transaction.finalAmount}</div>
                        <div className="text-sm text-green-600 dark:text-green-400">
                          Saved: ₹{transaction.discountAmount}
                        </div>
                        <Badge 
                          variant={
                            transaction.status === 'verified' ? 'default' : 
                            transaction.status === 'pending' ? 'secondary' : 'destructive'
                          }
                        >
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Daily Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {posState.recentTransactions.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">PIN Verifications</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Total Savings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  ₹{posState.recentTransactions.reduce((sum, t) => sum + t.discountAmount, 0).toFixed(0)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Customer Savings</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {posState.recentTransactions.length > 0 
                    ? Math.round((posState.recentTransactions.filter(t => t.status === 'verified').length / posState.recentTransactions.length) * 100)
                    : 0
                  }%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Verification Rate</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Bill Amount Dialog */}
      <Dialog open={showBillDialog} onOpenChange={setShowBillDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Transaction</DialogTitle>
            <DialogDescription>
              PIN verified for: {selectedDeal?.title} ({selectedDeal?.discountPercentage}% discount)
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="customerName">Customer Name</Label>
              <Input
                id="customerName"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter customer name"
              />
            </div>
            
            <div>
              <Label htmlFor="billAmount">Bill Amount (₹)</Label>
              <Input
                id="billAmount"
                type="number"
                value={billAmount}
                onChange={(e) => setBillAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>

            {billAmount && selectedDeal && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-sm text-green-700 dark:text-green-300">Calculation Summary:</div>
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  Bill Amount: ₹{parseFloat(billAmount).toFixed(2)}
                </div>
                <div className="font-medium text-green-600 dark:text-green-400">
                  Discount ({selectedDeal.discountPercentage}%): -₹{((parseFloat(billAmount) * selectedDeal.discountPercentage) / 100).toFixed(2)}
                </div>
                <div className="font-bold text-lg text-gray-900 dark:text-gray-100">
                  Final Amount: ₹{(parseFloat(billAmount) - ((parseFloat(billAmount) * selectedDeal.discountPercentage) / 100)).toFixed(2)}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowBillDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCompleteTransaction}
              disabled={!customerName || !billAmount || processTransactionMutation.isPending}
            >
              {processTransactionMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Receipt className="h-4 w-4 mr-2" />
              )}
              Complete Transaction
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* QR Scanner Dialog */}
      <Dialog open={showQRScanner} onOpenChange={setShowQRScanner}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Scan Customer Membership QR Code</DialogTitle>
            <DialogDescription>
              Scan the customer's membership QR code to view their details. You'll still need to manually enter the deal PIN for verification.
            </DialogDescription>
          </DialogHeader>
          
          <MobileQRScanner
            onScanSuccess={(data) => {
              try {
                // Try to parse as JSON (membership QR code format)
                const qrData = JSON.parse(data);
                if (qrData.type === 'customer_claim' || qrData.type === 'membership_verification') {
                  // Fill customer name from QR data
                  setCustomerName(qrData.userName || qrData.name || '');
                  setShowQRScanner(false);
                  toast({
                    title: "Customer QR Scanned",
                    description: `Customer: ${qrData.userName || qrData.name} (${qrData.membershipPlan})`,
                  });
                } else {
                  throw new Error('Invalid QR code format');
                }
              } catch (error) {
                // Fallback: treat as plain text
                setCustomerName(data);
                setShowQRScanner(false);
                toast({
                  title: "QR Scanned",
                  description: "Customer information extracted from QR code",
                });
              }
            }}
            onScanError={(error) => {
              toast({
                title: "QR Scan Failed",
                description: error,
                variant: "destructive"
              });
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}