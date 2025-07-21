import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PinInput } from "@/components/ui/pin-input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Shield, CheckCircle, AlertCircle, Calculator, Receipt, Loader2 } from "lucide-react";

interface PinVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dealId: number;
  dealTitle: string;
  dealDiscountPercentage?: number;
  onSuccess?: () => void;
}

export function PinVerificationDialog({
  open,
  onOpenChange,
  dealId,
  dealTitle,
  dealDiscountPercentage = 0,
  onSuccess
}: PinVerificationDialogProps) {
  const [pin, setPin] = useState("");
  const [showBillDialog, setShowBillDialog] = useState(false);
  const [billAmount, setBillAmount] = useState("");
  const [calculatedSavings, setCalculatedSavings] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Calculate savings based on bill amount
  const calculateSavings = (billAmountValue: string, discountPercentage: number) => {
    const amount = parseFloat(billAmountValue);
    if (isNaN(amount) || amount <= 0) return 0;
    return (amount * discountPercentage) / 100;
  };

  // Update bill amount mutation
  const updateBillMutation = useMutation({
    mutationFn: async ({ billAmount, savings }: { billAmount: number, savings: number }) => {
      return apiRequest(`/api/deals/${dealId}/update-bill`, 'POST', {
        billAmount,
        actualSavings: savings
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Bill Updated Successfully!",
        description: `Your actual savings of ₹${calculatedSavings.toFixed(2)} have been recorded.`,
        variant: "default",
      });

      // Reset and close dialogs
      handleClose();

      // Refresh user data
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/claims"] });
      queryClient.invalidateQueries({ queryKey: ["/api/deals"] });

      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: "Failed to update bill amount. Please try again.",
        variant: "destructive",
      });
    }
  });

  const verifyPinMutation = useMutation({
    mutationFn: async (pin: string) => {
      const response = await apiRequest(`/api/deals/${dealId}/verify-pin`, 'POST', { pin });
      return await response.json();
    },
    onSuccess: async (data: any) => {
      toast({
        title: "Deal Redeemed Successfully!",
        description: `You saved ₹${data.savingsAmount}! Would you like to add your actual bill amount?`,
        variant: "default",
      });

      // Show bill amount dialog immediately after successful PIN verification
      setPin("");
      setShowBillDialog(true);

      // Comprehensive data refresh to update user profile and deal information
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["/api/deals"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/users/claims"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] }),
        queryClient.invalidateQueries({ queryKey: [`/api/deals/${dealId}`] })
      ]);

      // Force refetch user data to update dashboard statistics
      queryClient.refetchQueries({ queryKey: ["/api/auth/me"] });
    },
    onError: (error: any) => {
      toast({
        title: "Verification Failed",
        description: error.message || "Invalid PIN. Please check with the vendor.",
        variant: "destructive",
      });
    },
  });

  const handleVerify = () => {
    // if (pin.length !== 4) {
    //   toast({
    //     title: "Invalid PIN",
    //     description: "Please enter a 4-digit PIN",
    //     variant: "destructive",
    //   });
    //   return;
    // }
    verifyPinMutation.mutate(pin);
  };

  const handleClose = () => {
    setShowBillDialog(false);
    setBillAmount("");
    setCalculatedSavings(0);
    onOpenChange(false);
    setPin("");
  };

  const handleSkipBillAmount = () => {
    handleClose();
    if (onSuccess) onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-[90vw] sm:max-w-md md:max-w-lg mx-auto p-4 sm:p-6 overflow-y-auto max-h-[80vh]">
        {!showBillDialog ? (
          // PIN Verification Dialog
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-500" />
                Verify Deal PIN
              </DialogTitle>
              <DialogDescription>
                Enter the 4-digit PIN provided by the vendor for{" "}
                <span className="font-semibold">"{dealTitle}"</span>
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col items-center space-y-6 py-4">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                  <Shield className="w-8 h-8 text-blue-600" />
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Ask the vendor for their verification PIN to complete your redemption
                </p>
              </div>

              <div className="space-y-4">
                <div className="text-center">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Enter 4-digit PIN
                  </label>
                  <PinInput
                    value={pin}
                    onChange={setPin}
                    onComplete={handleVerify}
                    disabled={verifyPinMutation.isPending}
                    className="justify-center"
                  />
                </div>

                {pin.length === 4 && !verifyPinMutation.isPending && (
                  <div className="flex items-center justify-center gap-2 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm">PIN entered, ready to verify</span>
                  </div>
                )}

                {verifyPinMutation.isPending && (
                  <div className="flex items-center justify-center gap-2 text-blue-600">
                    <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full" />
                    <span className="text-sm">Verifying PIN...</span>
                  </div>
                )}
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 w-full">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    <p className="font-medium mb-1">How Advanced PIN Verification Works</p>
                    <p className="text-xs">
                      Visit the store and ask for the current 4-digit PIN from the vendor (changes every 30 minutes for security). Enter it below to claim the deal and add your bill amount to track actual savings. Our multi-layer PIN system ensures authentic store visits.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
              <Button 
                variant="outline" 
                onClick={handleClose} 
                disabled={verifyPinMutation.isPending}
                className="w-full py-3 text-sm sm:text-base"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleVerify} 
                disabled={pin.length !== 4 || verifyPinMutation.isPending}
                className="w-full py-3 text-sm sm:text-base bg-blue-600 hover:bg-blue-700"
              >
                {verifyPinMutation.isPending ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    Verify & Redeem
                  </>
                )}
              </Button>
            </div>
          </>
        ) : (
          // Bill Amount Dialog
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-green-500" />
                Add Bill Amount
              </DialogTitle>
              <DialogDescription>
                Enter your actual bill amount to calculate your precise savings from{" "}
                <span className="font-semibold">"{dealTitle}"</span>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <Calculator className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Deal redeemed successfully! Add your bill amount for accurate savings calculation.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="billAmount" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Bill Amount (₹)
                  </Label>
                  <Input
                    id="billAmount"
                    type="number"
                    value={billAmount}
                    onChange={(e) => {
                      setBillAmount(e.target.value);
                      setCalculatedSavings(calculateSavings(e.target.value, dealDiscountPercentage));
                    }}
                    placeholder="Enter your bill amount"
                    className="text-lg text-center"
                    min="0"
                    step="0.01"
                  />
                </div>

                {billAmount && calculatedSavings > 0 && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-lg p-4">
                    <div className="text-center">
                      <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-1">Your Savings</p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        ₹{calculatedSavings.toFixed(2)}
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-300 mt-1">
                        {dealDiscountPercentage}% off ₹{billAmount}
                      </p>
                    </div>
                  </div>
                )}

                <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-800 dark:text-blue-200">
                      <p className="font-medium mb-1">Why add bill amount?</p>
                      <p className="text-xs">
                        This helps us calculate your exact savings and gives you accurate spending insights.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
              <Button 
                variant="outline" 
                onClick={handleSkipBillAmount} 
                disabled={updateBillMutation.isPending}
                className="w-full py-3 text-sm sm:text-base"
              >
                Skip for Now
              </Button>
              <Button 
                onClick={() => {
                  if (billAmount && calculatedSavings > 0) {
                    updateBillMutation.mutate({ 
                      billAmount: parseFloat(billAmount), 
                      savings: calculatedSavings 
                    });
                  }
                }}
                disabled={!billAmount || calculatedSavings <= 0 || updateBillMutation.isPending}
                className="w-full py-3 text-sm sm:text-base bg-green-600 hover:bg-green-700"
              >
                {updateBillMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Receipt className="w-4 h-4 mr-2" />
                    Update Savings
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}