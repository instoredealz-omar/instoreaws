import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
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
  Loader2
} from "lucide-react";
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

interface PosTransaction {
  id: number;
  sessionId: number;
  dealId: number;
  customerId: number | null;
  transactionType: string;
  amount: string;
  savingsAmount: string;
  pinVerified: boolean;
  paymentMethod: string | null;
  status: string;
  receiptNumber: string | null;
  notes: string | null;
  processedAt: Date;
}

interface PosState {
  activeSession: PosSession | null;
  selectedDeals: Array<{ deal: Deal; quantity: number; pin?: string }>;
  currentCustomer: { id?: number; name?: string } | null;
  paymentMethod: 'cash' | 'card' | 'upi' | 'wallet';
  totalAmount: number;
  totalSavings: number;
}

export default function PosDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [posState, setPosState] = useState<PosState>({
    activeSession: null,
    selectedDeals: [],
    currentCustomer: null,
    paymentMethod: 'cash',
    totalAmount: 0,
    totalSavings: 0,
  });

  const [terminalId, setTerminalId] = useState('TERMINAL_001');
  const [pinInput, setPinInput] = useState('');
  const [isProcessingTransaction, setIsProcessingTransaction] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [verifiedCustomer, setVerifiedCustomer] = useState<any>(null);

  // Fetch available deals for POS
  const { data: deals = [], isLoading: dealsLoading } = useQuery({
    queryKey: ['/api/pos/deals'],
    enabled: !!posState.activeSession,
  });

  // Fetch active POS sessions
  const { data: sessions = [], refetch: refetchSessions } = useQuery({
    queryKey: ['/api/pos/sessions'],
  });

  // Start POS session mutation
  const startSessionMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/pos/sessions', {
        method: 'POST',
        body: { terminalId },
      });
    },
    onSuccess: (data) => {
      setPosState(prev => ({ ...prev, activeSession: data }));
      toast({
        title: "POS Session Started",
        description: `Terminal ${terminalId} is now active`,
      });
      refetchSessions();
    },
    onError: (error) => {
      toast({
        title: "Session Start Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // End POS session mutation
  const endSessionMutation = useMutation({
    mutationFn: async (sessionId: number) => {
      return apiRequest(`/api/pos/sessions/${sessionId}/end`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      setPosState(prev => ({ 
        ...prev, 
        activeSession: null,
        selectedDeals: [],
        currentCustomer: null,
        totalAmount: 0,
        totalSavings: 0,
      }));
      toast({
        title: "POS Session Ended",
        description: "Session closed successfully",
      });
      refetchSessions();
    },
    onError: (error) => {
      toast({
        title: "Session End Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Process transaction mutation
  const processTransactionMutation = useMutation({
    mutationFn: async (transactionData: any) => {
      return apiRequest('/api/pos/transactions', {
        method: 'POST',
        body: transactionData,
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Transaction Processed",
        description: `Receipt #${data.receiptNumber} - ₹${data.savingsAmount} saved!`,
      });
      
      // Reset cart
      setPosState(prev => ({
        ...prev,
        selectedDeals: [],
        currentCustomer: null,
        totalAmount: 0,
        totalSavings: 0,
      }));
      
      setIsProcessingTransaction(false);
      queryClient.invalidateQueries({ queryKey: ['/api/pos/sessions'] });
    },
    onError: (error) => {
      toast({
        title: "Transaction Failed",
        description: error.message,
        variant: "destructive",
      });
      setIsProcessingTransaction(false);
    },
  });

  // Verify PIN mutation
  const verifyPinMutation = useMutation({
    mutationFn: async ({ dealId, pin }: { dealId: number; pin: string }) => {
      return apiRequest('/api/pos/verify-pin', {
        method: 'POST',
        body: { dealId, pin },
      });
    },
    onSuccess: (data, variables) => {
      if (data.valid) {
        const dealsArray = Array.isArray(deals) ? deals : [];
        const foundDeal = dealsArray.find(d => d.id === variables.dealId);
        if (foundDeal) {
          addDealToCart(foundDeal, variables.pin);
        }
        setPinInput('');
        toast({
          title: "PIN Verified",
          description: `${data.dealTitle} added to cart`,
        });
      } else {
        toast({
          title: "Invalid PIN",
          description: "Please check the PIN and try again",
          variant: "destructive",
        });
      }
    },
  });

  // Verify Claim Code mutation
  const verifyClaimCodeMutation = useMutation({
    mutationFn: async (claimCode: string) => {
      const response = await apiRequest('/api/pos/verify-claim-code', {
        method: 'POST',
        body: { claimCode },
      });
      return await response.json();
    },
    onSuccess: (data) => {
      if (data.success && data.valid) {
        // Create a temporary deal object from the claim data
        const claimDeal = {
          id: data.deal.id,
          title: data.deal.title,
          description: `Claimed deal - ${data.deal.title}`,
          category: 'claimed',
          discountPercentage: data.deal.discountPercentage,
          originalPrice: data.deal.originalPrice,
          discountedPrice: data.deal.discountedPrice,
          verificationPin: pinInput,
          isActive: true,
          isApproved: true,
        };
        
        addDealToCart(claimDeal, pinInput);
        setPinInput('');
        
        toast({
          title: "Claim Code Verified",
          description: `${data.customer.name}'s claim for "${data.deal.title}" verified`,
        });
      } else {
        toast({
          title: "Invalid Claim Code",
          description: data.error || "Please check the claim code and try again",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Verification Failed",
        description: "Failed to verify claim code. Please try again.",
        variant: "destructive",
      });
    },
  });

  const addDealToCart = (deal: Deal, pin?: string) => {
    setPosState(prev => {
      const existingDeal = prev.selectedDeals.find(item => item.deal.id === deal.id);
      
      let newSelectedDeals;
      if (existingDeal) {
        newSelectedDeals = prev.selectedDeals.map(item =>
          item.deal.id === deal.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        newSelectedDeals = [...prev.selectedDeals, { deal, quantity: 1, pin }];
      }

      const newTotalAmount = newSelectedDeals.reduce((sum, item) => 
        sum + (parseFloat(item.deal.discountedPrice || "0") * item.quantity), 0
      );
      
      const newTotalSavings = newSelectedDeals.reduce((sum, item) => 
        sum + ((parseFloat(item.deal.originalPrice || "0") - parseFloat(item.deal.discountedPrice || "0")) * item.quantity), 0
      );

      return {
        ...prev,
        selectedDeals: newSelectedDeals,
        totalAmount: newTotalAmount,
        totalSavings: newTotalSavings,
      };
    });
  };

  const removeDealFromCart = (dealId: number) => {
    setPosState(prev => {
      const newSelectedDeals = prev.selectedDeals.filter(item => item.deal.id !== dealId);
      
      const newTotalAmount = newSelectedDeals.reduce((sum, item) => 
        sum + (parseFloat(item.deal.discountedPrice || "0") * item.quantity), 0
      );
      
      const newTotalSavings = newSelectedDeals.reduce((sum, item) => 
        sum + ((parseFloat(item.deal.originalPrice || "0") - parseFloat(item.deal.discountedPrice || "0")) * item.quantity), 0
      );

      return {
        ...prev,
        selectedDeals: newSelectedDeals,
        totalAmount: newTotalAmount,
        totalSavings: newTotalSavings,
      };
    });
  };

  const handleQRScanSuccess = (customerData: any) => {
    setVerifiedCustomer(customerData);
    setPosState(prev => ({ 
      ...prev, 
      currentCustomer: { 
        id: customerData.userId, 
        name: customerData.userName 
      } 
    }));
    setShowQRScanner(false);
    
    toast({
      title: "Customer Verified",
      description: `${customerData.userName} verified successfully`,
    });
  };

  const handleQRScanError = (error: string) => {
    toast({
      title: "QR Scan Failed",
      description: error,
      variant: "destructive",
    });
  };

  const processTransaction = () => {
    if (!posState.activeSession || posState.selectedDeals.length === 0) return;

    setIsProcessingTransaction(true);

    // Process each deal as a separate transaction
    posState.selectedDeals.forEach(item => {
      const transactionData = {
        sessionId: posState.activeSession!.id,
        dealId: item.deal.id,
        customerId: verifiedCustomer?.userId || posState.currentCustomer?.id || null,
        amount: (parseFloat(item.deal.discountedPrice || "0") * item.quantity).toString(),
        savingsAmount: ((parseFloat(item.deal.originalPrice || "0") - parseFloat(item.deal.discountedPrice || "0")) * item.quantity).toString(),
        transactionType: 'redeem',
        paymentMethod: posState.paymentMethod,
        pin: item.pin,
        notes: `Quantity: ${item.quantity}`,
      };

      processTransactionMutation.mutate(transactionData);
    });
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">POS Dashboard</h1>
          <p className="text-muted-foreground">Point of Sale Terminal</p>
        </div>
        
        <div className="flex items-center gap-4">
          {posState.activeSession ? (
            <Badge variant="default" className="px-3 py-1">
              <Terminal className="h-4 w-4 mr-2" />
              {posState.activeSession.terminalId} Active
            </Badge>
          ) : (
            <Badge variant="secondary" className="px-3 py-1">
              <PowerOff className="h-4 w-4 mr-2" />
              Offline
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Session Control */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Power className="h-5 w-5" />
              Session Control
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="terminalId">Terminal ID</Label>
              <Input
                id="terminalId"
                value={terminalId}
                onChange={(e) => setTerminalId(e.target.value)}
                disabled={!!posState.activeSession}
                placeholder="TERMINAL_001"
              />
            </div>
            
            {!posState.activeSession ? (
              <Button 
                onClick={() => startSessionMutation.mutate()}
                disabled={startSessionMutation.isPending}
                className="w-full"
              >
                <Power className="h-4 w-4 mr-2" />
                Start Session
              </Button>
            ) : (
              <Button 
                onClick={() => endSessionMutation.mutate(posState.activeSession!.id)}
                disabled={endSessionMutation.isPending}
                variant="destructive"
                className="w-full"
              >
                <PowerOff className="h-4 w-4 mr-2" />
                End Session
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Customer Verification */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Customer Verification
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!verifiedCustomer ? (
              <div className="space-y-3">
                <Button 
                  onClick={() => setShowQRScanner(true)}
                  variant="outline"
                  className="w-full"
                  disabled={!posState.activeSession}
                >
                  <QrCode className="h-4 w-4 mr-2" />
                  Scan Customer QR Code
                </Button>
                
                <div className="text-center text-sm text-muted-foreground">
                  or
                </div>
                
                <Button 
                  onClick={() => {
                    // Manual customer entry for cases without QR code
                    setVerifiedCustomer({
                      userId: 0,
                      userName: 'Walk-in Customer',
                      membershipPlan: 'basic',
                      email: 'walkin@customer.com'
                    });
                  }}
                  variant="ghost"
                  className="w-full"
                  disabled={!posState.activeSession}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Walk-in Customer
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-green-800 dark:text-green-200">
                        {verifiedCustomer.userName}
                      </p>
                      <p className="text-sm text-green-600 dark:text-green-300 capitalize">
                        {verifiedCustomer.membershipPlan} Member
                      </p>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Verified
                    </Badge>
                  </div>
                </div>
                
                <Button 
                  onClick={() => {
                    setVerifiedCustomer(null);
                    setPosState(prev => ({ ...prev, currentCustomer: null }));
                  }}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  Reset Customer
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Claim Code Scanner */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scan className="h-5 w-5" />
              Claim Code Scanner
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="pinInput">Enter Customer Claim Code</Label>
              <Input
                id="pinInput"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.toUpperCase())}
                disabled={!posState.activeSession}
                placeholder="6-character code (e.g., ABC123)"
                maxLength={6}
                pattern="[A-Za-z0-9]*"
                inputMode="text"
              />
            </div>
            
            <Button 
              onClick={() => {
                if (pinInput.length === 6) {
                  // Verify customer claim code
                  verifyClaimCodeMutation.mutate(pinInput);
                }
              }}
              disabled={!posState.activeSession || pinInput.length !== 6 || verifyClaimCodeMutation.isPending}
              className="w-full"
            >
              {verifyClaimCodeMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Scan className="h-4 w-4 mr-2" />
              )}
              Verify Claim Code
            </Button>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Session Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Amount</span>
                <span className="font-bold">₹{posState.totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Savings</span>
                <span className="font-bold text-green-600">₹{posState.totalSavings.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Items in Cart</span>
                <span className="font-bold">{posState.selectedDeals.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Shopping Cart */}
      {posState.activeSession && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Shopping Cart
            </CardTitle>
          </CardHeader>
          <CardContent>
            {posState.selectedDeals.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No items in cart. Scan a PIN to add deals.
              </p>
            ) : (
              <div className="space-y-4">
                {posState.selectedDeals.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-semibold">{item.deal.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {item.deal.discountPercentage}% off • PIN: {item.pin}
                      </p>
                      <p className="text-sm">
                        ₹{item.deal.originalPrice} → ₹{item.deal.discountedPrice}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-semibold">Qty: {item.quantity}</span>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeDealFromCart(item.deal.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}

                <Separator />
                
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total: ₹{posState.totalAmount.toFixed(2)}</span>
                  <span className="text-green-600">Savings: ₹{posState.totalSavings.toFixed(2)}</span>
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label htmlFor="paymentMethod">Payment Method</Label>
                    <select
                      id="paymentMethod"
                      value={posState.paymentMethod}
                      onChange={(e) => setPosState(prev => ({ ...prev, paymentMethod: e.target.value as any }))}
                      className="w-full mt-1 p-2 border rounded-md"
                    >
                      <option value="cash">Cash</option>
                      <option value="card">Card</option>
                      <option value="upi">UPI</option>
                      <option value="wallet">Wallet</option>
                    </select>
                  </div>
                </div>

                <Button
                  onClick={processTransaction}
                  disabled={isProcessingTransaction || posState.selectedDeals.length === 0}
                  className="w-full"
                  size="lg"
                >
                  <Receipt className="h-4 w-4 mr-2" />
                  {isProcessingTransaction ? 'Processing...' : 'Process Transaction'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Available Deals */}
      {posState.activeSession && !dealsLoading && deals.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Available Deals</CardTitle>
            <CardDescription>Your active deals for POS transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {deals.map((deal) => (
                <div key={deal.id} className="border rounded-lg p-4">
                  <h3 className="font-semibold">{deal.title}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{deal.description}</p>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-lg font-bold">₹{deal.discountedPrice}</span>
                    <Badge variant="secondary">{deal.discountPercentage}% off</Badge>
                  </div>
                  <Button
                    onClick={() => addDealToCart(deal)}
                    size="sm"
                    className="w-full"
                    disabled={!posState.activeSession}
                  >
                    Add to Cart
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* QR Scanner Modal */}
      {showQRScanner && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <MobileQRScanner
              onScanSuccess={handleQRScanSuccess}
              onScanError={handleQRScanError}
              onClose={() => setShowQRScanner(false)}
              className="p-4"
            />
          </div>
        </div>
      )}
    </div>
  );
}