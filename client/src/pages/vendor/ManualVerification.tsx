import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Link } from 'wouter';
import { Phone, User, QrCode, CheckCircle, Clock, AlertCircle, Store, Receipt, ArrowLeft } from 'lucide-react';

interface Claim {
  claimId: number;
  claimCode: string;
  claimedAt: string;
  expiresAt: string;
  deal: {
    id: number;
    title: string;
    discountPercentage: number;
    originalPrice: string;
    discountedPrice: string;
  };
}

interface Customer {
  id: number;
  name: string;
  phone: string;
  membershipPlan: string;
}

interface VerificationResult {
  success: boolean;
  customer?: Customer;
  activeClaims?: Claim[];
  matchingCustomers?: Array<{
    customer: Customer;
    activeClaims: Claim[];
  }>;
  claim?: any;
  deal?: any;
}

const ManualVerification = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [qrData, setQrData] = useState('');
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [selectedClaim, setSelectedClaim] = useState<any>(null);
  const [billAmount, setBillAmount] = useState('');
  const [actualDiscount, setActualDiscount] = useState('');
  const [notes, setNotes] = useState('');
  const { toast } = useToast();

  // Phone verification mutation
  const phoneVerificationMutation = useMutation({
    mutationFn: async (phone: string) => {
      return apiRequest('/api/manual/verify-by-phone', 'POST', { phoneNumber: phone });
    },
    onSuccess: (data) => {
      setVerificationResult(data);
      toast({
        title: "Customer Found",
        description: `Found ${data.activeClaims?.length || 0} active claim(s) for ${data.customer?.name}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Customer Not Found",
        description: error.message || "No customer found with this phone number",
        variant: "destructive",
      });
    }
  });

  // Name verification mutation
  const nameVerificationMutation = useMutation({
    mutationFn: async (name: string) => {
      return apiRequest('/api/manual/verify-by-name', 'POST', { customerName: name });
    },
    onSuccess: (data) => {
      setVerificationResult(data);
      toast({
        title: "Customers Found",
        description: `Found ${data.matchingCustomers?.length || 0} customer(s) with active claims`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "No Customers Found",
        description: error.message || "No customers found matching this name",
        variant: "destructive",
      });
    }
  });

  // QR verification mutation
  const qrVerificationMutation = useMutation({
    mutationFn: async (qr: string) => {
      return apiRequest('/api/manual/verify-qr', 'POST', { qrData: qr });
    },
    onSuccess: (data) => {
      setVerificationResult(data);
      setSelectedClaim(data);
      toast({
        title: "QR Code Verified",
        description: `Valid claim for ${data.customer?.name}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Invalid QR Code",
        description: error.message || "Invalid or expired QR code",
        variant: "destructive",
      });
    }
  });

  // Transaction completion mutation
  const completionMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/manual/complete-transaction', 'POST', data);
    },
    onSuccess: (data) => {
      toast({
        title: "Transaction Completed",
        description: `Successfully processed savings of ₹${data.transaction.actualDiscount}`,
      });
      // Reset form
      setSelectedClaim(null);
      setBillAmount('');
      setActualDiscount('');
      setNotes('');
      setVerificationResult(null);
    },
    onError: (error: any) => {
      toast({
        title: "Transaction Failed",
        description: error.message || "Failed to complete transaction",
        variant: "destructive",
      });
    }
  });

  const handlePhoneVerification = () => {
    if (!phoneNumber.trim()) {
      toast({
        title: "Phone Required",
        description: "Please enter a phone number",
        variant: "destructive",
      });
      return;
    }
    phoneVerificationMutation.mutate(phoneNumber);
  };

  const handleNameVerification = () => {
    if (!customerName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a customer name",
        variant: "destructive",
      });
      return;
    }
    nameVerificationMutation.mutate(customerName);
  };

  const handleQRVerification = () => {
    if (!qrData.trim()) {
      toast({
        title: "QR Data Required",
        description: "Please scan or enter QR code data",
        variant: "destructive",
      });
      return;
    }
    qrVerificationMutation.mutate(qrData);
  };

  const handleCompleteTransaction = () => {
    if (!selectedClaim || !billAmount || actualDiscount === '') {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    completionMutation.mutate({
      claimId: selectedClaim.claimId || selectedClaim.claim?.claimId,
      billAmount: parseFloat(billAmount),
      actualDiscount: parseFloat(actualDiscount),
      notes
    });
  };

  const selectClaim = (claim: any, customer?: Customer) => {
    setSelectedClaim({
      ...claim,
      customer: customer || verificationResult?.customer
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="outline" size="sm" asChild>
            <Link to="/vendor/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
        <h1 className="text-3xl font-bold text-foreground">Manual Verification</h1>
        <p className="text-muted-foreground mt-2">
          For vendors without POS systems - verify customer claims manually
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Verification Methods */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Customer Verification
              </CardTitle>
              <CardDescription>
                Multiple ways to verify customer claims without POS integration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="phone" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="phone">Phone</TabsTrigger>
                  <TabsTrigger value="name">Name</TabsTrigger>
                  <TabsTrigger value="qr">QR Code</TabsTrigger>
                </TabsList>
                
                <TabsContent value="phone" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Customer Phone Number</Label>
                    <div className="flex gap-2">
                      <Input
                        id="phone"
                        placeholder="+911234567890"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        disabled={phoneVerificationMutation.isPending}
                      />
                      <Button 
                        onClick={handlePhoneVerification}
                        disabled={phoneVerificationMutation.isPending}
                        className="flex items-center gap-2"
                      >
                        <Phone className="h-4 w-4" />
                        {phoneVerificationMutation.isPending ? 'Searching...' : 'Verify'}
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Enter the customer's registered phone number to find their active claims
                  </p>
                </TabsContent>

                <TabsContent value="name" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Customer Name</Label>
                    <div className="flex gap-2">
                      <Input
                        id="name"
                        placeholder="John Doe"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        disabled={nameVerificationMutation.isPending}
                      />
                      <Button 
                        onClick={handleNameVerification}
                        disabled={nameVerificationMutation.isPending}
                        className="flex items-center gap-2"
                      >
                        <User className="h-4 w-4" />
                        {nameVerificationMutation.isPending ? 'Searching...' : 'Search'}
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Search for customers by name (partial matches supported)
                  </p>
                </TabsContent>

                <TabsContent value="qr" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="qr">QR Code Data</Label>
                    <div className="space-y-2">
                      <Textarea
                        id="qr"
                        placeholder="Scan QR code or paste data here..."
                        value={qrData}
                        onChange={(e) => setQrData(e.target.value)}
                        rows={3}
                        disabled={qrVerificationMutation.isPending}
                      />
                      <Button 
                        onClick={handleQRVerification}
                        disabled={qrVerificationMutation.isPending}
                        className="flex items-center gap-2 w-full"
                      >
                        <QrCode className="h-4 w-4" />
                        {qrVerificationMutation.isPending ? 'Verifying...' : 'Verify QR Code'}
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Use any QR code scanner app to scan the customer's QR code
                  </p>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Verification Results */}
        <div className="space-y-6">
          {verificationResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Verification Results
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Single Customer Result */}
                {verificationResult.customer && verificationResult.activeClaims && (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <h3 className="font-semibold text-green-800 dark:text-green-300">
                        {verificationResult.customer.name}
                      </h3>
                      <p className="text-sm text-green-600 dark:text-green-400">
                        {verificationResult.customer.phone} • {verificationResult.customer.membershipPlan} member
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Active Claims ({verificationResult.activeClaims.length})</Label>
                      {verificationResult.activeClaims.map((claim) => (
                        <div key={claim.claimId} className="p-3 border rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-medium">{claim.deal.title}</h4>
                              <p className="text-sm text-muted-foreground">
                                Code: {claim.claimCode} • {claim.deal.discountPercentage}% off
                              </p>
                            </div>
                            <Badge variant="secondary">
                              <Clock className="h-3 w-3 mr-1" />
                              {new Date(claim.expiresAt).toLocaleDateString()}
                            </Badge>
                          </div>
                          <Button 
                            size="sm" 
                            onClick={() => selectClaim(claim)}
                            className="w-full"
                          >
                            Process This Claim
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Multiple Customers Result */}
                {verificationResult.matchingCustomers && (
                  <div className="space-y-4">
                    <Label>Matching Customers ({verificationResult.matchingCustomers.length})</Label>
                    {verificationResult.matchingCustomers.map((match, index) => (
                      <div key={index} className="p-4 border rounded-lg space-y-3">
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                          <h3 className="font-semibold text-blue-800 dark:text-blue-300">
                            {match.customer.name}
                          </h3>
                          <p className="text-sm text-blue-600 dark:text-blue-400">
                            {match.customer.phone} • {match.customer.membershipPlan} member
                          </p>
                        </div>
                        
                        <div className="space-y-2">
                          {match.activeClaims.map((claim) => (
                            <div key={claim.claimId} className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
                              <div className="flex justify-between items-center">
                                <div>
                                  <span className="font-medium text-sm">{claim.deal.title}</span>
                                  <p className="text-xs text-muted-foreground">
                                    {claim.claimCode} • {claim.deal.discountPercentage}% off
                                  </p>
                                </div>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => selectClaim(claim, match.customer)}
                                >
                                  Select
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* QR Code Result */}
                {verificationResult.verified && verificationResult.claim && (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <h3 className="font-semibold text-green-800 dark:text-green-300">
                        QR Code Verified Successfully
                      </h3>
                      <p className="text-sm text-green-600 dark:text-green-400">
                        Customer: {verificationResult.customer?.name}
                      </p>
                    </div>
                    
                    <div className="p-3 border rounded-lg">
                      <h4 className="font-medium">{verificationResult.deal?.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        Code: {verificationResult.claim.claimCode} • {verificationResult.deal?.discountPercentage}% off
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Expires: {new Date(verificationResult.claim.expiresAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Transaction Completion */}
          {selectedClaim && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Complete Transaction
                </CardTitle>
                <CardDescription>
                  Process the customer's purchase and apply discount
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h3 className="font-semibold text-blue-800 dark:text-blue-300">
                    {selectedClaim.customer?.name || selectedClaim.deal?.title}
                  </h3>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    Claim Code: {selectedClaim.claimCode || selectedClaim.claim?.claimCode}
                  </p>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    Discount: {selectedClaim.deal?.discountPercentage || selectedClaim.discountPercentage}%
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="billAmount">Total Bill Amount (₹)</Label>
                    <Input
                      id="billAmount"
                      type="number"
                      placeholder="1000"
                      value={billAmount}
                      onChange={(e) => {
                        setBillAmount(e.target.value);
                        // Auto-calculate discount
                        const bill = parseFloat(e.target.value);
                        const discountPercent = selectedClaim.deal?.discountPercentage || selectedClaim.discountPercentage || 0;
                        if (bill && discountPercent) {
                          setActualDiscount((bill * discountPercent / 100).toFixed(2));
                        }
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="actualDiscount">Discount Amount (₹)</Label>
                    <Input
                      id="actualDiscount"
                      type="number"
                      placeholder="200"
                      value={actualDiscount}
                      onChange={(e) => setActualDiscount(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any additional notes about this transaction..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                  />
                </div>

                <Separator />

                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Customer Savings: ₹{actualDiscount || '0'}</p>
                    <p className="text-sm text-muted-foreground">
                      Final Amount: ₹{billAmount && actualDiscount ? (parseFloat(billAmount) - parseFloat(actualDiscount)).toFixed(2) : '0'}
                    </p>
                  </div>
                  <Button 
                    onClick={handleCompleteTransaction}
                    disabled={completionMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {completionMutation.isPending ? 'Processing...' : 'Complete Transaction'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Instructions */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-blue-600" />
            How to Use Manual Verification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone Verification
              </h3>
              <p className="text-sm text-muted-foreground">
                Ask customer for their registered phone number. Enter it to find all their active claims for your store.
              </p>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <User className="h-4 w-4" />
                Name Search
              </h3>
              <p className="text-sm text-muted-foreground">
                Search by customer name if they don't remember their phone number. Partial names work too.
              </p>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <QrCode className="h-4 w-4" />
                QR Code Scan
              </h3>
              <p className="text-sm text-muted-foreground">
                Customer shows their QR code. Use any QR scanner app to scan it, then paste the data here.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ManualVerification;